"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Clock3, CloudRain, ShieldCheck, TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

const FILTERS = [
  { id: "all", label: "All claims" },
  { id: "approved", label: "Approved" },
  { id: "manual_review", label: "In review" },
  { id: "processing", label: "Processing" },
  { id: "rejected", label: "Not approved" },
];
const STATES = {
  approved: { label: "Approved", className: "bg-safe/15 text-safe", icon: CheckCircle2 },
  rejected: { label: "Not approved", className: "bg-danger/15 text-danger", icon: TriangleAlert },
  manual_review: { label: "In review", className: "bg-attention/20 text-attention-dark", icon: Clock3 },
  pending: { label: "Pending", className: "bg-white/70 text-muted", icon: Clock3 },
  processing: { label: "Processing", className: "bg-primary/10 text-primary", icon: Clock3 },
};

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function date(value) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ClaimsPage() {
  const router = useRouter();
  const [claims, setClaims] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    api.listMyClaims(token)
      .then(setClaims)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  const visibleClaims = useMemo(() => filter === "all" ? claims : claims.filter((claim) => claim.status === filter), [claims, filter]);
  const approved = claims.filter((claim) => claim.status === "approved");
  const totalPaid = approved.reduce((sum, claim) => sum + Number(claim.approved_amount || 0), 0);
  const inReview = claims.filter((claim) => ["processing", "pending", "manual_review"].includes(claim.status)).length;

  if (loading) return <p className="pt-8 text-sm text-muted">Loading your claims…</p>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[0.16em] text-muted">Your protection</p><h1 className="mt-1 font-display text-2xl font-bold text-ink">Claims history</h1><p className="mt-1 text-sm text-muted">Track decisions and payouts for reported delivery disruptions.</p></div>
        <Link href="/rides" className="btn-primary inline-flex items-center gap-2 text-sm">Choose a ride <ArrowUpRight size={16} /></Link>
      </header>

      {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Summary icon={ShieldCheck} label="Claims filed" value={claims.length} tone="primary" />
        <Summary icon={CheckCircle2} label="Payouts approved" value={money(totalPaid)} tone="safe" />
        <Summary icon={Clock3} label="Awaiting review" value={inReview} tone={inReview ? "attention" : "safe"} />
      </section>

      <section className="glass rounded-card p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-display font-semibold text-ink">All reported disruptions</h2><p className="mt-1 text-xs text-muted">Claims are checked against disruption evidence and your company’s daily cover limit.</p></div>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-pill border border-white/70 bg-white/35 p-1" role="tablist" aria-label="Filter claims">
            {FILTERS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)} className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${filter === item.id ? "bg-primary text-white shadow-glass" : "text-muted hover:bg-white/60 hover:text-ink"}`}>{item.label}</button>)}
          </div>
        </div>

        {visibleClaims.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CloudRain size={22} /></span>
            <h3 className="font-display font-semibold text-ink">{claims.length ? "No claims in this view" : "No claims yet"}</h3>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">{claims.length ? "Choose another status filter to see your reported disruptions." : "If weather or a civic disruption interrupted a delivery, open that ride to report it."}</p>
            {!claims.length && <Link href="/rides" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">Browse deliveries <ArrowUpRight size={15} /></Link>}
          </div>
        ) : (
          <ul className="space-y-3">
            {visibleClaims.map((claim) => {
              const state = STATES[claim.status] || STATES.pending;
              const Icon = state.icon;
              return <li key={claim.token_id} className="rounded-2xl border border-white/70 bg-white/35 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${state.className}`}><Icon size={18} /></span>
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium text-ink">{claim.disruption_type === "environmental" ? "Weather disruption" : "Civic disruption"}</h3><span className={`rounded-pill px-2.5 py-1 text-[10px] font-medium ${state.className}`}>{state.label}</span>{claim.fraud_flag && <span className="rounded-pill bg-attention/15 px-2.5 py-1 text-[10px] font-medium text-attention-dark">Additional review</span>}</div><p className="mt-1 text-xs text-muted">Reported {date(claim.raised_at)}</p></div>
                  </div>
                  <div className="ml-13 text-left sm:ml-0 sm:text-right"><p className="font-mono text-lg font-semibold text-ink">{claim.status === "approved" ? money(claim.approved_amount) : money(claim.claimed_amount)}</p><p className="text-[11px] text-muted">{claim.status === "approved" ? "Approved payout" : "Requested amount"}</p></div>
                </div>

                <p className="mt-4 border-t border-ink/[0.07] pt-3 text-sm leading-relaxed text-muted">{claim.description}</p>
                {claim.payout_note && <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-xs leading-relaxed text-ink">{claim.payout_note}</p>}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink/[0.07] pt-3">
                  <span className="text-[11px] text-muted">{claim.status === "processing" ? "Review checkpoints are running" : claim.verification_source ? `Verified with ${claim.verification_source.replaceAll("_", " ")}` : "Decision pending verification"}</span>
                  <Link href={`/rides/${claim.ride_id}`} className="text-xs font-medium text-primary hover:underline">View delivery details <ArrowUpRight className="ml-0.5 inline" size={13} /></Link>
                </div>
              </li>;
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Summary({ icon: Icon, label, value, tone }) {
  const tones = { primary: "bg-primary/10 text-primary", safe: "bg-safe/10 text-safe", attention: "bg-attention/15 text-attention-dark" };
  return <div className="glass rounded-card p-4 sm:p-5"><div className="flex items-center justify-between"><p className="text-xs text-muted">{label}</p><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={17} /></span></div><p className="mt-3 font-mono text-2xl font-semibold text-ink">{value}</p></div>;
}
