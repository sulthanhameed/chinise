import { Link } from "react-router-dom";
import { GoldDivider } from "./Decor";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <GoldDivider />
      <div className="footer-grid">
        <div>
          <div className="footer-logo"><Logo /></div>
          <p className="muted footer-tag">Khang Chinese Restaurant &amp; Dimsum</p>
          <p className="muted">Authentic Chinese flavors, crafted fresh every day.</p>
        </div>
        <nav aria-label="Footer">
          <Link to="/menu">Menu</Link>
          <Link to="/top-foods">Top Foods</Link>
          <Link to="/track">Track Order</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <div className="muted">
          <p>Open daily · 11:00 – 23:00</p>
          <p>Follow us on Instagram @khang.resto</p>
        </div>
      </div>
      <p className="copyright">© {new Date().getFullYear()} Khang Dimsum. All rights reserved.</p>
    </footer>
  );
}
