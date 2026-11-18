import Link from "next/link";
import { Logo } from "@/components/logo";
import { Avatar, LocMeter, cn } from "@/components/ui";
import { LOC_BANDS } from "@/lib/loc";
import { PLANS, formatUsd } from "@/lib/pricing";

export const metadata = {
  title: "BIMcred — Hire BIM people who can prove it",
  description:
    "BIMcred gives US BIM professionals a verified, scored profile and gives employers a talent pool they can filter by proven competence instead of keywords.",
};

const CANDIDATE_STEPS = [
  {
    n: "01",
    title: "Create a free account",
    body: "No card, no recruiter access, no fee. Add your discipline, tools and project experience.",
  },
  {
    n: "02",
    title: "Verify a US mobile",
    body: "A one-time code confirms you are reachable. Employers only see the badge until they spend a credit.",
  },
  {
    n: "03",
    title: "Take the 15-minute test",
    body: "Fifteen questions across ISO 19650, LOD, coordination, 4D/5D, IFC and automation.",
  },
  {
    n: "04",
    title: "Publish your LOC",
    body: "Get a 100–500 Level of Competence score with a per-competency breakdown you can share.",
  },
];

const EMPLOYER_STEPS = [
  {
    n: "01",
    title: "Verify your company",
    body: "Domain-matched work email or registration details. Admin review keeps the pool clean.",
  },
  {
    n: "02",
    title: "Filter the scored pool",
    body: "Search by LOC band, competency, discipline, software, location and availability for free.",
  },
  {
    n: "03",
    title: "Unlock only who you want",
    body: "One credit reveals phone and email. Re-opening the same candidate is free, forever.",
  },
  {
    n: "04",
    title: "Run the pipeline",
    body: "Post roles, receive scored applicants and move them from shortlist to offer in one board.",
  },
];

