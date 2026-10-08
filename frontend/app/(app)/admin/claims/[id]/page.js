"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Check, X, CloudRain, Cloud, Sun, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const SOURCE_LABELS = {
  fabricated_disruption: "A recorded disruption event overlapped this ride",
  real_weather: "Live weather at the pickup point was disruptive",
  demo_weather: "Prototype weather scenario overlapped this ride",
  demo_traffic: "Prototype traffic scenario overlapped this ride",
  demo_curfew: "Prototype curfew scenario overlapped this ride",
};

export default function AdminClaimDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  const [error, setError] = useState("");
  const token = typeof window !== "undefined" ? getAdminToken() : null;

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    api.getClaimDetail(params.id, token).then(setClaim).catch((err) => setError(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleDecision(decision) {
    setDeciding(true);
    setError("");
    try {
      await api.decideClaim(claim.token_id, { decision, approved_amount: decision === "approved" ? claim.claimed_amount : undefined }, token);
      router.push("/admin/claims");
    } catch (err) {
      setError(err.message);
      setDeciding(false);
    }
  }

  if (loading) return <p className="text-muted text-sm pt-8">Loading claim…</p>;
  if (error && !claim) return <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mt-4">{error}</p>;
  if (!claim) return null;

  const hasCoords = claim.ride.pickup_lat != null && claim.ride.drop_lat != null;
  const credPct = claim.rider_credibility_score != null ? Math.round(claim.rider_credibility_score * 100) : null;

  return (
    <div className="space-y-5">
      <Link href="/admin/claims" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-primary">
        <ArrowLeft size={15} /> Back to review queue
      </Link>

      <section className="glass-strong rounded-[2rem] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Claim decision</p><h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Review delivery claim</h1><p className="mt-2 text-sm text-muted">{claim.rider_name} · {claim.rider_email}</p></div><span className="rounded-pill bg-attention/15 px-3 py-1.5 text-xs font-semibold capitalize text-attention-dark">{claim.disruption_type} disruption</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/80 bg-white/55 p-3.5"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Pickup</p><p className="mt-1 font-medium text-ink">{claim.ride.pickup_location}</p></div><div className="rounded-2xl border border-white/80 bg-white/55 p-3.5"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Drop-off</p><p className="mt-1 font-medium text-ink">{claim.ride.drop_location}</p></div></div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-lg"><div className="rounded-2xl border border-white/80 bg-white/55 p-3.5"><p className="text-[10px] uppercase tracking-wider text-muted">Requested</p><p className="mt-1 font-mono text-lg font-semibold text-ink">₹{Number(claim.claimed_amount).toLocaleString("en-IN")}</p></div><div className="rounded-2xl border border-white/80 bg-white/55 p-3.5"><p className="text-[10px] uppercase tracking-wider text-muted">Rider credibility</p><p className="mt-1 font-mono text-lg font-semibold text-ink">{credPct != null ? `${credPct}%` : "—"}</p></div></div>
      </section>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

      {claim.fraud_flag && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-danger shrink-0" />
          <p className="text-sm text-ink">Flagged: this rider has raised unusually frequent claims recently.</p>
        </div>
      )}

      {hasCoords && (
        <div className="glass rounded-card p-3">
          <RouteMap
            pickupLat={claim.ride.pickup_lat}
            pickupLng={claim.ride.pickup_lng}
            pickupLabel={claim.ride.pickup_location}
            dropLat={claim.ride.drop_lat}
            dropLng={claim.ride.drop_lng}
            dropLabel={claim.ride.drop_location}
          />
        </div>
      )}

      {claim.weather_snapshot && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          {claim.weather_snapshot.is_disruptive ? (
            <CloudRain size={20} className="text-primary shrink-0" />
          ) : (
            <Sun size={20} className="text-attention shrink-0" />
          )}
          <div>
            <p className="text-sm text-ink capitalize">{claim.weather_snapshot.description}, {claim.weather_snapshot.temp_c}°C</p>
            <p className="text-xs text-muted">
              {claim.weather_snapshot.simulated
                ? "Simulated heavy-rain evidence for this prototype claim"
                : "Current weather snapshot captured when this claim was raised"}
            </p>
            {claim.weather_snapshot.details && (
              <p className="mt-1 text-[11px] text-muted">
                {Object.entries(claim.weather_snapshot.details).map(([key, value]) => `${key.replaceAll("_", " ")}: ${value}`).join(" · ")}
              </p>
            )}
            {claim.weather_snapshot.demo_fixture && (
              <p className="mt-1 text-[11px] text-muted">Matching prototype fixture: {claim.weather_snapshot.demo_fixture.description}; the live check also confirmed disruptive conditions.</p>
            )}
            {claim.weather_snapshot.live_check && (
              <p className="mt-1 text-[11px] text-muted">Live check: {claim.weather_snapshot.live_check.description}, {claim.weather_snapshot.live_check.temp_c}°C (current conditions).</p>
            )}
          </div>
        </div>
      )}

      <section className="glass rounded-2xl p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-primary" />
            <h2 className="font-display font-semibold text-ink">Validation evidence</h2>
          </div>
          {claim.disruption_signals?.length > 0 ? <ul className="space-y-2">
            {claim.disruption_signals.map((signal) => (
              <li key={signal.event_id} className="rounded-2xl border border-white/75 bg-white/45 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium capitalize text-ink">{signal.label || signal.subtype?.replaceAll("_", " ") || "Recorded disruption"}</p>
                  <span className="rounded-pill bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{signal.severity} severity</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{signal.note || "A disruption event overlaps this ride’s time and zone."}</p>
                {signal.details && Object.keys(signal.details).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(signal.details).map(([key, value]) => (
                      <span key={key} className="rounded-xl border border-white/80 bg-white/65 px-2.5 py-1.5 text-[10px] text-ink">
                        <span className="capitalize text-muted">{key.replaceAll("_", " ")}: </span><strong className="font-semibold">{value}</strong>
                      </span>
                    ))}
                  </div>
                )}
                {signal.is_demo && <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-attention-dark">Prototype demo data</p>}
              </li>
            ))}
          </ul> : (
            <p className="rounded-2xl border border-white/75 bg-white/45 p-3 text-xs leading-relaxed text-muted">
              {claim.weather_snapshot
                ? "No recorded zone event matched this ride. The weather check above is the available environmental evidence."
                : "No recorded disruption event matched this ride, and no weather snapshot was available for this claim."}
            </p>
          )}
      </section>

      <div className="glass rounded-card divide-y divide-white/70 p-1">
        <Row label="Claim status" value={claim.status.replaceAll("_", " ")} capitalize />
        <Row label="Ride started" value={formatDateTime(claim.ride.start_time)} />
        <Row label="Ride ended" value={formatDateTime(claim.ride.end_time)} />
        <Row label="Fare" value={`₹${claim.ride.fare_amount}`} />
        <Row label="Claimed amount" value={`₹${claim.claimed_amount}`} />
        {claim.verification_source && <Row label="Auto-check result" value={SOURCE_LABELS[claim.verification_source]} />}
      </div>

      <div className="glass rounded-card p-5 sm:p-6">
        <p className="text-xs text-muted uppercase tracking-wide mb-2">Rider&apos;s description</p>
        <p className="text-sm text-ink">{claim.description}</p>
      </div>

      {claim.status === "manual_review" && (
        <div className="glass rounded-card p-4 sm:p-5"><p className="mb-3 font-display font-semibold text-ink">Record your decision</p><div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => handleDecision("approved")}
            disabled={deciding}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl bg-gradient-to-br from-safe to-primary-dark text-white text-sm font-semibold shadow-glass hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            <Check size={16} /> Approve
          </button>
          <button
            onClick={() => handleDecision("rejected")}
            disabled={deciding}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl bg-gradient-to-br from-danger to-[#555a60] text-white text-sm font-semibold shadow-glass hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            <X size={16} /> Reject
          </button>
        </div></div>
      )}
    </div>
  );
}

function Row({ label, value, capitalize }) {
  return (
    <div className="flex justify-between px-4 py-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className={`text-ink text-right ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}
