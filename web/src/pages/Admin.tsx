import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { formatINR } from "../lib/money";
import { functionErrorMessage } from "./Checkout";
import { STAGES } from "./Track";
import type { Category, OrderStatus, Product } from "../lib/types";

type Tab = "dashboard" | "products" | "categories" | "orders" | "users" | "payments";
const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "categories", label: "Categories" },
  { id: "orders", label: "Orders & tracking" },
  { id: "users", label: "Users" },
  { id: "payments", label: "Payments" },
];

interface Stats { orders_today: number; revenue_paid: number; open_orders: number; customers: number }

export function Admin() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) return <div className="page center muted">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="page center">
        <h1 className="brush">Admins only</h1>
        <p className="muted">Sign in with an admin account to manage the restaurant.</p>
        <Link className="btn btn-primary" to="/login">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <header className="page-hero">
        <p className="kicker">Restaurant control</p>
        <h1 className="brush">Admin Dashboard</h1>
      </header>
      <nav className="tabs wrap" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </nav>
      <div key={tab} className="category-enter">
        {tab === "dashboard" && <Dashboard />}
        {tab === "products" && <Products />}
        {tab === "categories" && <Categories />}
        {tab === "orders" && <Orders />}
        {tab === "users" && <Users />}
        {tab === "payments" && <Payments />}
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    supabase?.rpc("admin_dashboard_stats").then(({ data }) => setStats(data as Stats));
  }, []);
  if (!stats) return <p className="muted">Loading stats…</p>;
  return (
    <div className="stats-row">
      <div className="stat"><strong>{stats.orders_today}</strong><span>Orders today</span></div>
      <div className="stat"><strong>{formatINR(Number(stats.revenue_paid))}</strong><span>Paid revenue</span></div>
      <div className="stat"><strong>{stats.open_orders}</strong><span>Open orders</span></div>
      <div className="stat"><strong>{stats.customers}</strong><span>Customers</span></div>
    </div>
  );
}

