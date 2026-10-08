"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
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
      <div className="mx-auto max-w-2xl pt-6">
        <div className="glass-strong rounded-[2rem] p-7 text-center sm:p-10">
        <div className={`mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-[1.35rem] glass ${isApproved ? "text-safe" : "text-attention-dark"}`}>
          {isApproved ? <CheckCircle2 size={26} /> : <Clock size={26} />}
        </div>
        <p className="eyebrow">Claim update</p><h1 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
          {isApproved ? "Claim approved" : "Claim submitted for review"}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
          {isApproved
            ? `Verified against a matching disruption in your zone. ₹${result.approved_amount} approved.`
            : result.verification_source && result.fraud_flag
              ? "A disruption signal was verified, but this claim was flagged for a manual frequency review."
              : result.verification_source
                ? "A disruption signal was verified, but an active company coverage plan is needed before an automatic payout can be issued. This claim is in manual review."
                : "No matching disruption was found automatically — this claim needs manual review."}
        </p>
        {result.payout_note && (
          <p className="mx-auto mt-4 max-w-lg rounded-2xl border border-attention/20 bg-attention/10 px-4 py-3 text-left text-xs leading-relaxed text-attention-dark">
            {result.payout_note}
          </p>
        )}
        {result.verification_source === "real_weather" && (
          <p className="mt-5 inline-block rounded-2xl bg-primary/10 px-3 py-2 text-xs text-primary">
            Checked against current weather at your pickup location. This free weather feed does not provide historical conditions for the ride time.
          </p>
        )}
        <button onClick={() => router.push(`/rides/${params.id}`)} className="btn-primary mt-6 inline-flex items-center gap-2">Return to delivery <ArrowRight size={16}/></button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={`/rides/${params.id}`} className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-primary"><ArrowLeft size={15}/> Back to delivery</Link>
      <section className="glass-strong rounded-[2rem] p-5 sm:p-7"><p className="eyebrow">Disruption report</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Tell us what happened</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">We&apos;ll check your report against disruption evidence for this ride&apos;s time and zone. Your company provides coverage at no cost to you.</p><div className="mt-4 inline-flex items-center gap-2 rounded-pill border border-white/80 bg-white/55 px-3 py-2 text-xs text-muted"><ShieldCheck size={15} className="text-safe"/>No rider premium or payment required</div></section>

      <div className="glass rounded-card p-5 sm:p-7">
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

          <button type="submit" disabled={submitting} className="btn-primary inline-flex w-full items-center justify-center gap-2">
            {submitting ? "Submitting…" : "Submit claim for review"}<ArrowRight size={16}/>
          </button>
        </form>
      </div>
    </div>
  );
}
