export type Gender = 'boy' | 'girl' | 'other';

/** Drives the DiceBear "adventurer" render. Values are option keys/colors. */
export interface AvatarConfig {
  skinColor: string;
  hair: string;
  hairColor: string;
  eyes: string;
  mouth: string;
  glasses?: string;
  backgroundColor: string;
}

export interface Kid {
  id: string;
  name: string;
  birthday: string; // ISO date (yyyy-mm-dd)
  gender: Gender;
  avatar: AvatarConfig;
  starBalance: number; // supports 0.5 increments
  createdAt: string; // ISO
}

export interface Behaviour {
  id: string;
  name: string;
  description?: string;
  icon?: string; // emoji
  imageId?: string; // IndexedDB key (optional uploaded photo)
  defaultStars: number; // >= 0.5, 0.5 steps
  active: boolean;
}

export interface Reward {
  id: string;
  name: string;
  description?: string;
  icon?: string; // emoji fallback
  imageId?: string; // IndexedDB key
  starCost: number; // >= 0.5
  quantity: number; // remaining stock
}

export type LedgerType = 'award' | 'redeem' | 'adjust';

export interface LedgerEntry {
  id: string;
  kidId: string;
  type: LedgerType;
  refId?: string; // behaviourId or rewardId
  label: string;
  stars: number; // + for award, - for redeem
  createdAt: string; // ISO datetime, used for streaks
}

export type RedemptionStatus = 'pending' | 'fulfilled';

/**
 * A redeemed reward awaiting hand-off. Reward details are snapshotted so the
 * queue stays accurate even if the reward is later edited or deleted.
 */
export interface Redemption {
  id: string;
  kidId: string;
  rewardId: string;
  rewardName: string;
  icon?: string;
  imageId?: string;
  starCost: number;
  createdAt: string; // ISO datetime redeemed
  status: RedemptionStatus;
  fulfilledAt?: string; // ISO datetime handed over
}

export interface AppState {
  schemaVersion: number;
  pinHash?: string;
  kids: Kid[];
  behaviours: Behaviour[];
  rewards: Reward[];
  ledger: LedgerEntry[];
  redemptions: Redemption[];
  unlockedAchievements: Record<string, string[]>; // kidId -> achievementIds
  selectedKidId?: string;
}
