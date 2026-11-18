import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { employerApplications, loadEmployerContext } from "@/server/queries";
import {
  moveApplicationAction,
  saveApplicationNoteAction,
} from "@/server/actions/employer";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/profile";
import { timeAgo } from "@/lib/format";
import {
  Empty,
  Flash,
  LocPill,
  PageHeader,
  SectionTitle,
  cn,
} from "@/components/ui";

export const metadata = { title: "Hiring pipeline" };

const COLUMNS = ["SUBMITTED", "REVIEWED", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"] as const;

const NEXT_STATUSES: Record<string, string[]> = {
  SUBMITTED: ["REVIEWED", "SHORTLISTED", "REJECTED"],
  REVIEWED: ["SHORTLISTED", "INTERVIEW", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "OFFER", "REJECTED"],
  INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: ["REVIEWED"],
  WITHDRAWN: [],
};

const MOVE_LABEL: Record<string, string> = {
  REVIEWED: "Review",
  SHORTLISTED: "Shortlist",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hire",
  REJECTED: "Reject",
};

export default async function EmployerPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; moved?: string; saved?: string; error?: string }>;
}) {
  const session = await requireRole("EMPLOYER");
  const ctx = await loadEmployerContext(session.uid);
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const jobFilter = typeof sp.job === "string" ? sp.job : "";
  const allApplications = await employerApplications(ctx.employer.id);
  const applications = jobFilter
    ? allApplications.filter((application) => application.jobId === jobFilter)
    : allApplications;

  const closed = applications.filter((application) => ["REJECTED", "WITHDRAWN"].includes(application.status));
  const active = applications.filter((application) => !["REJECTED", "WITHDRAWN"].includes(application.status));
  const filterJob = ctx.jobs.find((job) => job.id === jobFilter);

  return (
    <>
      <PageHeader
        eyebrow="Applications"
        title="Hiring pipeline"
        description="Move applicants through the stages you actually use. Every transition is written to the audit log and reflected in the candidate tracker."
        actions={
          <Link href="/employer/jobs" className="btn btn-ghost btn-sm">
            Manage jobs
          </Link>
        }
      />

      {sp.moved ? <Flash kind="ok" message="Application moved. The candidate's tracker shows the new stage." /> : null}
      {sp.saved ? <Flash kind="ok" message="Internal note saved." /> : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      <form method="get" className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-white p-3">
        <select name="job" defaultValue={jobFilter} className="select h-10 w-auto min-w-[220px] flex-1">
          <option value="">All roles · {allApplications.length} applicants</option>
          {ctx.jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title} · {job._count.applications}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-ink btn-sm h-10">
          Filter pipeline
        </button>
        {jobFilter ? (
          <Link href="/employer/pipeline" className="text-[11px] font-semibold text-ink/40 hover:text-ink">
            Reset
          </Link>
        ) : null}
        <span className="ml-auto text-[11px] text-ink/40">
          {filterJob ? filterJob.title : "All open and closed roles"}
        </span>
      </form>

      {applications.length === 0 ? (
        <Empty
          title={jobFilter ? "No applicants for this role yet" : "No applications in the pipeline"}
          body="Publish a role with a clear LOC window and matching candidates can apply from their job feed. Applications appear here instantly."
          action={
            <Link href="/employer/jobs/new" className="btn btn-primary btn-sm">
              Post a job
            </Link>
          }
        />
      ) : (
        <>
          <div className="scroll-thin -mx-5 flex gap-3 overflow-x-auto px-5 pb-3 lg:mx-0 lg:px-0">
            {COLUMNS.map((status) => {
              const items = active.filter((application) => application.status === status);
              return (
                <div key={status} className="w-[272px] shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-1.5 w-1.5 rounded-full", status === "HIRED" ? "bg-verify" : status === "OFFER" ? "bg-accent" : "bg-ink/30")} />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink/50">
                        {STATUS_LABELS[status]}
                      </p>
                    </div>
                    <span className="font-mono text-[10.5px] tabular-nums text-ink/35">{items.length}</span>
                  </div>

                  <div className="space-y-2.5">
                    {items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-ink/10 px-3 py-6 text-center text-[10.5px] text-ink/30">
                        Empty
                      </div>
                    ) : (
                      items.map((application) => (
                        <article key={application.id} className="card p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                href={`/employer/talent/${application.candidateId}`}
                                className="truncate text-[12.5px] font-semibold hover:text-accent-dark"
                              >
                                {application.candidate.user.name}
                              </Link>
                              <p className="mt-0.5 truncate text-[10.5px] text-ink/45">{application.job.title}</p>
                            </div>
                            <LocPill score={application.candidate.locScore} band={application.candidate.locBand} size="sm" />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[10px] text-ink/35">
                            <span>{application.matchScore}% fit</span>
                            <span>{timeAgo(application.createdAt)}</span>
                          </div>

                          {application.note ? (
                            <p className="mt-2 line-clamp-2 rounded-lg bg-ink/[0.035] px-2 py-1.5 text-[10.5px] leading-relaxed text-ink/55">
                              {application.note}
                            </p>
                          ) : null}

                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {NEXT_STATUSES[application.status]?.map((next) => (
                              <form key={next} action={moveApplicationAction}>
                                <input type="hidden" name="applicationId" value={application.id} />
                                <input type="hidden" name="status" value={next} />
                                <button
                                  type="submit"
                                  className={cn(
                                    "btn btn-sm px-2 py-1 text-[9.5px]",
                                    next === "REJECTED" ? "btn-quiet" : "btn-ghost",
                                  )}
                                >
                                  {MOVE_LABEL[next] ?? next}
                                </button>
                              </form>
                            ))}
                          </div>

                          <details className="group mt-2">
                            <summary className="cursor-pointer list-none text-[9.5px] font-semibold text-ink/35 hover:text-ink">
                              Add note
                            </summary>
                            <form action={saveApplicationNoteAction} className="mt-2 space-y-1.5">
                              <input type="hidden" name="applicationId" value={application.id} />
                              <textarea
                                name="note"
                                rows={2}
                                defaultValue={application.note}
                                placeholder="Interview feedback, availability…"
                                className="input px-2 py-1.5 text-[11px]"
                              />
                              <button type="submit" className="btn btn-ink btn-sm w-full px-2 py-1 text-[9.5px]">
                                Save note
                              </button>
                            </form>
                          </details>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {closed.length > 0 ? (
            <div className="mt-8">
              <SectionTitle title={`Closed · ${closed.length}`} hint="Rejected or withdrawn applications" />
              <div className="card divide-y divide-ink/[0.06]">
                {closed.map((application) => (
                  <div key={application.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12.5px] font-semibold">{application.candidate.user.name}</p>
                        <span className={cn("badge", STATUS_STYLES[application.status])}>
                          {STATUS_LABELS[application.status]}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10.5px] text-ink/45">
                        {application.job.title} · {application.matchScore}% fit · {timeAgo(application.updatedAt)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {NEXT_STATUSES[application.status]?.map((next) => (
                        <form key={next} action={moveApplicationAction}>
                          <input type="hidden" name="applicationId" value={application.id} />
                          <input type="hidden" name="status" value={next} />
                          <button type="submit" className="btn btn-ghost btn-sm">
                            Reopen
                          </button>
                        </form>
                      ))}
                      <Link href={`/employer/talent/${application.candidateId}`} className="btn btn-quiet btn-sm">
                        Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
