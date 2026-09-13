"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const PERSONAS = [
  { value: "food_delivery", label: "Food delivery" },
  { value: "ecommerce", label: "E-commerce delivery" },
  { value: "grocery_qcommerce", label: "Grocery / quick-commerce" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [zones, setZones] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    persona_type: "food_delivery", company_id: "", zone_id: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.listZones(), api.listCompanies()])
      .then(([zoneData, companyData]) => {
        setZones(zoneData);
        setCompanies(companyData);
        setForm((f) => ({ ...f, zone_id: zoneData[0]?.zone_id || "", company_id: companyData[0]?.company_id || "" }));
      })
      .catch(() => setError("Couldn't load registration options. Is the backend running?"))
      .finally(() => setLoadingOptions(false));
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.registerRider(form);
      router.push("/login?registered=1");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const noOptionsAvailable = !loadingOptions && (zones.length === 0 || companies.length === 0) && !error;

  return (
    <div className="pt-4">
      <h1 className="font-display font-bold text-2xl text-ink mb-1">Get covered</h1>
      <p className="text-muted text-sm mb-6">Takes about a minute. No documents needed.</p>

      <div className="glass rounded-card p-6">
        {loadingOptions && <p className="text-sm text-muted mb-4">Loading…</p>}
        {noOptionsAvailable && (
          <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">
            No zones or companies exist yet — seed them via the admin panel or backend first.
          </p>
        )}
        {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name">
            <input required value={form.name} onChange={update("name")} className="input" placeholder="Your name" />
          </Field>
          <Field label="Email">
            <input required type="email" value={form.email} onChange={update("email")} className="input" placeholder="you@example.com" />
          </Field>
          <Field label="Phone number">
            <input required value={form.phone} onChange={update("phone")} className="input" placeholder="10-digit mobile number" />
          </Field>
          <Field label="Password">
            <input required minLength={8} type="password" value={form.password} onChange={update("password")} className="input" placeholder="At least 8 characters" />
          </Field>
          <Field label="What do you deliver?">
            <select value={form.persona_type} onChange={update("persona_type")} className="input">
              {PERSONAS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Which company do you work for?">
            <select required value={form.company_id} onChange={update("company_id")} className="input" disabled={companies.length === 0}>
              {companies.map((c) => <option key={c.company_id} value={c.company_id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Your zone">
            <select required value={form.zone_id} onChange={update("zone_id")} className="input" disabled={zones.length === 0}>
              {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.name}</option>)}
            </select>
          </Field>

          <button type="submit" disabled={submitting || zones.length === 0 || companies.length === 0} className="btn-primary w-full">
            {submitting ? "Creating your account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}
