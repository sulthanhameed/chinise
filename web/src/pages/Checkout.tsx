import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { loadRazorpay } from "../lib/razorpay";
import { formatINR } from "../lib/money";
import type { PaymentMethod } from "../lib/types";

const METHODS: { id: PaymentMethod; label: string; hint: string; icon: string }[] = [
  { id: "upi", label: "UPI", hint: "Pay with any UPI app via Razorpay", icon: "📱" },
  { id: "card", label: "Cards", hint: "Debit / credit card via Stripe", icon: "💳" },
  { id: "wallet", label: "Wallets", hint: "PayPal or wallet balance", icon: "👛" },
  { id: "cod", label: "Cash on delivery", hint: "Pay when your order arrives", icon: "💵" },
];

/** Reads the real error message from a Supabase Edge Function response. */
export async function functionErrorMessage(err: unknown): Promise<string> {
  const ctx = (err as { context?: Response })?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      if (body?.error) return String(body.error);
    } catch {
      /* fall through */
    }
  }
  return (err as Error)?.message ?? "Something went wrong";
}

export function Checkout() {
  const { items, totals, count } = useCart();
  const { user, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [form, setForm] = useState({
    name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    email: user?.email ?? "",
    address: profile?.address ?? "",
    notes: "",
  });

  const update = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (count === 0) {
    return (
      <div className="page center">
        <h1 className="brush">Your cart is empty</h1>
        <p className="muted">Add a few dishes from the menu first.</p>
        <Link className="btn btn-primary" to="/menu">Go to menu</Link>
      </div>
    );
  }

  const verifyAndFinish = async (orderCode: string, body: Record<string, unknown>) => {
    const { error } = await supabase!.functions.invoke("verify-payment", { body: { order_code: orderCode, ...body } });
    if (error) throw new Error(await functionErrorMessage(error));
    navigate(`/order/success?order=${orderCode}`);
  };

  const pay = async (orderCode: string, provider: string) => {
    const { data, error } = await supabase!.functions.invoke("create-payment", {
      body: { order_code: orderCode, return_url: `${window.location.origin}/order/success` },
    });
    if (error) throw new Error(await functionErrorMessage(error));

    if (provider === "razorpay") {
      await loadRazorpay();
      const RazorpayCtor = window.Razorpay!;
      const rzp = new RazorpayCtor({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Khang Dimsum",
        description: `Order ${orderCode}`,
        order_id: data.provider_order_id,
        prefill: data.prefill,
        theme: { color: "#b91c1c" },
        handler: (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          verifyAndFinish(orderCode, { provider: "razorpay", ...resp }).catch((e: Error) => toast.show(e.message));
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", () => {
        toast.show("Payment failed. You can retry from the order page.");
        setBusy(false);
      });
      rzp.open();
      return;
    }

    if (data.redirect_url) {
      window.location.href = data.redirect_url as string;
      return;
    }
    throw new Error("Payment provider did not return a redirect");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      return toast.show("Checkout needs the Supabase backend. See README → Setup.");
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          customer: { name: form.name, phone: form.phone, email: form.email || undefined, address: form.address },
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          payment_method: method,
          notes: form.notes || undefined,
        },
      });
      if (error) throw new Error(await functionErrorMessage(error));

      const orderCode: string = data.order.order_code;
      if (data.requires_payment) {
        await pay(orderCode, data.provider);
      } else {
        navigate(`/order/success?order=${orderCode}`);
      }
    } catch (err) {
      toast.show((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="page checkout-page">
      <header className="page-hero">
        <p className="kicker">Almost there</p>
        <h1 className="brush">Checkout</h1>
      </header>

      <form className="checkout-grid" onSubmit={submit}>
        <section className="about-card form">
          <h3>Delivery details</h3>
          <label>Full name<input required minLength={2} value={form.name} onChange={update("name")} autoComplete="name" /></label>
          <label>Phone<input required type="tel" pattern="^\+?[0-9\s-]{10,16}$" value={form.phone} onChange={update("phone")} autoComplete="tel" /></label>
          <label>Email (for order updates)<input type="email" value={form.email} onChange={update("email")} autoComplete="email" /></label>
          <label>Delivery address<textarea required minLength={10} rows={3} value={form.address} onChange={update("address")} autoComplete="street-address" /></label>
          <label>Notes for the kitchen (optional)<input value={form.notes} onChange={update("notes")} maxLength={300} /></label>

          <h3>Payment</h3>
          <div className="method-grid" role="radiogroup" aria-label="Payment method">
            {METHODS.map((m) => (
              <label key={m.id} className={`method ${method === m.id ? "selected" : ""}`}>
                <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                <span className="method-icon" aria-hidden="true">{m.icon}</span>
                <span><strong>{m.label}</strong><small className="muted">{m.hint}</small></span>
              </label>
            ))}
          </div>
        </section>

        <aside className="about-card summary">
          <h3>Order summary</h3>
          <ul className="summary-list">
            {items.map((i) => (
              <li key={i.product_id}><span>{i.quantity} × {i.name}</span><span>{formatINR(i.price * i.quantity)}</span></li>
            ))}
          </ul>
          <dl className="totals">
            <div><dt>Subtotal</dt><dd>{formatINR(totals.subtotal)}</dd></div>
            <div><dt>Tax (5%)</dt><dd>{formatINR(totals.tax)}</dd></div>
            <div><dt>Delivery</dt><dd>{totals.delivery === 0 ? "Free" : formatINR(totals.delivery)}</dd></div>
            <div className="grand"><dt>Total</dt><dd>{formatINR(totals.total)}</dd></div>
          </dl>
          <p className="muted small">Prices are re-checked on the server before payment.</p>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? "Processing…" : method === "cod" ? "Place order" : `Pay ${formatINR(totals.total)}`}
          </button>
        </aside>
      </form>
    </div>
  );
}
