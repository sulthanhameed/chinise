import { useNavigate } from "react-router-dom";
import { useCart } from "../lib/cart";
import { formatINR, FREE_DELIVERY_ABOVE } from "../lib/money";
import { FoodImage } from "./FoodImage";

export function CartDrawer() {
  const { items, totals, drawerOpen, closeDrawer, setQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const checkout = () => {
    closeDrawer();
    navigate("/checkout");
  };

  return (
    <>
      <div className={`drawer-scrim ${drawerOpen ? "show" : ""}`} onClick={closeDrawer} aria-hidden="true" />
      <aside className={`cart-drawer ${drawerOpen ? "open" : ""}`} aria-label="Shopping cart" aria-hidden={!drawerOpen}>
        <header className="drawer-head">
          <h3 className="heading-font">Your Order</h3>
          <button className="icon-btn" onClick={closeDrawer} aria-label="Close cart">×</button>
        </header>

        {items.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-emoji">🥢</div>
            <p>Your cart is empty.</p>
            <button className="btn btn-primary" onClick={() => { closeDrawer(); navigate("/menu"); }}>Browse the menu</button>
          </div>
        ) : (
          <ul className="cart-items">
            {items.map((i) => (
              <li key={i.product_id} className="cart-item">
                <FoodImage src={i.image_url} alt={i.name} emoji={i.emoji} className="cart-thumb" />
                <div className="cart-info">
                  <strong>{i.name}</strong>
                  <span className="muted">{formatINR(i.price)} each</span>
                  <div className="qty small">
                    <button onClick={() => setQuantity(i.product_id, i.quantity - 1)} aria-label="Decrease">−</button>
                    <span>{i.quantity}</span>
                    <button onClick={() => setQuantity(i.product_id, i.quantity + 1)} aria-label="Increase">+</button>
                  </div>
                </div>
                <div className="cart-line">
                  <strong>{formatINR(i.price * i.quantity)}</strong>
                  <button className="link-btn" onClick={() => removeItem(i.product_id)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <footer className="drawer-foot">
            <dl className="totals">
              <div><dt>Subtotal</dt><dd>{formatINR(totals.subtotal)}</dd></div>
              <div><dt>Tax (5%)</dt><dd>{formatINR(totals.tax)}</dd></div>
              <div><dt>Delivery</dt><dd>{totals.delivery === 0 ? "Free" : formatINR(totals.delivery)}</dd></div>
              <div className="grand"><dt>Total</dt><dd>{formatINR(totals.total)}</dd></div>
            </dl>
            {totals.subtotal < FREE_DELIVERY_ABOVE && (
              <p className="hint">Add {formatINR(FREE_DELIVERY_ABOVE - totals.subtotal)} more for free delivery.</p>
            )}
            <button className="btn btn-primary btn-block" onClick={checkout}>Checkout</button>
          </footer>
        )}
      </aside>
    </>
  );
}
