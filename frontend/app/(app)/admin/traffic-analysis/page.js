"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, CheckCircle2, Clock3, Database, Download, Gauge, LoaderCircle, MapPin, Play, TrafficCone, Users } from "lucide-react";
import { api, downloadSyntheticTrafficDataset } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

const fmtDate = (value) => new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function TrafficAnalysisPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [model, setModel] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [employeeRides, setEmployeeRides] = useState(null);
  const [run, setRun] = useState(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const selectedEmployee = employees.find((item) => item.rider_id === selectedId);

  useEffect(() => {
    const adminToken = getAdminToken();
    if (!adminToken) { router.push("/login"); return; }
    setToken(adminToken);
    Promise.all([api.ensureDemoRides(adminToken), api.listEmployees(adminToken), api.listTrafficSnapshots(adminToken), api.getTrafficModelStatus(adminToken)])
      .then(([rideStatus, employeeRows, snapshotRows, modelStatus]) => {
        setEmployees(employeeRows); setSnapshots(snapshotRows); setModel(modelStatus);
        if (rideStatus.riders_backfilled) setSuccess(`Restored at least 6 demo rides for ${rideStatus.riders_backfilled} existing fabricated rider account${rideStatus.riders_backfilled === 1 ? "" : "s"}.`);
      })
      .catch((err) => setError(err.message));
  }, [router]);

  useEffect(() => {
    if (!token || !selectedEmployee?.zone_id) return;
    api.getTrafficModelStatus(token, selectedEmployee.zone_id).then(setModel).catch(() => {});
  }, [token, selectedEmployee?.zone_id]);

  useEffect(() => {
    if (!token || !selectedId) { setEmployeeRides(null); setRun(null); return; }
    setBusy(true); setError("");
    api.getEmployeeTrafficRides(selectedId, token)
      .then(setEmployeeRides).catch((err) => setError(err.message)).finally(() => setBusy(false));
  }, [selectedId, token]);

  const matchedCount = useMemo(() => run?.rides_matched ?? 0, [run]);

  async function generateDataset() {
    if (!selectedId) return;
    setBusy(true); setError(""); setSuccess(""); setRun(null);
    try {
      const result = await api.generateSyntheticTrafficDataset(selectedId, { sample_count: 600, seed: 42 }, token);
      const rows = await api.listTrafficSnapshots(token);
      setSnapshots(rows);
      const trained = await api.trainTrafficModel(selectedEmployee?.zone_id, token);
      setModel(trained);
      setSuccess(`Refreshed ${result.training_records} training samples and ${result.ride_aligned_records} ride-aligned records for ${result.zone_name}, then trained the classifier. Holdout accuracy on synthetic data: ${Math.round(trained.metrics.accuracy * 100)}%.`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function analyzeRides() {
    if (!selectedId) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const result = await api.runEmployeeTrafficAnalysis(selectedId, token);
      setRun(result);
      setSuccess(`Matched synthetic traffic context to ${result.rides_matched} of ${result.rides_analyzed} rides.`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function exportDataset() {
    setDownloading(true); setError("");
    try { await downloadSyntheticTrafficDataset(selectedEmployee?.zone_id, token); }
    catch (err) { setError(err.message); }
    finally { setDownloading(false); }
  }

  async function trainModel() {
    setTraining(true); setError(""); setSuccess("");
    try {
      const result = await api.trainTrafficModel(selectedEmployee?.zone_id, token);
      setModel(result);
      setSuccess(`Trained ${result.model_name} on ${result.sample_count} synthetic records; held-out accuracy ${Math.round(result.metrics.accuracy * 100)}%.`);
    } catch (err) { setError(err.message); }
    finally { setTraining(false); }
  }

  const selectedZoneRecords = snapshots.filter((row) => !selectedEmployee || row.zone_id === selectedEmployee.zone_id);

  return <div className="space-y-6">
    <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-primary"><ArrowLeft size={15}/>Admin workspace</Link>
    <section className="glass-strong relative overflow-hidden rounded-[2rem] p-6 sm:p-8"><div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"/><div className="relative flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-glass"><TrafficCone size={22}/></span><div><p className="eyebrow">Operations · Prototype dataset</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Traffic analysis</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">Generate a reproducible, labeled traffic dataset for an employee’s zone, then match its synthetic route and time windows against their rides. These values are fabricated examples, not observed road conditions or GPS evidence.</p></div></div></section>
    {error && <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
    {success && <div role="status" className="rounded-2xl border border-safe/20 bg-safe/5 px-4 py-3 text-sm text-safe">{success}</div>}

    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="glass rounded-card p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Users size={18}/></span><div><p className="eyebrow">Step 1 · Select rider</p><h2 className="font-display text-xl font-semibold text-ink">Choose an employee</h2></div></div>
        <label className="text-xs font-medium text-muted">Employee<select className="input mt-1" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">Select employee</option>{employees.map((employee) => <option key={employee.rider_id} value={employee.rider_id}>{employee.name} · {employee.company_name}</option>)}</select></label>
        {!selectedId && <div className="mt-4 rounded-2xl border border-dashed border-primary/20 bg-white/30 p-5 text-center text-sm text-muted">Select an employee to load their delivery history and generate a zone dataset.</div>}
        {employeeRides && <div className="mt-4 rounded-2xl border border-white/80 bg-white/55 p-4"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-ink">{employeeRides.rider_name}</p><span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{employeeRides.rides.length} rides</span></div><p className="mt-1 text-xs text-muted">Zone: {selectedEmployee?.zone_name || selectedEmployee?.zone?.name || "Employee zone"}</p><div className="mt-3 flex items-center gap-2 text-xs text-muted"><Clock3 size={14}/>Demo rides are capped at 20 minutes</div><div className="mt-4 grid gap-2 sm:grid-cols-2"><button disabled={busy || !employeeRides.rides.length} onClick={generateDataset} className="btn-primary inline-flex items-center justify-center gap-2"><Database size={15}/>{busy ? "Generating and training…" : "Generate dataset + train model"}</button><button disabled={busy || !selectedZoneRecords.length} onClick={analyzeRides} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-50"><Play size={15}/>{busy ? "Analyzing…" : "Analyze employee rides"}</button></div><p className="mt-3 text-[11px] leading-relaxed text-muted"><strong>Generate + train</strong> refreshes the zone’s fixed 600-row labeled dataset (no duplicates), adds ride-aligned records, and retrains the model. <strong>Analyze rides</strong> applies the saved dataset/model to this employee’s rides and stores the results; it does not generate samples or retrain.</p></div>}
        {employeeRides && <div className="mt-4 max-h-56 space-y-2 overflow-auto">{employeeRides.rides.map((ride) => <div key={ride.ride_id} className="rounded-xl border border-white/70 bg-white/45 px-3 py-2.5"><p className="truncate text-xs font-medium text-ink">{ride.pickup_location} <span className="text-primary">→</span> {ride.drop_location}</p><p className="mt-1 text-[10px] text-muted">{fmtDate(ride.start_time)} · {ride.duration_minutes} min</p></div>)}</div>}
      </section>

      <section className="glass rounded-card p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Activity size={18}/></span><div><p className="eyebrow">Step 2 · Training-ready data</p><h2 className="font-display text-xl font-semibold text-ink">Dataset fields and model status</h2></div></div>
        <div className="grid gap-3 sm:grid-cols-2"><Feature label="Inputs" value="Hour, weekday, zone risk, route distance, traffic volume, speed"/><Feature label="Target label" value="Traffic level: low, moderate, high"/><Feature label="Dataset version" value="gigshield-traffic-v1"/><Feature label="Model status" value={model?.trained ? `Trained · ${model.model_name}` : "Not trained yet"}/></div>
        <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/[0.04] p-4"><p className="text-sm font-semibold text-ink">Prototype model training</p><p className="mt-1 text-xs leading-relaxed text-muted">Train a Random Forest classifier from the saved labeled records. The API holds out a stratified test split and saves the fitted pipeline locally. Its scores show whether it learned our fabricated labels; they do not indicate real Chennai traffic accuracy.</p></div>
        <div className="mt-4 flex flex-wrap gap-2"><button disabled={training || !selectedZoneRecords.length} onClick={trainModel} className="btn-primary inline-flex items-center gap-2"><Activity size={15}/>{training ? "Training classifier…" : "Train on selected zone"}</button><button disabled={downloading || !selectedZoneRecords.length} onClick={exportDataset} className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-50"><Download size={15}/>{downloading ? "Preparing CSV…" : "Export zone dataset CSV"}</button></div>
        {model?.trained && <div className="mt-4 rounded-2xl border border-white/80 bg-white/55 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-ink">Latest training report</p><span className="rounded-pill bg-safe/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-safe">{model.sample_count} samples · {model.test_count} held out</span></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><Metric label="Accuracy" value={`${Math.round(model.metrics.accuracy * 100)}%`}/><Metric label="Balanced accuracy" value={`${Math.round(model.metrics.balanced_accuracy * 100)}%`}/><Metric label="Train rows" value={model.train_count}/><Metric label="Test rows" value={model.test_count}/></div><div className="mt-3 flex flex-wrap gap-2">{Object.entries(model.class_counts || {}).map(([label, count]) => <span key={label} className="rounded-pill border border-white/80 bg-white/75 px-3 py-1 text-xs capitalize text-ink">{label}: {count}</span>)}</div><p className="mt-3 text-[11px] leading-relaxed text-attention-dark">{model.warning} Very high accuracy is expected when a model learns deterministic fabricated labels. Regenerating with the same seed refreshes the same rows, so it should not keep increasing the sample count.</p></div>}
      </section>
    </div>

    <section className="glass rounded-card p-5 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Saved traffic data</p><h2 className="mt-1 font-display text-xl font-semibold text-ink">Synthetic traffic records</h2><p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">Each card is one generated route/time record. The zone dataset has {selectedZoneRecords.filter((row) => row.raw_payload?.record_type === "training_sample").length} labeled training samples and {selectedZoneRecords.filter((row) => row.raw_payload?.record_type === "ride_aligned").length} ride-aligned records. Training rows have low/moderate/high labels; ride-aligned rows let the analysis match real saved demo rides and are excluded from training.</p></div><div className="flex items-center gap-2"><span className="rounded-pill border border-white/80 bg-white/55 px-3 py-1.5 text-xs text-muted">{selectedZoneRecords.length} zone records</span>{selectedZoneRecords.length > 0 && <span className="rounded-pill bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">{selectedZoneRecords.filter((row) => row.source === "synthetic_dataset").length} synthetic</span>}</div></div>
      {!selectedZoneRecords.length ? <p className="rounded-2xl border border-dashed border-primary/20 bg-white/30 p-5 text-sm text-muted">Choose an employee and generate a dataset to create the first labeled records.</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{selectedZoneRecords.slice(0, 9).map((snapshot) => { const label = snapshot.raw_payload?.traffic_label || (snapshot.congestion_score >= 0.55 ? "high" : snapshot.congestion_score >= 0.3 ? "moderate" : "low"); return <article key={snapshot.snapshot_id} className="rounded-2xl border border-white/80 bg-white/55 p-4"><div className="flex items-center justify-between gap-2"><span className="rounded-pill bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{snapshot.source.replaceAll("_", " ")}</span><span className={`rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase ${label === "high" ? "bg-danger/10 text-danger" : label === "moderate" ? "bg-attention/15 text-attention-dark" : "bg-safe/10 text-safe"}`}>{label} traffic</span></div><p className="mt-3 truncate text-sm font-semibold text-ink">{snapshot.origin_region} → {snapshot.destination_region}</p><p className="mt-1 text-xs text-muted">{fmtDate(snapshot.period_start)} – {fmtDate(snapshot.period_end)}</p><div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted"><span className="inline-flex items-center gap-1"><Activity size={12}/>{snapshot.trip_count} vehicles (synthetic)</span>{snapshot.average_speed_kmh != null && <span className="inline-flex items-center gap-1"><Gauge size={12}/>{snapshot.average_speed_kmh} km/h</span>}<span className="inline-flex items-center gap-1"><MapPin size={12}/>{snapshot.congestion_score != null ? `${Math.round(snapshot.congestion_score * 100)}% congestion` : "—"}</span></div></article>; })}</div>}
      {selectedZoneRecords.length > 9 && <p className="mt-3 text-xs text-muted">Showing 9 newest records. Export the CSV to access the full dataset.</p>}
    </section>

      {run && <section className="glass rounded-card p-5 sm:p-6"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Analysis result · {run.rider_name}</p><h2 className="mt-1 font-display text-xl font-semibold text-ink">Ride matching</h2><p className="mt-1 text-xs text-muted">This applies the saved dataset/model to the employee’s rides. It does not generate records or retrain the classifier.</p></div><div className="flex gap-2"><span className="rounded-pill bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">{run.rides_analyzed} rides</span><span className="rounded-pill bg-safe/10 px-3 py-1.5 text-xs font-semibold text-safe">{matchedCount} matched</span></div></div><div className="space-y-2">{run.assessments.map((item) => <article key={item.assessment_id} className="rounded-2xl border border-white/80 bg-white/55 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{item.pickup_location} <span className="text-primary">→</span> {item.drop_location}</p><p className="mt-1 text-xs text-muted">{fmtDate(item.start_time)} – {fmtDate(item.end_time)}</p></div><span className={`rounded-pill px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${item.status === "matched" ? "bg-safe/10 text-safe" : "bg-amber-100 text-amber-800"}`}>{item.status === "matched" ? `${item.traffic_level || "context"} synthetic traffic` : "No matching data"}</span></div><p className="mt-3 text-xs leading-relaxed text-muted">{item.summary?.note}{item.summary?.features?.traffic_label ? ` Dataset label: ${item.summary.features.traffic_label}; ${item.summary.features.traffic_volume} synthetic vehicles.` : ""}</p>{item.summary?.model_prediction && <p className="mt-2 text-xs font-medium text-primary">Model prediction: {item.summary.model_prediction.label} · probabilities {Object.entries(item.summary.model_prediction.probabilities).map(([label, value]) => `${label} ${Math.round(value * 100)}%`).join(" · ")}</p>}</article>)}</div><p className="mt-4 text-[11px] leading-relaxed text-muted">These are fabricated regional examples only. They do not represent observed road conditions, an individual GPS path, or claim evidence.</p></section>}
  </div>;
}

function Feature({ label, value }) { return <article className="rounded-2xl border border-white/80 bg-white/55 p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p><p className="mt-1 text-sm font-medium leading-relaxed text-ink">{value}</p></article>; }
function Metric({ label, value }) { return <div className="rounded-xl bg-white/70 p-3"><p className="text-[10px] uppercase tracking-wide text-muted">{label}</p><p className="mt-1 font-mono text-lg font-semibold text-ink">{value}</p></div>; }
