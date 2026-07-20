import { starLabel } from '../lib/stars';

/** A pill showing a star amount, e.g. "★ 2.5". */
export function StarBadge({
  value,
  tone = 'gold',
  className = '',
}: {
  value: number;
  tone?: 'gold' | 'muted';
  className?: string;
}) {
  const toneClass =
    tone === 'gold'
      ? 'bg-amber-100 text-amber-700 ring-amber-200'
      : 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-extrabold ring-1 ${toneClass} ${className}`}
    >
      <span className="text-amber-400">★</span>
      {starLabel(value)}
    </span>
  );
}
