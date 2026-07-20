import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppState,
  AvatarConfig,
  Behaviour,
  Gender,
  Kid,
  Reward,
} from '../types';
import { uid } from '../lib/id';
import { clampStars } from '../lib/stars';
import { DEFAULT_AVATAR } from '../lib/avatar';
import { seedBehaviours, seedRewards } from '../lib/seed';
import { deleteImage } from '../lib/images';
import { buildContext, evaluateUnlocked } from '../lib/achievements';

const SCHEMA_VERSION = 1;

export interface NewKidInput {
  name: string;
  birthday: string;
  gender: Gender;
  avatar?: AvatarConfig;
}

export interface RedeemResult {
  ok: boolean;
  reason?: 'insufficient' | 'outofstock';
}

interface Actions {
  // kids
  addKid: (input: NewKidInput) => string;
  updateKid: (id: string, patch: Partial<Omit<Kid, 'id' | 'createdAt'>>) => void;
  deleteKid: (id: string) => void;
  selectKid: (id: string) => void;
  setAvatar: (id: string, avatar: AvatarConfig) => void;

  // behaviours
  addBehaviour: (b: Omit<Behaviour, 'id'>) => void;
  updateBehaviour: (id: string, patch: Partial<Omit<Behaviour, 'id'>>) => void;
  deleteBehaviour: (id: string) => void;

  // rewards
  addReward: (r: Omit<Reward, 'id'>) => void;
  updateReward: (id: string, patch: Partial<Omit<Reward, 'id'>>) => void;
  deleteReward: (id: string) => void;

  // ledger / gamification
  awardStars: (kidId: string, behaviour: Behaviour, stars?: number) => string[];
  redeemReward: (kidId: string, reward: Reward) => RedeemResult;

  // pin
  setPinHash: (hash: string | undefined) => void;

  // data management
  replaceAll: (state: Partial<AppState>) => void;
  resetAll: () => void;
}

export type Store = AppState & Actions;

function initialData(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    pinHash: undefined,
    kids: [],
    behaviours: seedBehaviours(),
    rewards: seedRewards(),
    ledger: [],
    unlockedAchievements: {},
    selectedKidId: undefined,
  };
}

