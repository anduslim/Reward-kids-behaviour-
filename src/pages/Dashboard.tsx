import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore, useSelectedKid } from '../store/useStore';
import type { Behaviour } from '../types';
import { AvatarView } from '../components/AvatarView';
import { StarBadge } from '../components/StarBadge';
import { StoredImage } from '../components/StoredImage';
import { EmptyState, PageHeader } from '../components/Layout';
import { useParentGate } from '../components/ParentGate';
import { useCelebration } from '../components/Celebration';
import { computeStreaks } from '../lib/achievements';
import { clampStars, starLabel } from '../lib/stars';

export function Dashboard() {
  const kids = useStore((s) => s.kids);
  const selectKid = useStore((s) => s.selectKid);
  const allBehaviours = useStore((s) => s.behaviours);
  const behaviours = useMemo(() => allBehaviours.filter((b) => b.active), [allBehaviours]);
  const ledger = useStore((s) => s.ledger);
  const awardStars = useStore((s) => s.awardStars);
  const kid = useSelectedKid();
  const { requirePin } = useParentGate();
  const { celebrate } = useCelebration();

  const [flash, setFlash] = useState<{ id: string; amount: number } | null>(null);
  const [custom, setCustom] = useState<Behaviour | null>(null);

  const kidLedger = useMemo(
    () => ledger.filter((e) => e.kidId === kid?.id),
    [ledger, kid?.id],
  );
  const streak = useMemo(() => computeStreaks(kidLedger), [kidLedger]);
  const recent = useMemo(
    () => [...kidLedger].reverse().slice(0, 6),
    [kidLedger],
  );

  if (kids.length === 0) {
    return (
      <EmptyState
        emoji="🌟"
        title="Welcome to Star Kids!"
        subtitle="Add a child to start rewarding good behaviours with stars."
        action={
          <Link to="/kids" className="btn-primary">
            + Add your first kid
          </Link>
        }
      />
    );
  }

  const doAward = (b: Behaviour, amount?: number) => {
    if (!kid) return;
    requirePin(() => {
      const stars = clampStars(amount ?? b.defaultStars);
      const newly = awardStars(kid.id, b, stars);
      setFlash({ id: b.id, amount: stars });
      setTimeout(() => setFlash(null), 900);
      celebrate(newly);
    });
  };

  return (
    <div>
      <PageHeader title="Star Board" subtitle="Tap a behaviour to reward a star" />

      {/* Kid selector */}
      {kids.length > 1 && (
        <div className="mb-4 flex gap-3 overflow-x-auto pb-2">
          {kids.map((k) => (
            <button
              key={k.id}
              onClick={() => selectKid(k.id)}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl p-1 ${
                k.id === kid?.id ? '' : 'opacity-60'
              }`}
            >
              <AvatarView config={k.avatar} size={56} ring={k.id === kid?.id} />
              <span className="text-xs font-bold text-slate-600">{k.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Balance hero */}
      {kid && (
        <div className="card mb-5 flex items-center gap-4 bg-gradient-to-br from-brand-500 to-grape-500 p-5 text-white">
          <AvatarView config={kid.avatar} size={72} className="ring-4 ring-white/40" />
          <div className="flex-1">
            <div className="text-lg font-extrabold">{kid.name}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">{starLabel(kid.starBalance)}</span>
              <span className="text-xl">★</span>
            </div>
            {streak.current > 0 && (
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-sm font-bold">
                🔥 {streak.current}-day streak
              </div>
            )}
          </div>
        </div>
      )}

      {/* Behaviour grid */}
      {behaviours.length === 0 ? (
        <EmptyState
          emoji="✅"
          title="No behaviours yet"
          subtitle="Add some good behaviours to start awarding stars."
          action={
            <Link to="/behaviours" className="btn-primary">
              Manage behaviours
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {behaviours.map((b) => (
            <div key={b.id} className="relative">
              <button
                onClick={() => doAward(b)}
                className="card flex w-full flex-col items-center gap-2 p-4 text-center transition hover:-translate-y-0.5 active:scale-95"
              >
                {b.imageId ? (
                  <StoredImage
                    imageId={b.imageId}
                    fallback={b.icon}
                    className="h-14 w-14 rounded-2xl"
                  />
                ) : (
                  <span className="text-4xl">{b.icon ?? '⭐'}</span>
                )}
                <span className="text-sm font-bold leading-tight text-slate-700">
                  {b.name}
                </span>
                <StarBadge value={b.defaultStars} />
              </button>
              <button
                onClick={() => setCustom(b)}
                className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200"
                aria-label="Custom amount"
              >
                ½
              </button>
              {flash?.id === b.id && (
                <motion.div
                  initial={{ opacity: 0, y: 0, scale: 0.8 }}
                  animate={{ opacity: 1, y: -40, scale: 1.4 }}
                  className="pointer-events-none absolute inset-x-0 top-6 text-center text-2xl font-black text-amber-500"
                >
                  +{starLabel(flash.amount)}★
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent activity */}
      {recent.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
            Recent activity
          </h2>
          <div className="card divide-y divide-slate-100">
            {recent.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span>{e.type === 'redeem' ? '🎁' : '⭐'}</span>
                  <span className="text-sm font-semibold text-slate-700">{e.label}</span>
                </div>
                <span
                  className={`text-sm font-extrabold ${
                    e.stars >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {e.stars >= 0 ? '+' : ''}
                  {starLabel(e.stars)}★
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {custom && kid && (
        <CustomAwardModal
          behaviour={custom}
          onClose={() => setCustom(null)}
          onConfirm={(amount) => {
            setCustom(null);
            doAward(custom, amount);
          }}
        />
      )}
    </div>
  );
}

function CustomAwardModal({
  behaviour,
  onClose,
  onConfirm,
}: {
  behaviour: Behaviour;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(behaviour.defaultStars);
  const options = [0.5, 1, 1.5, 2, 3, 5];
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="card w-full max-w-xs p-6 text-center">
        <div className="text-3xl">{behaviour.icon ?? '⭐'}</div>
        <h2 className="mb-1 text-lg font-extrabold text-slate-800">{behaviour.name}</h2>
        <p className="mb-4 text-sm text-slate-500">How many stars?</p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => setAmount(o)}
              className={`btn !py-2 text-sm ring-1 ${
                amount === o
                  ? 'bg-brand-500 text-white ring-brand-500'
                  : 'bg-white text-slate-600 ring-slate-200'
              }`}
            >
              {starLabel(o)}★
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary flex-1" onClick={() => onConfirm(amount)}>
            Give {starLabel(amount)}★
          </button>
        </div>
      </div>
    </div>
  );
}
