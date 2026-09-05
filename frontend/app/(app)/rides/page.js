"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

const PAGE_SIZE = 5;

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function RidesPage() {
  const router = useRouter();
  const [rides, setRides] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? getToken() : null;

  async function loadFirstPage() {
    if (!token) { router.push("/login"); return; }
    try {
      const data = await api.listMyRides(token, PAGE_SIZE, 0);
      setRides(data);
      setOffset(data.length);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const data = await api.listMyRides(token, PAGE_SIZE, offset);
      setRides((prev) => [...prev, ...data]);
      setOffset((prev) => prev + data.length);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSimulate() {
    setSimulating(true);
    setError("");
    try {
      await api.simulateRides(token);
      await loadFirstPage();
    } catch (err) {
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  }

  if (loading) return <p className="text-muted text-sm pt-8">Loading your rides…</p>;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-ink mb-1">Your rides</h1>
      <p className="text-muted text-sm mb-6">Tap a completed ride to raise a complaint if a disruption affected it.</p>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

      {rides.length === 0 ? (
        <div className="glass rounded-card p-6 text-center">
          <p className="text-muted text-sm mb-4">
            No rides yet. This is a prototype — generate fabricated demo rides to explore the flow.
          </p>
          <button onClick={handleSimulate} disabled={simulating} className="btn-primary">
            {simulating ? "Generating…" : "Generate demo rides"}
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {rides.map((r) => (
              <li key={r.ride_id}>
                <Link
                  href={`/rides/${r.ride_id}`}
                  className="flex justify-between items-start glass rounded-2xl px-4 py-3 hover:bg-white/70 transition-colors"
                >
                  <div>
                    <p className="text-sm text-ink font-medium">{r.pickup_location} → {r.drop_location}</p>
                    <p className="text-xs text-muted mt-0.5">{formatDate(r.start_time)}</p>
                  </div>
                  <span className="font-mono text-sm text-ink">₹{r.fare_amount}</span>
                </Link>
              </li>
            ))}
          </ul>

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="btn-ghost w-full mt-4 text-sm"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
