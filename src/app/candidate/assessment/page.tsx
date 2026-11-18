import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { loadCandidateContext } from "@/server/queries";
import { ASSESSMENT_SECONDS, COMPETENCIES, QUESTIONS } from "@/lib/questions";
import { startAssessmentAction } from "@/server/actions/candidate";
import { AssessmentForm, type PublicQuestion } from "@/components/assessment-form";
import { LocResultCard } from "@/components/loc-result";
import { Crumbs, Flash, LocPill, PageHeader, SectionTitle, cn } from "@/components/ui";

export const metadata = { title: "Skill assessment" };

function minutesLabel(seconds: number): string {
  return `${Math.round(seconds / 60)} minutes`;
}

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; result?: string }>;
}) {
  const session = await requireRole("CANDIDATE");
  const ctx = await loadCandidateContext(session.uid);
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const { user, profile, completeness, latestAttempt } = ctx;

  const running = await db.assessmentAttempt.findFirst({
    where: { userId: session.uid, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });

  let active = running;
  let expiredNow = false;
  if (running) {
    const elapsed = (Date.now() - running.startedAt.getTime()) / 1000;
    if (elapsed > ASSESSMENT_SECONDS + 60) {
      await db.assessmentAttempt.update({ where: { id: running.id }, data: { status: "EXPIRED" } });
      active = null;
      expiredNow = true;
    }
  }

  const secondsLeft = active
    ? Math.max(0, Math.round(ASSESSMENT_SECONDS - (Date.now() - active.startedAt.getTime()) / 1000))
    : 0;

  const gates = [
    { label: "Profile complete (100%)", met: completeness === 100, href: "/candidate/profile" },
    { label: "US mobile verified", met: user.phoneVerified, href: "/candidate/verify-phone" },
    { label: "No previous completed attempt", met: !latestAttempt, href: "/candidate/assessment" },
  ];
  const eligible = gates.every((gate) => gate.met);

  const publicQuestions: PublicQuestion[] = QUESTIONS.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    competencyLabel:
      COMPETENCIES.find((competency) => competency.key === question.competency)?.label ?? question.competency,
    difficulty: question.difficulty,
    options: question.options.map((option) => ({ id: option.id, label: option.label })),
  }));

  return (
    <>
      <Crumbs items={[{ label: "Candidate", href: "/candidate" }, { label: "Skill assessment" }]} />
      <PageHeader
        eyebrow="LOC assessment"
        title={latestAttempt ? "Your assessment result" : "BIM skill assessment"}
        description={
          latestAttempt
            ? "One attempt, permanently tied to your profile. Employers see the score and the competency breakdown."
            : `${QUESTIONS.length} questions · ${minutesLabel(ASSESSMENT_SECONDS)} · difficulty-weighted · one attempt.`
        }
        actions={<LocPill score={profile.locScore} band={profile.locBand} />}
      />

      {sp.result ? (
        <Flash kind="ok" message="Assessment submitted and scored. Your LOC is now on your profile and in talent search." />
      ) : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}
      {expiredNow ? (
        <Flash kind="info" message="Your previous attempt passed the time limit and was closed. You can start a new attempt." />
      ) : null}

      {latestAttempt && profile.locScore != null ? (
        <div className="space-y-5">
          <LocResultCard
            locScore={profile.locScore}
            locBand={profile.locBand}
            rawScore={latestAttempt.rawScore}
            answers={latestAttempt.answers}
            submittedAt={latestAttempt.submittedAt}
          />

          <div className="card card-pad">
            <SectionTitle title="Attempt record" hint="Retained for audit and dispute resolution" />
            <dl className="grid gap-x-8 gap-y-3 text-[12.5px] sm:grid-cols-2">
              <div className="flex justify-between border-b border-ink/[0.06] py-1.5">
                <dt className="text-ink/50">Submitted</dt>
                <dd className="font-medium">
                  {latestAttempt.submittedAt
                    ? latestAttempt.submittedAt.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between border-b border-ink/[0.06] py-1.5">
                <dt className="text-ink/50">Duration</dt>
                <dd className="font-mono font-medium tabular-nums">
                  {Math.floor(latestAttempt.durationSec / 60)}m {latestAttempt.durationSec % 60}s
                </dd>
              </div>
              <div className="flex justify-between border-b border-ink/[0.06] py-1.5">
                <dt className="text-ink/50">Weighted accuracy</dt>
                <dd className="font-mono font-medium tabular-nums">{latestAttempt.rawScore}%</dd>
              </div>
              <div className="flex justify-between border-b border-ink/[0.06] py-1.5">
                <dt className="text-ink/50">Items correct</dt>
                <dd className="font-mono font-medium tabular-nums">
                  {latestAttempt.answers.filter((answer) => answer.correct).length} / {QUESTIONS.length}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-[11px] leading-relaxed text-ink/40">
              Retakes are disabled in this prototype. A production policy would allow a cooldown-gated
              retake and publish the latest verified score, keeping the attempt history immutable.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/candidate" className="btn btn-ink btn-sm">
              Back to overview
            </Link>
            <Link href="/candidate/jobs" className="btn btn-ghost btn-sm">
              Browse matched jobs
            </Link>
          </div>
        </div>
      ) : active ? (
        <>
          <div className="mb-5 rounded-2xl border border-warn/25 bg-warn-soft/60 px-4 py-3 text-[12.5px] leading-relaxed text-ink/70">
            <span className="font-semibold">Attempt in progress.</span> The clock runs from when you
            started. Answers are only saved when you submit, and the form submits automatically at
            zero — so finish each question before you leave the tab.
          </div>
          <AssessmentForm
            attemptId={active.id}
            questions={publicQuestions}
            secondsLeft={secondsLeft}
          />
        </>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div className="card card-pad">
            <SectionTitle title="Before you start" hint="What the assessment measures" />
            <ul className="mt-3 space-y-3">
              {[
                ["15 items, 10 competencies", "ISO 19650, LOD, coordination, 5D quantities, 4D sequencing, IFC/openBIM, US standards, delivery, digital twin and automation."],
                ["Difficulty-weighted scoring", "A hard item is worth more than an easy one, so guessing your way to a high band does not work."],
                ["15-minute server-enforced window", "The timer is validated again on the server at submit; a late submission is rejected."],
                ["One attempt", "The result is published to your profile and cannot be retaken in this prototype."],
                ["No trick questions", "Every item is defensible against a published source and is reviewed before it enters the bank."],
              ].map(([title, body], index) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink/[0.05] font-mono text-[10px] font-semibold text-ink/50">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">{title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-ink/55">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl bg-ink/[0.035] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/45">Result</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink/65">
                You receive a LOC score from 100 to 500, a band label, per-competency accuracy and a
                list of strengths and growth areas. Employers see the same breakdown when they open
                your card.
              </p>
            </div>

            {eligible ? (
              <form action={startAssessmentAction} className="mt-6">
                <button type="submit" className="btn btn-primary btn-lg w-full sm:w-auto">
                  Start the 15-minute assessment
                </button>
                <p className="mt-2 text-[11px] text-ink/40">
                  The clock starts as soon as you press start. You can submit early.
                </p>
              </form>
            ) : (
              <div className="mt-6">
                <p className="text-[12px] font-semibold text-ink/60">Finish these first:</p>
                <div className="mt-2 space-y-1.5">
                  {gates
                    .filter((gate) => !gate.met)
                    .map((gate) => (
                      <Link
                        key={gate.label}
                        href={gate.href}
                        className="flex items-center justify-between rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-[12.5px] font-medium transition hover:border-ink/25"
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {gate.label}
                        </span>
                        <span className="text-accent-dark">Fix →</span>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="card card-pad">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                Competencies covered
              </p>
              <ul className="mt-3 space-y-2">
                {COMPETENCIES.map((competency) => (
                  <li key={competency.key} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-medium leading-tight">{competency.label}</p>
                      <p className="mt-0.5 text-[10.5px] leading-snug text-ink/40">{competency.description}</p>
                    </div>
                    <span className="mt-1 font-mono text-[10px] tabular-nums text-ink/30">
                      ×{competency.weight.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn("card card-pad", eligible ? "border-verify/20 bg-verify-soft/30" : "")}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">Eligibility</p>
              <ul className="mt-2.5 space-y-2">
                {gates.map((gate) => (
                  <li key={gate.label} className="flex items-center gap-2 text-[12px]">
                    <span
                      className={cn(
                        "grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold",
                        gate.met ? "bg-verify text-white" : "border border-ink/20 text-transparent",
                      )}
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span className={gate.met ? "text-ink/50" : "font-medium text-ink"}>{gate.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
