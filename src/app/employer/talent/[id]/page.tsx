import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole, formatUsPhone } from "@/server/auth";
import { db } from "@/server/db";
import { isUnlocked, loadEmployerContext } from "@/server/queries";
import {
  createReportAction,
  unlockCandidateAction,
} from "@/server/actions/employer";
import { LOC_BANDS } from "@/lib/loc";
import {
  AVAILABILITY,
  DISCIPLINES,
  SOFTWARE,
  STATUS_LABELS,
  STATUS_STYLES,
  WORK_AUTH,
  labelFor,
  parseCsv,
} from "@/lib/profile";
import { formatDate, timeAgo } from "@/lib/format";
import { LocResultCard } from "@/components/loc-result";
import {
  Crumbs,
  Empty,
  Flash,
  KeyValue,
  LocMeter,
  LocPill,
  PageHeader,
  SectionTitle,
  cn,
} from "@/components/ui";

export const metadata = { title: "Candidate profile" };

function redactName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last[0].toUpperCase()}.`;
}

export default async function EmployerCandidatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ unlocked?: string; reported?: string; error?: string }>;
}) {
  const session = await requireRole("EMPLOYER");
  const ctx = await loadEmployerContext(session.uid);
  if (!ctx) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;

  const [candidate, unlocked, view] = await Promise.all([
    db.candidateProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, phoneVerified: true, createdAt: true } },
        attempts: {
          where: { status: "COMPLETED" },
          orderBy: { submittedAt: "desc" },
          take: 1,
          include: { answers: true },
        },
        applications: {
          where: { employerId: ctx.employer.id },
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { job: { select: { id: true, title: true, status: true } } },
        },
      },
    }),
    isUnlocked(ctx.employer.id, id),
    db.talentView.findUnique({
      where: { employerId_candidateId: { employerId: ctx.employer.id, candidateId: id } },
      select: { createdAt: true, note: true },
    }),
  ]);

  if (!candidate) notFound();
  if (!candidate.visible && !unlocked) notFound();

  const latestAttempt = candidate.attempts[0] ?? null;
  const credits = ctx.subscription?.creditsRemaining ?? 0;
  const canUnlock = ctx.employer.verified && credits >= 1;
  const band = LOC_BANDS.find((item) => item.label === candidate.locBand) ?? null;
  const name = unlocked ? candidate.user.name : redactName(candidate.user.name);

  return (
    <>
      <Crumbs
        items={[
          { label: "Employer", href: "/employer" },
          { label: "Talent search", href: "/employer/talent" },
          { label: name },
        ]}
      />

      <PageHeader
        eyebrow={unlocked ? "Unlocked candidate" : "Candidate preview"}
        title={name}
        description={
          candidate.headline ||
          candidate.currentTitle ||
          "BIM professional in the verified talent pool."
        }
        actions={
          <>
            <LocPill score={candidate.locScore} band={candidate.locBand} size="lg" />
            <Link href="/employer/talent" className="btn btn-ghost btn-sm">
              Back to search
            </Link>
          </>
        }
      />

      {sp.unlocked ? (
        <Flash kind="ok" message="Contact details unlocked. This candidate is now on your permanent shortlist and re-opening is free." />
      ) : null}
      {sp.reported ? (
        <Flash kind="ok" message="Report submitted. The operations team reviews moderation reports before taking action." />
      ) : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr] lg:items-start">
        <div className="space-y-5">
          {candidate.locScore != null && latestAttempt ? (
            <LocResultCard
              locScore={candidate.locScore}
              locBand={candidate.locBand}
              rawScore={latestAttempt.rawScore}
              answers={latestAttempt.answers}
              submittedAt={latestAttempt.submittedAt}
            />
          ) : (
            <Empty
              title="No verified LOC score"
              body="This profile has not completed a scored assessment yet, so it should not appear in employer search."
            />
          )}

          <div className="card card-pad">
            <SectionTitle title="Profile" hint={`Member since ${formatDate(candidate.user.createdAt)}`} />
            <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-ink/65">
              {candidate.bio || "No bio provided."}
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/40">Disciplines</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {parseCsv(candidate.disciplines).length > 0 ? (
                    parseCsv(candidate.disciplines).map((key) => (
                      <span key={key} className="badge badge-accent">
                        {labelFor(DISCIPLINES, key)}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-ink/40">Not listed</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/40">Software</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {parseCsv(candidate.software).length > 0 ? (
                    parseCsv(candidate.software).map((key) => (
                      <span key={key} className="badge badge-neutral">
                        {labelFor(SOFTWARE, key)}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-ink/40">Not listed</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-x-8 gap-y-1 sm:grid-cols-2">
              <KeyValue label="Current title">{candidate.currentTitle || "—"}</KeyValue>
              <KeyValue label="Experience">{candidate.yearsExperience} yr</KeyValue>
              <KeyValue label="Location">{candidate.location || "US"}</KeyValue>
              <KeyValue label="Work mode">{candidate.remoteOk ? "Remote ok" : "On-site / hybrid only"}</KeyValue>
              <KeyValue label="Availability">
                {labelFor(AVAILABILITY, candidate.availability)}
              </KeyValue>
              <KeyValue label="Work authorization">
                {labelFor(WORK_AUTH, candidate.workAuthorization)}
              </KeyValue>
            </div>
          </div>

          {candidate.applications.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="border-b border-ink/[0.07] px-5 py-4">
                <SectionTitle title="Your applications from this candidate" hint="Shared pipeline, owned by your company" />
              </div>
              <div className="divide-y divide-ink/[0.06]">
                {candidate.applications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">{application.job.title}</p>
                      <p className="mt-0.5 text-[11px] text-ink/45">
                        Applied {formatDate(application.createdAt)} · {application.matchScore}% fit
                      </p>
                    </div>
                    <span className={cn("badge shrink-0", STATUS_STYLES[application.status])}>
                      {STATUS_LABELS[application.status] ?? application.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-ink/[0.06] px-5 py-3">
                <Link href="/employer/pipeline" className="text-[12px] font-semibold text-accent-dark">
                  Open the pipeline →
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="card overflow-hidden">
            <div className={cn("px-5 py-4", unlocked ? "bg-verify-soft/70" : "bg-ink")}>
              <div className="flex items-center justify-between gap-3">
                <p className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", unlocked ? "text-verify" : "text-white/50")}>
                  Contact details
                </p>
                <span className={cn("badge", unlocked ? "badge-verify" : "bg-white/10 text-white/70")}>
                  {unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
              {unlocked ? (
                <div className="mt-3 space-y-1.5 text-[13px] text-ink">
                  <p className="font-semibold">{candidate.user.name}</p>
                  <p>{candidate.user.email}</p>
                  <p className="font-mono tabular-nums">{formatUsPhone(candidate.user.phone)}</p>
                  {candidate.user.phoneVerified ? (
                    <p className="text-[11px] font-semibold text-verify">US mobile verified</p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-[13px] font-semibold text-white">{name}</p>
                  <p className="mt-1 text-[12px] text-white/50">
                    Email and mobile are hidden until you spend one unlock credit.
                  </p>
                  <p className="mt-3 font-mono text-[13px] tracking-[0.18em] text-white/30">
                    ••••@••••.com · (•••) •••-••••
                  </p>
                </div>
              )}
            </div>
            <div className="px-5 py-4">
              {unlocked ? (
                <>
                  <p className="text-[11.5px] leading-relaxed text-ink/50">
                    Unlocked {view ? timeAgo(view.createdAt) : "earlier"}. Re-opening this profile never charges again.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={`mailto:${candidate.user.email}`} className="btn btn-ink btn-sm flex-1">
                      Email candidate
                    </a>
                    <a
                      href={`tel:${candidate.user.phone ?? ""}`}
                      className={cn("btn btn-ghost btn-sm flex-1", !candidate.user.phone && "pointer-events-none opacity-40")}
                    >
                      Call
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <form action={unlockCandidateAction}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <button type="submit" className="btn btn-primary btn-sm w-full" disabled={!canUnlock}>
                      Unlock contact · 1 credit
                    </button>
                  </form>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-ink/45">
                    {!ctx.employer.verified
                      ? "Your company must be verified by an admin before unlocking contacts."
                      : credits < 1
                        ? "You have no credits left. Top up on the billing page."
                        : `${credits} credit${credits === 1 ? "" : "s"} available. This unlock is permanent for your company.`}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {!ctx.employer.verified ? (
                      <Link href="/employer" className="btn btn-ghost btn-sm flex-1">
                        Verification
                      </Link>
                    ) : null}
                    <Link href="/employer/billing" className="btn btn-ghost btn-sm flex-1">
                      Buy credits
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {band ? (
            <div className="card card-pad">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">LOC band</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-lg font-semibold">{band.label}</p>
                <span className="font-mono text-[11px] tabular-nums text-ink/40">
                  {band.min}–{band.max}
                </span>
              </div>
              <div className="mt-3">
                <LocMeter score={candidate.locScore} showLabels />
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-ink/60">{band.description}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-ink/40">{band.employerSignal}</p>
            </div>
          ) : null}

          <div className="card card-pad">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">Assessment evidence</p>
            <div className="mt-3 space-y-2">
              <KeyValue label="Status">
                <span className="badge badge-verify">Verified attempt</span>
              </KeyValue>
              <KeyValue label="Submitted">{formatDate(latestAttempt?.submittedAt ?? null)}</KeyValue>
              <KeyValue label="Correct answers">
                {latestAttempt ? `${latestAttempt.answers.filter((answer) => answer.correct).length}/${latestAttempt.answers.length}` : "—"}
              </KeyValue>
              <KeyValue label="Duration">
                {latestAttempt ? `${Math.floor(latestAttempt.durationSec / 60)}m ${latestAttempt.durationSec % 60}s` : "—"}
              </KeyValue>
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-ink/35">
              LOC is a screening signal from a fixed, reviewed question bank. It is not a certification and
              should not be the sole basis for a hiring decision.
            </p>
          </div>

          <details className="card card-pad group">
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold">Report a concern</p>
                <p className="mt-0.5 text-[11px] text-ink/45">Profile accuracy or conduct</p>
              </div>
              <span className="text-[11px] font-semibold text-ink/35 group-open:hidden">Open</span>
              <span className="hidden text-[11px] font-semibold text-ink/35 group-open:inline">Close</span>
            </summary>
            <form action={createReportAction} className="mt-4 space-y-3">
              <input type="hidden" name="candidateId" value={candidate.id} />
              <div>
                <label className="label" htmlFor="reason">
                  Reason
                </label>
                <select id="reason" name="reason" className="select" required>
                  <option value="Credential mismatch">Credential mismatch</option>
                  <option value="Profile accuracy">Profile accuracy</option>
                  <option value="Contact details invalid">Contact details invalid</option>
                  <option value="Duplicate account">Duplicate account</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="details">
                  Details
                </label>
                <textarea
                  id="details"
                  name="details"
                  rows={3}
                  className="input resize-none"
                  placeholder="What should the operations team check?"
                />
              </div>
              <button type="submit" className="btn btn-ghost btn-sm w-full">
                Submit report
              </button>
            </form>
          </details>
        </div>
      </div>
    </>
  );
}
