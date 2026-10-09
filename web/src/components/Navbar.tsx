import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/menu", label: "Menu" },
  { to: "/top-foods", label: "Top Foods" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/contact", label: "Contact" },
];

interface Props {
  onSearch: () => void;
}

export function Navbar({ onSearch }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const { count, openDrawer, lastAddedAt } = useCart();
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const onHero = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!lastAddedAt) return;
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 450);
    return () => window.clearTimeout(t);
  }, [lastAddedAt]);

  const transparent = onHero && !scrolled;

  return (
    <header className={`navbar ${transparent ? "is-clear" : "is-glass"} ${scrolled ? "is-scrolled" : ""}`}>
      <div className="nav-inner">
        <Link to="/" className="logo" aria-label="Khang Dimsum home">
          <span className="logo-mark brush">康</span>
          <span className="logo-text">
            <span className="brush logo-name">Khang</span>
            <small>Dimsum · Chinese</small>
          </span>
        </Link>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`} aria-label="Primary">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/track" className="nav-link">Track Order</NavLink>
        </nav>

        <div className="nav-actions">
          <button className="icon-btn" onClick={onSearch} aria-label="Search dishes">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" strokeLinecap="round" />
            </svg>
          </button>
          <button className={`icon-btn cart-btn ${bump ? "bump" : ""}`} onClick={openDrawer} aria-label={`Cart, ${count} items`}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" strokeLinejoin="round" />
              <circle cx="10" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" />
            </svg>
            {count > 0 && <span className="cart-count">{count}</span>}
          </button>
          <button className="icon-btn profile-btn" onClick={() => navigate(user ? "/profile" : "/login")} aria-label={user ? "Profile" : "Login"}>
            {user ? <span className="avatar">{(user.user_metadata?.full_name as string | undefined)?.[0] ?? "U"}</span> : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
              </svg>
            )}
          </button>
          {isAdmin && <Link to="/admin" className="admin-pill">Admin</Link>}
          <button className="icon-btn menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={menuOpen}>
            <span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
