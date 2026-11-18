import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { loadCandidateContext } from "@/server/queries";
import { updateProfileAction } from "@/server/actions/candidate";
import {
  AVAILABILITY,
  COMPLETENESS_RULES,
  DISCIPLINES,
  SOFTWARE,
  WORK_AUTH,
  parseCsv,
  profileCompleteness,
} from "@/lib/profile";
import { Crumbs, Field, Flash, PageHeader, Progress, SectionTitle, cn } from "@/components/ui";

export const metadata = { title: "Profile" };

function Chip({
  name,
  value,
  label,
  checked,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="inline-flex select-none items-center rounded-full border border-ink/15 bg-white px-3 py-1.5 text-[12px] font-medium text-ink/60 transition hover:border-ink/30 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40">
        {label}
      </span>
    </label>
  );
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireRole("CANDIDATE");
  const ctx = await loadCandidateContext(session.uid);
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const { profile, completeness } = ctx;
  const disciplines = parseCsv(profile.disciplines);
  const software = parseCsv(profile.software);

  const input = {
    headline: profile.headline,
    currentTitle: profile.currentTitle,
    location: profile.location,
    yearsExperience: profile.yearsExperience,
    disciplines: profile.disciplines,
    software: profile.software,
    bio: profile.bio,
  };
  const liveCompleteness = profileCompleteness(input);

  return (
    <>
      <Crumbs items={[{ label: "Candidate", href: "/candidate" }, { label: "Profile" }]} />
      <PageHeader
        eyebrow="Your public card"
        title="Profile & visibility"
        description="This is what an employer sees before spending a credit. The assessment only unlocks at 100% completion."
        actions={
          <Link href="/candidate" className="btn btn-ghost btn-sm">
            Back to overview
          </Link>
        }
      />

      {sp.saved ? <Flash kind="ok" message="Profile saved. Visibility changes apply to talent search immediately." /> : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr] lg:items-start">
        <form action={updateProfileAction} className="space-y-5">
          <div className="card card-pad">
            <SectionTitle title="Positioning" hint="Short, specific, and searchable." />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Headline" htmlFor="headline" className="sm:col-span-2" hint="Role + discipline, for example “BIM Coordinator — MEP”.">
                <input
                  id="headline"
                  name="headline"
                  defaultValue={profile.headline}
                  maxLength={120}
                  placeholder="BIM Coordinator — MEP"
                  className="input"
                />
              </Field>
              <Field label="Current title" htmlFor="currentTitle">
                <input
                  id="currentTitle"
                  name="currentTitle"
                  defaultValue={profile.currentTitle}
                  placeholder="Senior BIM Technician"
                  className="input"
                />
              </Field>
              <Field label="Location" htmlFor="location" hint="City, state">
                <input
                  id="location"
                  name="location"
                  defaultValue={profile.location}
                  placeholder="Austin, TX"
                  className="input"
                />
              </Field>
              <Field label="Years of BIM experience" htmlFor="yearsExperience">
                <input
                  id="yearsExperience"
                  name="yearsExperience"
                  type="number"
                  min={0}
                  max={50}
                  defaultValue={profile.yearsExperience}
                  className="input"
                />
              </Field>
              <Field label="Availability" htmlFor="availability">
                <select id="availability" name="availability" defaultValue={profile.availability} className="select">
                  {AVAILABILITY.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Work authorization" htmlFor="workAuthorization">
                <select
                  id="workAuthorization"
                  name="workAuthorization"
                  defaultValue={profile.workAuthorization}
                  className="select"
                >
                  {WORK_AUTH.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-ink/10 bg-white px-3.5 py-2.5">
                  <span className="text-[12.5px] font-medium text-ink/70">Open to remote roles</span>
                  <input type="checkbox" name="remoteOk" defaultChecked={profile.remoteOk} className="peer sr-only" />
                  <span className="relative h-5 w-9 rounded-full bg-ink/15 transition peer-checked:bg-verify after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
                </label>
              </div>
              <Field label="Bio" htmlFor="bio" className="sm:col-span-2" hint="60+ characters. Mention project types and your role in coordination.">
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  defaultValue={profile.bio}
                  maxLength={1200}
                  placeholder="Six years coordinating MEP models on healthcare and higher-education projects. I run federated clash reviews, own the BEP for the MEP package, and build Dynamo scripts for parameter QA."
                  className="input resize-y"
                />
              </Field>
            </div>
          </div>

          <div className="card card-pad">
            <SectionTitle title="Disciplines" hint="Pick every discipline you have delivered in." />
            <div className="mt-3 flex flex-wrap gap-2">
              {DISCIPLINES.map((discipline) => (
                <Chip
                  key={discipline.key}
                  name="disciplines"
                  value={discipline.key}
                  label={discipline.label}
                  checked={disciplines.includes(discipline.key)}
                />
              ))}
            </div>

            <div className="mt-6">
              <SectionTitle title="Software" hint="Three or more tools completes this section." />
              <div className="mt-3 flex flex-wrap gap-2">
                {SOFTWARE.map((tool) => (
                  <Chip
                    key={tool.key}
                    name="software"
                    value={tool.key}
                    label={tool.label}
                    checked={software.includes(tool.key)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <SectionTitle title="Talent pool visibility" hint="Opt in when you are ready for employer contact." />
            <label className="mt-3 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-ink/10 bg-white px-4 py-3.5">
              <div>
                <p className="text-[13px] font-semibold">Appear in employer talent search</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink/50">
                  Your card shows your headline, LOC score, competency breakdown and location. Contact
                  details stay hidden until an employer unlocks you.
                </p>
              </div>
              <input type="checkbox" name="visible" defaultChecked={profile.visible} className="peer sr-only" />
              <span className="relative h-6 w-11 shrink-0 rounded-full bg-ink/15 transition peer-checked:bg-verify after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-primary">
              Save profile
            </button>
            <span className="text-[11px] text-ink/40">
              Saving re-evaluates completeness and search visibility.
            </span>
          </div>
        </form>

        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="card card-pad">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">Completeness</p>
                <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
                  {liveCompleteness}
                  <span className="text-base text-ink/30">%</span>
                </p>
              </div>
              <span className={cn("badge", liveCompleteness === 100 ? "badge-verify" : "badge-neutral")}>
                {liveCompleteness === 100 ? "Assessment ready" : "Assessment locked"}
              </span>
            </div>
            <div className="mt-3">
              <Progress value={liveCompleteness} tone={liveCompleteness === 100 ? "verify" : "accent"} />
            </div>
            <ul className="mt-4 space-y-2">
              {COMPLETENESS_RULES.map((rule) => {
                const met = rule.test(input);
                return (
                  <li key={rule.label} className="flex items-center justify-between gap-3 text-[11.5px]">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid h-3.5 w-3.5 place-items-center rounded-full text-[8px] font-bold",
                          met ? "bg-verify text-white" : "border border-ink/20 text-transparent",
                        )}
                        aria-hidden
                      >
                        ✓
                      </span>
                      <span className={met ? "text-ink/45" : "text-ink/70"}>{rule.label}</span>
                    </span>
                    <span className="font-mono text-[10px] text-ink/30">+{rule.points}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="card card-pad">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">Prototype note</p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink/50">
              This page saves to the PostgreSQL demo database via a server action. Validation is
              duplicated on the server, so bypassing the form still cannot publish an incomplete profile.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
