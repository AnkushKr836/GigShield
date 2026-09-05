"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { api } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import Gauge from "@/components/Gauge";

export default function AccountPage() {
  const router = useRouter();
  const [rider, setRider] = useState(null);
  const [credibility, setCredibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    Promise.all([api.getMe(token), api.getMyCredibility(token)])
      .then(([me, cred]) => { setRider(me); setCredibility(cred); })
      .catch((err) => {
        setError(err.message);
        if (err.status === 401) { clearToken(); router.push("/login"); }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="text-muted text-sm pt-8">Loading account…</p>;
  if (error) return <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mt-4">{error}</p>;

  const scorePercent = credibility ? Number(credibility.score) * 100 : 0;
  const scoreStatus = scorePercent >= 70 ? "safe" : scorePercent >= 40 ? "attention" : "danger";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
          <User size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-ink">{rider?.name}</h1>
          <p className="text-xs text-muted">{rider?.email}</p>
        </div>
      </div>

      <div className="glass rounded-card p-6 mb-6">
        <Gauge percent={scorePercent} value={`${scorePercent.toFixed(0)}%`} label="CREDIBILITY SCORE" status={scoreStatus} />
        <p className="text-xs text-muted text-center mt-3">
          Based on your claim history and how long you&apos;ve been registered. This affects how quickly a
          manually-reviewed claim gets attention — it does not affect automatic approvals.
        </p>
      </div>

      <div className="glass rounded-card divide-y divide-white/50">
        <Row label="Phone" value={rider?.phone} />
        <Row label="Delivers for" value={rider?.persona_type?.replace("_", " ")} capitalize />
        <Row label="Joined" value={rider?.joined_on ? new Date(rider.joined_on).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
      </div>
    </div>
  );
}

function Row({ label, value, capitalize }) {
  return (
    <div className="flex justify-between px-4 py-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className={`text-ink ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}
