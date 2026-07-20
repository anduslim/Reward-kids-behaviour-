import type { LedgerEntry } from '../types';

export interface AchievementDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Progress toward unlocking: returns { current, target }. */
  progress: (ctx: KidLedgerContext) => { current: number; target: number };
}

export interface KidLedgerContext {
  entries: LedgerEntry[]; // this kid's entries, newest-first not required
  totalStarsEarned: number; // sum of positive awards
  awardsCount: number;
  redeemCount: number;
  distinctBehaviours: number;
  currentStreak: number;
  longestStreak: number;
}

/**
 * Integer index of the local calendar day a timestamp falls on (days since the
 * Unix epoch). Because the timezone offset is applied per-date, consecutive
 * calendar days always differ by exactly 1 — even across DST transitions, where
 * raw millisecond diffs would be 23h/25h.
 */
function localDayIndex(iso: string): number {
  const d = new Date(iso);
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
}

/** Compute current + longest daily streak (consecutive days with an award). */
export function computeStreaks(entries: LedgerEntry[]): {
  current: number;
  longest: number;
} {
  const daySet = new Set(
    entries.filter((e) => e.type === 'award').map((e) => localDayIndex(e.createdAt)),
  );
  if (daySet.size === 0) return { current: 0, longest: 0 };

  const sorted = [...daySet].sort((a, b) => a - b);
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak: count back from today (or yesterday) while days are present.
  const today = localDayIndex(new Date().toISOString());
  let current = 0;
  let cursor = daySet.has(today) ? today : today - 1;
  while (daySet.has(cursor)) {
    current += 1;
    cursor -= 1;
  }
  return { current, longest };
}

export function buildContext(entries: LedgerEntry[]): KidLedgerContext {
  const awards = entries.filter((e) => e.type === 'award');
  const totalStarsEarned = awards.reduce((s, e) => s + e.stars, 0);
  const distinct = new Set(awards.map((e) => e.refId ?? e.label)).size;
  const { current, longest } = computeStreaks(entries);
  return {
    entries,
    totalStarsEarned,
    awardsCount: awards.length,
    redeemCount: entries.filter((e) => e.type === 'redeem').length,
    distinctBehaviours: distinct,
    currentStreak: current,
    longestStreak: longest,
  };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-star',
    name: 'First Star',
    emoji: '🌟',
    description: 'Earn your very first star',
    progress: (c) => ({ current: Math.min(c.awardsCount, 1), target: 1 }),
  },
  {
    id: 'ten-stars',
    name: 'Star Collector',
    emoji: '✨',
    description: 'Earn 10 stars in total',
    progress: (c) => ({ current: Math.min(c.totalStarsEarned, 10), target: 10 }),
  },
  {
    id: 'fifty-stars',
    name: 'Star Champion',
    emoji: '🏆',
    description: 'Earn 50 stars in total',
    progress: (c) => ({ current: Math.min(c.totalStarsEarned, 50), target: 50 }),
  },
  {
    id: 'hundred-stars',
    name: 'Star Legend',
    emoji: '👑',
    description: 'Earn 100 stars in total',
    progress: (c) => ({ current: Math.min(c.totalStarsEarned, 100), target: 100 }),
  },
  {
    id: 'streak-3',
    name: 'On a Roll',
    emoji: '🔥',
    description: 'Earn stars 3 days in a row',
    progress: (c) => ({ current: Math.min(c.longestStreak, 3), target: 3 }),
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    emoji: '⚡',
    description: 'Earn stars 7 days in a row',
    progress: (c) => ({ current: Math.min(c.longestStreak, 7), target: 7 }),
  },
  {
    id: 'all-rounder',
    name: 'All-Rounder',
    emoji: '🌈',
    description: 'Earn stars for 5 different behaviours',
    progress: (c) => ({ current: Math.min(c.distinctBehaviours, 5), target: 5 }),
  },
  {
    id: 'first-reward',
    name: 'Big Spender',
    emoji: '🎁',
    description: 'Redeem your first reward',
    progress: (c) => ({ current: Math.min(c.redeemCount, 1), target: 1 }),
  },
];

/** Returns the ids of achievements that are currently met for a context. */
export function evaluateUnlocked(ctx: KidLedgerContext): string[] {
  return ACHIEVEMENTS.filter((a) => {
    const { current, target } = a.progress(ctx);
    return current >= target;
  }).map((a) => a.id);
}
