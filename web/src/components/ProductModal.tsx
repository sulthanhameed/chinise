import { useEffect, useState } from "react";
import { FoodImage, Stars } from "./FoodImage";
import { formatINR } from "../lib/money";
import { fetchProductReviews } from "../lib/catalog";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import type { Category, Product, Review } from "../lib/types";

interface Props {
  product: Product;
  category?: Category;
  onClose: () => void;
  onAdd: (p: Product, qty: number) => void;
  onOrderNow: (p: Product, qty: number) => void;
}

export function ProductModal({ product, category, onClose, onAdd, onOrderNow }: Props) {
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { user, profile } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchProductReviews(product.id).then(setReviews);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product.id, onClose]);

  const submitReview = async () => {
    if (!supabase || !user) return;
    if (comment.trim().length < 3) return toast.show("Please write a short review");
    const { error } = await supabase.from("reviews").insert({
      product_id: product.id,
      user_id: user.id,
      author_name: profile?.full_name || "Guest",
      rating,
      comment: comment.trim(),
    });
    if (error) return toast.show(error.message);
    setComment("");
    setReviews(await fetchProductReviews(product.id));
    toast.show("Thanks for your review!");
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={product.name} onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-media">
          <FoodImage src={product.image_url} alt={product.name} emoji={category?.emoji} />
        </div>
        <div className="modal-body">
          <p className="kicker">{category?.name}</p>
          <h2 className="brush">{product.name}</h2>
          <div className="modal-meta">
            <Stars rating={product.rating} count={product.review_count} />
            <strong className="price">{formatINR(product.price)}</strong>
          </div>
          <p>{product.description}</p>
          {product.ingredients.length > 0 && (
            <>
              <h4>Ingredients</h4>
              <ul className="chips">{product.ingredients.map((i) => <li key={i}>{i}</li>)}</ul>
            </>
          )}
          <div className="product-price-row">
            <span className="muted">Quantity</span>
            <div className="qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(50, q + 1))} aria-label="Increase">+</button>
            </div>
          </div>
          <div className="product-actions">
            <button className="btn btn-outline" disabled={!product.is_available} onClick={() => onAdd(product, qty)}>Add to Cart</button>
            <button className="btn btn-primary" disabled={!product.is_available} onClick={() => onOrderNow(product, qty)}>Order Now</button>
          </div>

          <h4>Reviews</h4>
          {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
          <ul className="review-list">
            {reviews.map((r) => (
              <li key={r.id}>
                <Stars rating={r.rating} /> <strong>{r.author_name}</strong>
                <p>{r.comment}</p>
              </li>
            ))}
          </ul>
          {user && (
            <div className="review-form">
              <label>
                Your rating
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                </select>
              </label>
              <textarea placeholder="Share your experience" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
              <button className="btn btn-outline" onClick={submitReview}>Post review</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
