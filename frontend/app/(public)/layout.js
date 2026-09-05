import Link from "next/link";
import { Shield } from "lucide-react";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center">
      <header className="w-full max-w-md px-6 pt-8 pb-2 sm:max-w-lg">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-glass">
            <Shield size={16} color="white" strokeWidth={2.4} />
          </div>
          <span className="font-display font-extrabold text-ink text-lg">GigShield</span>
        </Link>
      </header>
      <main className="w-full max-w-md px-6 pb-16 sm:max-w-lg">{children}</main>
    </div>
  );
}
