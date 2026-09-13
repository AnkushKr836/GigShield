"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Bike, ShieldCheck, Settings, User, LogOut,
  ChevronRight, ChevronLeft, Shield, BarChart3,
} from "lucide-react";
import { clearToken } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rides", label: "Rides", icon: Bike },
  { href: "/claims", label: "Claims", icon: ShieldCheck },
  { href: "/admin", label: "Admin", icon: Settings },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", expanded ? "224px" : "76px");
  }, [expanded]);

  function handleLogout() {
    clearToken();
    router.push("/");
  }

  function isActive(href) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className={`fixed left-3 top-3 bottom-3 z-30 flex flex-col rounded-[22px] glass border-white/60 transition-all duration-300 ease-out ${expanded ? "w-[208px]" : "w-[64px]"}`}>
      <div className={`flex items-center ${expanded ? "justify-between" : "justify-center"} px-3 py-4`}>
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0" aria-label="GigShield dashboard">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glass soft-glow">
            <Shield size={18} color="white" strokeWidth={2.4} />
          </div>
          {expanded && <span className="font-display font-extrabold text-ink text-base whitespace-nowrap">GigShield</span>}
        </Link>
      </div>

      <button
        onClick={() => setExpanded((e) => !e)}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute -right-2.5 top-12 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-glass hover:bg-primary-dark hover:scale-105 transition-all"
      >
        {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      <nav className="flex-1 flex flex-col gap-1 px-2.5 mt-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!expanded ? item.label : undefined}
              className={`group flex items-center gap-3 px-2.5 py-2.5 rounded-2xl transition-all duration-200 ${
                active ? "bg-primary text-white shadow-glass" : "text-ink hover:bg-white/50 hover:-translate-y-px"
              } ${expanded ? "" : "justify-center"}`}
            >
              <Icon size={19} strokeWidth={2} className="shrink-0" />
              {expanded && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2.5 pb-3 flex flex-col gap-1">
        <div className={`flex items-center ${expanded ? "justify-between" : "justify-center"} px-1.5 py-1.5 mb-1 rounded-2xl bg-white/20`}>
          {expanded && <span className="text-[10px] uppercase tracking-widest text-muted">Appearance</span>}
          <ThemeToggle compact />
        </div>
        <Link
          href="/account"
          title={!expanded ? "Account" : undefined}
          className={`flex items-center gap-3 px-2.5 py-2.5 rounded-2xl transition-all ${pathname === "/account" ? "bg-primary text-white shadow-glass" : "text-ink hover:bg-white/50"} ${expanded ? "" : "justify-center"}`}
        >
          <User size={19} strokeWidth={2} className="shrink-0" />
          {expanded && <span className="text-sm font-medium whitespace-nowrap">Account</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={!expanded ? "Log out" : undefined}
          className={`flex items-center gap-3 px-2.5 py-2.5 rounded-2xl text-danger hover:bg-danger/10 transition-all ${expanded ? "" : "justify-center"}`}
        >
          <LogOut size={19} strokeWidth={2} className="shrink-0" />
          {expanded && <span className="text-sm font-medium whitespace-nowrap">Log out</span>}
        </button>
      </div>
    </aside>
  );
}