const COMPETENCY_BARS = [
  { label: "ISO 19650 information management", value: 86 },
  { label: "Coordination & clash", value: 92 },
  { label: "LOD and model progression", value: 71 },
  { label: "IFC / openBIM", value: 64 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-ink/[0.07] bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 text-[13px] font-medium text-ink/60 md:flex">
            <a href="#how" className="transition hover:text-ink">
              How it works
            </a>
            <a href="#loc" className="transition hover:text-ink">
              The LOC score
            </a>
            <a href="#employers" className="transition hover:text-ink">
              For employers
            </a>
            <a href="#pricing" className="transition hover:text-ink">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-quiet btn-sm sm:text-[13px]">
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-ink btn-sm">
              Get scored free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-accent/[0.07] via-transparent to-transparent" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-24 lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-ink/60">
              <span className="h-1.5 w-1.5 rounded-full bg-verify" />
              Independent · US BIM talent · 2026
            </div>
            <h1 className="mt-6 max-w-xl text-[42px] font-semibold leading-[1.04] tracking-tight sm:text-[56px]">
              Hire BIM people
              <br />
              who can <span className="text-accent">prove it</span>.
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-ink/60">
              BIMcred scores BIM professionals on a 100–500 Level of Competence scale, verified by a US
              mobile number and a timed assessment. Employers search competence instead of keyword
              inflation.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn btn-primary btn-lg">
                Get scored — it&apos;s free
              </Link>
              <Link href="/signup?as=employer" className="btn btn-ghost btn-lg">
                I&apos;m hiring
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-ink/10 pt-6">
              {[
                ["100–500", "LOC scale"],
                ["15 min", "Timed assessment"],
                ["+1 verified", "US mobile gate"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-mono text-[17px] font-semibold tabular-nums text-ink">{value}</dt>
                  <dd className="mt-0.5 text-[11.5px] text-ink/50">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Candidate card mock */}
          <div className="relative mx-auto w-full max-w-[400px]">
            <div className="absolute -inset-8 rounded-[36px] bg-gradient-to-br from-accent/10 via-transparent to-verify/10 blur-2xl" aria-hidden />
            <div className="relative card overflow-hidden">
              <div className="flex items-center justify-between border-b border-ink/[0.07] px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name="Maya Chen" size={40} />
                  <div>
                    <p className="text-[13px] font-semibold leading-tight">Maya Chen</p>
                    <p className="text-[11px] text-ink/50">BIM Coordinator · MEP · Austin, TX</p>
                  </div>
                </div>
                <span className="badge badge-verify">
                  <span className="h-1 w-1 rounded-full bg-verify" />
                  Verified
                </span>
              </div>

              <div className="px-5 py-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">
                      Level of Competence
                    </p>
                    <p className="mt-1 flex items-baseline gap-2">
                      <span className="font-mono text-[44px] font-semibold leading-none tabular-nums">
                        414
                      </span>
                      <span className="text-xs text-ink/40">/ 500</span>
                    </p>
                  </div>
                  <span className="badge badge-verify">Proficient</span>
                </div>
                <div className="mt-4">
                  <LocMeter score={414} showLabels />
                </div>

                <div className="mt-5 space-y-2.5">
                  {COMPETENCY_BARS.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-ink/60">{item.label}</span>
                        <span className="font-mono tabular-nums text-ink/40">{item.value}%</span>
                      </div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink/[0.07]">
                        <div
                          className={cn("h-full rounded-full", item.value >= 80 ? "bg-verify" : "bg-accent")}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between rounded-xl bg-ink/[0.035] px-3.5 py-2.5">
                  <span className="text-[11px] text-ink/55">Contact details</span>
                  <span className="text-[11px] font-semibold text-ink/70">Unlock · 1 credit</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-3 -top-3 rotate-2 rounded-xl border border-ink/10 bg-white px-3 py-2 shadow-card">
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink/40">Assessment</p>
              <p className="text-[12px] font-semibold">12 / 15 correct</p>
            </div>
          </div>
        </div>
      </section>

      {/* LOC explanation */}
      <section id="loc" className="border-y border-ink/10 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-dark">
                The score
              </p>
              <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight sm:text-[34px]">
                LOC is LOD for people.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink/60">
                A model at LOD 350 tells you what detail you can rely on. A person at LOC 350 tells you
                what work they can own. Every band maps to a concrete employer signal, so a score becomes
                a staffing decision rather than a leaderboard position.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink/60">
                The score is difficulty-weighted, time-boxed and reproducible. It is a signal, not a
                certification — BIMcred never presents it as the sole basis for a hiring decision.
              </p>
              <Link href="#how" className="mt-6 inline-flex text-sm font-semibold text-accent-dark">
                See how scoring works →
              </Link>
            </div>

            <div className="grid gap-2">
              {LOC_BANDS.map((band) => (
                <div
                  key={band.key}
                  className="grid grid-cols-[86px_1fr] items-start gap-4 rounded-xl border border-ink/[0.08] px-4 py-3.5 transition hover:border-ink/20 hover:bg-paper"
                >
                  <div>
                    <p className="font-mono text-[13px] font-semibold tabular-nums text-ink">
                      {band.min}–{band.max}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-ink/45">{band.label}</p>
                  </div>
                  <div>
                    <p className="text-[12.5px] leading-relaxed text-ink/65">{band.description}</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-ink/40">
                      Hire signal: {band.employerSignal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-dark">
              Two sides, one standard
            </p>
            <h2 className="mt-3 text-[30px] font-semibold tracking-tight sm:text-[34px]">
              How BIMcred works
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink/55">
            Candidates invest 20 minutes and keep their data. Employers spend credits only on people
            they actually want to talk to.
          </p>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          {[
            {
              title: "For BIM professionals",
              sub: "Free, forever",
              steps: CANDIDATE_STEPS,
              cta: { href: "/signup", label: "Create a candidate account" },
              tone: "accent" as const,
            },
            {
              title: "For employers",
              sub: "From 10 trial credits",
              steps: EMPLOYER_STEPS,
              cta: { href: "/signup?as=employer", label: "Create an employer account" },
              tone: "ink" as const,
            },
          ].map((column) => (
            <div key={column.title} className="card card-pad">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold">{column.title}</h3>
                <span className={cn("badge", column.tone === "accent" ? "badge-accent" : "badge-neutral")}>
                  {column.sub}
                </span>
              </div>
              <ol className="mt-5 space-y-4">
                {column.steps.map((step) => (
                  <li key={step.n} className="flex gap-3.5">
                    <span className="mt-0.5 font-mono text-[11px] font-semibold tabular-nums text-accent-dark">
                      {step.n}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold leading-snug">{step.title}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink/55">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href={column.cta.href}
                className={cn("mt-6 w-full", column.tone === "accent" ? "btn btn-primary" : "btn btn-ink")}
              >
                {column.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Employer value */}
      <section id="employers" className="border-y border-ink/10 bg-ink text-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                Why employers switch
              </p>
              <h2 className="mt-3 max-w-md text-[30px] font-semibold leading-tight tracking-tight sm:text-[36px]">
                Stop screening resumes for software names.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/55">
                A BIM coordinator who lists Revit is not the same as one who can run a federated model
                review. LOC separates the two before you spend a call.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup?as=employer" className="btn btn-primary">
                  Start with trial credits
                </Link>
                <Link href="/login" className="btn border border-white/20 text-white hover:bg-white/10">
                  Explore the demo
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Verified supply", "Every profile carries a confirmed US mobile number and a scored attempt. No ghost candidates."],
                ["Filter on evidence", "LOC band, competency, discipline, tool, state and availability — free to search, priced to contact."],
                ["One credit, one relationship", "Repeat views are free. You pay for the intro, not for browsing your own shortlist."],
                ["Explainable scoring", "Item-level breakdown behind every score, so a hiring manager can defend the shortlist internally."],
                ["US-specific standards", "Items written against ISO 19650, NBIMS-US, AIA E202/G202 and CSI practice."],
                ["Audit-ready", "Every unlock, credit movement and admin decision is logged with an actor and timestamp."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-[13px] font-semibold text-white">{title}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-white/50">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-dark">
            Pricing
          </p>
          <h2 className="mt-3 text-[30px] font-semibold tracking-tight sm:text-[34px]">
            Candidates pay nothing. Employers pay for introductions.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/55">
            Every plan includes the full scored talent pool. Bigger plans add filters, seats, job posts
            and monthly unlock credits. Prices are list prices in USD.
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white p-5",
                plan.highlight ? "border-accent shadow-lift" : "border-ink/10 shadow-card",
              )}
            >
              {plan.highlight ? (
                <span className="absolute -top-2.5 left-5 badge badge-accent">Recommended</span>
              ) : null}
              <p className="text-[13px] font-semibold">{plan.name}</p>
              <p className="mt-1 min-h-[32px] text-[11.5px] leading-snug text-ink/45">{plan.tagline}</p>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="font-mono text-[30px] font-semibold tabular-nums">
                  {plan.priceMonthly === 0 ? "Free" : formatUsd(plan.priceMonthly)}
                </span>
                {plan.priceMonthly > 0 ? <span className="text-[11px] text-ink/40">/mo</span> : null}
              </p>
              <p className="mt-1 text-[11px] text-ink/40">
                {plan.credits} unlock credits · {plan.seats === -1 ? "unlimited" : plan.seats} seat
                {plan.seats === 1 ? "" : "s"}
              </p>
              <ul className="mt-4 flex-1 space-y-2 border-t border-ink/[0.07] pt-4">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex gap-2 text-[11.5px] leading-snug text-ink/60">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?as=employer"
                className={cn("mt-5 w-full", plan.highlight ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm")}
              >
                {plan.key === "TRIAL" ? "Start free" : `Choose ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-ink/40">
          Prototype note: checkout is simulated. Plan changes and credit top-ups are recorded in the
          audit log so you can review the flow end to end.
        </p>
      </section>

      {/* Reviewer strip */}
      <section className="border-t border-ink/10 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">
                Reviewing this build?
              </p>
              <p className="mt-1 text-sm text-ink/60">
                Three seeded accounts cover every portal. The candidate has a complete profile and a
                LOC 414.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/login" className="btn btn-ghost btn-sm">
                Candidate demo
              </Link>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Employer demo
              </Link>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Admin demo
              </Link>
              <Link href="/login" className="btn btn-ink btn-sm">
                Open sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-[11px] text-ink/35">Local prototype · not a production service</span>
          </div>
          <div className="flex flex-wrap gap-5 text-[11px] text-ink/45">
            <a href="#loc" className="hover:text-ink">
              LOC model
            </a>
            <a href="#pricing" className="hover:text-ink">
              Pricing
            </a>
            <Link href="/login" className="hover:text-ink">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-ink">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
