"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import Gauge from "@/components/Gauge";

export default function DashboardPage() {
  const router = useRouter();
  const [rider, setRider] = useState(null);
  const [rides, setRides] = useState([]);
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? getToken() : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([api.getMe(token), api.listMyRides(token), api.listMyClaims(token)])
      .then(([me, myRides, myClaims]) => {
        setRider(me);
        setRides(myRides);
        setClaims(myClaims);
      })
      .catch((err) => {
        setError(err.message);
        if (err.status === 401) {
          clearToken();
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    clearToken();
    router.push("/");
  }

  if (loading) return <p className="text-storm-light text-sm pt-8">Loading your dashboard…</p>;

  const totalProtected = claims
    .filter((c) => c.approved_amount != null)
    .reduce((sum, c) => sum + Number(c.approved_amount), 0);
  const pendingCount = claims.filter((c) => c.status === "manual_review" || c.status === "pending").length;

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
        <Gauge
          percent={100}
          value={`₹${totalProtected}`}
          label="EARNINGS PROTECTED"
          status={totalProtected > 0 ? "safe" : "neutral"}
        />
        {pendingCount > 0 && (
          <p className="text-center text-xs text-signal-dark mt-2">
            {pendingCount} claim{pendingCount > 1 ? "s" : ""} awaiting review
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href="/rides"
          className="bg-surface border border-line rounded-card p-4 hover:border-storm transition-colors"
        >
          <p className="font-mono text-2xl font-semibold text-ink">{rides.length}</p>
          <p className="text-xs text-storm-light mt-1">Rides logged →</p>
        </Link>
        <Link
          href="/claims"
          className="bg-surface border border-line rounded-card p-4 hover:border-storm transition-colors"
        >
          <p className="font-mono text-2xl font-semibold text-ink">{claims.length}</p>
          <p className="text-xs text-storm-light mt-1">Claims raised →</p>
        </Link>
      </div>

      {rides.length === 0 && (
        <div className="bg-surface border border-line rounded-card p-5 text-center">
          <p className="text-sm text-storm-light mb-3">
            This is a prototype — generate fabricated demo rides to try the full flow.
          </p>
          <Link
            href="/rides"
            className="inline-block px-4 py-2.5 rounded-card bg-signal text-white text-sm font-medium hover:bg-signal-dark transition-colors"
          >
            Go generate demo rides
          </Link>
        </div>
      )}
    </div>
  );
}
