import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { formatINR } from "../lib/money";
import { STAGES } from "./Track";
import type { Order } from "../lib/types";

interface OrderWithItems extends Order {
  order_items: { product_name: string; quantity: number; line_total: number }[];
}

export function Profile() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", address: "" });
  const [orders, setOrders] = useState<OrderWithItems[]>([]);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? "", phone: profile.phone ?? "", address: profile.address ?? "" });
  }, [profile]);

  useEffect(() => {
    if (!supabase || !user) return;
    supabase
      .from("orders")
      .select("*, order_items(product_name, quantity, line_total)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setOrders((data as OrderWithItems[]) ?? []));
  }, [user]);

  if (!loading && !user) return <Navigate to="/login" replace />;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    if (error) return toast.show(error.message);
    await refreshProfile();
    toast.show("Profile saved");
  };

  const logout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="page profile-page">
      <header className="page-hero">
        <p className="kicker">Your account</p>
        <h1 className="brush">{profile?.full_name || "Your profile"}</h1>
        <p className="muted">{user?.email}</p>
      </header>

      <div className="profile-grid">
        <form className="about-card form" onSubmit={save}>
          <h3>Personal details</h3>
          <label>Full name<input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
          <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Default address<textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
          <button className="btn btn-primary" type="submit">Save</button>
          <button className="btn btn-outline" type="button" onClick={logout}>Sign out</button>
          {profile?.role === "admin" && <Link className="btn btn-gold" to="/admin">Open admin dashboard</Link>}
        </form>

        <section className="about-card">
          <h3>Order history</h3>
          {orders.length === 0 && <p className="muted">No orders yet. <Link to="/menu">Browse the menu</Link>.</p>}
          <ul className="order-history">
            {orders.map((o) => (
              <li key={o.id}>
                <div className="order-row">
                  <div>
                    <strong className="order-code">{o.order_code}</strong>
                    <span className="muted small"> · {new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                  </div>
                  <span className={`status-pill s-${o.status}`}>{STAGES.find((s) => s.key === o.status)?.label ?? o.status}</span>
                </div>
                <p className="muted small">{o.order_items.map((i) => `${i.quantity} × ${i.product_name}`).join(", ")}</p>
                <div className="order-row">
                  <strong>{formatINR(Number(o.total))}</strong>
                  <Link to={`/track?code=${o.order_code}`} className="link-btn">Track →</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
