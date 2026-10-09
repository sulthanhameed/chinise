import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { formatINR } from "../lib/money";
import type { OrderStatus, TrackingResult } from "../lib/types";

export const STAGES: { key: OrderStatus; label: string; icon: string }[] = [
  { key: "received", label: "Order Received", icon: "📝" },
  { key: "preparing", label: "Preparing", icon: "👨‍🍳" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🛵" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
];

export function stageIndex(status: OrderStatus): number {
  const i = STAGES.findIndex((s) => s.key === status);
  return i < 0 ? 0 : i;
}

const POLL_MS = 10000;

export function Track() {
  const [params, setParams] = useSearchParams();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const activeCode = params.get("code") ?? "";

  const lookup = async (raw: string, silent = false) => {
    if (!supabase) return setError("Order tracking needs the Supabase backend. See README → Setup.");
    const c = raw.trim().toUpperCase();
    if (!c) return;
    if (!silent) setLoading(true);
    const { data, error: e } = await supabase.rpc("get_order_tracking", { p_code: c });
    setLoading(false);
    if (e) return setError(e.message);
    if (!data) {
      setResult(null);
      return setError("We could not find an order with that ID. Check the code and try again.");
    }
    setError(null);
    setResult(data as TrackingResult);
  };

  useEffect(() => {
    if (activeCode) {
      setCode(activeCode);
      lookup(activeCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCode]);

  // Live-ish updates: refresh the timeline while the order is still in progress.
  useEffect(() => {
    if (!result || result.status === "delivered" || result.status === "cancelled") return;
    const t = window.setInterval(() => lookup(result.order_code, true), POLL_MS);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.order_code, result?.status]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setParams(code.trim() ? { code: code.trim().toUpperCase() } : {});
    lookup(code);
  };

  const idx = result ? stageIndex(result.status) : -1;
  const cancelled = result?.status === "cancelled";

  return (
    <div className="page track-page">
      <header className="page-hero">
        <p className="kicker">Where is my food?</p>
        <h1 className="heading-font">Track Your Order</h1>
      </header>

      <form className="track-search" onSubmit={submit}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter your Order ID, e.g. KH1A2B3C4D" aria-label="Order ID" />
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Checking…" : "Track"}</button>
      </form>

      {!isSupabaseConfigured && <p className="muted center">Connect Supabase to see live order status.</p>}
      {error && <p className="error-text center">{error}</p>}

      {result && (
        <div className="track-card">
          <div className="track-head">
            <div>
              <span className="muted">Order ID</span>
              <strong className="order-code">{result.order_code}</strong>
            </div>
            <div className="right">
              <span className="muted">Total</span>
              <strong className="price">{formatINR(Number(result.total))}</strong>
            </div>
          </div>

          {cancelled ? (
            <p className="error-text">This order was cancelled. Please contact us for help.</p>
          ) : (
            <ol className="stepper" aria-label="Order progress">
              {STAGES.map((s, i) => (
                <li key={s.key} className={i < idx ? "done" : i === idx ? "current" : ""}>
                  <span className="step-icon" aria-hidden="true">{s.icon}</span>
                  <span className="step-label">{s.label}</span>
                </li>
              ))}
            </ol>
          )}

          <ul className="timeline">
            {[...result.events].reverse().map((ev, i) => (
              <li key={`${ev.created_at}-${i}`}>
                <strong>{STAGES.find((s) => s.key === ev.status)?.label ?? ev.status}</strong>
                <span className="muted">{ev.note}</span>
                <time>{new Date(ev.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time>
              </li>
            ))}
          </ul>
          {result.payment_status !== "paid" && !cancelled && (
            <p className="muted small">Payment status: {result.payment_status}. Cash on delivery is collected at the door.</p>
          )}
        </div>
      )}
    </div>
  );
}
