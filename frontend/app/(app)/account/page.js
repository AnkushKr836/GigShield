"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CalendarDays, ShieldCheck, User } from "lucide-react";
import { api } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import Gauge from "@/components/Gauge";

export default function AccountPage() {
  const router = useRouter();
  const [rider, setRider] = useState(null);
  const [credibility, setCredibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
