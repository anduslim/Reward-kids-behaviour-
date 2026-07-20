import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useReducedMotion, type Variants } from 'framer-motion';

/* ------------------------------------------------------------------ */
/* Shared stagger variants for lists & grids                           */
/* ------------------------------------------------------------------ */

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 28 },
  },
};

/* ------------------------------------------------------------------ */
/* Animated count-up number (used by the star-balance hero)            */
/* ------------------------------------------------------------------ */

export function AnimatedNumber({
  value,
  format = (n) => String(n),
  className = '',
}: {
  value: number;
  /** Format the in-flight value for display (e.g. round to halves). */
  format?: (n: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (prev.current === value) return;
    if (reduced) {
      prev.current = value;
      setDisplay(value);
      return;
    }
    const from = prev.current;
    prev.current = value;
    setBump((b) => b + 1);
    const controls = animate(from, value, {
      duration: 0.7,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduced]);

  return (
    <motion.span
      key={bump}
      initial={bump === 0 ? false : { scale: 1 }}
      animate={bump === 0 ? undefined : { scale: [1, 1.22, 1] }}
      transition={{ duration: 0.45, times: [0, 0.4, 1] }}
      className={`inline-block tabular-nums ${className}`}
    >
      {format(display)}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* Modal shell: backdrop fade + panel spring (bottom sheet on mobile)  */
/* ------------------------------------------------------------------ */

export function ModalShell({
  children,
  onClose,
  sheet = false,
  className = '',
  zIndex = 'z-40',
}: {
  children: ReactNode;
  onClose?: () => void;
  /** Slide up as a bottom sheet on small screens (forms). */
  sheet?: boolean;
  className?: string;
  zIndex?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={`fixed inset-0 ${zIndex} flex ${
        sheet ? 'items-end sm:items-center sm:p-4' : 'items-center p-4'
      } justify-center bg-slate-900/50 backdrop-blur-[2px]`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: sheet ? 80 : 24, scale: sheet ? 1 : 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: sheet ? 80 : 16, scale: sheet ? 1 : 0.95 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className={className}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Star burst: little stars flying radially out of an awarded tile     */
/* ------------------------------------------------------------------ */

const BURST_STARS = [0, 60, 120, 180, 240, 300];

export function StarBurst() {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {/* expanding ring */}
      <motion.span
        initial={{ scale: 0.3, opacity: 0.7 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="absolute h-16 w-16 rounded-full border-4 border-amber-300"
      />
      {BURST_STARS.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <motion.span
            key={deg}
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos(rad) * 56,
              y: Math.sin(rad) * 56,
              scale: 1,
              opacity: 0,
              rotate: deg > 180 ? -120 : 120,
            }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute text-xl text-amber-400"
          >
            ★
          </motion.span>
        );
      })}
    </div>
  );
}
