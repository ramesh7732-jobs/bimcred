import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { loadEmployerContext, locDistribution, talentPoolStats } from "@/server/queries";
import { employerNextAction } from "@/lib/journeys";
import { creditsLabel, planFor } from "@/lib/pricing";
import { updateCompanyAction, requestVerificationAction } from "@/server/actions/employer";
import {
  Empty,
  Field,
  Flash,
  PageHeader,
  Progress,
  SectionTitle,
  Stat,
  cn,
} from "@/components/ui";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Overview" };

export default async function EmployerHome({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; saved?: string; requested?: string; error?: string }>;
}) {
  const session = await requireRole("EMPLOYER");
  const ctx = await loadEmployerContext(session.uid);
  if (!ctx) redirect("/login?error=Employer profile missing.");

  const sp = await searchParams;
  const { employer, subscription, jobs, openJobs, applicationCount, newApplications, unlocked, recentViews } = ctx;
  const plan = planFor(subscription?.plan ?? "TRIAL");
  const credits = subscription?.creditsRemaining ?? 0;

  const [pool, bands] = await Promise.all([talentPoolStats(), locDistribution()]);
  const bandTotal = bands.reduce((sum, band) => sum + band.count, 0);

  const next = employerNextAction({
    verified: employer.verified,
    creditsRemaining: credits,
    hasJob: jobs.length > 0,
    hasShortlist: unlocked > 0,
  });

  return (
    <>
      <PageHeader
        eyebrow={`Employer · ${employer.companyName || "Company profile"}`}
        title={`Overview`}
        description="Search is free. You spend a credit only when you decide to contact someone."
        actions={
          <>
            <Link href="/employer/talent" className="btn btn-ghost btn-sm">
              Search talent
            </Link>
            <Link href="/employer/jobs/new" className="btn btn-ink btn-sm">
              Post a job
            </Link>
          </>
        }
      />

      {sp.welcome ? (
        <Flash
          kind="ok"
          message="Employer account created. An admin verifies your company before credits become spendable — you can search the pool in the meantime."
        />
      ) : null}
      {sp.saved ? <Flash kind="ok" message="Company profile saved." /> : null}
      {sp.requested ? (
        <Flash kind="ok" message="Verification requested. An admin reviews company accounts in the operations console." />
      ) : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      {!employer.verified ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-warn/30 bg-warn-soft/50">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                Company verification pending
              </p>
              <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-ink/60">
                You can browse and filter the scored pool now. Unlocking contact details and publishing
                roles unlocks after an admin approves <span className="font-semibold">{employer.companyName}</span>.
                Sign in as the admin demo to approve it from /admin/employers.
              </p>
            </div>
            {jobs.length === 0 ? (
              <form action={requestVerificationAction} className="shrink-0">
                <button type="submit" className="btn btn-ink btn-sm">
                  Submit verification
                </button>
              </form>
            ) : (
              <span className="badge badge-warn shrink-0">Review in progress</span>
            )}
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-5">
          {/* Next action */}
          <div className="card overflow-hidden">
            <div className="h-1 w-full bg-ink/[0.06]">
              <div className="h-full bg-accent" style={{ width: `${next.progress}%` }} />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-dark">
                  Next best action
                </p>
                <span className="badge badge-neutral">Journey {next.progress}%</span>
              </div>
              <h2 className="mt-2 text-lg font-semibold tracking-tight">{next.title}</h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-ink/60">{next.description}</p>
              <Link href={next.route} className="btn btn-primary btn-sm mt-4">
                {next.cta}
              </Link>
            </div>
          </div>

          {/* Talent pool */}
          <div className="card card-pad">
            <SectionTitle
              title="Talent pool right now"
              hint={`${pool.scored} scored · ${pool.total} visible profiles`}
              action={
                <Link href="/employer/talent" className="text-[12px] font-semibold text-accent-dark">
                  Open search →
                </Link>
              }
            />
            <div className="mt-4 space-y-2.5">
              {bands.map((band) => (
                <div key={band.band} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-[11px] font-medium text-ink/55">{band.band}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        band.band === "Expert"
                          ? "bg-ink"
                          : band.band === "Proficient"
                            ? "bg-verify"
                            : band.band === "Competent"
                              ? "bg-accent"
                              : band.band === "Developing"
                                ? "bg-warn"
                                : "bg-ink/30",
                      )}
                      style={{ width: `${bandTotal ? Math.max(3, (band.count / bandTotal) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink/45">
                    {band.count}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-ink/[0.06] pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-ink/40">Verified</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{pool.verified}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-ink/40">Scored</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{pool.scored}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-ink/40">Visible</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{pool.total}</p>
              </div>
            </div>
          </div>

          {/* Recent unlocks */}
          <div>
            <SectionTitle
              title="Recently unlocked"
              hint="Re-opening any of these is free"
              action={
                <Link href="/employer/talent" className="text-[12px] font-semibold text-accent-dark">
                  Find more →
                </Link>
              }
            />
            {recentViews.length === 0 ? (
              <Empty
                title="No unlocks yet"
                body="Filtering is free and unlimited. A credit is spent only when you unlock a candidate's phone and email."
                action={
                  <Link href="/employer/talent" className="btn btn-ghost btn-sm">
                    Search the pool
                  </Link>
                }
              />
            ) : (
              <div className="card divide-y divide-ink/[0.06]">
                {recentViews.map((view) => (
                  <div key={view.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">{view.candidate.user.name}</p>
                      <p className="truncate text-[11.5px] text-ink/45">
                        {view.candidate.headline} · {view.candidate.location || "US"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-mono text-[11px] tabular-nums text-ink/40">
                        {view.candidate.locScore ?? "—"} LOC
                      </span>
                      <span className="text-[10.5px] text-ink/35">{timeAgo(view.createdAt)}</span>
                      <Link href={`/employer/talent/${view.candidateId}`} className="btn btn-ghost btn-sm">
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <div className="card card-pad">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">Unlock credits</p>
                <p className="mt-1 font-mono text-4xl font-semibold tabular-nums">{credits}</p>
                <p className="mt-1 text-[11px] text-ink/45">
                  {plan.name} plan · {plan.credits} / month
                </p>
              </div>
              <span className={cn("badge", employer.verified ? "badge-verify" : "badge-warn")}>
                {employer.verified ? "Verified" : "Locked"}
              </span>
            </div>
            <div className="mt-3">
              <Progress value={plan.credits ? (credits / plan.credits) * 100 : 0} tone="verify" />
            </div>
            <div className="mt-4 flex gap-2">
              <Link href="/employer/billing" className="btn btn-ghost btn-sm flex-1">
                Top up
              </Link>
              <Link href="/employer/talent" className="btn btn-primary btn-sm flex-1">
                Use a credit
              </Link>
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-ink/40">
              {creditsLabel(credits)} available. Unlocking the same candidate twice never charges twice.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Open jobs" value={openJobs} hint={`${jobs.length} total`} />
            <Stat label="Applicants" value={applicationCount} hint={`${newApplications} new`} tone={newApplications > 0 ? "accent" : "ink"} />
            <Stat label="Unlocked" value={unlocked} hint="Lifetime contacts" />
            <Stat label="Plan" value={plan.name} hint={plan.tagline.slice(0, 28) + "…"} />
          </div>

          <details className="card card-pad group">
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold">Company profile</p>
                <p className="mt-0.5 text-[11px] text-ink/45">{employer.companyName}</p>
              </div>
              <span className="text-[11px] font-semibold text-accent-dark group-open:hidden">Edit</span>
              <span className="hidden text-[11px] font-semibold text-ink/40 group-open:inline">Close</span>
            </summary>
            <form action={updateCompanyAction} className="mt-4 space-y-3">
              <Field label="Company name" htmlFor="companyName">
                <input id="companyName" name="companyName" defaultValue={employer.companyName} className="input" required />
              </Field>
              <Field label="Website" htmlFor="website">
                <input id="website" name="website" defaultValue={employer.website} placeholder="https://" className="input" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Industry" htmlFor="industry">
                  <input id="industry" name="industry" defaultValue={employer.industry} placeholder="AEC" className="input" />
                </Field>
                <Field label="Size" htmlFor="companySize">
                  <input id="companySize" name="companySize" defaultValue={employer.companySize} placeholder="201-500" className="input" />
                </Field>
              </div>
              <Field label="HQ location" htmlFor="hqLocation">
                <input id="hqLocation" name="hqLocation" defaultValue={employer.hqLocation} placeholder="Denver, CO" className="input" />
              </Field>
              <button type="submit" className="btn btn-ink btn-sm w-full">
                Save company
              </button>
            </form>
          </details>
        </div>
      </div>
    </>
  );
}
