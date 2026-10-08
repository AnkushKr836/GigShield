"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight, Bike, CheckCircle2, ChevronRight, Clock3, CloudRain,
  ShieldCheck, TriangleAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";

const STATUS = {
  approved: { label: "Approved", className: "bg-safe/15 text-safe", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-danger/15 text-danger", icon: TriangleAlert },
  manual_review: { label: "In review", className: "bg-attention/20 text-attention-dark", icon: Clock3 },
  pending: { label: "Pending", className: "bg-white/60 text-muted", icon: Clock3 },
};

function formatDate(value, options = { day: "numeric", month: "short" }) {
  return new Date(value).toLocaleDateString("en-IN", options);
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function ProtectionChart({ claims }) {
  const points = useMemo(() => {
    const ordered = [...claims]
      .sort((a, b) => new Date(a.raised_at) - new Date(b.raised_at))
      .slice(-7);
    if (!ordered.length) return [];
    const values = ordered.map((claim) => Number(claim.approved_amount || 0));
    const max = Math.max(100, Math.ceil(Math.max(...values) / 100) * 100);
    return values.map((value, index) => ({
      x: ordered.length === 1 ? 55 : 13 + (index / (ordered.length - 1)) * 84,
      y: 27 - (value / max) * 21,
      value,
      date: ordered[index].raised_at,
    })).map((point) => ({ ...point, max }));
  }, [claims]);

  if (!points.length) {
    return (
      <div className="flex h-40 flex-col items-center justify-center text-center">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CloudRain size={19} /></div>
        <p className="text-sm font-medium text-ink">Your protection history starts with your first claim</p>
        <p className="mt-1 text-xs text-muted">Approved payouts will appear here.</p>
      </div>
    );
  }

  const path = points.reduce((result, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const third = (point.x - previous.x) / 3;
    return `${result} C ${previous.x + third} ${previous.y}, ${point.x - third} ${point.y}, ${point.x} ${point.y}`;
  }, "");
  const max = points[0].max;
  const areaPath = `${path} L ${points[points.length - 1].x} 27 L ${points[0].x} 27 Z`;
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const latestPoint = points[points.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-white/80 bg-gradient-to-r from-white/75 via-white/45 to-primary/[0.06] px-4 py-3">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Total received · recent claims</p><p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-ink">{formatMoney(total)}</p></div>
        <span className="rounded-pill border border-safe/15 bg-safe/10 px-3 py-1.5 text-[11px] font-semibold text-safe">{points.length} payout{points.length === 1 ? "" : "s"}</span>
      </div>

      <div className="rounded-2xl border border-white/75 bg-white/35 px-2 pb-2 pt-3 sm:px-3">
        <div className="aspect-[10/3] min-h-28 w-full max-h-60">
          <svg viewBox="0 0 100 30" preserveAspectRatio="xMidYMid meet" className="h-full w-full" role="img" aria-label="Approved payout amounts across the seven most recent claims">
            <defs>
              <linearGradient id="income-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#587d9b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#587d9b" stopOpacity="0.015" />
              </linearGradient>
              <linearGradient id="income-line" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#8ba9c1" />
                <stop offset="100%" stopColor="#172a43" />
              </linearGradient>
            </defs>
            {[6, 16.5, 27].map((y, index) => (
              <g key={y}>
                <text x="1" y={y - 0.8} fontSize="2.6" fill="#6c7c8c">{index === 0 ? formatMoney(max) : index === 1 ? formatMoney(max / 2) : "₹0"}</text>
                <line x1="12" x2="99" y1={y} y2={y} stroke="#8196aa" strokeOpacity={index === 2 ? "0.2" : "0.12"} strokeDasharray={index === 2 ? "0" : "1.2 1.5"} vectorEffect="non-scaling-stroke" />
              </g>
            ))}
            {points.length > 1 && <path d={areaPath} fill="url(#income-area)" />}
            {points.length > 1 && <path d={path} fill="none" stroke="url(#income-line)" strokeWidth="2.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />}
            {points.map((point, index) => (
              <g key={`${point.date}-${index}`}>
                {index === points.length - 1 && <circle cx={point.x} cy={point.y} r="5" fill="#587d9b" fillOpacity="0.16" />}
                <circle cx={point.x} cy={point.y} r={index === points.length - 1 ? "2.4" : "1.8"} fill="#fff" stroke="#172a43" strokeWidth="1.4" vectorEffect="non-scaling-stroke"><title>{formatDate(point.date)}: {formatMoney(point.value)}</title></circle>
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-1 flex items-center justify-between pl-[12%] text-[10px] font-medium text-muted">
          <span>{formatDate(points[0].date)}</span>
          {points.length > 2 && <span className="hidden sm:inline">Approved payout timeline</span>}
          <span>{formatDate(latestPoint.date)}</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [rider, setRider] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    Promise.all([api.getMe(token), api.listMyRides(token, 5, 0), api.listMyClaims(token)])
      .then(([me, rides, myClaims]) => {
        setRider(me);
        setRecentRides(rides);
        setClaims(myClaims);
      })
      .catch((err) => {
        setError(err.message);
        if (err.status === 401) { clearToken(); router.push("/login"); }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <p className="pt-8 text-sm text-muted">Loading your dashboard…</p>;

  const approvedClaims = claims.filter((claim) => claim.status === "approved");
  const totalProtected = approvedClaims.reduce((sum, claim) => sum + Number(claim.approved_amount || 0), 0);
  const pendingCount = claims.filter((claim) => ["manual_review", "pending"].includes(claim.status)).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Rider dashboard</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">Good to see you, {rider?.name?.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-muted">Your company provides your disruption cover at no cost to you.</p>
        </div>
        <Link href="/rides" className="btn-primary inline-flex items-center gap-2 text-sm">View rides <ArrowUpRight size={16} /></Link>
      </header>

      {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={ShieldCheck} label="Income protected" value={formatMoney(totalProtected)} tone="safe" detail="Approved payouts" />
        <Metric icon={ShieldCheck} label="Claims filed" value={claims.length} tone="primary" detail={`${approvedClaims.length} approved`} />
        <Metric icon={Bike} label="Recent rides" value={recentRides.length} tone="primary" detail="Latest deliveries" />
        <Metric icon={Clock3} label="Awaiting review" value={pendingCount} tone={pendingCount ? "attention" : "safe"} detail={pendingCount ? "We’ll update your claim" : "No open reviews"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="glass rounded-card p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><h2 className="font-display text-base font-semibold text-ink">Income protection</h2><p className="mt-1 text-xs text-muted">Your approved payouts over recent claims</p></div>
            <Link href="/claims" className="text-xs font-medium text-primary hover:underline">Claim history <ChevronRight className="inline" size={14} /></Link>
          </div>
          <ProtectionChart claims={approvedClaims} />
        </div>

        <div className="glass rounded-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck size={20} /></div>
            <div><p className="text-xs uppercase tracking-wider text-muted">Your coverage</p><h2 className="font-display font-semibold text-ink">Provided by your company</h2></div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">When severe weather or civic disruptions interrupt a delivery, raise a claim from that ride. We verify the disruption and apply your company’s daily payout limit.</p>
          <div className="mt-4 rounded-2xl border border-white/70 bg-white/40 p-3 text-xs leading-relaxed text-muted">No rider premium or policy checkout is required. Your company manages the coverage plan.</div>
          <Link href="/rides" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Find an affected ride <ChevronRight size={15} /></Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-base font-semibold text-ink">Recent claims</h2><Link href="/claims" className="text-xs font-medium text-primary hover:underline">View all</Link></div>
          {claims.length === 0 ? <EmptyState text="No claims yet. Open a completed delivery to report a weather or civic disruption." link="/rides" linkText="Browse rides" /> : (
            <ul className="divide-y divide-ink/[0.07]">
              {claims.slice(0, 4).map((claim) => {
                const status = STATUS[claim.status] || STATUS.pending;
                const Icon = status.icon;
                return <li key={claim.token_id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-start gap-3"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${status.className}`}><Icon size={16} /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{claim.disruption_type === "environmental" ? "Weather disruption" : "Civic disruption"}</p><p className="mt-0.5 line-clamp-1 text-xs text-muted">{claim.description}</p><p className="mt-1 text-[11px] text-muted">{formatDate(claim.raised_at, { day: "numeric", month: "short", year: "numeric" })}</p></div></div>
                  <div className="shrink-0 text-right"><span className={`inline-block rounded-pill px-2 py-1 text-[10px] font-medium ${status.className}`}>{status.label}</span><p className="mt-1 font-mono text-xs font-semibold text-ink">{claim.approved_amount != null ? formatMoney(claim.approved_amount) : formatMoney(claim.claimed_amount)}</p></div>
                </li>;
              })}
            </ul>
          )}
        </div>

        <div className="glass rounded-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-base font-semibold text-ink">Recent deliveries</h2><Link href="/rides" className="text-xs font-medium text-primary hover:underline">View all</Link></div>
          {recentRides.length === 0 ? <EmptyState text="Create sample deliveries to explore the claim flow." link="/rides" linkText="Generate demo rides" /> : (
            <ul className="space-y-2">
              {recentRides.slice(0, 4).map((ride) => <li key={ride.ride_id}><Link href={`/rides/${ride.ride_id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/35 px-3 py-3 transition-colors hover:bg-white/65">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{ride.pickup_location} <span className="text-muted">→</span> {ride.drop_location}</p><p className="mt-1 text-xs text-muted">{formatDate(ride.start_time, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p></div>
                <span className="shrink-0 font-mono text-sm text-ink">{formatMoney(ride.fare_amount)}</span>
              </Link></li>)}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone, detail }) {
  const tones = { safe: "text-safe bg-safe/10", primary: "text-primary bg-primary/10", attention: "text-attention-dark bg-attention/15" };
  return <div className="glass rounded-card p-4 sm:p-5"><div className="flex items-center justify-between"><span className="text-xs text-muted">{label}</span><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={17} /></span></div><p className="mt-3 font-mono text-2xl font-semibold text-ink">{value}</p><p className="mt-1 text-[11px] text-muted">{detail}</p></div>;
}

function EmptyState({ text, link, linkText }) {
  return <div className="flex min-h-32 flex-col items-start justify-center"><p className="max-w-sm text-sm leading-relaxed text-muted">{text}</p><Link href={link} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{linkText}<ChevronRight size={15} /></Link></div>;
}
