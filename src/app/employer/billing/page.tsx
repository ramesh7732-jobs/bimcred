import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { loadEmployerContext } from "@/server/queries";
import { changePlanAction, topUpCreditsAction } from "@/server/actions/employer";
import { PLANS, annualSavingPct, creditsLabel, formatUsd, planFor } from "@/lib/pricing";
import { formatDate, timeAgo } from "@/lib/format";
import {
  Flash,
  KeyValue,
  PageHeader,
  Progress,
  SectionTitle,
  Stat,
  cn,
} from "@/components/ui";

export const metadata = { title: "Billing & credits" };

const TOP_UPS = [
  { amount: 10, label: "10 credits" },
  { amount: 25, label: "25 credits" },
  { amount: 50, label: "50 credits" },
  { amount: 100, label: "100 credits" },
];

export default async function EmployerBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; topup?: string; error?: string }>;
}) {
  const session = await requireRole("EMPLOYER");
  const ctx = await loadEmployerContext(session.uid);
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const subscription = ctx.subscription;
  const plan = planFor(subscription?.plan ?? "TRIAL");
  const credits = subscription?.creditsRemaining ?? 0;
  const used = subscription?.creditsUsed ?? 0;
  const included = Math.max(1, plan.credits);
  const periodEnd = subscription?.currentPeriodEnd ?? null;
  const daysLeft = periodEnd ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / 86_400_000)) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Billing"
        title="Credits & plan"
        description="One credit unlocks one new candidate relationship. Re-opening a candidate is always free."
        actions={
          <span className={cn("badge", ctx.employer.verified ? "badge-verify" : "badge-warn")}>
            {ctx.employer.verified ? "Account verified" : "Verification pending"}
          </span>
        }
      />

      {sp.plan ? <Flash kind="ok" message="Plan updated. Your credit allocation has been reset for the new period." /> : null}
      {sp.topup ? <Flash kind="ok" message="Credits added to your balance." /> : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      <div className="metric-grid mb-6">
        <Stat label="Credits available" value={credits} hint={creditsLabel(credits)} tone={credits > 0 ? "verify" : "warn"} />
        <Stat label="Credits used" value={used} hint="Lifetime spend" />
        <Stat label="Plan" value={plan.name} hint={formatUsd(plan.priceMonthly) + " / month"} />
        <Stat
          label="Renews in"
          value={`${daysLeft}d`}
          hint={periodEnd ? formatDate(periodEnd) : "No period set"}
          tone={daysLeft < 7 ? "accent" : "ink"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <div className="space-y-5">
          <div className="card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <SectionTitle title="Current period" hint={plan.tagline} />
                <p className="font-mono text-4xl font-semibold tabular-nums">{credits}</p>
                <p className="mt-1 text-[11.5px] text-ink/45">
                  {creditsLabel(credits)} available · {plan.credits} included per period
                </p>
              </div>
              <span className="badge badge-dark">{plan.name}</span>
            </div>
            <div className="mt-4">
              <Progress value={Math.min(100, (credits / included) * 100)} tone="verify" />
            </div>
            <div className="mt-5 grid gap-x-8 sm:grid-cols-2">
              <KeyValue label="Period ends">{periodEnd ? formatDate(periodEnd) : "—"}</KeyValue>
              <KeyValue label="Seats included">{plan.seats === -1 ? "Unlimited" : plan.seats}</KeyValue>
              <KeyValue label="Job posts">{plan.jobPosts === -1 ? "Unlimited" : plan.jobPosts}</KeyValue>
              <KeyValue label="Search filters">{plan.searchFilters ? "Included" : "Not included"}</KeyValue>
              <KeyValue label="Pipeline board">{plan.pipeline ? "Included" : "Not included"}</KeyValue>
              <KeyValue label="Support">{plan.sla}</KeyValue>
            </div>
          </div>

          <div className="card card-pad">
            <SectionTitle title="Credit balance" hint="Unlocks are idempotent: the same candidate never costs twice." />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {TOP_UPS.map((option) => (
                <form key={option.amount} action={topUpCreditsAction} className="flex items-center gap-3 rounded-xl border border-ink/10 px-3.5 py-3">
                  <input type="hidden" name="amount" value={option.amount} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold">{option.label}</p>
                    <p className="mt-0.5 text-[10.5px] text-ink/40">
                      {formatUsd(option.amount * 12)} · simulated top-up
                    </p>
                  </div>
                  <button type="submit" className="btn btn-ghost btn-sm shrink-0">
                    Add
                  </button>
                </form>
              ))}
            </div>
            <form action={topUpCreditsAction} className="mt-4 flex items-end gap-2 rounded-xl bg-ink/[0.03] px-3.5 py-3">
              <div className="flex-1">
                <label className="label" htmlFor="amount">
                  Custom amount
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min={1}
                  max={500}
                  defaultValue={25}
                  className="input h-10"
                />
              </div>
              <button type="submit" className="btn btn-ink btn-sm h-10">
                Top up
              </button>
            </form>
            <p className="mt-3 text-[10.5px] leading-relaxed text-ink/35">
              This prototype simulates payment. No card is charged and no invoice is generated. A
              production build would create a Stripe PaymentIntent here and only credit the balance
              after the webhook confirms payment.
            </p>
          </div>

          <div>
            <SectionTitle
              title="Unlock ledger"
              hint={`${ctx.unlocked} ${ctx.unlocked === 1 ? "candidate" : "candidates"} unlocked with this company`}
            />
            {ctx.recentViews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink/15 px-4 py-6 text-center text-[12.5px] text-ink/45">
                No credits spent yet. Search the talent pool and unlock a candidate you want to contact.
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="scroll-thin overflow-x-auto">
                  <table className="table-base min-w-[520px]">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>LOC</th>
                        <th>Credits</th>
                        <th>When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ctx.recentViews.map((view) => (
                        <tr key={view.id}>
                          <td>
                            <Link href={`/employer/talent/${view.candidateId}`} className="font-medium hover:text-accent-dark">
                              {view.candidate.user.name}
                            </Link>
                            <p className="mt-0.5 text-[10.5px] text-ink/40">{view.candidate.headline}</p>
                          </td>
                          <td className="font-mono tabular-nums">{view.candidate.locScore ?? "—"}</td>
                          <td className="font-mono tabular-nums">-{view.unlockCost}</td>
                          <td className="text-[11.5px] text-ink/50">{timeAgo(view.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card card-pad">
            <SectionTitle title="Change plan" hint="Effective immediately in the prototype" />
            <div className="mt-4 space-y-3">
              {PLANS.map((option) => {
                const current = option.key === plan.key;
                const saving = annualSavingPct(option);
                return (
                  <div
                    key={option.key}
                    className={cn(
                      "rounded-xl border p-4",
                      current ? "border-accent/40 bg-accent-soft/40" : option.highlight ? "border-ink/20 bg-white" : "border-ink/10 bg-white",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-semibold">{option.name}</p>
                          {option.highlight ? <span className="badge badge-accent">Popular</span> : null}
                          {current ? <span className="badge badge-verify">Current</span> : null}
                        </div>
                        <p className="mt-0.5 text-[10.5px] text-ink/45">{option.tagline}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-[15px] font-semibold tabular-nums">{formatUsd(option.priceMonthly)}</p>
                        <p className="text-[9.5px] text-ink/35">per month</p>
                        {saving > 0 ? (
                          <p className="mt-0.5 text-[9.5px] font-semibold text-verify">
                            {formatUsd(option.priceAnnual)} annual · {saving}% off
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="badge badge-neutral">{creditsLabel(option.credits)}</span>
                      <span className="badge badge-neutral">{option.seats === -1 ? "Unlimited seats" : `${option.seats} seats`}</span>
                      <span className="badge badge-neutral">
                        {option.jobPosts === -1 ? "Unlimited jobs" : `${option.jobPosts} jobs`}
                      </span>
                    </div>
                    {current ? (
                      <button type="button" className="btn btn-ghost btn-sm mt-3 w-full" disabled>
                        Current plan
                      </button>
                    ) : (
                      <form action={changePlanAction} className="mt-3">
                        <input type="hidden" name="plan" value={option.key} />
                        <button type="submit" className="btn btn-ink btn-sm w-full">
                          {option.priceMonthly > plan.priceMonthly ? `Upgrade to ${option.name}` : `Switch to ${option.name}`}
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card card-pad">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">Billing contact</p>
            <p className="mt-2 text-[13px] font-semibold">{ctx.employer.companyName}</p>
            <p className="mt-0.5 text-[11.5px] text-ink/50">{ctx.user.email}</p>
            <p className="mt-3 text-[10.5px] leading-relaxed text-ink/40">
              In production, invoices, tax IDs and payment methods live here. The prototype keeps
              billing state in the local database so a reviewer can test upgrades without a payment
              provider.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
