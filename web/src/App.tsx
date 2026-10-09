import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { CatalogProvider } from "./lib/catalog";
import { AuthProvider } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import { ToastProvider } from "./lib/toast";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import { SearchOverlay } from "./components/SearchOverlay";
import { IntroGate } from "./components/IntroAnimation";
import { Home } from "./pages/Home";
import { Menu } from "./pages/Menu";
import { TopFoods } from "./pages/TopFoods";
import { About, Contact, Services } from "./pages/InfoPages";
import { Checkout } from "./pages/Checkout";
import { OrderSuccess } from "./pages/OrderSuccess";
import { Track } from "./pages/Track";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
import { Admin } from "./pages/Admin";
import { isSupabaseConfigured } from "./lib/supabase";

function Shell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <IntroGate>
      <Navbar onSearch={() => setSearchOpen(true)} />
      {!isSupabaseConfigured && (
        <div className="preview-banner">Preview mode: menu is sample data. Connect Supabase to enable ordering (see README).</div>
      )}
      <CartDrawer />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      <main>
        {/* key on pathname replays the fade + slide page transition on every route change */}
        <div key={location.pathname} className="page-transition">
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/top-foods" element={<TopFoods />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/success" element={<OrderSuccess />} />
            <Route path="/track" element={<Track />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route
              path="*"
              element={
                <div className="page center">
                  <h1 className="heading-font">Page not found</h1>
                  <a className="btn btn-primary" href="/">Back home</a>
                </div>
              }
            />
          </Routes>
        </div>
      </main>
      <Footer />
    </IntroGate>
  );
}

export function App() {
  return (
    <CatalogProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </CatalogProvider>
  );
}
