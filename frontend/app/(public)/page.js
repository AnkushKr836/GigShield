import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, CloudRain, MapPinned, ShieldCheck, Zap } from "lucide-react";
import Gauge from "@/components/Gauge";
import { api } from "@/lib/api";

export default async function Home() {
  let credibilityScore = 0;
  try {
    const summary = await api.getPublicSummary();
    credibilityScore = summary.platform_credibility_score;
  } catch {
    credibilityScore = 0;
  }

  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6 sm:pt-12">
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-pill border border-white/80 bg-white/55 px-3 py-1.5 text-xs font-medium text-primary shadow-sm backdrop-blur-lg">
            <span className="h-2 w-2 rounded-full bg-safe shadow-[0_0_0_4px_rgba(20,184,166,0.12)]" /> Company-sponsored rider protection
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.04] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            When disruption stops the ride, <span className="bg-gradient-to-r from-primary to-[#91abc1] bg-clip-text text-transparent">your income has a safety net.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
            GigShield helps delivery riders recover lost income when severe weather or civic disruption affects a delivery. Your company provides the cover; you never pay a rider premium.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="btn-primary inline-flex items-center justify-center gap-2">Register with your company <ArrowRight size={17} /></Link>
            <Link href="/login" className="btn-ghost inline-flex items-center justify-center">Sign in to GigShield</Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-1.5"><BadgeCheck size={15} className="text-safe" /> Company-sponsored coverage</span>
            <span className="inline-flex items-center gap-1.5"><Zap size={15} className="text-primary" /> Clear claim decisions</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-white/55 via-primary/10 to-white/30 blur-2xl" />
          <div className="relative space-y-4">
            <div className="glass-strong rounded-[2rem] p-6 sm:p-8">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div><p className="eyebrow">Platform trust</p><h2 className="mt-1 font-display text-xl font-bold text-ink">Built around fair review</h2></div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck size={22} /></div>
              </div>
              <Gauge percent={(credibilityScore / 1000) * 100} value={credibilityScore} label="PLATFORM CREDIBILITY SCORE" status={credibilityScore >= 700 ? "safe" : credibilityScore >= 400 ? "attention" : "neutral"} />
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/55 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-safe/10 text-safe"><Building2 size={18} /></div>
                <div><p className="text-sm font-semibold text-ink">Your company funds the cover</p><p className="mt-0.5 text-xs text-muted">No signup fee or weekly rider premium.</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-2xl p-4"><CloudRain size={18} className="mb-3 text-primary" /><p className="text-sm font-semibold text-ink">Disruption aware</p><p className="mt-1 text-xs leading-relaxed text-muted">Weather and civic-event checks support claim review.</p></div>
              <div className="glass rounded-2xl p-4"><MapPinned size={18} className="mb-3 text-safe" /><p className="text-sm font-semibold text-ink">Ride by ride</p><p className="mt-1 text-xs leading-relaxed text-muted">Report an affected delivery and follow its decision.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14 sm:mt-20">
        <div className="mb-6 max-w-xl"><p className="eyebrow">A straightforward process</p><h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Protection that follows your work</h2><p className="mt-2 text-sm leading-relaxed text-muted">A clear path from company enrollment to claim review, with your delivery company managing the cover.</p></div>
        <div className="grid gap-3 md:grid-cols-3">
          <Step number="01" icon={Building2} title="Your company enrolls you" description="Choose your delivery company when you register. The company owns the coverage plan and its daily limit." />
          <Step number="02" icon={CloudRain} title="Report an affected ride" description="Open a completed delivery and tell us how weather or a civic disruption interrupted it." />
          <Step number="03" icon={ShieldCheck} title="Follow the decision" description="Evidence is checked, payout limits are applied, and unmatched cases can be reviewed by an admin." />
        </div>
      </section>
      <p className="mt-8 text-center text-[11px] text-muted/80">Prototype for software development coursework. Demo rides and payouts may be simulated.</p>
    </div>
  );
}

function Step({ number, icon: Icon, title, description }) {
  return <div className="glass glass-hover rounded-card p-5 sm:p-6"><div className="flex items-center justify-between"><span className="font-mono text-xs font-semibold tracking-widest text-primary">{number}</span><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/75 text-primary shadow-sm"><Icon size={19} /></span></div><h3 className="mt-4 font-display text-base font-bold text-ink">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{description}</p></div>;
}