function Products() {
  const toast = useToast();
  const [rows, setRows] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [draft, setDraft] = useState({ name: "", slug: "", category_id: "", price: "", description: "", image_url: "" });

  const load = async () => {
    if (!supabase) return;
    const [p, c] = await Promise.all([supabase.from("products").select("*").order("name"), supabase.from("categories").select("*").order("sort_order")]);
    setRows((p.data as Product[]) ?? []);
    setCats((c.data as Category[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const patch = async (id: string, values: Partial<Product>) => {
    const { error } = await supabase!.from("products").update(values).eq("id", id);
    if (error) return toast.show(error.message);
    load();
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const slug = draft.slug || draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await supabase!.from("products").insert({
      name: draft.name, slug, category_id: draft.category_id, price: Number(draft.price),
      description: draft.description, image_url: draft.image_url || null, ingredients: [],
    });
    if (error) return toast.show(error.message);
    setDraft({ name: "", slug: "", category_id: "", price: "", description: "", image_url: "" });
    toast.show("Product added");
    load();
  };

  return (
    <div className="admin-stack">
      <form className="about-card form admin-form" onSubmit={create}>
        <h3>Add a dish</h3>
        <div className="form-row">
          <label>Name<input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label>Price (₹)<input required type="number" min={0} step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></label>
          <label>Category
            <select required value={draft.category_id} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}>
              <option value="">Choose…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Image URL<input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="/images/food/your-photo.jpg" /></label>
        </div>
        <label>Description<textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
        <button className="btn btn-primary" type="submit">Add dish</button>
      </form>

      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Dish</th><th>Category</th><th>Price</th><th>Rating</th><th>Available</th><th>Featured</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{cats.find((c) => c.id === p.category_id)?.name}</td>
                <td>
                  <input className="cell-input" type="number" min={0} step="0.01" defaultValue={Number(p.price)}
                    onBlur={(e) => Number(e.target.value) !== Number(p.price) && patch(p.id, { price: Number(e.target.value) })} />
                </td>
                <td>{Number(p.rating).toFixed(1)} ({p.review_count})</td>
                <td><input type="checkbox" checked={p.is_available} onChange={(e) => patch(p.id, { is_available: e.target.checked })} /></td>
                <td><input type="checkbox" checked={p.is_featured} onChange={(e) => patch(p.id, { is_featured: e.target.checked })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Categories() {
  const toast = useToast();
  const [rows, setRows] = useState<Category[]>([]);
  const load = async () => {
    const { data } = await supabase!.from("categories").select("*").order("sort_order");
    setRows((data as Category[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async (c: Category, values: Partial<Category>) => {
    const { error } = await supabase!.from("categories").update(values).eq("id", c.id);
    if (error) return toast.show(error.message);
    toast.show("Category saved");
    load();
  };

  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead><tr><th>Emoji</th><th>Name</th><th>Sort</th><th>Image URL</th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td><input className="cell-input narrow" defaultValue={c.emoji} onBlur={(e) => e.target.value !== c.emoji && save(c, { emoji: e.target.value })} /></td>
              <td><input className="cell-input" defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && save(c, { name: e.target.value })} /></td>
              <td><input className="cell-input narrow" type="number" defaultValue={c.sort_order} onBlur={(e) => Number(e.target.value) !== c.sort_order && save(c, { sort_order: Number(e.target.value) })} /></td>
              <td><input className="cell-input" defaultValue={c.image_url ?? ""} onBlur={(e) => e.target.value !== (c.image_url ?? "") && save(c, { image_url: e.target.value || null })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface AdminOrder {
  id: string; order_code: string; customer_name: string; customer_phone: string; total: number;
  status: OrderStatus; payment_method: string; payment_status: string; created_at: string;
}

function Orders() {
  const toast = useToast();
  const [rows, setRows] = useState<AdminOrder[]>([]);
  const load = async () => {
    const { data } = await supabase!.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
    setRows((data as AdminOrder[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const update = async (o: AdminOrder, status: OrderStatus, markPaid = false) => {
    const { error } = await supabase!.functions.invoke("update-order-status", {
      body: { order_id: o.id, status, mark_paid: markPaid },
    });
    if (error) return toast.show(await functionErrorMessage(error));
    toast.show(`${o.order_code} → ${status.replace(/_/g, " ")}`);
    load();
  };

  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td><strong className="order-code">{o.order_code}</strong><br /><span className="muted small">{new Date(o.created_at).toLocaleString("en-IN")}</span></td>
              <td>{o.customer_name}<br /><span className="muted small">{o.customer_phone}</span></td>
              <td>{formatINR(Number(o.total))}</td>
              <td>{o.payment_method.toUpperCase()} · <span className={o.payment_status === "paid" ? "ok-text" : "muted"}>{o.payment_status}</span></td>
              <td>
                <select value={o.status} onChange={(e) => update(o, e.target.value as OrderStatus)}>
                  {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
              <td>
                {o.payment_status !== "paid" && (
                  <button className="btn btn-outline small-btn" onClick={() => update(o, o.status, true)}>Mark paid</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Users() {
  const toast = useToast();
  const [rows, setRows] = useState<{ id: string; full_name: string | null; phone: string | null; role: string; created_at: string }[]>([]);
  const load = async () => {
    const { data } = await supabase!.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
    setRows((data as typeof rows) ?? []);
  };
  useEffect(() => { load(); }, []);

  const setRole = async (id: string, role: "customer" | "admin") => {
    const { error } = await supabase!.from("profiles").update({ role }).eq("id", id);
    if (error) return toast.show(error.message);
    load();
  };

  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead><tr><th>Name</th><th>Phone</th><th>Joined</th><th>Role</th></tr></thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <td>{u.full_name || "—"}</td>
              <td>{u.phone || "—"}</td>
              <td>{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
              <td>
                <select value={u.role} onChange={(e) => setRole(u.id, e.target.value as "customer" | "admin")}>
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Payments() {
  const [rows, setRows] = useState<{ id: string; provider: string; amount: number; status: string; provider_payment_id: string | null; created_at: string; orders: { order_code: string } | null }[]>([]);
  useEffect(() => {
    supabase!.from("payments").select("*, orders(order_code)").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setRows((data as typeof rows) ?? []));
  }, []);
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead><tr><th>Order</th><th>Provider</th><th>Amount</th><th>Status</th><th>Provider ref</th><th>When</th></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="order-code">{p.orders?.order_code ?? "—"}</td>
              <td>{p.provider}</td>
              <td>{formatINR(Number(p.amount))}</td>
              <td><span className={p.status === "paid" ? "ok-text" : "muted"}>{p.status}</span></td>
              <td className="small muted">{p.provider_payment_id ?? "—"}</td>
              <td>{new Date(p.created_at).toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
