"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Bike, ShieldCheck, User, LogOut, Shield,
  Users, Building2, MapPin, Layers, ClipboardCheck, BarChart3, ChevronLeft, ChevronRight,
} from "lucide-react";
import { clearToken, clearAdminToken, getToken, isAdminTokenValid } from "@/lib/auth";

const RIDER_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rides", label: "Rides", icon: Bike },
  { href: "/claims", label: "Claims", icon: ShieldCheck },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/zones", label: "Regions", icon: MapPin },
  { href: "/admin/coverage-plans", label: "Coverage plans", icon: Layers },
  { href: "/admin/claims", label: "Claims review", icon: ClipboardCheck },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarReady, setSidebarReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const navItems = isAdmin ? ADMIN_NAV : RIDER_NAV;

  useEffect(() => {
    setIsAdmin(isAdminTokenValid() && !getToken());
  }, [pathname]);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("gigshield-sidebar-collapsed") === "true");
    setSidebarReady(true);
  }, []);

  useEffect(() => {
    if (!sidebarReady) return;
    document.documentElement.dataset.sidebarCollapsed = collapsed ? "true" : "false";
    window.localStorage.setItem("gigshield-sidebar-collapsed", String(collapsed));
  }, [collapsed, sidebarReady]);

  function handleLogout() {
    if (isAdmin) {
      clearAdminToken();
      router.push("/login");
    } else {
      clearToken();
      router.push("/");
    }
  }

  function isActive(href) {
    return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
  }

  return (
    <>
      <aside className={`fixed inset-y-4 left-4 z-40 hidden gap-3 transition-[width] duration-300 md:flex ${collapsed ? "w-[66px]" : "w-[292px]"}`}>
        <div className="flex w-[66px] shrink-0 flex-col items-center rounded-[24px] bg-[#142943] py-3 text-white shadow-[0_18px_44px_rgba(16,31,51,0.26)]">
          <Link href={isAdmin ? "/admin" : "/dashboard"} aria-label="GigShield home" className="mb-5 flex h-11 w-11 items-center justify-center rounded-[17px] bg-gradient-to-br from-[#345675] to-[#101d31] text-white shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2),0_5px_12px_rgba(0,0,0,0.24)]">
            <Shield size={20} strokeWidth={1.9} />
          </Link>
          <nav aria-label="Quick navigation" className="flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] transition-all ${active ? "bg-white/[0.17] text-white shadow-[inset_1px_1px_2px_rgba(255,255,255,0.18),0_4px_10px_rgba(0,0,0,0.18)]" : "text-white/65 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </Link>
              );
            })}
          </nav>
          {!isAdmin && (
            <Link href="/account" title="Account" aria-label="Account" className={`mb-2 flex h-10 w-10 items-center justify-center rounded-[14px] transition-colors ${pathname === "/account" ? "bg-white/[0.17] text-white" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
              <User size={18} strokeWidth={1.8} />
            </Link>
          )}
          <button
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? "Expand side navigation" : "Minimize side navigation"}
            aria-label={collapsed ? "Expand side navigation" : "Minimize side navigation"}
            aria-expanded={!collapsed}
            className="mb-2 flex h-10 w-10 items-center justify-center rounded-[14px] text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            {collapsed ? <ChevronRight size={18} strokeWidth={1.8} /> : <ChevronLeft size={18} strokeWidth={1.8} />}
          </button>
          <button onClick={handleLogout} title="Log out" aria-label="Log out" className="flex h-10 w-10 items-center justify-center rounded-[14px] text-white/65 transition-colors hover:bg-white/10 hover:text-white">
            <LogOut size={18} strokeWidth={1.8} />
          </button>
        </div>

        {!collapsed && <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-white/75 bg-[#f0f3f6]/90 px-3 py-4 shadow-[0_18px_44px_rgba(31,43,58,0.12),inset_1px_1px_2px_rgba(255,255,255,0.94)] backdrop-blur-2xl">
          <div className="flex items-center gap-3 border-b border-black/[0.07] px-2 pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/90 bg-gradient-to-br from-white to-[#d9e4ee] text-[#294662] shadow-[0_4px_12px_rgba(35,55,78,0.13)]">
              {isAdmin ? <ShieldCheck size={19} /> : <User size={19} />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{isAdmin ? "Operations team" : "Rider workspace"}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">GigShield · {isAdmin ? "Admin" : "Protected"}</p>
            </div>
          </div>

          <div className="px-2 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted/80">{isAdmin ? "Operations" : "Workspace"}</div>
          <nav aria-label={isAdmin ? "Admin navigation" : "Rider navigation"} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-[13px] transition-all ${active ? "border border-white/90 bg-gradient-to-b from-white/95 to-[#e4edf5] font-semibold text-ink shadow-[0_4px_12px_rgba(37,58,80,0.1),inset_0_1px_0_white]" : "border border-transparent text-[#44566a] hover:border-white/70 hover:bg-white/65 hover:text-[#172a43]"}`}
                >
                  <Icon size={16} strokeWidth={1.8} className={active ? "text-[#294662]" : "text-muted group-hover:text-[#294662]"} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </Link>
              );
            })}
            {!isAdmin && (
              <Link href="/account" className={`group flex min-h-11 items-center gap-3 rounded-[14px] border px-3 text-[13px] transition-all ${pathname === "/account" ? "border border-white/90 bg-gradient-to-b from-white/95 to-[#e4edf5] font-semibold text-ink shadow-[0_4px_12px_rgba(37,58,80,0.1),inset_0_1px_0_white]" : "border-transparent text-[#44566a] hover:border-white/70 hover:bg-white/65 hover:text-[#172a43]"}`}>
                <User size={16} strokeWidth={1.8} className="text-muted group-hover:text-ink" />
                <span className="flex-1">Account</span>
              </Link>
            )}
          </nav>

          <div className="mt-4 flex items-center justify-between border-t border-black/[0.07] px-2 pt-3 text-[10px] text-muted">
            <span>Company-sponsored cover</span>
            <ShieldCheck size={14} />
          </div>
        </div>}
      </aside>

      <nav aria-label="Mobile navigation" className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-1 overflow-x-auto rounded-[22px] border border-white/75 bg-[#f0f1f2]/90 p-2 shadow-[0_12px_34px_rgba(31,34,38,0.18)] backdrop-blur-2xl md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined} className={`flex min-w-[50px] flex-1 flex-col items-center gap-1 rounded-[15px] px-2 py-2 text-[9px] font-medium transition-colors ${active ? "bg-gradient-to-b from-white to-[#e4e6e8] text-ink shadow-[0_3px_8px_rgba(37,40,45,0.1)]" : "text-muted hover:bg-white/60"}`}>
              <Icon size={17} strokeWidth={1.8} /><span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
        {!isAdmin && <Link href="/account" aria-label="Account" className={`flex min-w-[50px] flex-1 flex-col items-center gap-1 rounded-[15px] px-2 py-2 text-[9px] font-medium ${pathname === "/account" ? "bg-gradient-to-b from-white to-[#e4e6e8] text-ink shadow-[0_3px_8px_rgba(37,40,45,0.1)]" : "text-muted hover:bg-white/60"}`}><User size={17} strokeWidth={1.8} /><span>Account</span></Link>}
        <button onClick={handleLogout} aria-label="Log out" className="flex min-w-[50px] flex-1 flex-col items-center gap-1 rounded-[15px] px-2 py-2 text-[9px] font-medium text-muted transition-colors hover:bg-white/60 hover:text-ink"><LogOut size={17} strokeWidth={1.8} /><span>Log out</span></button>
      </nav>
    </>
  );
}
