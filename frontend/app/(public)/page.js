import Link from "next/link";
import { CloudRain, ShieldCheck, Zap } from "lucide-react";
import Gauge from "@/components/Gauge";

export default function Home() {
  return (
    <div className="pt-6">
      <p className="font-mono text-xs tracking-widest text-muted uppercase mb-3">
        Prototype — Software Development coursework
      </p>
      <h1 className="font-display font-extrabold text-4xl leading-[1.08] text-ink mb-4">
        When the weather stops you working,{" "}
        <span className="text-primary">your pay doesn&apos;t stop.</span>
      </h1>
      <p className="text-muted mb-8 leading-relaxed">
        GigShield is provided by your delivery company at no cost to you. When
        floods, heat, or curfews cut your delivery hours, raise a complaint on
        the affected ride — verified against real disruption data, no paperwork.
      </p>

      <div className="glass rounded-card p-6 mb-8">
        <Gauge percent={100} value="₹0" label="EARNINGS PROTECTED SO FAR" status="neutral" />
      </div>

      <div className="flex flex-col gap-3 mb-10">
        <Link href="/register" className="btn-primary text-center">
          Register with your company
        </Link>
        <Link href="/login" className="btn-ghost text-center">
          I already have an account
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="glass rounded-2xl p-4">
          <CloudRain size={20} className="mx-auto mb-2 text-primary" />
          <p className="text-xs text-muted leading-snug">Weather &amp; civic disruption cover</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <ShieldCheck size={20} className="mx-auto mb-2 text-safe" />
          <p className="text-xs text-muted leading-snug">Free — your company pays</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <Zap size={20} className="mx-auto mb-2 text-attention" />
          <p className="text-xs text-muted leading-snug">Verified, automated decisions</p>
        </div>
      </div>
    </div>
  );
}
