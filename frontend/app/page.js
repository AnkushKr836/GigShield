import Link from "next/link";
import Gauge from "@/components/Gauge";

export default function Home() {
  return (
    <div className="pt-4">
      <p className="font-mono text-xs tracking-widest text-storm-light uppercase mb-3">
        Prototype — Software Development coursework
      </p>
      <h1 className="font-display font-extrabold text-4xl leading-[1.05] text-ink mb-4">
        When the weather stops you working,{" "}
        <span className="text-signal">your pay doesn&apos;t stop.</span>
      </h1>
      <p className="text-storm-light mb-8 leading-relaxed">
        GigShield is provided by your delivery company at no cost to you. When
        floods, heat, or curfews cut your delivery hours, raise a token on the
        affected ride — verified against real disruption data, no paperwork.
      </p>

      <div className="bg-surface border border-line rounded-card p-6 mb-8">
        <Gauge percent={100} value="₹0" label="EARNINGS PROTECTED SO FAR" status="neutral" />
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/register"
          className="text-center px-4 py-3 rounded-card bg-signal text-white font-medium hover:bg-signal-dark transition-colors"
        >
          Register with your company
        </Link>
        <Link
          href="/login"
          className="text-center px-4 py-3 rounded-card border border-line text-storm font-medium hover:border-storm transition-colors"
        >
          I already have an account
        </Link>
      </div>

      <ul className="mt-10 space-y-3 text-sm text-storm-light">
        <li className="flex gap-2">
          <span className="text-safe">●</span> Covers lost hours from weather, floods, curfews
        </li>
        <li className="flex gap-2">
          <span className="text-danger">●</span> Never covers health, accidents, or vehicle repair
        </li>
        <li className="flex gap-2">
          <span className="text-signal">●</span> Free to riders — your company covers the cost
        </li>
      </ul>
    </div>
  );
}
