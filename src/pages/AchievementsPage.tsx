import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore, useSelectedKid } from '../store/useStore';
import { AvatarView } from '../components/AvatarView';
import { EmptyState, PageHeader } from '../components/Layout';
import { staggerChild, staggerParent } from '../components/motion';
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
      <PageHeader
        title="Achievements"
        subtitle={`${earnedCount} of ${ACHIEVEMENTS.length} unlocked`}
      />

      {/* Kid selector */}
      {kids.length > 1 && (
        <div className="scrollbar-hide mb-4 flex gap-3 overflow-x-auto pb-2">
          {kids.map((k) => (
            <motion.button
              key={k.id}
              onClick={() => selectKid(k.id)}
              whileTap={{ scale: 0.92 }}
              animate={{ opacity: k.id === kid.id ? 1 : 0.55 }}
              className="flex shrink-0 flex-col items-center gap-1 rounded-2xl p-1"
            >
              <AvatarView config={k.avatar} size={48} ring={k.id === kid.id} />
              <span className="text-xs font-bold text-slate-600">{k.name}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Streak highlights */}
      <motion.div
        variants={staggerParent}
        initial="hidden"
        animate="show"
        className="mb-5 grid grid-cols-3 gap-3"
      >
        <StatTile
          emoji="🔥"
          label="Current streak"
          value={`${ctx.currentStreak}d`}
          flame={ctx.currentStreak > 0}
        />
        <StatTile emoji="🏆" label="Best streak" value={`${ctx.longestStreak}d`} />
        <StatTile emoji="⭐" label="Stars earned" value={starLabel(ctx.totalStarsEarned)} />
      </motion.div>

      {/* Badges */}
      <motion.div
        variants={staggerParent}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {ACHIEVEMENTS.map((a) => {
          const { current, target } = a.progress(ctx);
          const done = current >= target;
          const pct = Math.min(100, Math.round((current / target) * 100));
          return (
            <motion.div
              key={a.id}
              variants={staggerChild}
              whileHover={{ y: -3 }}
              className={`card relative overflow-hidden p-4 text-center transition-shadow ${
                done
                  ? 'bg-gradient-to-b from-amber-50 to-white ring-2 ring-amber-300'
                  : 'opacity-95'
              }`}
            >
              {done && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-14 -skew-x-12 bg-gradient-to-r from-transparent via-amber-100/70 to-transparent animate-shimmer"
                />
              )}
              <motion.div
                initial={done ? { scale: 0.4, rotate: -15 } : false}
                animate={done ? { scale: 1, rotate: 0 } : undefined}
                transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                className={`relative text-4xl ${done ? 'drop-shadow' : 'opacity-60 grayscale'}`}
              >
                {a.emoji}
              </motion.div>
              <div className="relative mt-1 text-sm font-extrabold text-slate-800">{a.name}</div>
              <p className="relative text-xs text-slate-500">{a.description}</p>
              {done ? (
                <div className="relative mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-600 ring-1 ring-amber-200">
                  Unlocked! ✓
                </div>
              ) : (
                <div className="relative mt-2">
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/60">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                      className="h-full rounded-full bg-gradient-to-r from-grape-400 to-grape-500"
                    />
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-400">
                    {starLabel(current)} / {starLabel(target)}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

function StatTile({
  emoji,
  label,
  value,
  flame = false,
}: {
  emoji: string;
  label: string;
  value: string;
  flame?: boolean;
}) {
  return (
    <motion.div
      variants={staggerChild}
      className="card flex flex-col items-center gap-0.5 p-3 text-center"
    >
      <span className={`text-2xl ${flame ? 'animate-flame' : ''}`}>{emoji}</span>
      <span className="text-xl font-black text-slate-800">{value}</span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
    </motion.div>
  );
}
