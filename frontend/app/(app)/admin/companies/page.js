"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Pencil, Search, Trash2, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const token = typeof window !== "undefined" ? getAdminToken() : null;

  function load() {
    api.listCompanies().then(setCompanies).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createCompany({ name }, token);
      setName("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(c) {
    setEditingId(c.company_id);
    setEditName(c.name);
  }

  async function saveEdit(id) {
    setError("");
    try {
      await api.updateCompany(id, { name: editName }, token);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await api.deleteCompany(id, token);
      setConfirmDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const visibleCompanies = companies.filter((company) => company.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to admin
      </Link>
      <section className="glass-strong rounded-[2rem] p-5 sm:p-7">
        <p className="eyebrow">Company network</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Companies</h1><p className="mt-1 text-sm text-muted">Manage the delivery companies that purchase rider coverage.</p>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 rounded-2xl border border-white/80 bg-white/45 p-3 sm:flex-row"><input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Company name, e.g. Zomato" /><button type="submit" disabled={submitting} className="btn-primary shrink-0 px-5">{submitting ? "Adding…" : "Add company"}</button></form>
        <div className="mt-4 inline-flex items-center gap-2 rounded-pill border border-white/80 bg-white/55 px-3 py-2 text-xs text-muted"><Building2 size={14} className="text-primary"/><span><strong className="text-ink">{companies.length}</strong> companies configured</span></div>
      </section>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-2xl px-3 py-2 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : companies.length === 0 ? (
        <div className="glass rounded-card p-8 text-center"><Building2 size={22} className="mx-auto mb-2 text-primary"/><p className="font-medium text-ink">No companies yet</p><p className="mt-1 text-sm text-muted">Add a delivery company above to create its coverage plans.</p></div>
      ) : (
        <section className="glass rounded-card p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display font-semibold text-ink">Company directory</h2><p className="mt-1 text-xs text-muted">Each company manages its own coverage plans.</p></div><label className="relative w-full sm:max-w-xs"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/><input className="input pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search companies"/></label></div>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleCompanies.map((c) => (
            <li key={c.company_id} className="list-row p-4">
              {editingId === c.company_id ? (
                <div className="flex items-center gap-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input flex-1" />
                  <button onClick={() => saveEdit(c.company_id)} className="p-2 rounded-xl bg-safe text-white shrink-0"><Check size={15} /></button>
                  <button onClick={() => setEditingId(null)} className="p-2 rounded-xl bg-white/60 text-muted shrink-0"><X size={15} /></button>
                </div>
              ) : confirmDeleteId === c.company_id ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink">Remove {c.name}?</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(c.company_id)} className="px-3 py-1 rounded-xl bg-danger text-white text-xs font-medium">Confirm</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 rounded-xl bg-white/60 text-muted text-xs font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-display font-bold text-primary">{c.name.slice(0,1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{c.name}</p><p className="mt-0.5 text-[10px] text-muted">Company-sponsored cover</p></div></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-white/60 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmDeleteId(c.company_id)} className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-white/60 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {visibleCompanies.length === 0 && <p className="py-8 text-center text-sm text-muted">No companies match “{search}”.</p>}
        </section>
      )}
    </div>
  );
}
