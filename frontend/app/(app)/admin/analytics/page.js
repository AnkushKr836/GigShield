"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

const STATUS_COLORS = { approved: "bg-safe", rejected: "bg-danger", manual_review: "bg-attention", pending: "bg-muted" };

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { router.push("/login"); return; }
    api.getAnalyticsSummary(token).then(setSummary).catch((err) => setError(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="text-muted text-sm pt-8">Loading analytics…</p>;
  if (error) return <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mt-4">{error}</p>;
  if (!summary) return null;

  const maxStatusCount = Math.max(1, ...Object.values(summary.claims_by_status));
  const maxCompanyClaims = Math.max(1, ...summary.by_company.map((c) => c.claim_count));

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to admin
      </Link>
      <section className="glass-strong rounded-[2rem] p-5 sm:p-7"><p className="eyebrow">Coverage operations</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Analytics</h1><p className="mt-1 text-sm text-muted">An overview of enrolled riders, delivery activity, claim outcomes, and approved payouts.</p></section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Riders" value={summary.total_riders} />
        <Stat label="Rides" value={summary.total_rides} />
        <Stat label="Claims" value={summary.total_claims} />
        <Stat label="Total payouts" value={`₹${summary.total_approved_payout}`} />
      </div>

      {summary.fraud_flagged_count > 0 && (
        <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="text-danger shrink-0" />
          <p className="text-sm text-ink">
            <span className="font-semibold">{summary.fraud_flagged_count}</span> claim{summary.fraud_flagged_count > 1 ? "s" : ""} flagged for unusually frequent filing
          </p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
      <div className="glass rounded-card p-5 sm:p-6">
        <h2 className="font-display font-semibold text-ink">Claims by status</h2><p className="mb-5 mt-1 text-xs text-muted">Distribution of all recorded claim decisions.</p>
        <div className="space-y-3">
          {Object.entries(summary.claims_by_status).map(([status, count]) => (
            <div key={status}>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span className="capitalize">{status.replace("_", " ")}</span>
                <span>{count}</span>
              </div>
              <div className="h-2 rounded-full bg-white/50 overflow-hidden">
                <div className={`h-full rounded-full ${STATUS_COLORS[status] || "bg-muted"}`} style={{ width: `${(count / maxStatusCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-card p-5 sm:p-6">
        <h2 className="font-display font-semibold text-ink">Company activity</h2><p className="mb-5 mt-1 text-xs text-muted">Claim volume and payout totals by covered workforce.</p>
        {summary.by_company.length === 0 ? (
          <p className="text-sm text-muted">No claims recorded against any company yet.</p>
        ) : (
          <div className="space-y-3">
            {summary.by_company.map((c) => (
              <div key={c.company_name}>
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>{c.company_name}</span>
                  <span>{c.claim_count} claims · ₹{c.total_payout}</span>
                </div>
                <div className="h-2 rounded-full bg-white/50 overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(c.claim_count / maxCompanyClaims) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="glass glass-hover rounded-2xl p-4 sm:p-5">
      <p className="font-mono text-xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}
