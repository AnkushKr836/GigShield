"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

const TIERS = ["Basic", "Standard", "Premium"];

export default function AdminCoveragePlansPage() {
  const [plans, setPlans] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [tierName, setTierName] = useState("Basic");
  const [payoutPerDay, setPayoutPerDay] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    Promise.all([api.listCoveragePlans(), api.listCompanies()])
      .then(([planData, companyData]) => {
        setPlans(planData);
        setCompanies(companyData);
        setCompanyId((prev) => prev || companyData[0]?.company_id || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const companyName = (id) => companies.find((c) => c.company_id === id)?.name || id.slice(0, 8);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createCoveragePlan({ company_id: companyId, tier_name: tierName, payout_per_day: Number(payoutPerDay) });
      setPayoutPerDay("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to admin
      </Link>
      <h1 className="font-display font-bold text-2xl text-ink mb-6">Coverage Plans</h1>

      <form onSubmit={handleSubmit} className="glass rounded-card p-5 space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="input" disabled={companies.length === 0}>
            {companies.map((c) => <option key={c.company_id} value={c.company_id}>{c.name}</option>)}
          </select>
          <select value={tierName} onChange={(e) => setTierName(e.target.value)} className="input">
            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <input required type="number" min="1" value={payoutPerDay} onChange={(e) => setPayoutPerDay(e.target.value)} className="input" placeholder="Payout per disrupted day (₹)" />
          <button type="submit" disabled={submitting || companies.length === 0} className="btn-primary shrink-0 px-5">
            {submitting ? "Adding…" : "Add"}
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}
      {companies.length === 0 && !loading && (
        <p className="text-sm text-attention-dark bg-attention/15 rounded-2xl px-3 py-2 mb-4">Add a company first before creating a plan.</p>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-muted">No coverage plans yet — add one above.</p>
      ) : (
        <ul className="space-y-2">
          {plans.map((p) => (
            <li key={p.plan_id} className="glass rounded-2xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-sm text-ink font-medium">{companyName(p.company_id)} — {p.tier_name}</p>
              </div>
              <span className="font-mono text-sm text-ink">₹{p.payout_per_day}/day</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
