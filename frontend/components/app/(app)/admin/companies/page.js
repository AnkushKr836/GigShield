"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.listCompanies().then(setCompanies).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createCompany({ name });
      setName("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to admin
      </Link>
      <h1 className="font-display font-bold text-2xl text-ink mb-6">Companies</h1>

      <form onSubmit={handleSubmit} className="glass rounded-card p-5 flex gap-2 mb-6">
        <input
          required value={name} onChange={(e) => setName(e.target.value)}
          className="input" placeholder="Company name, e.g. Zomato"
        />
        <button type="submit" disabled={submitting} className="btn-primary shrink-0 px-5">
          {submitting ? "Adding…" : "Add"}
        </button>
      </form>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : companies.length === 0 ? (
        <p className="text-sm text-muted">No companies yet — add one above.</p>
      ) : (
        <ul className="space-y-2">
          {companies.map((c) => (
            <li key={c.company_id} className="glass rounded-2xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-ink font-medium">{c.name}</span>
              <span className="text-xs text-muted font-mono">{c.company_id.slice(0, 8)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
