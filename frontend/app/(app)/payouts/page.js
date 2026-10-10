"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, WalletCards } from "lucide-react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api.listMyPayouts(token).then(setPayouts).catch((err) => setError(err.message));
  }, []);
  const total = payouts.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  return <div className="space-y-6">
    <header><p className="eyebrow">Company-sponsored cover</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Payouts</h1><p className="mt-2 text-sm text-muted">Approved income protection payouts linked to your reported delivery disruptions.</p></header>
    {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
    <section className="glass-strong flex flex-wrap items-end justify-between gap-4 rounded-[2rem] p-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Total received</p><p className="mt-2 font-mono text-4xl font-semibold text-ink">{money(total)}</p></div><span className="rounded-pill bg-safe/10 px-3 py-2 text-xs font-semibold text-safe">{payouts.filter((p) => p.status === "completed").length} completed</span></section>
    <section className="glass rounded-card p-5 sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><WalletCards size={19}/></span><div><h2 className="font-display font-semibold text-ink">Payout history</h2><p className="mt-0.5 text-xs text-muted">Demo payouts use a simulated wallet reference; no payment is sent.</p></div></div>
      {payouts.length ? <ul className="divide-y divide-ink/[0.07]">{payouts.map((p) => <li key={p.payout_id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-safe/10 text-safe"><CheckCircle2 size={17}/></span><div><p className="text-sm font-semibold text-ink">{p.disruption_type === "environmental" ? "Weather disruption" : "Civic disruption"}</p><p className="mt-1 text-xs text-muted">{p.processed_at ? new Date(p.processed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Date unavailable"} · {p.gateway_ref || "Demo wallet"}</p></div></div><div className="flex items-center gap-4"><p className="font-mono text-lg font-semibold text-ink">{money(p.amount)}</p><Link aria-label="View claim delivery" href={`/rides/${p.ride_id}`} className="text-primary"><ArrowUpRight size={16}/></Link></div></li>)}</ul> : <div className="py-10 text-center"><Clock3 className="mx-auto text-muted" size={24}/><p className="mt-3 text-sm font-medium text-ink">No payouts yet</p><p className="mt-1 text-xs text-muted">Approved claims will appear here.</p><Link href="/claims" className="mt-4 inline-flex text-sm font-medium text-primary">View claims <ArrowUpRight className="ml-1" size={14}/></Link></div>}
    </section>
  </div>;
}
