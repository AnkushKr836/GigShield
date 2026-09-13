"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
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

  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to admin
      </Link>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-bold text-2xl text-ink">Employees</h1>
        <button onClick={handleSeed} disabled={seeding} className="btn-primary text-sm px-4 py-2">
          {seeding ? "Generating…" : "+ Seed 10 fabricated"}
        </button>
      </div>
      <p className="text-muted text-sm mb-6">All registered riders, with their most recently computed credibility score.</p>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : employees.length === 0 ? (
        <div className="glass rounded-card p-6 text-center">
          <Users size={22} className="mx-auto mb-2 text-muted" />
          <p className="text-sm text-muted">No employees yet — register one, or seed fabricated demo employees above.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {employees.map((e) => {
            const status = scoreStatus(e.credibility_score);
            const pct = e.credibility_score != null ? Math.round(e.credibility_score * 100) : null;
            return (
              <li key={e.rider_id} className="glass rounded-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{e.name}</p>
                    <p className="text-xs text-muted">{e.email} · {e.company_name} · {e.zone_name}</p>
                  </div>
                  <span className="font-mono text-sm text-ink shrink-0 ml-3">{pct != null ? `${pct}%` : "—"}</span>
                </div>
                {pct != null && (
                  <div className="h-1.5 rounded-full bg-white/50 overflow-hidden">
                    <div className={`h-full rounded-full ${SCORE_BAR[status]}`} style={{ width: `${pct}%` }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
