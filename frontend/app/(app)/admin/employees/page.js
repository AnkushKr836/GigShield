"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Search, Users } from "lucide-react";
import { api } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

function scoreStatus(score) {
  if (score == null) return "neutral";
  if (score >= 0.7) return "safe";
  if (score >= 0.4) return "attention";
  return "danger";
}
const SCORE_BAR = { safe: "bg-safe", attention: "bg-attention", danger: "bg-danger", neutral: "bg-muted" };

export default function AdminEmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const token = typeof window !== "undefined" ? getAdminToken() : null;

  function load() {
    setLoading(true);
    api.listEmployees(token).then(setEmployees).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSeed() {
    setSeeding(true);
    setError("");
    try {
      await api.seedEmployees(10, token);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  }

  const visibleEmployees = employees.filter((employee) =>
    `${employee.name} ${employee.email} ${employee.company_name} ${employee.zone_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to admin
      </Link>
      <div className="glass-strong rounded-[2rem] p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Workforce directory</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Employees</h1><p className="mt-1 text-sm text-muted">Riders enrolled through participating companies.</p></div>
          <button onClick={handleSeed} disabled={seeding} className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2.5"><Users size={16} />{seeding ? "Generating…" : "Seed 10 demo riders"}</button>
        </div>
        <div className="mt-5 grid max-w-lg grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/75 bg-white/50 p-3"><p className="font-mono text-xl font-semibold text-ink">{employees.length}</p><p className="text-xs text-muted">Riders in directory</p></div>
          <div className="rounded-2xl border border-white/75 bg-white/50 p-3"><p className="font-mono text-xl font-semibold text-ink">{employees.filter((employee) => employee.credibility_score != null).length}</p><p className="text-xs text-muted">Scored profiles</p></div>
        </div>
      </div>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : employees.length === 0 ? (
        <div className="glass rounded-card p-6 text-center">
          <Users size={22} className="mx-auto mb-2 text-muted" />
          <p className="text-sm text-muted">No employees yet — register one, or seed fabricated demo employees above.</p>
        </div>
      ) : (
        <div className="glass rounded-card p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display font-semibold text-ink">Rider profiles</h2><p className="mt-1 text-xs text-muted">Credibility helps prioritize manual review only.</p></div><label className="relative w-full sm:max-w-xs"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/><input className="input pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a rider" /></label></div>
        <ul className="grid gap-3 xl:grid-cols-2">
          {visibleEmployees.map((e) => {
            const status = scoreStatus(e.credibility_score);
            const pct = e.credibility_score != null ? Math.round(e.credibility_score * 100) : null;
            return (
              <li key={e.rider_id} className="list-row p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-primary/15 font-display font-bold text-primary shadow-sm">{e.name?.slice(0, 1)?.toUpperCase()}</div>
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{e.name}</p><p className="mt-0.5 truncate text-xs text-muted">{e.email}</p></div>
                  </div>
                  <span className={`shrink-0 rounded-pill px-2.5 py-1 font-mono text-xs font-semibold ${pct == null ? "bg-white/60 text-muted" : status === "safe" ? "bg-safe/10 text-safe" : status === "attention" ? "bg-attention/15 text-attention-dark" : "bg-danger/10 text-danger"}`}>{pct != null ? `${pct}%` : "Not scored"}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px]"><span className="inline-flex items-center gap-1 rounded-pill border border-white/80 bg-white/50 px-2.5 py-1 text-muted"><Building2 size={12}/>{e.company_name}</span><span className="rounded-pill border border-white/80 bg-white/50 px-2.5 py-1 capitalize text-muted">{e.zone_name}</span></div>
                {pct != null && (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/75">
                    <div className={`h-full rounded-full ${SCORE_BAR[status]} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {visibleEmployees.length === 0 && <p className="py-10 text-center text-sm text-muted">No riders match “{search}”.</p>}
        </div>
      )}
    </div>
  );
}
