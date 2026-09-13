"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES = {
  approved: "bg-safe/15 text-safe",
  rejected: "bg-danger/15 text-danger",
  manual_review: "bg-attention/20 text-attention-dark",
  pending: "bg-white/60 text-muted",
};

export default function RideDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [ride, setRide] = useState(null);
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? getToken() : null;

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    Promise.all([api.getRide(params.id, token), api.listMyClaims(token)])
      .then(([rideData, claims]) => {
        setRide(rideData);
        setClaim(claims.find((c) => c.ride_id === rideData.ride_id) || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) return <p className="text-muted text-sm pt-8">Loading ride…</p>;
  if (error) return <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mt-4">{error}</p>;
  if (!ride) return null;

  return (
    <div>
      <Link href="/rides" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1">
        <ArrowLeft size={15} /> Back to rides
      </Link>

      <h1 className="font-display font-bold text-2xl text-ink mt-3 mb-4">
        {ride.pickup_location} → {ride.drop_location}
      </h1>

      <div className="glass rounded-card divide-y divide-white/50">
        <Row label="Started" value={formatDateTime(ride.start_time)} />
        <Row label="Ended" value={formatDateTime(ride.end_time)} />
        <Row label="Fare" value={`₹${ride.fare_amount}`} />
        <Row label="Status" value={ride.status} capitalize />
      </div>

      <div className="mt-6">
        {claim ? (
          <div className="glass rounded-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted uppercase tracking-wide">Complaint status</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[claim.status]}`}>
                {claim.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-ink mb-2">{claim.description}</p>
            <div className="flex justify-between text-sm pt-3 border-t border-white/50">
              <span className="text-muted">Claimed</span>
              <span className="font-mono text-ink">₹{claim.claimed_amount}</span>
            </div>
            {claim.approved_amount != null && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted">Approved</span>
                <span className="font-mono text-safe font-semibold">₹{claim.approved_amount}</span>
              </div>
            )}
          </div>
        ) : (
          <Link href={`/rides/${ride.ride_id}/claim`} className="btn-primary w-full text-center block">
            Raise complaint
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, capitalize }) {
  return (
    <div className="flex justify-between px-4 py-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className={`text-ink ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}
