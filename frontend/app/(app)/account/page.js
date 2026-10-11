"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CalendarDays, RotateCcw, ShieldCheck, User } from "lucide-react";
import { api } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import Gauge from "@/components/Gauge";

export default function AccountPage() {
  const router = useRouter();
  const [rider, setRider] = useState(null);
  const [credibility, setCredibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resettingClaims, setResettingClaims] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    Promise.all([api.getMe(token), api.getMyCredibility(token)])
      .then(([me, cred]) => { setRider(me); setCredibility(cred); })
      .catch((err) => {
        setError(err.message);
        if (err.status === 401) { clearToken(); router.push("/login"); }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="text-muted text-sm pt-8">Loading account…</p>;
  if (error) return <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mt-4">{error}</p>;

  const scorePercent = credibility ? Number(credibility.score) * 100 : 0;
  const scoreStatus = scorePercent >= 70 ? "safe" : scorePercent >= 40 ? "attention" : "danger";

  async function handleResetClaimHistory() {
    const confirmed = window.confirm(
      "Clear your claim history and payout records? Your account, rides, coverage and disruption evidence will stay in place so you can submit claims again."
    );
    if (!confirmed) return;

    const token = getToken();
    setResettingClaims(true);
    setResetMessage("");
    setResetError("");
    try {
      const result = await api.resetMyClaimHistory(token);
      const nextCredibility = await api.getMyCredibility(token);
      setCredibility(nextCredibility);
      setResetMessage(`${result.deleted_claims} claim${result.deleted_claims === 1 ? "" : "s"} and ${result.deleted_payouts} payout record${result.deleted_payouts === 1 ? "" : "s"} cleared. Your rides are still available to claim again.`);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResettingClaims(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-strong rounded-[2rem] p-5 sm:p-7">
        <p className="eyebrow">Rider profile</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary to-primary-dark font-display text-xl font-bold text-white shadow-glass">{rider?.name?.slice(0, 1)?.toUpperCase() || <User size={22}/>}</div>
          <div className="min-w-0"><h1 className="truncate font-display text-2xl font-bold text-ink">{rider?.name}</h1><p className="mt-0.5 truncate text-sm text-muted">{rider?.email}</p></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-pill border border-white/80 bg-white/55 px-3 py-1.5 text-xs text-muted"><Building2 size={14} className="text-primary"/>Company-sponsored cover</span><span className="inline-flex items-center gap-1.5 rounded-pill border border-white/80 bg-white/55 px-3 py-1.5 text-xs capitalize text-muted"><CalendarDays size={14} className="text-primary"/>Joined {rider?.joined_on ? new Date(rider.joined_on).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}</span></div>
      </section>

      <div className="glass rounded-card p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2"><ShieldCheck size={17} className="text-primary"/><h2 className="font-display font-semibold text-ink">Credibility overview</h2></div>
        <Gauge percent={scorePercent} value={`${scorePercent.toFixed(0)}%`} label="CREDIBILITY SCORE" status={scoreStatus} />
        <p className="text-xs text-muted text-center mt-3">
          Based on your claim history and how long you&apos;ve been registered. This affects how quickly a
          manually-reviewed claim gets attention — it does not affect automatic approvals.
        </p>
      </div>

      <div className="glass rounded-card divide-y divide-white/70 p-1">
        <Row label="Phone" value={rider?.phone} />
        <Row label="Delivers for" value={rider?.persona_type?.replace("_", " ")} capitalize />
        <Row label="Joined" value={rider?.joined_on ? new Date(rider.joined_on).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
      </div>

      <section className="glass rounded-card p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <p className="eyebrow">Claim history</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-ink">Reset claim history</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">Clears your claims, review checkpoints and payout records. Your account, rides and disruption evidence remain, so you can run the same claim walkthrough again.</p>
          </div>
          <button type="button" onClick={handleResetClaimHistory} disabled={resettingClaims} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-danger/20 bg-danger/[0.07] px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:cursor-wait disabled:opacity-60">
            <RotateCcw size={16} className={resettingClaims ? "animate-spin" : ""} />
            {resettingClaims ? "Resetting…" : "Reset claim history"}
          </button>
        </div>
        {resetMessage && <p role="status" className="mt-4 rounded-2xl border border-safe/15 bg-safe/10 px-4 py-3 text-sm text-safe">{resetMessage}</p>}
        {resetError && <p role="alert" className="mt-4 rounded-2xl border border-danger/15 bg-danger/10 px-4 py-3 text-sm text-danger">{resetError}</p>}
      </section>
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
