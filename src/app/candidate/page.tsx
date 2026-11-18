import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { loadCandidateContext } from "@/server/queries";
import { CANDIDATE_JOURNEY, candidateNextAction, candidateProgress } from "@/lib/journeys";
import { LocResultCard } from "@/components/loc-result";
import {
  Empty,
  Flash,
  LocPill,
  PageHeader,
  Progress,
  SectionTitle,
  Stat,
  cn,
} from "@/components/ui";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/profile";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Overview" };

export default async function CandidateHome({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; scored?: string; error?: string }>;
}) {
  const session = await requireRole("CANDIDATE");
  const ctx = await loadCandidateContext(session.uid);
  if (!ctx) redirect("/login?error=Profile missing. Ask an administrator to repair your account.");

  const sp = await searchParams;
  const { user, profile, completeness, latestAttempt, applications, viewsCount } = ctx;

  const state = {
    hasProfile: true,
    phoneVerified: user.phoneVerified,
    hasLoc: profile.locScore != null,
    profileComplete: completeness === 100,
    visible: profile.visible,
  };

  const next = candidateNextAction(state);
  const progress = candidateProgress(state);

  const doneByStep: Record<string, boolean> = {
    "create-account": true,
    "verify-mobile": state.phoneVerified,
    "build-profile": state.profileComplete,
    "take-assessment": state.hasLoc,
    "review-loc": state.hasLoc,
    "opt-in-visibility": state.visible,
    "apply-to-jobs": applications.length > 0,
    "track-applications": applications.length > 0,
  };

  const firstName = user.name.split(" ")[0] ?? user.name;
  const publicHeadline = profile.headline || profile.currentTitle || "BIM professional";

  return (
    <>
      <PageHeader
        eyebrow={`Candidate · ${user.email}`}
        title={`Welcome back, ${firstName}`}
        description="Your LOC score is the headline. Keep the profile behind it current, then let employers find you."
        actions={
          <>
            <Link href="/candidate/profile" className="btn btn-ghost btn-sm">
              Edit profile
            </Link>
            <Link href="/candidate/jobs" className="btn btn-ink btn-sm">
              Browse jobs
            </Link>
          </>
        }
      />

      {sp.welcome ? (
        <Flash
          kind="ok"
          message="Account created. Next: complete your profile and verify your US mobile number — both are required before the assessment unlocks."
        />
      ) : null}
      {sp.scored ? <Flash kind="ok" message="Assessment submitted. Your LOC score is now live." /> : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-5">
          {/* Next action */}
          <div className="card overflow-hidden">
            <div className="h-1 w-full bg-ink/[0.06]">
              <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-dark">
                  Next best action
                </p>
                <span className="badge badge-neutral">Journey {progress}%</span>
              </div>
              <h2 className="mt-2 text-lg font-semibold tracking-tight">{next.title}</h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-ink/60">{next.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link href={next.route} className="btn btn-primary btn-sm">
                  {next.cta}
                </Link>
                <span className="text-[11px] text-ink/40">
                  {state.hasLoc ? `LOC ${profile.locScore}` : "Unscored"} ·{" "}
                  {state.phoneVerified ? "mobile verified" : "mobile unverified"}
                </span>
              </div>
            </div>
          </div>

          {/* LOC result */}
          {latestAttempt && profile.locScore != null ? (
            <LocResultCard
              locScore={profile.locScore}
              locBand={profile.locBand}
              rawScore={latestAttempt.rawScore}
              answers={latestAttempt.answers}
              submittedAt={latestAttempt.submittedAt}
            />
          ) : (
            <div className="card card-pad">
              <SectionTitle
                title="Your LOC score"
                hint="Issued after the 15-question timed assessment."
                action={<LocPill score={null} />}
              />
              <div className="mt-3 rounded-xl border border-dashed border-ink/15 px-4 py-6 text-center">
                <p className="text-sm font-semibold">No score yet</p>
                <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-ink/55">
                  The assessment unlocks once your profile is 100% complete and your mobile is verified.
                  You will see a 100–500 LOC score plus a per-competency breakdown.
                </p>
                <Link href="/candidate/assessment" className="btn btn-ghost btn-sm mt-4">
                  Check eligibility
                </Link>
              </div>
            </div>
          )}

          {/* Applications */}
          <div>
            <SectionTitle
              title="Recent applications"
              hint={`${applications.length} total`}
              action={
                <Link href="/candidate/applications" className="text-[12px] font-semibold text-accent-dark">
                  View all →
                </Link>
              }
            />
            {applications.length === 0 ? (
              <Empty
                title="No applications yet"
                body="Your scored profile travels with every application, so employers see LOC and competency fit before the first call."
                action={
                  <Link href="/candidate/jobs" className="btn btn-ghost btn-sm">
                    Browse the job feed
                  </Link>
                }
              />
            ) : (
              <div className="card divide-y divide-ink/[0.06]">
                {applications.slice(0, 4).map((application) => (
                  <div key={application.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">{application.job.title}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink/50">
                        {application.job.employer.companyName} · {application.job.location || "Location flexible"} ·{" "}
                        {timeAgo(application.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-[11px] tabular-nums text-ink/40">{application.matchScore}% fit</span>
                      <span className={cn("badge", STATUS_STYLES[application.status])}>
                        {STATUS_LABELS[application.status] ?? application.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="card px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/40">Profile</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{completeness}%</p>
              <div className="mt-2">
                <Progress value={completeness} tone={completeness === 100 ? "verify" : "accent"} />
              </div>
            </div>
            <div className="card px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/40">Employer views</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{viewsCount}</p>
              <p className="mt-2 text-[10.5px] text-ink/40">Unlocks of your contact card</p>
            </div>
          </div>

          <div className="card card-pad">
            <SectionTitle title="Discoverability" />
            <div className="flex items-center justify-between rounded-xl bg-ink/[0.035] px-3.5 py-3">
              <div>
                <p className="text-[12.5px] font-semibold">
                  {profile.visible ? "Visible to verified employers" : "Hidden from search"}
                </p>
                <p className="mt-0.5 text-[11px] text-ink/45">
                  {profile.visible ? "Your card appears in talent search." : "Only you can see your profile."}
                </p>
              </div>
              <span className={cn("badge", profile.visible ? "badge-verify" : "badge-neutral")}>
                {profile.visible ? "On" : "Off"}
              </span>
            </div>
            <Link href="/candidate/profile" className="mt-3 inline-flex text-[12px] font-semibold text-accent-dark">
              Change visibility →
            </Link>
          </div>

          <div className="card card-pad">
            <SectionTitle title="Your journey" hint="8 steps from signup to placed" />
            <ol className="mt-3 space-y-2.5">
              {CANDIDATE_JOURNEY.map((step) => {
                const done = doneByStep[step.id] ?? false;
                return (
                  <li key={step.id} className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[9px] font-bold",
                        done ? "border-verify bg-verify text-white" : "border-ink/20 bg-white text-transparent",
                      )}
                      aria-hidden
                    >
                      ✓
                    </span>
                    <div className="min-w-0">
                      <p className={cn("text-[12px] font-medium leading-tight", done ? "text-ink/45" : "text-ink")}>
                        {step.title}
                      </p>
                      {!done ? (
                        <Link href={step.route} className="text-[10.5px] text-accent-dark hover:underline">
                          {step.cta}
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="card card-pad">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">Profile card preview</p>
            <p className="mt-2 text-[13px] font-semibold">{publicHeadline}</p>
            <p className="mt-0.5 text-[11.5px] text-ink/50">
              {profile.location || "Add a location"} · {profile.yearsExperience} yr
              {profile.yearsExperience === 1 ? "" : "s"} experience
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <LocPill score={profile.locScore} band={profile.locBand} size="sm" />
              {user.phoneVerified ? <span className="badge badge-verify">US mobile</span> : null}
              {profile.remoteOk ? <span className="badge badge-neutral">Remote ok</span> : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
