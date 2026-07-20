import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const links = [
  { to: '/', label: 'Home', emoji: '🏠', end: true },
  { to: '/behaviours', label: 'Behaviours', emoji: '✅' },
  { to: '/rewards', label: 'Rewards', emoji: '🎁' },
  { to: '/achievements', label: 'Awards', emoji: '🏅' },
  { to: '/kids', label: 'Kids', emoji: '👦' },
  { to: '/settings', label: 'Settings', emoji: '⚙️' },
];

export function NavBar() {
  const { pathname } = useLocation();

  return (
    <nav className="sticky bottom-0 z-30 border-t border-slate-100 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:bottom-auto md:top-0 md:border-b md:border-t-0">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-2">
        {links.map((l) => {
          const isActive = l.end ? pathname === l.to : pathname.startsWith(l.to);
          return (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={`relative isolate flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2.5 text-[11px] font-bold transition-colors ${
                isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active-pill"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-x-1 inset-y-1 -z-10 rounded-2xl bg-gradient-to-b from-brand-50 to-brand-100 ring-1 ring-brand-200/70"
                />
              )}
              <motion.span
                animate={isActive ? { scale: 1.15, y: -1 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="text-xl"
              >
                {l.emoji}
              </motion.span>
              <span className="hidden sm:block">{l.label}</span>
              {isActive && (
                <motion.span
                  layoutId="nav-active-dot"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute -bottom-0.5 h-1 w-6 rounded-full bg-brand-400 sm:hidden"
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
