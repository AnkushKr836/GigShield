"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

const RISK_TIERS = ["low", "medium", "high"];

export default function AdminZonesPage() {
  const [zones, setZones] = useState([]);
  const [name, setName] = useState("");
  const [riskTier, setRiskTier] = useState("medium");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.listZones().then(setZones).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createZone({ name, risk_tier: riskTier });
      setName("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const TIER_STYLES = { low: "bg-safe/15 text-safe", medium: "bg-attention/20 text-attention-dark", high: "bg-danger/15 text-danger" };

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
            <li key={z.zone_id} className="glass rounded-2xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-ink font-medium">{z.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TIER_STYLES[z.risk_tier]}`}>{z.risk_tier}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
