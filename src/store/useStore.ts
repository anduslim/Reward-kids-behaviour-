import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppState,
  AvatarConfig,
  Behaviour,
  Gender,
  Kid,
  Redemption,
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
  reason?: 'insufficient' | 'outofstock' | 'notfound';
  /** Achievement ids newly unlocked by this redemption (e.g. first reward). */
  newly?: string[];
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
  redeemReward: (kidId: string, rewardId: string) => RedeemResult;
  /** Undo a ledger entry: reverse its star change (and, for a redeem, restore
   *  stock and remove its queued redemption). For fixing a mis-tapped star. */
  removeLedgerEntry: (entryId: string) => void;

  // redemption fulfillment queue
  fulfillRedemption: (id: string) => void;
  reopenRedemption: (id: string) => void;
  deleteRedemption: (id: string) => void;

  // pin
  setPinHash: (hash: string | undefined) => void;

  // preferences
  setLeaderboardEnabled: (enabled: boolean) => void;

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
    redemptions: [],
    unlockedAchievements: {},
    selectedKidId: undefined,
    leaderboardEnabled: false,
  };
}

/** Drop keys whose value is `undefined` so a patch never wipes an existing field. */
function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
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
          kids: s.kids.map((k) => (k.id === id ? { ...k, ...stripUndefined(patch) } : k)),
        })),

      deleteKid: (id) =>
        set((s) => {
          const { [id]: _drop, ...rest } = s.unlockedAchievements;
          void _drop;
          return {
            kids: s.kids.filter((k) => k.id !== id),
            ledger: s.ledger.filter((e) => e.kidId !== id),
            redemptions: s.redemptions.filter((r) => r.kidId !== id),
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

      updateBehaviour: (id, patch) => {
        const prev = get().behaviours.find((x) => x.id === id);
        if (prev && 'imageId' in patch && patch.imageId !== prev.imageId) {
          void deleteImage(prev.imageId); // old photo replaced/removed
        }
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
        }));
      },

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

      updateReward: (id, patch) => {
        const prev = get().rewards.find((x) => x.id === id);
        if (prev && 'imageId' in patch && patch.imageId !== prev.imageId) {
          void deleteImage(prev.imageId); // old photo replaced/removed
        }
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
        }));
      },

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

      redeemReward: (kidId, rewardId) => {
        // Re-read everything from live state and validate + mutate atomically inside
        // one `set`, so a stale reward object (e.g. captured before the PIN modal
        // opened, or edited/depleted in the meantime) can never cause an
        // over-redemption or negative stock.
        const s = get();
        const kid = s.kids.find((k) => k.id === kidId);
        const reward = s.rewards.find((r) => r.id === rewardId);
        if (!kid || !reward) return { ok: false, reason: 'notfound' };
        if (reward.quantity <= 0) return { ok: false, reason: 'outofstock' };
        if (kid.starBalance < reward.starCost)
          return { ok: false, reason: 'insufficient' };

        let newly: string[] = [];
        set((cur) => {
          const entry = {
            id: uid('led_'),
            kidId,
            type: 'redeem' as const,
            refId: reward.id,
            label: reward.name,
            stars: -reward.starCost,
            createdAt: new Date().toISOString(),
          };
          // Snapshot the reward so the fulfillment queue survives later edits/deletes.
          const redemption: Redemption = {
            id: uid('rdm_'),
            kidId,
            rewardId: reward.id,
            rewardName: reward.name,
            icon: reward.icon,
            imageId: reward.imageId,
            starCost: reward.starCost,
            createdAt: entry.createdAt,
            status: 'pending',
          };
          const next: AppState = {
            ...cur,
            kids: cur.kids.map((k) =>
              k.id === kidId ? { ...k, starBalance: k.starBalance - reward.starCost } : k,
            ),
            rewards: cur.rewards.map((r) =>
              r.id === reward.id ? { ...r, quantity: r.quantity - 1 } : r,
            ),
            ledger: [...cur.ledger, entry],
            redemptions: [...cur.redemptions, redemption],
          };
          const res = refreshAchievements(next, kidId);
          newly = res.newly;
          return { ...next, unlockedAchievements: res.unlocked };
        });
        return { ok: true, newly };
      },

      removeLedgerEntry: (entryId) =>
        set((s) => {
          const entry = s.ledger.find((e) => e.id === entryId);
          if (!entry) return {} as Partial<AppState>;
          // Reverse the balance: an award added `stars`, a redeem subtracted it,
          // so undoing either is `balance - entry.stars`. Clamp to avoid negatives.
          const kids = s.kids.map((k) =>
            k.id === entry.kidId
              ? { ...k, starBalance: Math.max(0, k.starBalance - entry.stars) }
              : k,
          );
          let rewards = s.rewards;
          let redemptions = s.redemptions;
          if (entry.type === 'redeem') {
            rewards = s.rewards.map((r) =>
              r.id === entry.refId ? { ...r, quantity: r.quantity + 1 } : r,
            );
            // Drop the matching queued redemption (same kid/reward/timestamp).
            const idx = s.redemptions.findIndex(
              (r) =>
                r.kidId === entry.kidId &&
                r.rewardId === entry.refId &&
                r.createdAt === entry.createdAt,
            );
            if (idx >= 0) redemptions = s.redemptions.filter((_, i) => i !== idx);
          }
          const next: AppState = {
            ...s,
            kids,
            rewards,
            redemptions,
            ledger: s.ledger.filter((e) => e.id !== entryId),
          };
          const res = refreshAchievements(next, entry.kidId);
          return { ...next, unlockedAchievements: res.unlocked };
        }),

      fulfillRedemption: (id) =>
        set((s) => ({
          redemptions: s.redemptions.map((r) =>
            r.id === id
              ? { ...r, status: 'fulfilled', fulfilledAt: new Date().toISOString() }
              : r,
          ),
        })),

      reopenRedemption: (id) =>
        set((s) => ({
          redemptions: s.redemptions.map((r) =>
            r.id === id ? { ...r, status: 'pending', fulfilledAt: undefined } : r,
          ),
        })),

      deleteRedemption: (id) =>
        set((s) => ({ redemptions: s.redemptions.filter((r) => r.id !== id) })),

      setPinHash: (hash) => set({ pinHash: hash }),

      setLeaderboardEnabled: (enabled) => set({ leaderboardEnabled: enabled }),

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