/** Recompute unlocked achievements for a kid; returns newly-unlocked ids. */
function refreshAchievements(
  state: AppState,
  kidId: string,
): { unlocked: Record<string, string[]>; newly: string[] } {
  const entries = state.ledger.filter((e) => e.kidId === kidId);
  const ctx = buildContext(entries);
  const met = evaluateUnlocked(ctx);
  const prev = state.unlockedAchievements[kidId] ?? [];
  const newly = met.filter((id) => !prev.includes(id));
  return {
    unlocked: { ...state.unlockedAchievements, [kidId]: met },
    newly,
  };
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialData(),

      addKid: (input) => {
        const id = uid('kid_');
        const kid: Kid = {
          id,
          name: input.name.trim() || 'Kiddo',
          birthday: input.birthday,
          gender: input.gender,
          avatar: input.avatar ?? DEFAULT_AVATAR,
          starBalance: 0,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          kids: [...s.kids, kid],
          selectedKidId: s.selectedKidId ?? id,
        }));
        return id;
      },

      updateKid: (id, patch) =>
        set((s) => ({
          kids: s.kids.map((k) => (k.id === id ? { ...k, ...patch } : k)),
        })),

      deleteKid: (id) =>
        set((s) => {
          const { [id]: _drop, ...rest } = s.unlockedAchievements;
          void _drop;
          return {
            kids: s.kids.filter((k) => k.id !== id),
            ledger: s.ledger.filter((e) => e.kidId !== id),
            unlockedAchievements: rest,
            selectedKidId:
              s.selectedKidId === id
                ? s.kids.find((k) => k.id !== id)?.id
                : s.selectedKidId,
          };
        }),

      selectKid: (id) => set({ selectedKidId: id }),

      setAvatar: (id, avatar) =>
        set((s) => ({
          kids: s.kids.map((k) => (k.id === id ? { ...k, avatar } : k)),
        })),

      addBehaviour: (b) =>
        set((s) => ({
          behaviours: [
            ...s.behaviours,
            { ...b, id: uid('beh_'), defaultStars: clampStars(b.defaultStars) },
          ],
        })),

      updateBehaviour: (id, patch) =>
        set((s) => ({
          behaviours: s.behaviours.map((b) =>
            b.id === id
              ? {
                  ...b,
                  ...patch,
                  defaultStars:
                    patch.defaultStars !== undefined
                      ? clampStars(patch.defaultStars)
                      : b.defaultStars,
                }
              : b,
          ),
        })),

      deleteBehaviour: (id) => {
        const b = get().behaviours.find((x) => x.id === id);
        void deleteImage(b?.imageId);
        set((s) => ({ behaviours: s.behaviours.filter((x) => x.id !== id) }));
      },

      addReward: (r) =>
        set((s) => ({
          rewards: [
            ...s.rewards,
            {
              ...r,
              id: uid('rew_'),
              starCost: clampStars(r.starCost),
              quantity: Math.max(0, Math.floor(r.quantity)),
            },
          ],
        })),

      updateReward: (id, patch) =>
        set((s) => ({
          rewards: s.rewards.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...patch,
                  starCost:
                    patch.starCost !== undefined ? clampStars(patch.starCost) : r.starCost,
                  quantity:
                    patch.quantity !== undefined
                      ? Math.max(0, Math.floor(patch.quantity))
                      : r.quantity,
                }
              : r,
          ),
        })),

      deleteReward: (id) => {
        const r = get().rewards.find((x) => x.id === id);
        void deleteImage(r?.imageId);
        set((s) => ({ rewards: s.rewards.filter((x) => x.id !== id) }));
      },

      awardStars: (kidId, behaviour, stars) => {
        const amount = clampStars(stars ?? behaviour.defaultStars);
        let newly: string[] = [];
        set((s) => {
          const entry = {
            id: uid('led_'),
            kidId,
            type: 'award' as const,
            refId: behaviour.id,
            label: behaviour.name,
            stars: amount,
            createdAt: new Date().toISOString(),
          };
          const next: AppState = {
            ...s,
            kids: s.kids.map((k) =>
              k.id === kidId ? { ...k, starBalance: k.starBalance + amount } : k,
            ),
            ledger: [...s.ledger, entry],
          };
          const res = refreshAchievements(next, kidId);
          newly = res.newly;
          return { ...next, unlockedAchievements: res.unlocked };
        });
        return newly;
      },

      redeemReward: (kidId, reward) => {
        const state = get();
        const kid = state.kids.find((k) => k.id === kidId);
        if (!kid) return { ok: false };
        if (reward.quantity <= 0) return { ok: false, reason: 'outofstock' };
        if (kid.starBalance < reward.starCost)
          return { ok: false, reason: 'insufficient' };

        set((s) => {
          const entry = {
            id: uid('led_'),
            kidId,
            type: 'redeem' as const,
            refId: reward.id,
            label: reward.name,
            stars: -reward.starCost,
            createdAt: new Date().toISOString(),
          };
          const next: AppState = {
            ...s,
            kids: s.kids.map((k) =>
              k.id === kidId ? { ...k, starBalance: k.starBalance - reward.starCost } : k,
            ),
            rewards: s.rewards.map((r) =>
              r.id === reward.id ? { ...r, quantity: r.quantity - 1 } : r,
            ),
            ledger: [...s.ledger, entry],
          };
          const res = refreshAchievements(next, kidId);
          return { ...next, unlockedAchievements: res.unlocked };
        });
        return { ok: true };
      },

      setPinHash: (hash) => set({ pinHash: hash }),

      replaceAll: (incoming) =>
        set((s) => ({
          ...s,
          ...incoming,
          schemaVersion: SCHEMA_VERSION,
        })),

      resetAll: () => set(initialData()),
    }),
    {
      name: 'krb.state.v1',
      version: SCHEMA_VERSION,
    },
  ),
);

/** Selector hook: the currently-selected kid (or the first one). */
export function useSelectedKid(): Kid | undefined {
  return useStore((s) => {
    if (s.selectedKidId) {
      const found = s.kids.find((k) => k.id === s.selectedKidId);
      if (found) return found;
    }
    return s.kids[0];
  });
}
