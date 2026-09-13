"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { saveToken, saveAdminToken } from "@/lib/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "1";

  const [mode, setMode] = useState("rider"); // "rider" | "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleRiderSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { access_token } = await api.login({ email, password });
      saveToken(access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdminSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { access_token } = await api.adminLogin({ username, password: adminPassword });
      saveAdminToken(access_token);
      router.push("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-4">
      <h1 className="font-display font-bold text-2xl text-ink mb-1">
        {mode === "rider" ? "Log in" : "Admin login"}
      </h1>
      <p className="text-muted text-sm mb-6">
        {mode === "rider" ? "Check your coverage and raise a complaint." : "Manage companies, zones, plans, and claims."}
      </p>

      <div className="glass rounded-full p-1 flex mb-6 w-fit mx-auto">
        <button
          onClick={() => { setMode("rider"); setError(""); }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === "rider" ? "bg-primary text-white" : "text-muted"}`}
        >
          Rider
        </button>
        <button
          onClick={() => { setMode("admin"); setError(""); }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === "admin" ? "bg-primary text-white" : "text-muted"}`}
        >
          Admin
        </button>
      </div>

      <div className="glass rounded-card p-6">
        {justRegistered && mode === "rider" && (
          <p className="text-sm text-safe bg-safe/10 rounded-2xl px-3 py-2 mb-4">Account created. Log in to continue.</p>
        )}
        {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

        {mode === "rider" ? (
          <form onSubmit={handleRiderSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">Email</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">Password</span>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Your password" />
            </label>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">Username</span>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} className="input" placeholder="admin" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">Password</span>
              <input required type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="input" placeholder="Admin password" />
            </label>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Logging in…" : "Log in as admin"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
