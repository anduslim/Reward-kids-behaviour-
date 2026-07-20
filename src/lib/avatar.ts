import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import type { AvatarConfig } from '../types';

/**
 * Layer options for the Kahoot-style avatar builder. Keys map to DiceBear
 * "adventurer" variant names; colors are hex (without the leading #).
 */
export const AVATAR_OPTIONS = {
  skinColor: ['f2d3b1', 'ecad80', '9e5622', '763900'],
  hair: [
    'long01',
    'long03',
    'long07',
    'short01',
    'short04',
    'short08',
    'short11',
    'short16',
  ],
  hairColor: ['0e0e0e', '562306', 'ac6511', 'e9b729', 'afafaf', 'ff543d', '6bd9e9'],
  eyes: ['variant01', 'variant04', 'variant07', 'variant12', 'variant22', 'variant26'],
  mouth: ['variant01', 'variant05', 'variant10', 'variant15', 'variant19', 'variant26'],
  glasses: ['none', 'variant01', 'variant03', 'variant05'],
  backgroundColor: ['ffd5dc', 'c0e8ff', 'd7f9c7', 'fff3c4', 'e7d9ff', 'ffe0b3'],
} as const;

export const DEFAULT_AVATAR: AvatarConfig = {
  skinColor: AVATAR_OPTIONS.skinColor[0],
  hair: AVATAR_OPTIONS.hair[3],
  hairColor: AVATAR_OPTIONS.hairColor[1],
  eyes: AVATAR_OPTIONS.eyes[0],
  mouth: AVATAR_OPTIONS.mouth[0],
  glasses: 'none',
  backgroundColor: AVATAR_OPTIONS.backgroundColor[1],
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomAvatar(): AvatarConfig {
  return {
    skinColor: pick(AVATAR_OPTIONS.skinColor),
    hair: pick(AVATAR_OPTIONS.hair),
    hairColor: pick(AVATAR_OPTIONS.hairColor),
    eyes: pick(AVATAR_OPTIONS.eyes),
    mouth: pick(AVATAR_OPTIONS.mouth),
    glasses: pick(AVATAR_OPTIONS.glasses),
    backgroundColor: pick(AVATAR_OPTIONS.backgroundColor),
  };
}

/** Build the DiceBear SVG data-uri for an avatar config. */
export function avatarDataUri(cfg: AvatarConfig): string {
  const avatar = createAvatar(adventurer, {
    seed: 'star-kid',
    skinColor: [cfg.skinColor],
    hair: [cfg.hair as never],
    hairColor: [cfg.hairColor],
    eyes: [cfg.eyes as never],
    mouth: [cfg.mouth as never],
    glasses: cfg.glasses && cfg.glasses !== 'none' ? [cfg.glasses as never] : [],
    glassesProbability: cfg.glasses && cfg.glasses !== 'none' ? 100 : 0,
    backgroundColor: [cfg.backgroundColor],
  });
  return avatar.toDataUri();
}
