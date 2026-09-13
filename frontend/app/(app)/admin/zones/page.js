"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

const RISK_TIERS = ["low", "medium", "high"];
const TIER_STYLES = { low: "bg-safe/15 text-safe", medium: "bg-attention/20 text-attention-dark", high: "bg-danger/15 text-danger" };

export default function AdminZonesPage() {
  const router = useRouter();
  const [zones, setZones] = useState([]);
  const [name, setName] = useState("");
  const [riskTier, setRiskTier] = useState("medium");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editTier, setEditTier] = useState("medium");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const token = typeof window !== "undefined" ? getAdminToken() : null;

  function load() {
    api.listZones().then(setZones).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createZone({ name, risk_tier: riskTier }, token);
      setName("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(z) {
    setEditingId(z.zone_id);
    setEditName(z.name);
    setEditTier(z.risk_tier);
  }

  async function saveEdit(id) {
    setError("");
    try {
      await api.updateZone(id, { name: editName, risk_tier: editTier }, token);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await api.deleteZone(id, token);
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
      <h1 className="font-display font-bold text-2xl text-ink mb-6">Zones</h1>

      <form onSubmit={handleSubmit} className="glass rounded-card p-5 flex gap-2 mb-6">
        <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Zone name, e.g. Chennai Central" />
        <select value={riskTier} onChange={(e) => setRiskTier(e.target.value)} className="input w-32 shrink-0">
          {RISK_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="submit" disabled={submitting} className="btn-primary shrink-0 px-5">
          {submitting ? "Adding…" : "Add"}
        </button>
      </form>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : zones.length === 0 ? (
        <p className="text-sm text-muted">No zones yet — add one above.</p>
      ) : (
        <ul className="space-y-2">
          {zones.map((z) => (
            <li key={z.zone_id} className="glass rounded-2xl px-4 py-3">
              {editingId === z.zone_id ? (
                <div className="flex items-center gap-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input flex-1" />
                  <select value={editTier} onChange={(e) => setEditTier(e.target.value)} className="input w-28 shrink-0">
                    {RISK_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => saveEdit(z.zone_id)} className="p-2 rounded-xl bg-safe text-white shrink-0"><Check size={15} /></button>
                  <button onClick={() => setEditingId(null)} className="p-2 rounded-xl bg-white/60 text-muted shrink-0"><X size={15} /></button>
                </div>
              ) : confirmDeleteId === z.zone_id ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink">Remove {z.name}?</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(z.zone_id)} className="px-3 py-1 rounded-xl bg-danger text-white text-xs font-medium">Confirm</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 rounded-xl bg-white/60 text-muted text-xs font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink font-medium">{z.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TIER_STYLES[z.risk_tier]}`}>{z.risk_tier}</span>
                    <button onClick={() => startEdit(z)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-white/60 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmDeleteId(z.zone_id)} className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-white/60 transition-colors"><Trash2 size={14} /></button>
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
