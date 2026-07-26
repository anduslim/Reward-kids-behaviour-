import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AvatarConfig } from '../types';
import { useStore } from './useStore';
import { computeStreaks } from '../lib/achievements';

export interface LeaderboardEntry {
  id: string;
  group_id: string;
  owner_user_id: string;
  kid_key: string;
  display_name: string;
  avatar: AvatarConfig | null;
  total_stars: number;
  current_streak: number;
  updated_at: string;
}

interface GroupRow {
  id: string;
  name: string;
  invite_code: string;
}

type Status = 'idle' | 'loading' | 'error';

interface LeaderboardState {
  configured: boolean;
  ready: boolean; // an auth session exists
  userId: string | null;
  groupId: string | null;
  groupName: string | null;
  inviteCode: string | null;
  entries: LeaderboardEntry[];
  status: Status;
  error?: string;

  init: () => Promise<void>;
  createGroup: (name: string) => Promise<void>;
  joinGroup: (code: string) => Promise<void>;
  leaveGroup: () => Promise<void>;
  syncKids: () => Promise<void>;
  refresh: () => Promise<void>;
}

let channel: RealtimeChannel | null = null;

/** Aggregate rows for the currently opted-in kids. */
function sharedRows(groupId: string, userId: string) {
  const { kids, ledger } = useStore.getState();
  return kids
    .filter((k) => k.sharedInGroup)
    .map((k) => ({
      group_id: groupId,
      owner_user_id: userId,
      kid_key: k.id,
      display_name: k.name,
      avatar: k.avatar,
      total_stars: k.starBalance,
      current_streak: computeStreaks(ledger.filter((e) => e.kidId === k.id)).current,
      updated_at: new Date().toISOString(),
    }));
}

function subscribe(groupId: string, onChange: () => void) {
  if (!supabase) return;
  if (channel) supabase.removeChannel(channel);
  channel = supabase
    .channel(`lb:${groupId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'leaderboard_entries', filter: `group_id=eq.${groupId}` },
      onChange,
    )
    .subscribe();
}

function unsubscribe() {
  if (supabase && channel) supabase.removeChannel(channel);
  channel = null;
}

export const useLeaderboard = create<LeaderboardState>()(
  persist(
    (set, get) => ({
      configured: isSupabaseConfigured,
      ready: false,
      userId: null,
      groupId: null,
      groupName: null,
      inviteCode: null,
      entries: [],
      status: 'idle',

      init: async () => {
        if (!supabase) return;
        set({ status: 'loading', error: undefined });
        try {
          let { data } = await supabase.auth.getSession();
          if (!data.session) {
            const res = await supabase.auth.signInAnonymously();
            if (res.error) throw res.error;
            data = { session: res.data.session } as typeof data;
          }
          const userId = data.session?.user.id ?? null;
          set({ ready: Boolean(userId), userId, status: 'idle' });

          const { groupId } = get();
          if (userId && groupId) {
            subscribe(groupId, () => void get().refresh());
            await get().syncKids();
            await get().refresh();
          }
        } catch (e) {
          set({ status: 'error', error: friendly(e) });
        }
      },

      createGroup: async (name) => {
        if (!supabase) return;
        set({ status: 'loading', error: undefined });
        try {
          const { data, error } = await supabase.rpc('create_group', { group_name: name });
          if (error) throw error;
          const g = data as GroupRow;
          set({ groupId: g.id, groupName: g.name, inviteCode: g.invite_code, status: 'idle' });
          subscribe(g.id, () => void get().refresh());
          await get().syncKids();
          await get().refresh();
        } catch (e) {
          set({ status: 'error', error: friendly(e) });
        }
      },

      joinGroup: async (code) => {
        if (!supabase) return;
        set({ status: 'loading', error: undefined });
        try {
          const { data, error } = await supabase.rpc('join_group', { code });
          if (error) throw error;
          const g = data as GroupRow;
          set({ groupId: g.id, groupName: g.name, inviteCode: g.invite_code, status: 'idle' });
          subscribe(g.id, () => void get().refresh());
          await get().syncKids();
          await get().refresh();
        } catch (e) {
          set({ status: 'error', error: friendly(e) });
        }
      },

      leaveGroup: async () => {
        const { groupId } = get();
        if (!supabase || !groupId) return;
        set({ status: 'loading', error: undefined });
        try {
          const { error } = await supabase.rpc('leave_group', { gid: groupId });
          if (error) throw error;
        } catch (e) {
          set({ error: friendly(e) });
        } finally {
          unsubscribe();
          set({ groupId: null, groupName: null, inviteCode: null, entries: [], status: 'idle' });
        }
      },

      syncKids: async () => {
        const { groupId, userId } = get();
        if (!supabase || !groupId || !userId) return;
        try {
          const rows = sharedRows(groupId, userId);
          if (rows.length) {
            const { error } = await supabase
              .from('leaderboard_entries')
              .upsert(rows, { onConflict: 'group_id,owner_user_id,kid_key' });
            if (error) throw error;
          }
          // Remove any of this owner's entries whose kid is no longer shared.
          const keep = rows.map((r) => r.kid_key);
          const base = supabase
            .from('leaderboard_entries')
            .delete()
            .eq('group_id', groupId)
            .eq('owner_user_id', userId);
          await (keep.length ? base.not('kid_key', 'in', `(${keep.join(',')})`) : base);
        } catch (e) {
          set({ error: friendly(e) });
        }
      },

      refresh: async () => {
        const { groupId } = get();
        if (!supabase || !groupId) return;
        try {
          const { data, error } = await supabase
            .from('leaderboard_entries')
            .select('*')
            .eq('group_id', groupId)
            .order('total_stars', { ascending: false })
            .order('updated_at', { ascending: true });
          if (error) throw error;
          set({ entries: (data ?? []) as LeaderboardEntry[], status: 'idle' });
        } catch (e) {
          set({ status: 'error', error: friendly(e) });
        }
      },
    }),
    {
      name: 'krb.leaderboard.v1',
      partialize: (s) => ({
        groupId: s.groupId,
        groupName: s.groupName,
        inviteCode: s.inviteCode,
      }),
    },
  ),
);

function friendly(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/invalid invite/i.test(msg)) return 'That invite code isn’t valid.';
  if (/anonymous/i.test(msg)) return 'Sign-in isn’t enabled on the server yet.';
  return msg || 'Something went wrong.';
}
