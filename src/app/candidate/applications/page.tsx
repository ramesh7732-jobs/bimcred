import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { candidateApplications } from "@/server/queries";
import { withdrawApplicationAction } from "@/server/actions/candidate";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/profile";
import { formatDate, timeAgo } from "@/lib/format";
import { Crumbs, Empty, Flash, PageHeader, cn } from "@/components/ui";

export const metadata = { title: "Applications" };

const PIPELINE = ["SUBMITTED", "REVIEWED", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"];

export default async function CandidateApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string; withdrawn?: string; error?: string }>;
}) {
  const session = await requireRole("CANDIDATE");
  const sp = await searchParams;

  const profile = await db.candidateProfile.findUnique({ where: { userId: session.uid } });
  if (!profile) redirect("/login");

  const applications = await candidateApplications(profile.id);
  const active = applications.filter((application) => !["REJECTED", "WITHDRAWN"].includes(application.status));
  const closed = applications.filter((application) => ["REJECTED", "WITHDRAWN"].includes(application.status));

  return (
    <>
      <Crumbs items={[{ label: "Candidate", href: "/candidate" }, { label: "Applications" }]} />
      <PageHeader
        eyebrow="Tracker"
        title="Your applications"
        description="Status updates from employers appear here. Your LOC and competency breakdown travel with every application."
        actions={
          <Link href="/candidate/jobs" className="btn btn-ghost btn-sm">
            Browse jobs
          </Link>
        }
      />

      {sp.applied ? <Flash kind="ok" message="Application submitted. The employer now sees your LOC and competency breakdown." /> : null}
      {sp.withdrawn ? <Flash kind="info" message="Application withdrawn. The employer sees the update in their pipeline." /> : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      {applications.length === 0 ? (
        <Empty
          title="Nothing in the tracker yet"
          body="Apply to a role from the job feed. You will see each stage here, from new to hired, with the date it changed."
          action={
            <Link href="/candidate/jobs" className="btn btn-primary btn-sm">
              Find a role
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
              Active · {active.length}
            </p>
            <div className="space-y-3">
              {active.map((application) => {
                const stageIndex = PIPELINE.indexOf(application.status);
                return (
                  <article key={application.id} className="card p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-[14.5px] font-semibold">{application.job.title}</h2>
                        <p className="mt-0.5 text-[12px] text-ink/55">
                          {application.job.employer.companyName} ·{" "}
                          {application.job.location || "Location flexible"} · applied {timeAgo(application.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-mono text-[11px] tabular-nums text-ink/40">{application.matchScore}% fit</span>
                        <span className={cn("badge", STATUS_STYLES[application.status])}>
                          {STATUS_LABELS[application.status] ?? application.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center gap-1">
                        {PIPELINE.map((stage, index) => {
                          const reached = stageIndex >= index;
                          return (
                            <div key={stage} className="flex flex-1 items-center gap-1">
                              <div className="flex flex-col items-center gap-1.5">
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    reached ? "bg-accent" : "bg-ink/15",
                                    index === stageIndex ? "ring-4 ring-accent/15" : "",
                                  )}
                                />
                                <span
                                  className={cn(
                                    "hidden text-[9.5px] font-medium sm:block",
                                    reached ? "text-ink/70" : "text-ink/30",
                                  )}
                                >
                                  {STATUS_LABELS[stage]}
                                </span>
                              </div>
                              {index < PIPELINE.length - 1 ? (
                                <span className={cn("h-px flex-1", stageIndex > index ? "bg-accent" : "bg-ink/10")} />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/[0.06] pt-3">
                      <p className="text-[11px] text-ink/40">
                        Applied {formatDate(application.createdAt)} · last update {timeAgo(application.updatedAt)}
                      </p>
                      {application.status !== "HIRED" ? (
                        <form action={withdrawApplicationAction}>
                          <input type="hidden" name="applicationId" value={application.id} />
                          <button type="submit" className="text-[11px] font-semibold text-ink/35 transition hover:text-red-600">
                            Withdraw
                          </button>
                        </form>
                      ) : (
                        <span className="badge badge-verify">Offer accepted</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {closed.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                Closed · {closed.length}
              </p>
              <div className="card divide-y divide-ink/[0.06]">
                {closed.map((application) => (
                  <div key={application.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink/70">{application.job.title}</p>
                      <p className="text-[11px] text-ink/40">{application.job.employer.companyName}</p>
                    </div>
                    <span className={cn("badge shrink-0", STATUS_STYLES[application.status])}>
                      {STATUS_LABELS[application.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
