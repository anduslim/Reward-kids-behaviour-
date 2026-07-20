/** Round any number to the nearest 0.5 (the minimum star increment). */
export function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/** Clamp to a valid star amount: at least 0.5, in 0.5 steps. */
export function clampStars(n: number, min = 0.5): number {
  const r = roundToHalf(n);
  return r < min ? min : r;
}

/**
 * Render a star value as glyphs, e.g. 2.5 -> "★★½".
 * Half stars use a distinct glyph so kids can read them at a glance.
 */
export function starGlyphs(n: number): string {
  const full = Math.floor(n);
  const half = n - full >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') || '½';
}

/** Compact numeric label, dropping a trailing ".0" (2 -> "2", 2.5 -> "2.5"). */
export function starLabel(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
