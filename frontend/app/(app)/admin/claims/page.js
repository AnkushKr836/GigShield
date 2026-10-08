"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronRight, ClipboardCheck, Clock3, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function AdminClaimsReviewPage() {
  const router = useRouter();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = typeof window !== "undefined" ? getAdminToken() : null;

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    api.listAdminClaims(token).then(setClaims).catch((err) => setError(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to admin
      </Link>
      <section className="glass-strong rounded-[2rem] p-5 sm:p-7">
        <p className="eyebrow">Decision workspace</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Claims review</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Review claim outcomes, disruption evidence, route context, and rider details. Claims awaiting a human decision appear first.</p>
        <div className="mt-5 flex flex-wrap gap-3"><ReviewStat icon={ClipboardCheck} value={claims.filter((claim) => claim.status === "manual_review").length} label="Awaiting a decision"/><ReviewStat icon={AlertTriangle} value={claims.filter((claim) => claim.fraud_flag).length} label="Flagged claims"/></div>
      </section>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : claims.length === 0 ? (
        <div className="glass rounded-card flex min-h-56 flex-col items-center justify-center p-8 text-center"><span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-safe/10 text-safe"><ShieldCheck size={23}/></span><p className="font-display font-semibold text-ink">No claims yet</p><p className="mt-1 text-sm text-muted">Claims and their validation evidence will appear here.</p></div>
      ) : (
        <section className="glass rounded-card p-4 sm:p-6"><div className="mb-4 flex items-center gap-2"><Clock3 size={15} className="text-primary"/><h2 className="font-display font-semibold text-ink">Claim history</h2></div><ul className="grid gap-3 lg:grid-cols-2">
          {claims.map((c) => (
            <li key={c.token_id}>
              <Link
                href={`/admin/claims/${c.token_id}`}
                className="list-row glass-hover flex h-full items-center justify-between gap-4 p-4 sm:p-5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-attention/15 text-attention-dark"><ClipboardCheck size={18}/></span>
                  <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-pill bg-primary/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{c.disruption_type === "environmental" ? "Weather" : "Civic"}</span><span className="text-[11px] text-muted">{formatDate(c.raised_at)}</span><span className="rounded-pill bg-white/70 px-2 py-0.5 text-[10px] font-semibold capitalize text-ink">{c.status.replaceAll("_", " ")}</span>
                    {c.fraud_flag && (
                      <span className="rounded-pill bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">Flagged</span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-ink">{c.description}</p>
                  <p className="mt-2 text-[10px] text-muted">Claim ref · {c.token_id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1"><span className="font-mono text-base font-semibold text-ink">₹{Number(c.claimed_amount).toLocaleString("en-IN")}</span><span className="text-[10px] uppercase tracking-wider text-muted">Requested</span><ChevronRight size={16} className="mt-1 text-primary" />
                </div>
              </Link>
            </li>
          ))}
        </ul></section>
      )}
    </div>
  );
}

function ReviewStat({ icon: Icon, value, label }) {
  return <div className="inline-flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/55 px-3.5 py-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={16}/></span><div><p className="font-mono text-sm font-semibold text-ink">{value}</p><p className="text-[10px] text-muted">{label}</p></div></div>;
}
