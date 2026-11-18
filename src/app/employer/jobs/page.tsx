import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { loadEmployerContext } from "@/server/queries";
import { setJobStatusAction } from "@/server/actions/employer";
import { planFor } from "@/lib/pricing";
import { EMPLOYMENT_TYPES, WORK_MODES, labelFor } from "@/lib/profile";
import { formatSalary, timeAgo } from "@/lib/format";
import {
  Empty,
  Flash,
  LocMeter,
  PageHeader,
  Progress,
  SectionTitle,
  Stat,
  cn,
} from "@/components/ui";

export const metadata = { title: "Job posts" };

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-verify-soft text-verify",
  DRAFT: "bg-ink/[0.06] text-ink/55",
  CLOSED: "bg-ink/[0.05] text-ink/35",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  DRAFT: "Draft",
  CLOSED: "Closed",
};

export default async function EmployerJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const session = await requireRole("EMPLOYER");
  const ctx = await loadEmployerContext(session.uid);
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const plan = planFor(ctx.subscription?.plan ?? "TRIAL");
  const liveCount = ctx.jobs.filter((job) => job.status !== "CLOSED").length;
  const atLimit = plan.jobPosts !== -1 && liveCount >= plan.jobPosts;

  const open = ctx.jobs.filter((job) => job.status === "OPEN");
  const draft = ctx.jobs.filter((job) => job.status === "DRAFT");
  const closed = ctx.jobs.filter((job) => job.status === "CLOSED");

  const renderJob = (job: (typeof ctx.jobs)[number]) => (
    <article key={job.id} className="card card-hover p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14.5px] font-semibold">{job.title}</h3>
            <span className={cn("badge", STATUS_STYLES[job.status] ?? "badge-neutral")}>
              {STATUS_LABELS[job.status] ?? job.status}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-ink/55">
            {job.location || "Location not set"} · {labelFor(WORK_MODES, job.workMode)} ·{" "}
            {labelFor(EMPLOYMENT_TYPES, job.employmentType)} · posted {timeAgo(job.createdAt)}
          </p>
          <p className="mt-2 line-clamp-2 max-w-2xl text-[12.5px] leading-relaxed text-ink/60">
            {job.description || "No description provided."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="badge badge-neutral font-mono">
              LOC {Math.max(job.minLoc, 100)}–{job.maxLoc}
            </span>
            <span className="badge badge-neutral">{formatSalary(job.salaryMin, job.salaryMax)}</span>
            <span className="badge badge-neutral">{job._count.applications} applicants</span>
          </div>
          <div className="mt-3 max-w-xs">
            <LocMeter score={job.minLoc} />
            <p className="mt-1 text-[10px] text-ink/35">LOC floor for this role</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-[150px]">
          <Link href={`/employer/pipeline?job=${job.id}`} className="btn btn-ghost btn-sm">
            View applicants
          </Link>
          {job.status === "OPEN" ? (
            <form action={setJobStatusAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="status" value="CLOSED" />
              <button type="submit" className="btn btn-quiet btn-sm w-full">
                Close role
              </button>
            </form>
          ) : (
            <form action={setJobStatusAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="status" value="OPEN" />
              <button type="submit" className="btn btn-ghost btn-sm w-full">
                {job.status === "DRAFT" ? "Publish role" : "Reopen role"}
              </button>
            </form>
          )}
          {job.status === "OPEN" ? (
            <form action={setJobStatusAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="status" value="DRAFT" />
              <button type="submit" className="text-[10.5px] font-medium text-ink/35 hover:text-ink">
                Move to draft
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );

  return (
    <>
      <PageHeader
        eyebrow="Hiring"
        title="Job posts"
        description="Publish roles with an explicit LOC window so candidates can self-qualify before applying."
        actions={
          <Link href="/employer/jobs/new" className={cn("btn btn-sm", atLimit ? "btn-ghost" : "btn-primary")}>
            Post a job
          </Link>
        }
      />

      {sp.created ? <Flash kind="ok" message="Job published. Matching candidates can now see it in the job feed." /> : null}
      {sp.updated ? <Flash kind="ok" message="Job status updated." /> : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      {!ctx.employer.verified ? (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-warn/30 bg-warn-soft/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-relaxed text-ink/65">
            <span className="font-semibold">Verification pending.</span> You can draft roles now, but
            publishing requires admin approval of {ctx.employer.companyName}.
          </p>
          <Link href="/employer" className="btn btn-ink btn-sm shrink-0">
            Verification status
          </Link>
        </div>
      ) : null}

      <div className="metric-grid mb-5">
        <Stat label="Open roles" value={open.length} hint="Live in the candidate feed" tone={open.length ? "verify" : "ink"} />
        <Stat label="Applicants" value={ctx.applicationCount} hint={`${ctx.newApplications} unreviewed`} tone={ctx.newApplications ? "accent" : "ink"} />
        <Stat label="Drafts" value={draft.length} hint="Not visible to candidates" />
        <Stat label="Plan limit" value={plan.jobPosts === -1 ? "Unlimited" : `${liveCount}/${plan.jobPosts}`} hint={`${plan.name} plan`} />
      </div>

      {plan.jobPosts !== -1 ? (
        <div className="mb-5">
          <Progress value={plan.jobPosts ? (liveCount / plan.jobPosts) * 100 : 0} tone={atLimit ? "accent" : "verify"} />
          <p className="mt-1.5 text-[11px] text-ink/40">
            {plan.jobPosts - liveCount > 0
              ? `${plan.jobPosts - liveCount} active post${plan.jobPosts - liveCount === 1 ? "" : "s"} left on ${plan.name}.`
              : "Active post limit reached. Close a role or upgrade for more."}
          </p>
        </div>
      ) : null}

      {ctx.jobs.length === 0 ? (
        <Empty
          title="No job posts yet"
          body="Publish your first BIM role with a LOC window, work mode and pay range. Candidates see where they sit before they apply."
          action={
            <Link href="/employer/jobs/new" className="btn btn-primary btn-sm">
              Post your first job
            </Link>
          }
        />
      ) : (
        <div className="space-y-7">
          <div>
            <SectionTitle title={`Open · ${open.length}`} hint="Live in the candidate job feed" />
            <div className="space-y-3">
              {open.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink/15 px-4 py-6 text-center text-[12.5px] text-ink/45">
                  No open roles. Publish a draft or create a new post.
                </div>
              ) : (
                open.map(renderJob)
              )}
            </div>
          </div>

          {draft.length > 0 ? (
            <div>
              <SectionTitle title={`Drafts · ${draft.length}`} hint="Review before publishing" />
              <div className="space-y-3">{draft.map(renderJob)}</div>
            </div>
          ) : null}

          {closed.length > 0 ? (
            <div>
              <SectionTitle title={`Closed · ${closed.length}`} hint="Historical posts and their applicants" />
              <div className="space-y-3">{closed.map(renderJob)}</div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
