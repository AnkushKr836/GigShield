"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Bike, ShieldCheck, Settings, User, LogOut,
  ChevronRight, ChevronLeft, Shield, BarChart3,
} from "lucide-react";
import { clearToken } from "@/lib/auth";

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

  function handleLogout() {
    clearToken();
    router.push("/");
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-20 flex flex-col glass border-r border-white/60
        transition-all duration-300 ease-out ${expanded ? "w-56" : "w-[76px]"}`}
    >
      {/* Logo + extend toggle */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glass">
            <Shield size={18} color="white" strokeWidth={2.4} />
          </div>
          {expanded && (
            <span className="font-display font-extrabold text-ink text-base whitespace-nowrap">GigShield</span>
          )}
        </div>
      </div>

      <button
        onClick={() => setExpanded((e) => !e)}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-glass hover:bg-primary-dark transition-colors"
      >
        {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-3 mt-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!expanded ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all
                ${active ? "bg-primary text-white shadow-glass" : "text-ink hover:bg-white/50"}
                ${expanded ? "" : "justify-center"}`}
            >
              <Icon size={19} strokeWidth={2} className="shrink-0" />
              {expanded && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Account + Logout */}
      <div className="px-3 pb-5 flex flex-col gap-1">
        <Link
          href="/account"
          title={!expanded ? "Account" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all
            ${pathname === "/account" ? "bg-primary text-white shadow-glass" : "text-ink hover:bg-white/50"}
            ${expanded ? "" : "justify-center"}`}
        >
          <User size={19} strokeWidth={2} className="shrink-0" />
          {expanded && <span className="text-sm font-medium whitespace-nowrap">Account</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={!expanded ? "Log out" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-danger hover:bg-danger/10 transition-all
            ${expanded ? "" : "justify-center"}`}
        >
          <LogOut size={19} strokeWidth={2} className="shrink-0" />
          {expanded && <span className="text-sm font-medium whitespace-nowrap">Log out</span>}
        </button>
      </div>
    </aside>
  );
}
