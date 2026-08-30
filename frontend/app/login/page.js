"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { saveToken } from "@/lib/auth";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
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

  return (
    <div className="pt-2">
      <h1 className="font-display font-bold text-2xl text-ink mb-1">Log in</h1>
      <p className="text-storm-light text-sm mb-6">Check your coverage and raise a claim.</p>

      {justRegistered && (
        <p className="text-sm text-safe bg-safe/5 border border-safe/20 rounded-card px-3 py-2 mb-4">
          Account created. Log in to continue.
        </p>
      )}
      {error && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-card px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-xs font-medium text-storm-light mb-1.5 uppercase tracking-wide">
            Email
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-storm-light mb-1.5 uppercase tracking-wide">
            Password
          </span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Your password"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-3 rounded-card bg-signal text-white font-medium hover:bg-signal-dark transition-colors disabled:opacity-50"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
