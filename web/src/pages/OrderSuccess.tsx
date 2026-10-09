import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../lib/cart";
import { functionErrorMessage } from "./Checkout";
import { STAGES, stageIndex } from "./Track";
import type { TrackingResult } from "../lib/types";

export function OrderSuccess() {
  const [params] = useSearchParams();
  const { clear } = useCart();
  const [status, setStatus] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const ran = useRef(false);
  const orderCode = (params.get("order") ?? "").toUpperCase();
  const cancelled = params.get("cancelled") === "1";

  useEffect(() => {
    if (ran.current || !orderCode || !supabase) return;
    ran.current = true;
    const provider = params.get("provider");
    const sessionId = params.get("session_id");
    const paypalToken = params.get("token");

    (async () => {
      // Returning from Stripe / PayPal: confirm the payment on the server.
      if (!cancelled && provider === "stripe" && sessionId) {
        setVerifying(true);
        const { error: e } = await supabase!.functions.invoke("verify-payment", { body: { order_code: orderCode, provider, session_id: sessionId } });
        if (e) setError(await functionErrorMessage(e));
        setVerifying(false);
      } else if (!cancelled && provider === "paypal" && paypalToken) {
        setVerifying(true);
        const { error: e } = await supabase!.functions.invoke("verify-payment", { body: { order_code: orderCode, provider, paypal_order_id: paypalToken } });
        if (e) setError(await functionErrorMessage(e));
        setVerifying(false);
      }
      const { data } = await supabase!.rpc("get_order_tracking", { p_code: orderCode });
      setStatus((data as TrackingResult) ?? null);
      if (data) clear();
    })();
  }, [orderCode, params, cancelled, clear]);

  if (!orderCode) {
    return (
      <div className="page center">
        <h1 className="heading-font">No order found</h1>
        <Link className="btn btn-primary" to="/menu">Back to menu</Link>
      </div>
    );
  }

  const paid = status?.payment_status === "paid";
  const idx = status ? stageIndex(status.status) : 0;

  return (
    <div className="page success-page center">
      <div className={`success-badge ${cancelled ? "cancelled" : ""}`} aria-hidden="true">{cancelled ? "!" : "✓"}</div>
      <h1 className="heading-font">{cancelled ? "Payment cancelled" : "Thank you for your order!"}</h1>
      <p className="muted">
        {cancelled
          ? "Your order was saved but not paid. You can retry payment from the Track page."
          : "We have received your order and will confirm it by SMS and email."}
      </p>

      <div className="order-id-card">
        <span className="muted">Order ID</span>
        <strong className="order-code">{orderCode}</strong>
        {status && (
          <span className={`pay-pill ${paid ? "paid" : ""}`}>{verifying ? "Confirming payment…" : paid ? "Payment received" : "Payment pending"}</span>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {status && (
        <ol className="stepper mini">
          {STAGES.map((s, i) => (
            <li key={s.key} className={i <= idx ? "done" : ""}>
              <span className="dot" />
              <span>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="hero-cta">
        <Link className="btn btn-primary" to={`/track?code=${orderCode}`}>Track order</Link>
        <Link className="btn btn-outline" to="/menu">Order more</Link>
      </div>
    </div>
  );
}
