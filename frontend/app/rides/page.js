"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function RidesPage() {
  const router = useRouter();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? getToken() : null;

  async function loadRides() {
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const data = await api.listMyRides(token);
      setRides(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSimulate() {
    setSimulating(true);
    setError("");
    try {
      await api.simulateRides(token);
      await loadRides();
    } catch (err) {
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  }

  if (loading) return <p className="text-storm-light text-sm pt-8">Loading your rides…</p>;

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-bold text-2xl text-ink">Your rides</h1>
      </div>
      <p className="text-storm-light text-sm mb-6">
        Tap a completed ride to raise a token if a disruption affected it.
      </p>

      {error && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-card px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {rides.length === 0 ? (
        <div className="bg-surface border border-line rounded-card p-6 text-center">
          <p className="text-storm-light text-sm mb-4">
            No rides yet. This is a prototype — generate some fabricated demo rides to explore the flow.
          </p>
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="px-4 py-3 rounded-card bg-signal text-white font-medium hover:bg-signal-dark transition-colors disabled:opacity-50"
          >
            {simulating ? "Generating…" : "Generate demo rides"}
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {rides.map((r) => (
            <li key={r.ride_id}>
              <Link
                href={`/rides/${r.ride_id}`}
                className="block bg-surface border border-line rounded-card px-4 py-3 hover:border-storm transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-ink font-medium">
                      {r.pickup_location} → {r.drop_location}
                    </p>
                    <p className="text-xs text-storm-light mt-0.5">{formatDate(r.start_time)}</p>
                  </div>
                  <span className="font-mono text-sm text-ink">₹{r.fare_amount}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
