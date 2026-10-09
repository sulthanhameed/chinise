import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCatalog } from "../lib/catalog";
import { useProductActions } from "../lib/useProductActions";
import { useAuth } from "../lib/auth";
import { ProductModal } from "../components/ProductModal";
import { FoodSlider } from "../components/FoodSlider";
import { ChefSurprise } from "../components/ChefSurprise";
import { Testimonials } from "../components/Testimonials";
import { VideoBackdrop } from "../components/VideoBackdrop";
import { Lantern, GoldDivider, SectionHeading } from "../components/Decor";
import { Reveal } from "../components/Reveal";
import { FoodImage } from "../components/FoodImage";
import type { Product } from "../lib/types";

const SITE_RATING = 4.6;
const SITE_REVIEWS = 583;

function Hero() {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);

  // Parallax: the background moves slower than the page; text fades as you scroll away.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      el.style.setProperty("--parallax", `${y * 0.35}px`);
      el.style.setProperty("--fade", `${Math.max(0, 1 - y / 500)}`);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="hero" ref={ref}>
      <div className="hero-media">
        <VideoBackdrop src="/media/hero.mp4" poster="/images/hero-poster-v2.jpg" />
      </div>
      <div className="hero-lanterns" aria-hidden="true">
        <Lantern className="float-a" size={1.4} />
        <Lantern className="float-b" size={1} />
        <Lantern className="float-c" size={1.2} />
      </div>
      <div className="hero-content">
        <p className="kicker fade-in-up">Khang Chinese Restaurant &amp; Dimsum</p>
        <h1 className="heading-font fade-in-up delay-1">Authentic Chinese Flavors, Crafted Fresh</h1>
        <p className="hero-sub fade-in-up delay-2">
          Hand-folded dim sum, slow-simmered noodle broths and wok-fired classics — delivered hot to your door.
        </p>
        <div className="hero-cta fade-in-up delay-3">
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/menu")}>Order Now</button>
          <Link className="btn btn-glass btn-lg" to="/top-foods">See top foods</Link>
        </div>
        <div className="rating-badge fade-in-up delay-3">
          <span className="rating-score">{SITE_RATING} ★</span>
          <span>{SITE_REVIEWS} reviews</span>
        </div>
      </div>
      <div className="scroll-cue" aria-hidden="true"><span /></div>
    </section>
  );
}

function OrderTrackTeaser() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  return (
    <form
      className="track-teaser"
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) navigate(`/track?code=${encodeURIComponent(code.trim())}`);
      }}
    >
      <div>
        <p className="kicker">Already ordered?</p>
        <h3 className="heading-font">Track your order</h3>
        <p className="muted">Enter the Order ID from your confirmation message.</p>
      </div>
      <div className="track-input-row">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. KH1A2B3C4D" aria-label="Order ID" />
        <button className="btn btn-primary" type="submit">Track</button>
      </div>
    </form>
  );
}

export function Home() {
  const { products, categories, reviews } = useCatalog();
  const { add, orderNow } = useProductActions();
  const [active, setActive] = useState<Product | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const available = products.filter((p) => p.is_available);
  const featured = available.filter((p) => p.is_featured);
  const sliderItems = featured.length >= 4 ? featured : available;
  const activeCat = active ? categories.find((c) => c.id === active.category_id) : undefined;

  return (
    <div className="home">
      <Hero />

      <section className="section slider-section">
        <Reveal>
          <SectionHeading kicker="Guests' favourites" title="Featured Dishes" subtitle="Hover to pause · tap a dish to see details" />
        </Reveal>
        <FoodSlider products={sliderItems} categories={categories} onOpen={setActive} />
      </section>

      <section className="section">
        <Reveal>
          <SectionHeading kicker="Explore the menu" title="Food Categories" />
        </Reveal>
        <div className="category-grid">
          {categories.map((c, i) => (
            <Reveal key={c.id} delay={i * 80}>
              <button className="category-card" onClick={() => navigate(`/menu?cat=${c.slug}`)}>
                <FoodImage src={c.image_url} alt={c.name} emoji={c.emoji} />
                <div className="category-label">
                  <span className="category-emoji">{c.emoji}</span>
                  <strong>{c.name}</strong>
                  <span className="muted">{available.filter((p) => p.category_id === c.id).length} dishes →</span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="promo">
        <VideoBackdrop src="/media/promo.mp4" poster="/images/food/siu-mai.jpg" className="promo-video" />
        <Reveal className="promo-copy">
          <p className="kicker">Hand-folded every morning</p>
          <h2 className="heading-font">From our steamers to your table</h2>
          <p>Our dim sum chefs fold, steam and serve every basket fresh. Taste the tradition in every bite.</p>
          <Link className="btn btn-gold" to="/menu">Explore the menu</Link>
        </Reveal>
      </section>

      <section className="section chef-section">
        <Reveal>
          <ChefSurprise
            products={available}
            categories={categories}
            onAdd={(p) => add(p, 1)}
            onOpen={setActive}
          />
        </Reveal>
      </section>

      <section className="section">
        <Reveal>
          <SectionHeading kicker="Loved by our guests" title="Reviews" subtitle={`${SITE_RATING} ★ average from ${SITE_REVIEWS} reviews`} />
        </Reveal>
        <Testimonials reviews={reviews} />
      </section>

      <section className="section track-section">
        <Reveal>
          <OrderTrackTeaser />
        </Reveal>
        {!user && (
          <p className="center muted">
            <Link to="/login">Sign in</Link> to see your order history and faster checkout.
          </p>
        )}
      </section>

      <GoldDivider />

      {active && (
        <ProductModal
          product={active}
          category={activeCat}
          onClose={() => setActive(null)}
          onAdd={(p, q) => { add(p, q); setActive(null); }}
          onOrderNow={(p, q) => { orderNow(p, q); setActive(null); }}
        />
      )}
    </div>
  );
}
