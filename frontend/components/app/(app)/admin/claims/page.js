"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import { api } from "@/lib/api";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function AdminClaimsReviewPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decidingId, setDecidingId] = useState(null);

  function load() {
    setLoading(true);
    api.listManualReviewClaims().then(setClaims).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDecision(tokenId, decision, claimedAmount) {
    setDecidingId(tokenId);
    setError("");
    try {
      await api.decideClaim(tokenId, { decision, approved_amount: decision === "approved" ? claimedAmount : undefined });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to admin
      </Link>
      <h1 className="font-display font-bold text-2xl text-ink mb-1">Claims review</h1>
      <p className="text-muted text-sm mb-6">
        Sorted with lower-credibility riders&apos; claims first — credibility affects review order, not the original automated decision.
      </p>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : claims.length === 0 ? (
        <p className="text-sm text-muted">No claims currently awaiting review.</p>
      ) : (
        <ul className="space-y-3">
          {claims.map((c) => (
            <li key={c.token_id} className="glass rounded-card p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-muted">{formatDate(c.raised_at)} · {c.disruption_type}</span>
                <span className="font-mono text-sm text-ink">₹{c.claimed_amount}</span>
              </div>
              {c.fraud_flag && (
                <span className="inline-block mb-2 px-2 py-0.5 rounded-full text-xs font-medium bg-danger/15 text-danger">
                  Flagged: unusually frequent claims
                </span>
              )}
              <p className="text-sm text-ink mb-4">{c.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDecision(c.token_id, "approved", c.claimed_amount)}
                  disabled={decidingId === c.token_id}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-safe text-white text-sm font-medium hover:bg-safe/85 transition-colors disabled:opacity-50"
                >
                  <Check size={15} /> Approve
                </button>
                <button
                  onClick={() => handleDecision(c.token_id, "rejected")}
                  disabled={decidingId === c.token_id}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-danger text-white text-sm font-medium hover:bg-danger/85 transition-colors disabled:opacity-50"
                >
                  <X size={15} /> Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
