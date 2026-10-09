import { useState } from "react";
import { FoodImage, Stars } from "./FoodImage";
import { formatINR } from "../lib/money";
import type { Category, Product } from "../lib/types";

interface Props {
  product: Product;
  category?: Category;
  onOpen: (p: Product) => void;
  onAdd: (p: Product, qty: number) => void;
  onOrderNow: (p: Product, qty: number) => void;
}

export function ProductCard({ product, category, onOpen, onAdd, onOrderNow }: Props) {
  const [qty, setQty] = useState(1);
  const [pressed, setPressed] = useState(false);
  const unavailable = !product.is_available;

  return (
    <article className={`product-card ${unavailable ? "is-unavailable" : ""}`}>
      <button className="product-media" onClick={() => onOpen(product)} aria-label={`View ${product.name}`}>
        <FoodImage src={product.image_url} alt={product.name} emoji={category?.emoji} />
        {product.is_top && <span className="badge badge-gold">Top pick</span>}
        {unavailable && <span className="badge badge-dark">Sold out</span>}
      </button>
      <div className="product-body">
        <div className="product-title-row">
          <h3>{product.name}</h3>
          <Stars rating={product.rating} />
        </div>
        <p className="product-desc">{product.description}</p>
        <div className="product-price-row">
          <strong className="price">{formatINR(product.price)}</strong>
          <div className="qty" role="group" aria-label="Quantity">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(50, q + 1))} aria-label="Increase">+</button>
          </div>
        </div>
        <div className="product-actions">
          <button
            className={`btn btn-outline ${pressed ? "pressed" : ""}`}
            disabled={unavailable}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            onClick={() => onAdd(product, qty)}
          >
            Add to Cart
          </button>
          <button className="btn btn-primary" disabled={unavailable} onClick={() => onOrderNow(product, qty)}>
            Order Now
          </button>
        </div>
      </div>
    </article>
  );
}
