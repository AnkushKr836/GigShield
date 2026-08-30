import Link from "next/link";
import Gauge from "@/components/Gauge";

export default function Home() {
  return (
    <div className="pt-4">
      <p className="font-mono text-xs tracking-widest text-storm-light uppercase mb-3">
        Weekly income protection
      </p>
      <h1 className="font-display font-extrabold text-4xl leading-[1.05] text-ink mb-4">
        When the weather stops you working,{" "}
        <span className="text-signal">your pay doesn&apos;t stop.</span>
      </h1>
      <p className="text-storm-light mb-8 leading-relaxed">
        GigShield pays out automatically when floods, heat, or curfews cut your
        delivery hours — no paperwork, no adjuster, verified against real weather
        and traffic data.
      </p>

      <div className="bg-surface border border-line rounded-card p-6 mb-8">
        <Gauge percent={72} value="₹92" label="THIS WEEK'S PREMIUM" status="signal" />
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/register"
          className="text-center px-4 py-3 rounded-card bg-signal text-white font-medium hover:bg-signal-dark transition-colors"
        >
          Get covered this week
        </Link>
        <Link
          href="/login"
          className="text-center px-4 py-3 rounded-card border border-line text-storm font-medium hover:border-storm transition-colors"
        >
          I already have a policy
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
          <span className="text-signal">●</span> Priced weekly, matched to your earnings cycle
        </li>
      </ul>
    </div>
  );
}
