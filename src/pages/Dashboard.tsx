import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore, useSelectedKid } from '../store/useStore';
import type { Behaviour } from '../types';
import { AvatarView } from '../components/AvatarView';
import { StarBadge } from '../components/StarBadge';
import { StoredImage } from '../components/StoredImage';
import { EmptyState, PageHeader } from '../components/Layout';
import { useParentGate } from '../components/ParentGate';
import { useCelebration } from '../components/Celebration';
import {
  AnimatedNumber,
  ModalShell,
  StarBurst,
  staggerChild,
  staggerParent,
} from '../components/motion';
import { computeStreaks } from '../lib/achievements';
import { clampStars, roundToHalf, starLabel } from '../lib/stars';

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

  const [flash, setFlash] = useState<{ id: string; amount: number; key: number } | null>(null);
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
      setFlash({ id: b.id, amount: stars, key: Date.now() });
      setTimeout(() => setFlash(null), 950);
      celebrate(newly);
    });
  };

  return (
    <div>
      <PageHeader title="Star Board" subtitle="Tap a behaviour to reward a star" />

      {/* Kid selector */}
      {kids.length > 1 && (
        <div className="scrollbar-hide mb-4 flex gap-3 overflow-x-auto pb-2">
          {kids.map((k) => (
            <motion.button
              key={k.id}
              onClick={() => selectKid(k.id)}
              whileTap={{ scale: 0.92 }}
              animate={{ scale: k.id === kid?.id ? 1 : 0.94, opacity: k.id === kid?.id ? 1 : 0.55 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex shrink-0 flex-col items-center gap-1 rounded-2xl p-1"
            >
              <AvatarView config={k.avatar} size={56} ring={k.id === kid?.id} />
              <span className="text-xs font-bold text-slate-600">{k.name}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Balance hero */}
      {kid && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="card relative mb-6 flex items-center gap-4 overflow-hidden border-none bg-gradient-to-br from-brand-400 via-brand-500 to-grape-600 p-5 text-white shadow-pop ring-0"
        >
          {/* decorative twinkles */}
          <span aria-hidden className="absolute right-5 top-3 text-lg text-white/50 animate-twinkle">
            ✦
          </span>
          <span
            aria-hidden
            className="absolute right-14 bottom-4 text-xs text-white/40 animate-twinkle"
            style={{ animationDelay: '0.8s' }}
          >
            ✦
          </span>
          <span
            aria-hidden
            className="absolute left-24 top-2 text-sm text-white/30 animate-twinkle"
            style={{ animationDelay: '1.5s' }}
          >
            ✦
          </span>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10 blur-2xl"
          />
          <AvatarView config={kid.avatar} size={76} className="relative shrink-0 ring-4 ring-white/40" />
          <div className="relative flex-1">
            <div className="text-lg font-extrabold drop-shadow-sm">{kid.name}</div>
            <div className="flex items-baseline gap-1.5">
              <AnimatedNumber
                value={kid.starBalance}
                format={(n) => starLabel(roundToHalf(n))}
                className="text-[2.6rem] font-black leading-none drop-shadow-sm"
              />
              <span className="text-2xl text-amber-300 drop-shadow-sm">★</span>
            </div>
            {streak.current > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-sm font-bold backdrop-blur-sm"
              >
                <span className="inline-block animate-flame">🔥</span>
                {streak.current}-day streak
              </motion.div>
            )}
          </div>
        </motion.div>
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
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {behaviours.map((b) => (
            <motion.div key={b.id} variants={staggerChild} className="relative">
              <motion.button
                onClick={() => doAward(b)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="card flex w-full flex-col items-center gap-2 p-4 text-center hover:shadow-card-hover"
              >
                {b.imageId ? (
                  <StoredImage
                    imageId={b.imageId}
                    fallback={b.icon}
                    className="h-14 w-14 rounded-2xl"
                  />
                ) : (
                  <span className="text-4xl drop-shadow-sm">{b.icon ?? '⭐'}</span>
                )}
                <span className="text-sm font-bold leading-tight text-slate-700">
                  {b.name}
                </span>
                <StarBadge value={b.defaultStars} />
              </motion.button>
              <motion.button
                onClick={() => setCustom(b)}
                whileTap={{ scale: 0.85 }}
                className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-600 hover:ring-brand-200"
                aria-label="Custom amount"
              >
                ½
              </motion.button>
              {flash?.id === b.id && (
                <div key={flash.key}>
                  <StarBurst />
                  <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.7 }}
                    animate={{ opacity: [0, 1, 1, 0], y: -48, scale: 1.4 }}
                    transition={{ duration: 0.9, times: [0, 0.2, 0.75, 1] }}
                    className="pointer-events-none absolute inset-x-0 top-6 text-center text-2xl font-black text-amber-500 drop-shadow"
                  >
                    +{starLabel(flash.amount)}★
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Recent activity */}
      {recent.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
            Recent activity
          </h2>
          <div className="card divide-y divide-slate-100 overflow-hidden">
            <AnimatePresence initial={false}>
              {recent.map((e) => (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-base ring-1 ring-slate-100">
                      {e.type === 'redeem' ? '🎁' : '⭐'}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{e.label}</span>
                  </div>
                  <span
                    className={`text-sm font-extrabold tabular-nums ${
                      e.stars >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {e.stars >= 0 ? '+' : ''}
                    {starLabel(e.stars)}★
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      <AnimatePresence>
        {custom && kid && (
          <CustomAwardModal
            key="custom-award"
            behaviour={custom}
            onClose={() => setCustom(null)}
            onConfirm={(amount) => {
              setCustom(null);
              doAward(custom, amount);
            }}
          />
        )}
      </AnimatePresence>
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
    <ModalShell onClose={onClose} className="card w-full max-w-xs p-6 text-center">
      <motion.div
        initial={{ scale: 0.5, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 15, delay: 0.05 }}
        className="text-4xl"
      >
        {behaviour.icon ?? '⭐'}
      </motion.div>
      <h2 className="mb-1 mt-1 text-lg font-extrabold text-slate-800">{behaviour.name}</h2>
      <p className="mb-4 text-sm text-slate-500">How many stars?</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {options.map((o) => (
          <motion.button
            key={o}
            onClick={() => setAmount(o)}
            whileTap={{ scale: 0.9 }}
            className={`btn !py-2 text-sm ring-1 ${
              amount === o
                ? 'bg-gradient-to-b from-brand-400 to-brand-500 text-white shadow-pop ring-brand-500'
                : 'bg-white text-slate-600 ring-slate-200 hover:ring-brand-300'
            }`}
          >
            {starLabel(o)}★
          </motion.button>
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
    </ModalShell>
  );
}
