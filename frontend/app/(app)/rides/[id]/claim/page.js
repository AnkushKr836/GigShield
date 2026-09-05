"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function RaiseClaimPage() {
  const router = useRouter();
  const params = useParams();
  const token = typeof window !== "undefined" ? getToken() : null;

  const [disruptionType, setDisruptionType] = useState("environmental");
  const [description, setDescription] = useState("");
  const [claimedAmount, setClaimedAmount] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const claim = await api.raiseClaim(
        { ride_id: params.id, disruption_type: disruptionType, description, claimed_amount: Number(claimedAmount) },
        token
      );
      setResult(claim);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const isApproved = result.status === "approved";
    return (
      <div className="pt-8 text-center">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 glass ${isApproved ? "text-safe" : "text-attention-dark"}`}>
          {isApproved ? <CheckCircle2 size={26} /> : <Clock size={26} />}
        </div>
        <h1 className="font-display font-bold text-xl text-ink mb-2">
          {isApproved ? "Complaint approved" : "Complaint submitted for review"}
        </h1>
        <p className="text-muted text-sm mb-6">
          {isApproved
            ? `Verified against a matching disruption in your zone. ₹${result.approved_amount} approved and paid out.`
            : "No matching disruption was found automatically — this complaint needs manual review."}
        </p>
        <button onClick={() => router.push(`/rides/${params.id}`)} className="btn-ghost">
          Back to ride
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-ink mb-1">Raise a complaint</h1>
      <p className="text-muted text-sm mb-6">
        Tell us what happened. We&apos;ll check it against verified disruption data for this ride&apos;s time and zone.
      </p>

      <div className="glass rounded-card p-6">
        {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">What type of disruption?</span>
            <select value={disruptionType} onChange={(e) => setDisruptionType(e.target.value)} className="input">
              <option value="environmental">Weather (rain, flood, heat, pollution)</option>
              <option value="social">Civic (curfew, strike, road closure)</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">What happened?</span>
            <textarea
              required minLength={10} value={description} onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[100px] resize-none"
              placeholder="Describe the disruption and how it affected this delivery…"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">Amount you&apos;re claiming (₹)</span>
            <input required type="number" min="1" value={claimedAmount} onChange={(e) => setClaimedAmount(e.target.value)} className="input" placeholder="e.g. 250" />
          </label>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Submitting…" : "Submit complaint"}
          </button>
        </form>
      </div>
    </div>
  );
}
