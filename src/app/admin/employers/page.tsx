import Link from "next/link";
import { requireRole } from "@/server/auth";
import { adminEmployers } from "@/server/queries";
import {
  grantCreditsAction,
  setEmployerVerifiedAction,
} from "@/server/actions/admin";
import { planFor, formatUsd } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import {
  Empty,
  Flash,
  PageHeader,
  SectionTitle,
  Stat,
  cn,
} from "@/components/ui";

export const metadata = { title: "Employer accounts" };

export default async function AdminEmployersPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; granted?: string; error?: string; view?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const view = sp.view === "pending" ? "pending" : "all";

  const employers = await adminEmployers();
  const pending = employers.filter((employer) => !employer.verified);
  const visible = view === "pending" ? pending : employers;
  const totalCredits = employers.reduce(
    (sum, employer) => sum + (employer.subscription?.creditsRemaining ?? 0),
    0,
  );
  const verified = employers.length - pending.length;

  return (
    <>
      <PageHeader
        eyebrow="Company accounts"
        title="Employers"
        description="Approve companies before they can spend credits or publish roles. Verification is the only gate on the demand side."
        actions={
          <Link href="/admin/users?role=EMPLOYER" className="btn btn-ghost btn-sm">
            User records
          </Link>
        }
      />

      {sp.updated ? <Flash kind="ok" message="Employer verification state updated." /> : null}
      {sp.granted ? <Flash kind="ok" message="Credits granted to the employer." /> : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      <div className="metric-grid mb-5">
        <Stat label="Employers" value={employers.length} hint="Company accounts" />
        <Stat label="Verified" value={verified} hint="Can spend credits" tone="verify" />
        <Stat label="Pending" value={pending.length} hint="Awaiting review" tone={pending.length ? "warn" : "ink"} />
        <Stat label="Unused credits" value={totalCredits} hint="Across all accounts" tone="accent" />
      </div>

      <div className="mb-3 flex items-center gap-1 rounded-xl bg-ink/[0.05] p-1">
        {[
          { label: `All · ${employers.length}`, value: "all" },
          { label: `Pending · ${pending.length}`, value: "pending" },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/employers${tab.value === "pending" ? "?view=pending" : ""}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition",
              view === tab.value ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <Empty
          title="No employers here"
          body="The verification queue is clear. New company sign-ups appear here automatically."
          action={
            <Link href="/admin/employers" className="btn btn-ghost btn-sm">
              Show all employers
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {visible.map((employer) => {
            const subscription = employer.subscription;
            const plan = planFor(subscription?.plan ?? "TRIAL");
            return (
              <article key={employer.id} className={cn("card p-5", !employer.verified && "border-warn/30")}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold">{employer.companyName}</h2>
                      <span className={cn("badge", employer.verified ? "badge-verify" : "badge-warn")}>
                        {employer.verified ? "Verified" : "Pending"}
                      </span>
                      <span className="badge badge-neutral">{plan.name}</span>
                      {plan.highlight ? <span className="badge badge-accent">Popular</span> : null}
                    </div>
                    <p className="mt-1 text-[11.5px] text-ink/50">
                      {employer.user.name} · {employer.user.email} · joined {formatDate(employer.user.createdAt)}
                    </p>
                    <p className="mt-1 text-[11.5px] text-ink/45">
                      {employer.industry || "Industry not set"} · {employer.companySize || "size not set"} ·{" "}
                      {employer.hqLocation || "HQ not set"}
                    </p>
                    {employer.website ? (
                      <a
                        href={employer.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-1 inline-flex text-[11px] font-medium text-accent-dark hover:underline"
                      >
                        {employer.website}
                      </a>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="badge badge-neutral font-mono tabular-nums">
                        {subscription?.creditsRemaining ?? 0} credits left
                      </span>
                      <span className="badge badge-neutral font-mono tabular-nums">
                        {subscription?.creditsUsed ?? 0} used
                      </span>
                      <span className="badge badge-neutral">{employer._count.jobs} jobs</span>
                      <span className="badge badge-neutral">
                        {employer._count.views} {employer._count.views === 1 ? "unlock" : "unlocks"}
                      </span>
                      <span className="badge badge-neutral">
                        Renews {subscription ? formatDate(subscription.currentPeriodEnd) : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 lg:w-[260px]">
                    <form action={setEmployerVerifiedAction}>
                      <input type="hidden" name="employerId" value={employer.id} />
                      <input type="hidden" name="verified" value={employer.verified ? "false" : "true"} />
                      <button type="submit" className={cn("btn btn-sm w-full", employer.verified ? "btn-ghost" : "btn-ink")}>
                        {employer.verified ? "Revoke verification" : "Approve company"}
                      </button>
                    </form>

                    <form action={grantCreditsAction} className="flex items-end gap-2">
                      <input type="hidden" name="employerId" value={employer.id} />
                      <div className="flex-1">
                        <label className="label" htmlFor={`credits-${employer.id}`}>
                          Grant credits
                        </label>
                        <input
                          id={`credits-${employer.id}`}
                          name="amount"
                          type="number"
                          min={1}
                          max={500}
                          defaultValue={10}
                          className="input h-9"
                        />
                      </div>
                      <button type="submit" className="btn btn-ghost btn-sm h-9">
                        Grant
                      </button>
                    </form>
                    <p className="text-[10px] text-ink/35">
                      Plan value {formatUsd(plan.priceMonthly)}/month · {plan.credits} credits included
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <SectionTitle title="Verification policy" hint="Why this gate exists" />
        <div className="card card-pad space-y-2 text-[12px] leading-relaxed text-ink/60">
          <p>
            Unverified employers can browse previews but cannot reveal candidate contact details or
            publish roles. This keeps the scored pool from being scraped by throwaway accounts and
            makes every paid unlock attributable to a real company.
          </p>
          <p>
            Approval is a manual decision in the prototype. A production build should check the work
            email domain against the company website, optionally run a business registry lookup, and
            store the evidence on the profile.
          </p>
        </div>
      </div>
    </>
  );
}
