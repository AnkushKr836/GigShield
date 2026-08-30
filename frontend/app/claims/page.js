"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

const STATUS_STYLES = {
  approved: "bg-safe/10 text-safe",
  rejected: "bg-danger/10 text-danger",
  manual_review: "bg-signal/10 text-signal-dark",
  pending: "bg-storm/10 text-storm-light",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ClaimsPage() {
  const router = useRouter();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    api
      .listMyClaims(token)
      .then(setClaims)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="text-storm-light text-sm pt-8">Loading your claims…</p>;

  return (
    <div className="pt-2">
      <h1 className="font-display font-bold text-2xl text-ink mb-6">Your claims</h1>

      {error && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-card px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {claims.length === 0 ? (
        <p className="text-sm text-storm-light">
          No claims yet — raise one from a completed ride&apos;s detail page.
        </p>
      ) : (
        <ul className="space-y-2">
          {claims.map((c) => (
            <li key={c.token_id} className="bg-surface border border-line rounded-card p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-storm-light">{formatDate(c.raised_at)}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[c.status]}`}>
                  {c.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-ink mb-3">{c.description}</p>
              <div className="flex justify-between text-sm">
                <span className="text-storm-light">Claimed ₹{c.claimed_amount}</span>
                {c.approved_amount != null && (
                  <span className="font-mono text-safe font-semibold">Approved ₹{c.approved_amount}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
