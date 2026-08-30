"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
        {
          ride_id: params.id,
          disruption_type: disruptionType,
          description,
          claimed_amount: Number(claimedAmount),
        },
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
        <div
          className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${
            isApproved ? "bg-safe/10 text-safe" : "bg-signal/10 text-signal-dark"
          }`}
        >
          <span className="text-2xl">{isApproved ? "✓" : "⏳"}</span>
        </div>
        <h1 className="font-display font-bold text-xl text-ink mb-2">
          {isApproved ? "Claim approved" : "Claim submitted for review"}
        </h1>
        <p className="text-storm-light text-sm mb-6">
          {isApproved
            ? `Verified against a matching disruption in your zone. ₹${result.approved_amount} approved.`
            : "No matching disruption was found automatically — this claim needs manual review."}
        </p>
        <button
          onClick={() => router.push(`/rides/${params.id}`)}
          className="px-4 py-3 rounded-card border border-line text-storm font-medium hover:border-storm transition-colors"
        >
          Back to ride
        </button>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <h1 className="font-display font-bold text-2xl text-ink mb-1">Raise a token</h1>
      <p className="text-storm-light text-sm mb-6">
        Tell us what happened. We&apos;ll check it against verified disruption data for this ride&apos;s time and zone.
      </p>

      {error && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-card px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-xs font-medium text-storm-light mb-1.5 uppercase tracking-wide">
            What type of disruption?
          </span>
          <select value={disruptionType} onChange={(e) => setDisruptionType(e.target.value)} className="input">
            <option value="environmental">Weather (rain, flood, heat, pollution)</option>
            <option value="social">Civic (curfew, strike, road closure)</option>
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-storm-light mb-1.5 uppercase tracking-wide">
            What happened?
          </span>
          <textarea
            required
            minLength={10}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[100px] resize-none"
            placeholder="Describe the disruption and how it affected this delivery…"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-storm-light mb-1.5 uppercase tracking-wide">
            Amount you&apos;re claiming (₹)
          </span>
          <input
            required
            type="number"
            min="1"
            value={claimedAmount}
            onChange={(e) => setClaimedAmount(e.target.value)}
            className="input"
            placeholder="e.g. 250"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-3 rounded-card bg-signal text-white font-medium hover:bg-signal-dark transition-colors disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit claim"}
        </button>
      </form>
    </div>
  );
}
