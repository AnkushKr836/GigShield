"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Check, X } from "lucide-react";
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

  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to admin
      </Link>
      <h1 className="font-display font-bold text-2xl text-ink mb-6">Companies</h1>

      <form onSubmit={handleSubmit} className="glass rounded-card p-5 flex gap-2 mb-6">
        <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Company name, e.g. Zomato" />
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
            <li key={c.company_id} className="glass rounded-2xl px-4 py-3">
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
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink font-medium">{c.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-white/60 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmDeleteId(c.company_id)} className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-white/60 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
