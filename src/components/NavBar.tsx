import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home', emoji: '🏠', end: true },
  { to: '/behaviours', label: 'Behaviours', emoji: '✅' },
  { to: '/rewards', label: 'Rewards', emoji: '🎁' },
  { to: '/achievements', label: 'Awards', emoji: '🏅' },
  { to: '/kids', label: 'Kids', emoji: '👦' },
  { to: '/settings', label: 'Settings', emoji: '⚙️' },
];

export function NavBar() {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-slate-100 bg-white/90 backdrop-blur md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-2">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-xs font-bold transition ${
                isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <span className="text-xl">{l.emoji}</span>
            <span className="hidden sm:block">{l.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
