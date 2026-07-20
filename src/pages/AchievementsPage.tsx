import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore, useSelectedKid } from '../store/useStore';
import { AvatarView } from '../components/AvatarView';
import { EmptyState, PageHeader } from '../components/Layout';
import { ACHIEVEMENTS, buildContext } from '../lib/achievements';
import { starLabel } from '../lib/stars';

export function AchievementsPage() {
  const kids = useStore((s) => s.kids);
  const selectKid = useStore((s) => s.selectKid);
  const ledger = useStore((s) => s.ledger);
  const kid = useSelectedKid();

  const ctx = useMemo(
    () => buildContext(ledger.filter((e) => e.kidId === kid?.id)),
    [ledger, kid?.id],
  );

  if (kids.length === 0 || !kid) {
    return (
      <EmptyState
        emoji="🏅"
        title="No awards yet"
        subtitle="Add a kid and start earning stars to unlock achievements."
        action={
          <Link to="/kids" className="btn-primary">
            + Add a kid
          </Link>
        }
      />
    );
  }

  const earnedCount = ACHIEVEMENTS.filter((a) => {
    const { current, target } = a.progress(ctx);
    return current >= target;
  }).length;

  return (
    <div>
      <PageHeader title="Achievements" subtitle={`${earnedCount} of ${ACHIEVEMENTS.length} unlocked`} />

      {/* Kid selector */}
      {kids.length > 1 && (
        <div className="mb-4 flex gap-3 overflow-x-auto pb-2">
          {kids.map((k) => (
            <button
              key={k.id}
              onClick={() => selectKid(k.id)}
              className={`flex shrink-0 flex-col items-center gap-1 ${
                k.id === kid.id ? '' : 'opacity-60'
              }`}
            >
              <AvatarView config={k.avatar} size={48} ring={k.id === kid.id} />
              <span className="text-xs font-bold text-slate-600">{k.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Streak highlights */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatTile emoji="🔥" label="Current streak" value={`${ctx.currentStreak}d`} />
        <StatTile emoji="🏆" label="Best streak" value={`${ctx.longestStreak}d`} />
        <StatTile emoji="⭐" label="Stars earned" value={starLabel(ctx.totalStarsEarned)} />
      </div>

      {/* Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const { current, target } = a.progress(ctx);
          const done = current >= target;
          const pct = Math.min(100, Math.round((current / target) * 100));
          return (
            <div
              key={a.id}
              className={`card p-4 text-center transition ${
                done ? 'ring-2 ring-amber-300' : 'opacity-90'
              }`}
            >
              <div className={`text-4xl ${done ? 'animate-pop' : 'grayscale'}`}>{a.emoji}</div>
              <div className="mt-1 text-sm font-extrabold text-slate-800">{a.name}</div>
              <p className="text-xs text-slate-500">{a.description}</p>
              {done ? (
                <div className="mt-2 text-xs font-bold text-amber-500">Unlocked! ✓</div>
              ) : (
                <div className="mt-2">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-grape-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-400">
                    {starLabel(current)} / {starLabel(target)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="card flex flex-col items-center gap-0.5 p-3 text-center">
      <span className="text-2xl">{emoji}</span>
      <span className="text-xl font-black text-slate-800">{value}</span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
    </div>
  );
}
