import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { PageHeader, EmptyState } from '../components/Layout';

/**
 * Opt-in entry point for the private family-group leaderboard. The full
 * cross-device sharing (Supabase-backed) is planned for a later release, so
 * for now this shows a friendly "coming soon" state once enabled in Settings.
 */
export function LeaderboardPage() {
  const enabled = useStore((s) => s.leaderboardEnabled);

  if (!enabled) {
    return (
      <div>
        <PageHeader title="Leaderboard" subtitle="Private family rankings" />
        <EmptyState
          emoji="🏆"
          title="Leaderboard is off"
          subtitle="Turn on the Family Leaderboard in Settings to compare stars with your family."
          action={
            <Link to="/settings" className="btn-primary">
              Go to Settings
            </Link>
          }
        />
      </div>
    );
  }

  const perks = [
    ['👨‍👩‍👧‍👦', 'Private family group', 'Invite co-parents, grandparents or cousins with a code.'],
    ['⭐', 'Shared star rankings', 'See how everyone’s stars stack up, updated across devices.'],
    ['🔒', 'You stay in control', 'Opt in per kid; only nicknames, avatars and totals are shared.'],
  ];

  return (
    <div>
      <PageHeader title="Family Leaderboard" subtitle="You’re on the early list 🎉" />

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="card relative overflow-hidden border-none bg-gradient-to-br from-brand-400 via-brand-500 to-grape-600 p-6 text-center text-white shadow-pop"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl"
        />
        <motion.div
          animate={{ y: [0, -6, 0], rotate: [0, -4, 4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-6xl drop-shadow"
        >
          🏆
        </motion.div>
        <h2 className="mt-2 text-xl font-extrabold">Coming soon</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm font-semibold text-white/90">
          A private, opt-in way to compare stars with your own family group. It’s enabled — we’re
          putting the finishing touches on cross-device sharing.
        </p>
      </motion.div>

      <div className="mt-5 space-y-3">
        {perks.map(([emoji, title, body], i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 26 }}
            className="card flex items-start gap-3 p-4"
          >
            <span className="text-2xl">{emoji}</span>
            <div>
              <div className="font-extrabold text-slate-800">{title}</div>
              <p className="text-sm text-slate-500">{body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="mt-5 text-center text-xs font-semibold text-slate-400">
        You can turn this off anytime in Settings.
      </p>
    </div>
  );
}
