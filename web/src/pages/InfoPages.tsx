import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { GoldDivider, SectionHeading } from "../components/Decor";
import { useToast } from "../lib/toast";

export function About() {
  return (
    <div className="page">
      <header className="page-hero">
        <p className="kicker">Our story</p>
        <h1 className="brush">About Khang</h1>
        <GoldDivider />
      </header>
      <div className="about-grid">
        <Reveal>
          <div className="about-card">
            <h2 className="brush">Tradition on every plate</h2>
            <p>Khang Chinese Restaurant &amp; Dimsum brings the teahouse spirit of southern China to your table. Our dim sum is folded by hand each morning and steamed to order.</p>
            <p>From slow-simmered broths to wok-fired classics, every recipe is built on fresh ingredients and patient technique.</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="about-card accent">
            <h2 className="brush">What we stand for</h2>
            <ul className="check-list">
              <li>Fresh ingredients, prepared daily</li>
              <li>Recipes rooted in Chinese tradition</li>
              <li>Warm hospitality for every guest</li>
              <li>Transparent pricing with no surprises</li>
            </ul>
          </div>
        </Reveal>
      </div>
      <div className="stats-row">
        {[["4.6 ★", "Average rating"], ["583", "Guest reviews"], ["5", "Dim sum categories"], ["7 days", "Open every week"]].map(([n, l], i) => (
          <Reveal key={l} delay={i * 80}>
            <div className="stat"><strong className="brush">{n}</strong><span>{l}</span></div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

const SERVICES = [
  { icon: "🥢", title: "Dine-In", text: "A warm, lantern-lit dining room with tables for families, friends and business lunches." },
  { icon: "🛵", title: "Home Delivery", text: "Order online and track your delivery live from kitchen to doorstep. Free delivery over ₹499." },
  { icon: "🎉", title: "Private Dining", text: "Book a dim sum brunch or a banquet for weddings, birthdays and corporate events." },
  { icon: "🍱", title: "Catering", text: "Dim sum platters and family-style feasts delivered to your office or event venue." },
];

export function Services() {
  return (
    <div className="page">
      <header className="page-hero">
        <p className="kicker">What we offer</p>
        <h1 className="brush">Our Services</h1>
      </header>
      <div className="service-grid">
        {SERVICES.map((s, i) => (
          <Reveal key={s.title} delay={i * 90}>
            <article className="service-card">
              <div className="service-icon" aria-hidden="true">{s.icon}</div>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
              <Link to={s.title === "Home Delivery" ? "/menu" : "/contact"} className="link-btn">Learn more →</Link>
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <div className="hours-card">
          <SectionHeading title="Opening Hours" />
          <table>
            <tbody>
              <tr><td>Monday – Friday</td><td>11:00 – 23:00</td></tr>
              <tr><td>Saturday – Sunday</td><td>10:00 – 23:30</td></tr>
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}

export function Contact() {
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    // Contact messages are not stored yet. Connect this to Supabase (table + edge function) or an email API before launch.
    toast.show("Contact form is not connected yet. Please call or message us on Instagram.");
    setSent(false);
  };
  return (
    <div className="page">
      <header className="page-hero">
        <p className="kicker">We would love to hear from you</p>
        <h1 className="brush">Contact Us</h1>
      </header>
      <div className="contact-grid">
        <Reveal>
          <div className="about-card">
            <h3>Visit us</h3>
            <p>Khang Chinese Restaurant &amp; Dimsum<br />[Add your street address]</p>
            <h3>Call</h3>
            <p><a href="tel:+910000000000">+91 00000 00000</a> (replace with your number)</p>
            <h3>Instagram</h3>
            <p><a href="https://www.instagram.com/khang.resto" target="_blank" rel="noreferrer">@khang.resto</a></p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <form className="about-card form" onSubmit={submit}>
            <h3>Send a message</h3>
            <label>Name<input required minLength={2} /></label>
            <label>Email<input type="email" required /></label>
            <label>Message<textarea required minLength={5} rows={5} /></label>
            <button className="btn btn-primary" type="submit" disabled={sent}>{sent ? "Sent ✓" : "Send"}</button>
          </form>
        </Reveal>
      </div>
    </div>
  );
}
