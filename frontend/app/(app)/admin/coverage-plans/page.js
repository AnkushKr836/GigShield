"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Layers, Pencil, Trash2, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

const TIERS = ["Basic", "Standard", "Premium"];

export default function AdminCoveragePlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [tierName, setTierName] = useState("Basic");
  const [payoutPerDay, setPayoutPerDay] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTier, setEditTier] = useState("Basic");
  const [editPayout, setEditPayout] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const token = typeof window !== "undefined" ? getAdminToken() : null;

  function load() {
    Promise.all([api.listCoveragePlans(null, token), api.listCompanies()])
      .then(([planData, companyData]) => {
        setPlans(planData);
        setCompanies(companyData);
        setCompanyId((prev) => prev || companyData[0]?.company_id || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const companyName = (id) => companies.find((c) => c.company_id === id)?.name || id.slice(0, 8);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createCoveragePlan({ company_id: companyId, tier_name: tierName, payout_per_day: Number(payoutPerDay) }, token);
      setPayoutPerDay("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(p) {
    setEditingId(p.plan_id);
    setEditTier(p.tier_name);
    setEditPayout(String(p.payout_per_day));
  }

  async function saveEdit(id) {
    setError("");
    try {
      await api.updateCoveragePlan(id, { tier_name: editTier, payout_per_day: Number(editPayout) }, token);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await api.deleteCoveragePlan(id, token);
      setConfirmDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to admin
      </Link>
      <section className="glass-strong rounded-[2rem] p-5 sm:p-7"><p className="eyebrow">Company-funded policies</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Coverage plans</h1><p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">Set the maximum payout each covered rider can receive per day. Companies buy the plan; riders receive cover at no cost.</p><div className="mt-5 flex flex-wrap gap-3"><span className="inline-flex items-center gap-2 rounded-pill border border-white/80 bg-white/55 px-3 py-2 text-xs text-muted"><Layers size={14} className="text-primary"/><strong className="font-mono text-ink">{plans.length}</strong> plans</span><span className="inline-flex items-center gap-2 rounded-pill border border-white/80 bg-white/55 px-3 py-2 text-xs text-muted"><Building2 size={14} className="text-primary"/><strong className="font-mono text-ink">{companies.length}</strong> companies</span></div></section>

      <form onSubmit={handleSubmit} className="glass rounded-card p-4 sm:p-5 space-y-3">
        <div><h2 className="font-display font-semibold text-ink">Create a plan</h2><p className="mt-1 text-xs text-muted">The daily cap is shared per rider across approved claims that day.</p></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="input" disabled={companies.length === 0}>
            {companies.map((c) => <option key={c.company_id} value={c.company_id}>{c.name}</option>)}
          </select>
          <select value={tierName} onChange={(e) => setTierName(e.target.value)} className="input">
            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
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
        <div className="glass rounded-card p-8 text-center"><Layers size={22} className="mx-auto mb-2 text-primary"/><p className="font-medium text-ink">No coverage plans yet</p><p className="mt-1 text-sm text-muted">Create a company-funded daily limit above.</p></div>
      ) : (
        <section className="glass rounded-card p-4 sm:p-6"><div className="mb-4"><h2 className="font-display font-semibold text-ink">Plan catalogue</h2><p className="mt-1 text-xs text-muted">Daily maximums assigned to participating companies.</p></div><ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <li key={p.plan_id} className="list-row p-4">
              {editingId === p.plan_id ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select value={editTier} onChange={(e) => setEditTier(e.target.value)} className="input flex-1">
                    {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="number" min="1" value={editPayout} onChange={(e) => setEditPayout(e.target.value)} className="input w-28 shrink-0" />
                  <button onClick={() => saveEdit(p.plan_id)} className="p-2 rounded-xl bg-safe text-white shrink-0"><Check size={15} /></button>
                  <button onClick={() => setEditingId(null)} className="p-2 rounded-xl bg-white/60 text-muted shrink-0"><X size={15} /></button>
                </div>
              ) : confirmDeleteId === p.plan_id ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink">Remove {companyName(p.company_id)} — {p.tier_name}?</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(p.plan_id)} className="px-3 py-1 rounded-xl bg-danger text-white text-xs font-medium">Confirm</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 rounded-xl bg-white/60 text-muted text-xs font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-medium text-primary">{companyName(p.company_id)}</p><p className="mt-1 font-display text-lg font-bold text-ink">{p.tier_name}</p></div><span className="rounded-xl bg-primary/10 p-2 text-primary"><Layers size={17}/></span></div>
                  <div className="flex items-end justify-between gap-2 border-t border-white/70 pt-3">
                    <div><p className="font-mono text-xl font-semibold text-ink">₹{Number(p.payout_per_day).toLocaleString("en-IN")}</p><p className="text-[10px] uppercase tracking-wider text-muted">Daily payout cap</p></div>
                    <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-white/60 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmDeleteId(p.plan_id)} className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-white/60 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul></section>
      )}
    </div>
  );
}
