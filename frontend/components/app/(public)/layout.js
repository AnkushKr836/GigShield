import Link from "next/link";
import { Shield } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center">
      <header className="w-full max-w-3xl px-5 sm:px-6 pt-6 sm:pt-8 pb-2 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glass soft-glow">
            <Shield size={17} color="white" strokeWidth={2.4} />
          </div>
          <span className="font-display font-extrabold text-ink text-lg">GigShield</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="w-full max-w-3xl px-5 sm:px-6 pb-16">{children}</main>
    </div>
  );
}
