import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { ACHIEVEMENTS } from '../lib/achievements';

interface CelebrationValue {
  /** Fire confetti. */
  burst: () => void;
  /** Show toasts for newly-unlocked achievement ids (and fire confetti). */
  celebrate: (newlyUnlockedIds: string[]) => void;
}

const Ctx = createContext<CelebrationValue | null>(null);

interface Toast {
  id: string;
  emoji: string;
  name: string;
}

const PALETTE = ['#f97316', '#8b5cf6', '#fbbf24', '#34d399', '#60a5fa', '#f472b6'];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Layered, premium-feeling confetti: center pop + gold star flutter + side cannons. */
function fireConfetti(big: boolean) {
  if (prefersReducedMotion()) return;

  // 1. Centre pop
  confetti({
    particleCount: big ? 80 : 60,
    spread: 75,
    startVelocity: 38,
    origin: { y: 0.7 },
    colors: PALETTE,
    scalar: 0.9,
    ticks: 180,
    disableForReducedMotion: true,
  });
  // 2. Slow gold stars drifting above it
  confetti({
    particleCount: big ? 26 : 16,
    spread: 100,
    startVelocity: 24,
    gravity: 0.55,
    decay: 0.93,
    origin: { y: 0.65 },
    shapes: ['star'],
    colors: ['#fbbf24', '#f59e0b', '#fde68a'],
    scalar: 1.2,
    ticks: 220,
    disableForReducedMotion: true,
  });
  // 3. Side cannons, slightly delayed, for the "big" celebration
  if (big) {
    setTimeout(() => {
      confetti({
        particleCount: 45,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: PALETTE,
        ticks: 200,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 45,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: PALETTE,
        ticks: 200,
        disableForReducedMotion: true,
      });
    }, 220);
  }
}

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const burst = useCallback(() => {
    fireConfetti(false);
  }, []);

  const celebrate = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    fireConfetti(true);
    const next = ids
      .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
      .filter((a): a is (typeof ACHIEVEMENTS)[number] => Boolean(a))
      .map((a) => ({ id: a.id + Date.now(), emoji: a.emoji, name: a.name }));
    setToasts((t) => [...t, ...next]);
    next.forEach((toast) => {
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== toast.id));
      }, 4000);
    });
  }, []);

  return (
    <Ctx.Provider value={{ burst, celebrate }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -32, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="card relative flex items-center gap-3 overflow-hidden px-4 py-3 ring-2 ring-amber-200"
            >
              {/* shine sweep */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-16 -skew-x-12 bg-gradient-to-r from-transparent via-amber-100/80 to-transparent animate-shimmer"
              />
              <motion.span
                initial={{ rotate: -20, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}
                className="relative text-3xl drop-shadow-sm"
              >
                {t.emoji}
              </motion.span>
              <div className="relative">
                <div className="text-xs font-bold uppercase tracking-wide text-grape-500">
                  Achievement unlocked!
                </div>
                <div className="font-extrabold text-slate-800">{t.name}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useCelebration(): CelebrationValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCelebration must be used within CelebrationProvider');
  return ctx;
}
