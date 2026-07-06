import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/about',     label: 'About Me' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/tutorials', label: 'Save Slot' },
  { to: '/contact',   label: 'Services' },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <ul className="navbar__list">
        {LINKS.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                `navbar__link${isActive ? ' is-active' : ''}`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: var(--z-chrome);
          padding: var(--space-6) var(--space-8);
          display: flex;
          justify-content: center;
        }

        .navbar__list {
          display: flex;
          gap: var(--space-8);
        }

        .navbar__link {
          font-size: 0.85rem;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-muted);
          padding: var(--space-1) 0;
          border-bottom: 1px solid transparent;
          transition:
            color var(--dur-normal) var(--ease-out),
            border-color var(--dur-normal) var(--ease-out);
        }

        .navbar__link:hover {
          color: var(--color-fg);
        }

        .navbar__link.is-active {
          color: var(--color-fg);
          border-bottom-color: var(--color-fg);
        }
      `}</style>
    </nav>
  );
}
