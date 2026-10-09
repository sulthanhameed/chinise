import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { isSupabaseConfigured } from "../lib/supabase";

export function Login() {
  const { user, signIn, signUp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });

  if (user) return <Navigate to="/profile" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const err = mode === "signin"
      ? await signIn(form.email, form.password)
      : await signUp(form.name, form.phone, form.email, form.password);
    setBusy(false);
    if (err) return toast.show(err);
    if (mode === "signup") toast.show("Account created. Check your email if confirmation is enabled.");
    navigate("/profile");
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1 className="heading-font">{mode === "signin" ? "Welcome back" : "Join Khang"}</h1>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button>
          <button role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Sign up</button>
        </div>
        {!isSupabaseConfigured && <p className="muted small">Accounts need the Supabase backend. See README → Setup.</p>}
        <form onSubmit={submit} className="form">
          {mode === "signup" && (
            <>
              <label>Full name<input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
              <label>Phone<input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" /></label>
            </>
          )}
          <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
          <label>Password<input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>
          <button className="btn btn-primary btn-block" disabled={busy} type="submit">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
