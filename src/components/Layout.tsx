import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { NavBar } from './NavBar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    // app-shell uses 100dvh (visible viewport, vh fallback) so the bottom nav
    // sits flush on iOS Safari instead of floating above the fold.
    <div className="app-shell flex flex-col md:flex-col-reverse">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-6 md:pb-8 md:pt-24">
        {children}
      </main>
      <NavBar />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-end justify-between gap-3">
      <div>
        <h1 className="bg-gradient-to-r from-brand-600 via-brand-500 to-grape-500 bg-clip-text text-[1.7rem] font-black leading-tight text-transparent">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm font-semibold text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  emoji,
  title,
  subtitle,
  action,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="card relative flex flex-col items-center gap-2 overflow-hidden px-6 py-14 text-center"
    >
      {/* soft decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-50 to-transparent"
      />
      <span aria-hidden className="absolute left-6 top-6 text-lg text-amber-300 animate-twinkle">
        ✦
      </span>
      <span
        aria-hidden
        className="absolute right-8 top-10 text-sm text-grape-300 animate-twinkle"
        style={{ animationDelay: '0.9s' }}
      >
        ✦
      </span>
      <motion.span
        aria-hidden
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative text-6xl drop-shadow-sm"
      >
        {emoji}
      </motion.span>
      <h2 className="relative mt-1 text-xl font-extrabold text-slate-700">{title}</h2>
      {subtitle && <p className="relative max-w-xs text-sm text-slate-500">{subtitle}</p>}
      {action && <div className="relative mt-3">{action}</div>}
    </motion.div>
  );
}
