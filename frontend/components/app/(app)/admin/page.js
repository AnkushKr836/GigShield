import Link from "next/link";
import { Building2, MapPin, Layers, ClipboardCheck, BarChart3, ArrowRight } from "lucide-react";

const SECTIONS = [
  { href: "/admin/companies", label: "Companies", desc: "Add delivery companies that purchase coverage", icon: Building2 },
  { href: "/admin/zones", label: "Zones", desc: "Add geographic zones for disruption tracking", icon: MapPin },
  { href: "/admin/coverage-plans", label: "Coverage Plans", desc: "Set payout tiers per company", icon: Layers },
  { href: "/admin/claims", label: "Claims Review", desc: "Decide claims routed to manual review", icon: ClipboardCheck },
  { href: "/admin/analytics", label: "Analytics", desc: "Claim trends and payout totals", icon: BarChart3 },
];

export default function AdminHubPage() {
  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-ink mb-1">Admin</h1>
      <p className="text-muted text-sm mb-6">
        No login required in this prototype — this panel is used for seeding demo data and reviewing claims.
      </p>

      <div className="space-y-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center justify-between glass rounded-card p-5 hover:bg-white/70 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
                  <Icon size={19} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{s.label}</p>
                  <p className="text-xs text-muted mt-0.5">{s.desc}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
