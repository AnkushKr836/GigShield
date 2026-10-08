"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Layers, ClipboardCheck, BarChart3, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { getAdminToken } from "@/lib/auth";

const SECTIONS = [
  { href: "/admin/employees", label: "Employees", desc: "Browse riders and their credibility scores", icon: Users },
  { href: "/admin/companies", label: "Companies", desc: "Add delivery companies that purchase coverage", icon: Building2 },
  { href: "/admin/zones", label: "Zones", desc: "Add geographic zones for disruption tracking", icon: MapPin },
  { href: "/admin/coverage-plans", label: "Coverage Plans", desc: "Set payout tiers per company", icon: Layers },
  { href: "/admin/claims", label: "Claims Review", desc: "Decide claims routed to manual review", icon: ClipboardCheck },
  { href: "/admin/analytics", label: "Analytics", desc: "Claim trends and payout totals", icon: BarChart3 },
];

export default function AdminHubPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getAdminToken()) router.push("/login");
  }, [router]);

  return (
    <div className="space-y-6">
      <section className="glass-strong relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-glass"><ShieldCheck size={22}/></span><div><p className="eyebrow">Operations console</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Admin workspace</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Manage company-funded coverage, participating rider zones, and the claims that need a human decision.</p></div></div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="glass glass-hover group flex min-h-36 items-center justify-between rounded-card p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-primary/10 text-primary shadow-sm transition-transform group-hover:scale-105">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-display font-semibold text-ink">{s.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{s.desc}</p>
                </div>
              </div>
              <ArrowRight size={16} className="ml-2 shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
