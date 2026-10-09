export interface Category {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  image_url: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  category_id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  image_url: string | null;
  rating: number;
  review_count: number;
  is_available: boolean;
  is_featured: boolean;
  is_top: boolean;
}

export interface Review {
  id: string;
  product_id: string | null;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export type PaymentMethod = "upi" | "card" | "wallet" | "cod";
export type OrderStatus = "received" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  image_url: string | null;
  emoji: string;
  quantity: number;
}

export interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  created_at: string;
}

export interface TrackingEvent {
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface TrackingResult {
  order_code: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  created_at: string;
  updated_at: string;
  events: TrackingEvent[];
}
