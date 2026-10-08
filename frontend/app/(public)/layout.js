"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen flex flex-col items-center">
      <header className="mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between rounded-[22px] border border-white/80 bg-white/50 px-5 py-3 shadow-[0_8px_26px_rgba(37,40,45,0.06)] backdrop-blur-xl sm:mt-6 sm:px-7">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-glass">
            <Shield size={16} color="white" strokeWidth={2.4} />
          </div>
          <span className="font-display font-extrabold text-ink text-lg">GigShield</span>
        </Link>
        {!isHome && (
          <Link href="/" className="flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors">
            <ArrowLeft size={15} /> Back
          </Link>
        )}
      </header>
      <main className="w-full px-5 pb-16 sm:px-8">{children}</main>
    </div>
  );
}
