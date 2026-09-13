"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Check, X } from "lucide-react";
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
            <li key={p.plan_id} className="glass rounded-2xl px-4 py-3">
              {editingId === p.plan_id ? (
                <div className="flex items-center gap-2">
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
                <div className="flex justify-between items-center">
                  <p className="text-sm text-ink font-medium">{companyName(p.company_id)} — {p.tier_name}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-ink">₹{p.payout_per_day}/day</span>
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-white/60 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmDeleteId(p.plan_id)} className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-white/60 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
