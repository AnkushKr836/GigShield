"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import Gauge from "@/components/Gauge";

function daysRemaining(endDateStr) {
  const end = new Date(endDateStr);
  const now = new Date();
  const diffMs = end - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function DashboardPage() {
  const router = useRouter();
  const [rider, setRider] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? getToken() : null;

  async function loadData() {
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const [me, myPolicies] = await Promise.all([api.getMe(token), api.listPolicies(token)]);
      setRider(me);
      setPolicies(myPolicies);
    } catch (err) {
      setError(err.message);
      if (err.status === 401) {
        clearToken();
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreatePolicy() {
    setCreating(true);
    setError("");
    try {
      await api.createPolicy(token);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function handleLogout() {
    clearToken();
    router.push("/");
  }

  if (loading) {
    return <p className="text-storm-light text-sm pt-8">Loading your coverage…</p>;
  }

  const activePolicy = policies.find((p) => p.status === "active");

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-storm-light uppercase tracking-wide">Welcome back</p>
          <h1 className="font-display font-bold text-xl text-ink">{rider?.name}</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-storm-light hover:text-danger transition-colors">
          Log out
        </button>
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-card px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="bg-surface border border-line rounded-card p-6 mb-6">
        {activePolicy ? (
          <>
            <Gauge
              percent={(daysRemaining(activePolicy.end_date) / 7) * 100}
              value={`${daysRemaining(activePolicy.end_date)}d`}
              label="COVERAGE REMAINING"
              status="safe"
            />
            <div className="mt-4 pt-4 border-t border-line flex justify-between text-sm">
              <span className="text-storm-light">This week&apos;s premium</span>
              <span className="font-mono font-semibold text-ink">₹{activePolicy.weekly_premium}</span>
            </div>
          </>
        ) : (
          <>
            <Gauge percent={0} value="0d" label="NO ACTIVE COVERAGE" status="neutral" />
            <button
              onClick={handleCreatePolicy}
              disabled={creating}
              className="mt-4 w-full px-4 py-3 rounded-card bg-signal text-white font-medium hover:bg-signal-dark transition-colors disabled:opacity-50"
            >
              {creating ? "Setting up your policy…" : "Start this week's coverage"}
            </button>
          </>
        )}
      </div>

      <div>
        <h2 className="text-xs font-medium text-storm-light uppercase tracking-wide mb-3">
          Policy history
        </h2>
        {policies.length === 0 ? (
          <p className="text-sm text-storm-light">No policies yet — start your first one above.</p>
        ) : (
          <ul className="space-y-2">
            {policies.map((p) => (
              <li
                key={p.policy_id}
                className="flex justify-between items-center bg-surface border border-line rounded-card px-4 py-3 text-sm"
              >
                <span className="text-ink">
                  {p.start_date} → {p.end_date}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-storm-light">₹{p.weekly_premium}</span>
                  <StatusBadge status={p.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-safe/10 text-safe",
    expired: "bg-storm/10 text-storm-light",
    cancelled: "bg-danger/10 text-danger",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${styles[status] || styles.expired}`}>
      {status}
    </span>
  );
}
