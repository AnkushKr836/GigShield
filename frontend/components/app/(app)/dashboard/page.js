"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Bike, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import Gauge from "@/components/Gauge";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const router = useRouter();
  const [rider, setRider] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? getToken() : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([api.getMe(token), api.listMyRides(token, 3, 0), api.listMyClaims(token)])
      .then(([me, rides, myClaims]) => {
        setRider(me);
        setRecentRides(rides);
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

  if (loading) return <p className="text-muted text-sm pt-8">Loading your dashboard…</p>;

  const totalProtected = claims
    .filter((c) => c.approved_amount != null)
    .reduce((sum, c) => sum + Number(c.approved_amount), 0);
  const pendingCount = claims.filter((c) => c.status === "manual_review" || c.status === "pending").length;

  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wide">Welcome back</p>
      <h1 className="font-display font-bold text-2xl text-ink mb-6">{rider?.name}</h1>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

      <div className="glass rounded-card p-6 mb-6">
        <Gauge
          percent={100}
          value={`₹${totalProtected}`}
          label="EARNINGS PROTECTED"
          status={totalProtected > 0 ? "safe" : "neutral"}
        />
        {pendingCount > 0 && (
          <p className="text-center text-xs text-attention-dark mt-2">
            {pendingCount} claim{pendingCount > 1 ? "s" : ""} awaiting review
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass rounded-2xl p-4">
          <Bike size={18} className="text-primary mb-1.5" />
          <p className="font-mono text-xl font-semibold text-ink">{claims.length > 0 || recentRides.length > 0 ? "—" : 0}</p>
          <p className="text-xs text-muted">rides &amp; claims tracked</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <ShieldCheck size={18} className="text-safe mb-1.5" />
          <p className="font-mono text-xl font-semibold text-ink">{claims.length}</p>
          <p className="text-xs text-muted">claims raised</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-ink">Recent deliveries</h2>
        <Link href="/rides" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
          View all <ChevronRight size={14} />
        </Link>
      </div>

      {recentRides.length === 0 ? (
        <div className="glass rounded-card p-5 text-center">
          <p className="text-sm text-muted mb-3">
            This is a prototype — generate fabricated demo rides to try the full flow.
          </p>
          <Link href="/rides" className="btn-primary inline-block text-sm">
            Go generate demo rides
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {recentRides.map((r) => (
            <li key={r.ride_id}>
              <Link
                href={`/rides/${r.ride_id}`}
                className="flex justify-between items-center glass rounded-2xl px-4 py-3 hover:bg-white/70 transition-colors"
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
      )}
    </div>
  );
}
