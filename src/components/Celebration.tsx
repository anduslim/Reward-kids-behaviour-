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

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const burst = useCallback(() => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#f97316', '#8b5cf6', '#fbbf24', '#34d399', '#60a5fa'],
    });
  }, []);

  const celebrate = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      burst();
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
    },
    [burst],
  );

  return (
    <Ctx.Provider value={{ burst, celebrate }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="card flex items-center gap-3 px-4 py-3"
            >
              <span className="text-3xl">{t.emoji}</span>
              <div>
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
