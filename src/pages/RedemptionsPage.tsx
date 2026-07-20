import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import type { Kid, Redemption } from '../types';
import { AvatarView } from '../components/AvatarView';
import { StarBadge } from '../components/StarBadge';
import { StoredImage } from '../components/StoredImage';
import { EmptyState, PageHeader } from '../components/Layout';
import { staggerChild, staggerParent } from '../components/motion';
import { useParentGate } from '../components/ParentGate';

export function RedemptionsPage() {
  const redemptions = useStore((s) => s.redemptions);
  const kids = useStore((s) => s.kids);
  const fulfillRedemption = useStore((s) => s.fulfillRedemption);
  const reopenRedemption = useStore((s) => s.reopenRedemption);
  const deleteRedemption = useStore((s) => s.deleteRedemption);
  const { requirePin } = useParentGate();

  const kidById = useMemo(() => {
    const m = new Map<string, Kid>();
    kids.forEach((k) => m.set(k.id, k));
    return m;
  }, [kids]);

  // Pending oldest-first (a real to-do queue); fulfilled newest-first (history).
  const pending = useMemo(
    () =>
      redemptions
        .filter((r) => r.status === 'pending')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [redemptions],
  );
  const fulfilled = useMemo(
    () =>
      redemptions
        .filter((r) => r.status === 'fulfilled')
        .sort((a, b) => (b.fulfilledAt ?? '').localeCompare(a.fulfilledAt ?? '')),
    [redemptions],
  );

  if (redemptions.length === 0) {
    return (
      <div>
        <PageHeader title="Redemption Queue" subtitle="Rewards to hand out" />
        <EmptyState
          emoji="🧾"
          title="Nothing to fulfill yet"
          subtitle="When a kid redeems a reward it lands here so you can track and tick it off once given."
          action={
            <Link to="/rewards" className="btn-grape">
              Go to rewards
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Redemption Queue"
        subtitle={
          pending.length > 0
            ? `${pending.length} reward${pending.length > 1 ? 's' : ''} to hand out`
            : 'All caught up! 🎉'
        }
      />

      {/* Pending */}
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
        To fulfill ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <div className="card mb-6 px-4 py-6 text-center text-sm font-semibold text-slate-500">
          🎉 Nothing waiting — every redeemed reward has been given out.
        </div>
      ) : (
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="mb-6 space-y-3"
        >
          <AnimatePresence initial={false}>
            {pending.map((r) => (
              <RedemptionCard
                key={r.id}
                redemption={r}
                kid={kidById.get(r.kidId)}
                onFulfill={() => requirePin(() => fulfillRedemption(r.id))}
                onCancel={() =>
                  requirePin(() => {
                    if (confirm(`Remove "${r.rewardName}" from the queue?`))
                      deleteRedemption(r.id);
                  })
                }
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Fulfilled history */}
      {fulfilled.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
            Given ({fulfilled.length})
          </h2>
          <motion.div
            variants={staggerParent}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <AnimatePresence initial={false}>
              {fulfilled.map((r) => (
                <RedemptionCard
                  key={r.id}
                  redemption={r}
                  kid={kidById.get(r.kidId)}
                  done
                  onReopen={() => requirePin(() => reopenRedemption(r.id))}
                  onCancel={() =>
                    requirePin(() => {
                      if (confirm(`Delete this record for "${r.rewardName}"?`))
                        deleteRedemption(r.id);
                    })
                  }
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </div>
  );
}

function RedemptionCard({
  redemption: r,
  kid,
  done = false,
  onFulfill,
  onReopen,
  onCancel,
}: {
  redemption: Redemption;
  kid?: Kid;
  done?: boolean;
  onFulfill?: () => void;
  onReopen?: () => void;
  onCancel?: () => void;
}) {
  return (
    <motion.div
      layout
      variants={staggerChild}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
      className={`card flex items-center gap-3 p-3 ${done ? 'opacity-75' : ''}`}
    >
      {r.imageId ? (
        <StoredImage
          imageId={r.imageId}
          fallback={r.icon}
          className="h-12 w-12 shrink-0 rounded-2xl"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-grape-50 to-brand-50 text-2xl ring-1 ring-slate-100">
          {r.icon ?? '🎁'}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="truncate font-extrabold text-slate-800">{r.rewardName}</div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          {kid && <AvatarView config={kid.avatar} size={18} />}
          <span className="truncate">
            {kid?.name ?? 'Someone'} ·{' '}
            {done
              ? `given ${formatDate(r.fulfilledAt)}`
              : `redeemed ${formatDate(r.createdAt)}`}
          </span>
        </div>
      </div>

      <StarBadge value={r.starCost} tone="muted" />

      {done ? (
        <div className="flex flex-col gap-1">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-center text-[11px] font-bold text-emerald-600">
            ✓ given
          </span>
          <div className="flex justify-end gap-1">
            <button
              className="rounded-lg px-2 py-0.5 text-xs text-slate-400 transition hover:bg-slate-100 active:scale-90"
              onClick={onReopen}
              aria-label="Move back to queue"
            >
              ↩
            </button>
            <button
              className="rounded-lg px-2 py-0.5 text-xs text-red-400 transition hover:bg-red-50 active:scale-90"
              onClick={onCancel}
              aria-label="Delete record"
            >
              🗑️
            </button>
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn-grape !px-3 !py-2 text-xs"
            onClick={onFulfill}
          >
            ✓ Mark given
          </motion.button>
          <button
            className="rounded-lg px-2 py-1 text-xs text-red-400 transition hover:bg-red-50 active:scale-90"
            onClick={onCancel}
            aria-label="Remove from queue"
          >
            🗑️
          </button>
        </div>
      )}
    </motion.div>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
