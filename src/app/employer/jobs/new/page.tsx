import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { loadEmployerContext } from "@/server/queries";
import { createJobAction } from "@/server/actions/employer";
import { planFor } from "@/lib/pricing";
import { COMPETENCIES } from "@/lib/questions";
import { EMPLOYMENT_TYPES, WORK_MODES } from "@/lib/profile";
import { Crumbs, Field, Flash, PageHeader, SectionTitle, cn } from "@/components/ui";

export const metadata = { title: "Post a job" };

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("EMPLOYER");
  const ctx = await loadEmployerContext(session.uid);
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const plan = planFor(ctx.subscription?.plan ?? "TRIAL");
  const liveCount = ctx.jobs.filter((job) => job.status !== "CLOSED").length;
  const atLimit = plan.jobPosts !== -1 && liveCount >= plan.jobPosts;
  const blocked = !ctx.employer.verified || atLimit;

  return (
    <>
      <Crumbs
        items={[
          { label: "Employer", href: "/employer" },
          { label: "Jobs", href: "/employer/jobs" },
          { label: "New post" },
        ]}
      />
      <PageHeader
        eyebrow="New role"
        title="Post a BIM job"
        description="Be explicit about the LOC window. Candidates use it to self-qualify, which keeps your pipeline relevant."
        actions={
          <Link href="/employer/jobs" className="btn btn-ghost btn-sm">
            Back to jobs
          </Link>
        }
      />

      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      {!ctx.employer.verified ? (
        <div className="mb-5 rounded-2xl border border-warn/30 bg-warn-soft/50 px-4 py-3 text-[12px] leading-relaxed text-ink/65">
          <span className="font-semibold">Company verification required.</span> An admin must approve{" "}
          {ctx.employer.companyName} before a role can go live. You can review the form below in the
          meantime, or submit verification from the{" "}
          <Link href="/employer" className="font-semibold text-accent-dark">
            employer overview
          </Link>
          .
        </div>
      ) : null}

      {atLimit ? (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-warn/30 bg-warn-soft/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-relaxed text-ink/65">
            <span className="font-semibold">Plan limit reached.</span> {plan.name} includes{" "}
            {plan.jobPosts} active posts and you have {liveCount}. Close a role or upgrade.
          </p>
          <Link href="/employer/billing" className="btn btn-ink btn-sm shrink-0">
            View plans
          </Link>
        </div>
      ) : null}

      <form action={createJobAction} className={cn("grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start", blocked && "pointer-events-none opacity-60")}>
        <div className="space-y-5">
          <div className="card card-pad">
            <SectionTitle title="Role basics" hint="What candidates see first" />
            <div className="mt-4 space-y-4">
              <Field label="Job title" htmlFor="title" hint="Be specific: discipline, seniority and scope.">
                <input
                  id="title"
                  name="title"
                  className="input"
                  placeholder="Senior BIM Coordinator - MEP"
                  required
                  minLength={4}
                  maxLength={120}
                />
              </Field>

              <Field label="Description" htmlFor="description" hint="Projects, responsibilities and the BIM outcomes you expect.">
                <textarea
                  id="description"
                  name="description"
                  rows={7}
                  className="input resize-y"
                  placeholder="Lead MEP coordination on a healthcare campus. Own the federated model, chair clash reviews and publish trade packages against the BEP."
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Location" htmlFor="location" hint="City, state or 'Remote (US)'.">
                  <input id="location" name="location" className="input" placeholder="Austin, TX" />
                </Field>
                <Field label="Work mode" htmlFor="workMode">
                  <select id="workMode" name="workMode" className="select" defaultValue="HYBRID">
                    {WORK_MODES.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Employment type" htmlFor="employmentType">
                  <select id="employmentType" name="employmentType" className="select" defaultValue="FULL_TIME">
                    {EMPLOYMENT_TYPES.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Annual salary range" htmlFor="salaryMin" hint="USD, leave blank to not disclose.">
                  <div className="flex items-center gap-2">
                    <input id="salaryMin" name="salaryMin" type="number" min={0} step={1000} placeholder="95000" className="input" />
                    <span className="text-ink/30">–</span>
                    <input name="salaryMax" type="number" min={0} step={1000} placeholder="125000" className="input" />
                  </div>
                </Field>
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <SectionTitle
              title="LOC window"
              hint="The 100–500 competence range where this role sits. Used to filter and score fit."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="LOC floor" htmlFor="minLoc" hint="Candidates below this see the role, but are outside the window.">
                <input id="minLoc" name="minLoc" type="number" min={100} max={500} step={10} defaultValue={300} className="input" />
              </Field>
              <Field label="LOC ceiling" htmlFor="maxLoc" hint="Raise the ceiling for senior or cross-discipline roles.">
                <input id="maxLoc" name="maxLoc" type="number" min={100} max={500} step={10} defaultValue={450} className="input" />
              </Field>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-1.5">
              {[
                ["Emerging", "100–199"],
                ["Developing", "200–299"],
                ["Competent", "300–399"],
                ["Proficient", "400–449"],
                ["Expert", "450–500"],
              ].map(([label, range]) => (
                <div key={label} className="rounded-lg bg-ink/[0.035] px-2 py-2 text-center">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink/40">{label}</p>
                  <p className="mt-0.5 font-mono text-[10px] tabular-nums text-ink/50">{range}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card card-pad">
            <SectionTitle title="Competencies" hint="What the assessment should cover for this role." />
            <div className="mt-3 space-y-2">
              {COMPETENCIES.map((competency) => (
                <label
                  key={competency.key}
                  className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-ink/10 px-3 py-2.5 transition hover:border-ink/20"
                >
                  <input
                    type="checkbox"
                    name="competencies"
                    value={competency.key}
                    defaultChecked={["iso19650", "lod", "clash", "delivery"].includes(competency.key)}
                    className="mt-0.5 accent-[#ED5B26]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[12px] font-semibold">{competency.label}</span>
                    <span className="mt-0.5 block text-[10.5px] leading-relaxed text-ink/45">
                      {competency.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <SectionTitle title="Publish" />
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink/50">
              Posting publishes the role immediately and notifies matching candidates in their job
              feed. You can close or draft it at any time from the jobs page.
            </p>
            <button type="submit" className="btn btn-primary mt-4 w-full" disabled={blocked}>
              Publish role
            </button>
            {blocked ? (
              <p className="mt-2 text-center text-[10.5px] text-ink/40">
                {!ctx.employer.verified ? "Verification required" : "Active post limit reached"}
              </p>
            ) : null}
          </div>
        </div>
      </form>
    </>
  );
}
