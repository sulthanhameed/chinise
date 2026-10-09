import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./cart";
import { useToast } from "./toast";
import type { Product } from "./types";

/** Shared add-to-cart / order-now behaviour for every product surface. */
export function useProductActions() {
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const add = useCallback(
    (p: Product, qty = 1) => {
      cart.addItem(p, qty);
      toast.show(`${p.name} added to cart`);
    },
    [cart, toast],
  );

  const orderNow = useCallback(
    (p: Product, qty = 1) => {
      cart.addItem(p, qty);
      navigate("/checkout");
    },
    [cart, navigate],
  );

  return { add, orderNow };
}
