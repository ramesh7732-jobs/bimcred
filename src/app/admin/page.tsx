import Link from "next/link";
import { requireRole } from "@/server/auth";
import { adminOverview, locDistribution, openReports, recentAudit } from "@/server/queries";
import { resolveReportAction, setEmployerVerifiedAction } from "@/server/actions/admin";
import { formatDate, timeAgo } from "@/lib/format";
import {
  Empty,
  Flash,
  PageHeader,
  SectionTitle,
  Stat,
  cn,
} from "@/components/ui";

export const metadata = { title: "Operations overview" };

function actionLabel(action: string): string {
  return action
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .join(" · ");
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ resolved?: string; error?: string }>;
}) {
  const session = await requireRole("ADMIN");
  const sp = await searchParams;

  const [overview, bands, reports, audit] = await Promise.all([
    adminOverview(),
    locDistribution(),
    openReports(),
    recentAudit(12),
  ]);

  const bandTotal = bands.reduce((sum, band) => sum + band.count, 0);
  const average = bandTotal
    ? Math.round(bands.reduce((sum, band) => sum + band.avg * band.count, 0) / bandTotal)
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Admin · daily triage"
        title="Operations overview"
        description={`Signed in as ${session.name}. Clear verification requests, moderation reports and audit follow-ups from one board.`}
        actions={
          <>
            <Link href="/admin/employers" className="btn btn-ghost btn-sm">
              Verification queue
            </Link>
            <Link href="/admin/audit" className="btn btn-ink btn-sm">
              Audit log
            </Link>
          </>
        }
      />

      {sp.resolved ? <Flash kind="ok" message="Report resolved and recorded in the audit log." /> : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      <div className="metric-grid mb-5">
        <Stat label="Candidates" value={overview.candidates} hint={`${overview.phoneVerified} phone-verified`} />
        <Stat label="Employers" value={overview.employers} hint={`${overview.verifiedEmployers} verified`} tone="verify" />
        <Stat label="Pending reviews" value={overview.pendingEmployers.length} hint="Awaiting company verification" tone={overview.pendingEmployers.length ? "warn" : "ink"} />
        <Stat label="Open reports" value={overview.openReports} hint="Moderation queue" tone={overview.openReports ? "warn" : "ink"} />
        <Stat label="Scored candidates" value={overview.scored} hint="With a published LOC" tone="accent" />
        <Stat label="Completed assessments" value={overview.attempts} hint="All-time attempts" />
        <Stat label="Contact unlocks" value={overview.unlocks} hint="Paid employer–candidate relationships" />
        <Stat label="Pool average" value={average ? `${average}` : "—"} hint="Mean LOC across scored profiles" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr] lg:items-start">
        <div className="space-y-5">
          <div className="card overflow-hidden">
            <div className="border-b border-ink/[0.07] px-5 py-4">
              <SectionTitle
                title="Company verification queue"
                hint="Oldest first. Approving makes credits spendable and job publishing available."
                action={
                  <Link href="/admin/employers" className="text-[12px] font-semibold text-accent-dark">
                    All employers →
                  </Link>
                }
              />
            </div>
            {overview.pendingEmployers.length === 0 ? (
              <div className="px-5 py-8 text-center text-[12.5px] text-ink/45">
                Queue is clear. No companies are waiting for verification.
              </div>
            ) : (
              <div className="divide-y divide-ink/[0.06]">
                {overview.pendingEmployers.map((employer) => (
                  <div key={employer.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">{employer.companyName}</p>
                      <p className="mt-0.5 truncate text-[11px] text-ink/45">
                        {employer.user.email} · {employer.hqLocation || "Location not set"} ·{" "}
                        {employer.companySize || "size not set"} · requested {timeAgo(employer.createdAt)}
                      </p>
                      <p className="mt-0.5 truncate text-[10.5px] text-ink/35">
                        {employer.website || "No website supplied"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <form action={setEmployerVerifiedAction}>
                        <input type="hidden" name="employerId" value={employer.id} />
                        <input type="hidden" name="verified" value="true" />
                        <button type="submit" className="btn btn-ink btn-sm">
                          Approve
                        </button>
                      </form>
                      <Link href="/admin/employers" className="btn btn-ghost btn-sm">
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionTitle
              title={`Moderation reports · ${reports.length}`}
              hint="Reports are reviewed before any candidate is hidden."
            />
            {reports.length === 0 ? (
              <Empty
                title="No open reports"
                body="Employer reports about profile accuracy or contact details will appear here for triage."
              />
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <article key={report.id} className="card card-pad">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold">{report.reason}</p>
                        <p className="mt-0.5 text-[11px] text-ink/45">
                          {report.candidate.user.name} · reported by {report.reporter.name} (
                          {report.reporter.role.toLowerCase()}) · {timeAgo(report.createdAt)}
                        </p>
                      </div>
                      <span className="badge badge-warn">Open</span>
                    </div>
                    <p className="mt-2.5 text-[12px] leading-relaxed text-ink/60">{report.details || "No details supplied."}</p>
                    <form action={resolveReportAction} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                      <input type="hidden" name="reportId" value={report.id} />
                      <div className="flex-1">
                        <label className="label" htmlFor={`resolution-${report.id}`}>
                          Resolution note
                        </label>
                        <input
                          id={`resolution-${report.id}`}
                          name="resolution"
                          className="input h-10"
                          placeholder="What did you check and decide?"
                        />
                      </div>
                      <button type="submit" name="status" value="RESOLVED" className="btn btn-ink btn-sm h-10">
                        Resolve
                      </button>
                      <button
                        type="submit"
                        name="status"
                        value="DISMISSED"
                        className="btn btn-ghost btn-sm h-10"
                      >
                        Dismiss
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card card-pad">
            <SectionTitle title="LOC distribution" hint={`${bandTotal} scored profiles · average ${average || "—"}`} />
            <div className="mt-4 space-y-3">
              {bands.map((band) => (
                <div key={band.band}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[11.5px] font-medium text-ink/65">{band.band}</span>
                    <span className="font-mono text-[10.5px] tabular-nums text-ink/40">
                      {band.count} · avg {band.avg || "—"}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink/[0.06]">
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
                </div>
              ))}
            </div>
            <Link href="/admin/assessments" className="mt-4 inline-flex text-[12px] font-semibold text-accent-dark">
              Assessment health →
            </Link>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-ink/[0.07] px-5 py-4">
              <SectionTitle
                title="Recent activity"
                hint="Append-only audit trail"
                action={
                  <Link href="/admin/audit" className="text-[12px] font-semibold text-accent-dark">
                    Full log →
                  </Link>
                }
              />
            </div>
            <div className="divide-y divide-ink/[0.05]">
              {audit.map((entry) => (
                <div key={entry.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11.5px] font-semibold text-ink/75">{actionLabel(entry.action)}</p>
                    <span className="shrink-0 text-[10px] text-ink/30">{timeAgo(entry.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[10.5px] text-ink/40">
                    {entry.actor ? `${entry.actor.name} · ${entry.actor.role.toLowerCase()}` : "System"} ·{" "}
                    {entry.entity}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">Demo date</p>
            <p className="mt-1 text-[13px] font-semibold">{formatDate(new Date())}</p>
            <p className="mt-2 text-[10.5px] leading-relaxed text-ink/40">
              Seed data is deterministic. Re-run <code className="rounded bg-ink/[0.05] px-1 py-0.5">npm run db:reset</code>{" "}
              to restore the original demo state after testing.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
