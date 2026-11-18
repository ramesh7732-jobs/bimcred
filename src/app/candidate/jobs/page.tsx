import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { loadCandidateContext, openJobsForCandidate } from "@/server/queries";
import { applyToJobAction } from "@/server/actions/candidate";
import { EMPLOYMENT_TYPES, WORK_MODES, labelFor } from "@/lib/profile";
import { formatSalary, jobMatchScore } from "@/lib/format";
import { Crumbs, Empty, Flash, LocPill, PageHeader, cn } from "@/components/ui";

export const metadata = { title: "Job feed" };

export default async function CandidateJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mode?: string; fit?: string; error?: string; applied?: string }>;
}) {
  const session = await requireRole("CANDIDATE");
  const ctx = await loadCandidateContext(session.uid);
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const { profile } = ctx;

  const [allJobs, applications] = await Promise.all([
    openJobsForCandidate(profile.locScore),
    db.application.findMany({
      where: { candidateId: profile.id },
      select: { jobId: true },
    }),
  ]);
  const appliedSet = new Set(applications.map((application) => application.jobId));

  const query = (sp.q ?? "").toLowerCase().trim();
  const mode = sp.mode ?? "";
  const fitOnly = sp.fit === "fit";

  const jobs = allJobs
    .filter((job) => {
      if (mode && job.workMode !== mode) return false;
      if (query) {
        const haystack = `${job.title} ${job.employer.companyName} ${job.location} ${job.description}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (fitOnly && profile.locScore != null) {
        if (profile.locScore < job.minLoc || profile.locScore > job.maxLoc) return false;
      }
      return true;
    })
    .map((job) => ({ job, match: jobMatchScore(job, profile) }))
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));

  return (
    <>
      <Crumbs items={[{ label: "Candidate", href: "/candidate" }, { label: "Job feed" }]} />
      <PageHeader
        eyebrow="Open roles"
        title="Job feed"
        description="Every posting shows its LOC window, so you can see where you sit before you apply. Applications carry your scored profile automatically."
        actions={<LocPill score={profile.locScore} band={profile.locBand} />}
      />

      {sp.applied ? <Flash kind="ok" message="Application sent. Track its status from the Applications tab." /> : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      <form method="get" className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-white p-3">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search title, company or city"
          className="input h-10 flex-1 sm:min-w-[220px]"
        />
        <select name="mode" defaultValue={mode} className="select h-10 w-auto min-w-[140px]">
          <option value="">Any work mode</option>
          {WORK_MODES.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-ink/15 bg-white px-3 text-[12px] font-medium text-ink/60">
          <input type="checkbox" name="fit" value="fit" defaultChecked={fitOnly} className="accent-[#ED5B26]" />
          Inside my LOC window
        </label>
        <button type="submit" className="btn btn-ink btn-sm h-10">
          Filter
        </button>
        {query || mode || fitOnly ? (
          <Link href="/candidate/jobs" className="text-[11px] font-semibold text-ink/40 hover:text-ink">
            Reset
          </Link>
        ) : null}
      </form>

      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-[12px] text-ink/50">
          <span className="font-semibold text-ink">{jobs.length}</span> open role
          {jobs.length === 1 ? "" : "s"}
        </p>
        <p className="text-[11px] text-ink/40">
          {profile.locScore == null ? "Take the assessment to see fit scores" : `Sorted by fit for LOC ${profile.locScore}`}
        </p>
      </div>

      {jobs.length === 0 ? (
        <Empty
          title="No roles match that filter"
          body="Try widening the work mode or clearing the LOC window filter. New roles appear here as soon as employers publish them."
          action={
            <Link href="/candidate/jobs" className="btn btn-ghost btn-sm">
              Clear filters
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {jobs.map(({ job, match }) => {
            const applied = appliedSet.has(job.id);
            return (
              <article key={job.id} className="card card-hover p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold">{job.title}</h2>
                      {job.employer.verified ? (
                        <span className="badge badge-verify">
                          <span className="h-1 w-1 rounded-full bg-verify" />
                          Verified employer
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[12px] text-ink/55">
                      {job.employer.companyName} · {job.location || job.employer.hqLocation || "Location not set"} ·{" "}
                      {labelFor(WORK_MODES, job.workMode)} · {labelFor(EMPLOYMENT_TYPES, job.employmentType)}
                    </p>
                    <p className="mt-2.5 line-clamp-2 max-w-2xl text-[12.5px] leading-relaxed text-ink/60">
                      {job.description || "No description provided."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="badge badge-neutral font-mono">
                        LOC {Math.max(job.minLoc, 100)}–{job.maxLoc}
                      </span>
                      <span className="badge badge-neutral">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                      <span className="badge badge-neutral">{job._count.applications} applicants</span>
                      {profile.locScore != null &&
                      profile.locScore >= job.minLoc &&
                      profile.locScore <= job.maxLoc ? (
                        <span className="badge badge-verify">Inside window</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-[168px]">
                    <div className="rounded-xl bg-ink/[0.035] px-3 py-2 text-center">
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink/40">Fit score</p>
                      <p className={cn("font-mono text-xl font-semibold tabular-nums", (match ?? 0) >= 70 ? "text-verify" : "text-ink")}>
                        {profile.locScore == null ? "—" : `${match}%`}
                      </p>
                    </div>
                    {applied ? (
                      <span className="btn btn-ghost btn-sm cursor-default text-verify">Applied ✓</span>
                    ) : (
                      <form action={applyToJobAction}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <button type="submit" className="btn btn-primary btn-sm w-full">
                          Apply
                        </button>
                      </form>
                    )}
                    <Link href="/candidate/applications" className="text-center text-[10.5px] font-medium text-ink/40 hover:text-ink">
                      Track applications
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-[11px] leading-relaxed text-ink/35">
        Fit score is a heuristic combining LOC window, experience and tool overlap. It is shown to help
        you triage roles — employers rank applicants on their pipeline, not on this number.
      </p>
    </>
  );
}
