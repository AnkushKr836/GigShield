"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CloudRain, Cloud, Clock3, Sun, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

// Leaflet touches `window` at import time — must never render on the server.
const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES = {
  approved: "bg-safe/15 text-safe",
  rejected: "bg-danger/15 text-danger",
  manual_review: "bg-attention/20 text-attention-dark",
  pending: "bg-white/60 text-muted",
};

const SOURCE_LABELS = {
  fabricated_disruption: "Verified against a recorded disruption event",
  real_weather: "Verified against live weather conditions",
  demo_weather: "Matched a prototype weather scenario",
  demo_traffic: "Matched a prototype traffic scenario",
  demo_curfew: "Matched a prototype curfew scenario",
};

export default function RideDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [ride, setRide] = useState(null);
  const [claim, setClaim] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? getToken() : null;

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    Promise.all([api.getRide(params.id, token), api.listMyClaims(token), api.getRideWeather(params.id, token)])
      .then(([rideData, claims, weatherData]) => {
        setRide(rideData);
        setClaim(claims.find((c) => c.ride_id === rideData.ride_id) || null);
        setWeather(weatherData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) return <p className="text-muted text-sm pt-8">Loading ride…</p>;
  if (error) return <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mt-4">{error}</p>;
  if (!ride) return null;

  const hasCoords = ride.pickup_lat != null && ride.drop_lat != null;

  return (
    <div className="space-y-5">
      <Link href="/rides" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-primary">
        <ArrowLeft size={15} /> Back to rides
      </Link>

      <section className="glass-strong rounded-[2rem] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Delivery details</p><h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Your route</h1><p className="mt-2 text-sm text-muted">{formatDateTime(ride.start_time)}</p></div><span className="rounded-pill bg-safe/10 px-3 py-1.5 text-xs font-semibold capitalize text-safe">{ride.status}</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="rounded-2xl border border-white/80 bg-white/55 p-3.5"><p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted"><span className="h-2 w-2 rounded-full bg-safe"/>Pickup</p><p className="font-medium text-ink">{ride.pickup_location}</p></div>
          <span className="hidden text-primary sm:block"><ArrowRight size={18}/></span>
          <div className="rounded-2xl border border-white/80 bg-white/55 p-3.5"><p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted"><span className="h-2 w-2 rounded-full bg-primary"/>Drop-off</p><p className="font-medium text-ink">{ride.drop_location}</p></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-lg"><TripStat icon={Clock3} label="Ride time" value={`${new Date(ride.end_time).getTime() > new Date(ride.start_time).getTime() ? Math.max(1, Math.round((new Date(ride.end_time).getTime() - new Date(ride.start_time).getTime()) / 60000)) : 0} min`} /><TripStat icon={Wallet} label="Fare" value={`₹${Number(ride.fare_amount).toLocaleString("en-IN")}`} /></div>
      </section>

      {hasCoords && (
        <div className="glass rounded-card p-3">
          <RouteMap
            pickupLat={ride.pickup_lat}
            pickupLng={ride.pickup_lng}
            pickupLabel={ride.pickup_location}
            dropLat={ride.drop_lat}
            dropLng={ride.drop_lng}
            dropLabel={ride.drop_location}
          />
        </div>
      )}

      {weather && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          {weather.available ? (
            <>
              {weather.is_disruptive ? (
                <CloudRain size={20} className="text-primary shrink-0" />
              ) : (
                <Sun size={20} className="text-attention shrink-0" />
              )}
              <div>
                <p className="text-sm text-ink capitalize">{weather.description}, {weather.temp_c}°C</p>
                <p className="text-xs text-muted">Live conditions at pickup right now — not necessarily at ride time</p>
              </div>
            </>
          ) : (
            <>
              <Cloud size={20} className="text-muted shrink-0" />
              <p className="text-sm text-muted">{weather.reason}</p>
            </>
          )}
        </div>
      )}

      <div>
        {claim ? (
          <div className="glass-strong rounded-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted uppercase tracking-wide">Complaint status</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[claim.status]}`}>
                {claim.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-ink mb-2">{claim.description}</p>
            {claim.verification_source && !claim.verification_source.startsWith("demo_") && (
              <p className="text-xs text-primary mb-2">{SOURCE_LABELS[claim.verification_source] || claim.verification_source.replaceAll("_", " ")}</p>
            )}
            <div className="flex justify-between text-sm pt-3 border-t border-white/50">
              <span className="text-muted">Claimed</span>
              <span className="font-mono text-ink">₹{claim.claimed_amount}</span>
            </div>
            {claim.approved_amount != null && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted">Approved</span>
                <span className="font-mono text-safe font-semibold">₹{claim.approved_amount}</span>
              </div>
            )}
          </div>
        ) : (
          <Link href={`/rides/${ride.ride_id}/claim`} className="btn-primary inline-flex w-full items-center justify-center gap-2 text-center">
            Report a disruption <ArrowRight size={16}/>
          </Link>
        )}
      </div>
    </div>
  );
}

function TripStat({ icon: Icon, label, value }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-white/75 bg-white/45 px-3.5 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-primary"><Icon size={16}/></span><div><p className="text-[10px] uppercase tracking-wider text-muted">{label}</p><p className="mt-0.5 font-mono text-sm font-semibold text-ink">{value}</p></div></div>;
}
