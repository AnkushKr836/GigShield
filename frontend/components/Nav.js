import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between sm:max-w-lg">
        <Link href="/" className="font-display font-extrabold text-lg tracking-tight text-storm">
          GigShield
        </Link>
        <nav className="flex gap-4 font-body text-sm text-storm-light">
          <Link href="/login" className="hover:text-signal transition-colors">
            Log in
          </Link>
          <Link
            href="/register"
            className="px-3 py-1.5 rounded-card bg-signal text-white font-medium hover:bg-signal-dark transition-colors"
          >
            Get covered
          </Link>
        </nav>
      </div>
    </header>
  );
}
