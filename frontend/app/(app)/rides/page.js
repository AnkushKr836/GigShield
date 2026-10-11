"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bike, CalendarDays, CheckCircle2, ChevronRight, Clock3, MapPin, Plus, Search } from "lucide-react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

const PAGE_SIZE = 5;
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function amount(value) { return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`; }

export default function RidesPage() {
  const router = useRouter();
  const [rides, setRides] = useState([]);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState(null);

  useEffect(() => {
    const authToken = getToken();
    setToken(authToken);
    if (!authToken) { router.push("/login"); return; }
    loadFirstPage(authToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function loadFirstPage(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const data = await api.listMyRides(authToken, PAGE_SIZE, 0);
      setRides(data); setOffset(data.length); setHasMore(data.length === PAGE_SIZE);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleLoadMore() {
    setLoadingMore(true); setError("");
    try {
      const data = await api.listMyRides(token, PAGE_SIZE, offset);
      setRides((prev) => [...prev, ...data]); setOffset((prev) => prev + data.length); setHasMore(data.length === PAGE_SIZE);
    } catch (err) { setError(err.message); }
    finally { setLoadingMore(false); }
  }

  async function handleSimulate() {
    setSimulating(true); setError("");
    try { await api.simulateRides(token); await loadFirstPage(); }
    catch (err) { setError(err.message); }
    finally { setSimulating(false); }
  }

  const filteredRides = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rides;
    return rides.filter((ride) => `${ride.pickup_location} ${ride.drop_location} ${ride.status}`.toLowerCase().includes(query));
  }, [rides, search]);
  const totalFare = rides.reduce((sum, ride) => sum + Number(ride.fare_amount || 0), 0);

  if (loading) return <div className="glass rounded-card p-8 text-sm text-muted">Loading your deliveries…</div>;

  return (
    <div className="space-y-6">
      <section className="glass-strong relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><p className="eyebrow">Delivery activity</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Your rides</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Open a delivery to see its route and weather check, or report a disruption that affected the trip. Generated rides have varied evidence: supported claims can qualify for automatic approval, while rides without matching evidence go to admin review and can be rejected there.</p></div>
          <button onClick={handleSimulate} disabled={simulating} className="btn-primary inline-flex shrink-0 items-center justify-center gap-2"><Plus size={17} />{simulating ? "Generating rides…" : "Generate demo rides"}</button>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
          <MiniStat label="Loaded deliveries" value={rides.length} icon={Bike} />
          <MiniStat label="Recorded fares" value={amount(totalFare)} icon={CalendarDays} />
        </div>
      </section>

      {error && <p className="rounded-2xl border border-danger/15 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      <section className="glass rounded-card p-4 sm:p-6">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><h2 className="font-display text-lg font-bold text-ink">Recent deliveries</h2><p className="mt-1 text-xs text-muted">Showing {rides.length} loaded ride{rides.length === 1 ? "" : "s"}</p></div>
          <label className="relative block w-full sm:max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="input pl-9" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search loaded rides" /></label>
        </div>

        {rides.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-white/25 px-6 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bike size={23} /></span>
            <h3 className="font-display font-semibold text-ink">No rides on your list yet</h3><p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">Generate deliveries with varied disruption evidence, then submit claims to see automatic approval eligibility and admin review paths.</p>
            <button onClick={handleSimulate} disabled={simulating} className="btn-primary mt-4">{simulating ? "Generating…" : "Generate demo rides"}</button>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="rounded-2xl bg-white/35 p-8 text-center text-sm text-muted">No loaded rides match “{search}”.</div>
        ) : (
          <ul className="space-y-3">
            {filteredRides.map((ride, index) => <li key={ride.ride_id}>
              <Link href={`/rides/${ride.ride_id}`} className="list-row glass-hover group grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-5">
                <div className="min-w-0">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-pill bg-primary/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Ride {String(offset - index).padStart(2, "0")}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted"><Clock3 size={13} />{formatDate(ride.start_time)}</span>
                    <span className="ml-auto inline-flex items-center gap-1.5 rounded-pill border border-safe/15 bg-safe/[0.07] px-2.5 py-1 text-[10px] font-medium capitalize text-safe"><CheckCircle2 size={12} />{String(ride.status || "completed").replaceAll("_", " ")}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] sm:items-center sm:gap-3">
                    <RouteStop label="PICKUP" location={ride.pickup_location} />
                    <span className="hidden h-9 w-9 items-center justify-center rounded-full border border-primary/10 bg-white/70 text-primary/70 sm:flex"><ArrowRight size={16} /></span>
                    <RouteStop label="DROP-OFF" location={ride.drop_location} destination />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-primary/[0.08] pt-3 sm:min-w-[112px] sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:py-1 sm:pl-5 sm:pt-0">
                  <div><p className="font-mono text-xl font-semibold tracking-tight text-ink">{amount(ride.fare_amount)}</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">Ride fare</p></div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 text-muted transition-all group-hover:bg-primary group-hover:text-white sm:mt-3"><ChevronRight size={17} /></span>
                </div>
              </Link>
            </li>)}
          </ul>
        )}
        {hasMore && rides.length > 0 && <button onClick={handleLoadMore} disabled={loadingMore} className="btn-ghost mt-4 w-full text-sm">{loadingMore ? "Loading more…" : "Load more deliveries"}<ArrowRight className="ml-1 inline" size={15} /></button>}
      </section>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/45 px-3.5 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-primary"><Icon size={16} /></span><div><p className="font-mono text-sm font-semibold text-ink">{value}</p><p className="text-[10px] text-muted">{label}</p></div></div>;
}

function RouteStop({ label, location, destination = false }) {
  return <div className="flex min-w-0 items-start gap-2.5">
    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${destination ? "bg-primary/[0.07] text-primary" : "bg-safe/[0.08] text-safe"}`}><MapPin size={14} /></span>
    <div className="min-w-0"><p className="text-[9px] font-semibold tracking-[0.16em] text-muted/80">{label}</p><p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-ink sm:text-[14px]">{location || "Location unavailable"}</p></div>
  </div>;
}
