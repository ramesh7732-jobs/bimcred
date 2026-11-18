"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { submitAssessmentAction } from "@/server/actions/candidate";
import { cn } from "@/components/ui";

export type PublicQuestion = {
  id: string;
  prompt: string;
  competencyLabel: string;
  difficulty: number;
  options: { id: string; label: string }[];
};

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Timed assessment runner. The question payload is sanitised on the server
 * (answers and explanations are never sent to the browser), the countdown is
 * enforced again server-side on submit, and the form auto-submits at zero so a
 * forgotten tab cannot strand an attempt.
 */
export function AssessmentForm({
  attemptId,
  questions,
  secondsLeft,
}: {
  attemptId: string;
  questions: PublicQuestion[];
  secondsLeft: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const autoSubmitted = useRef(false);
  const [remaining, setRemaining] = useState(Math.max(0, secondsLeft));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submitNow = useCallback(() => {
    if (submitting) return;
    setSubmitting(true);
    formRef.current?.requestSubmit();
  }, [submitting]);

  useEffect(() => {
    if (remaining <= 0) {
      if (!autoSubmitted.current) {
        autoSubmitted.current = true;
        submitNow();
      }
      return;
    }
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining, submitNow]);

  const answeredCount = Object.keys(answers).length;
  const urgent = remaining <= 120;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <form
      ref={formRef}
      action={submitAssessmentAction}
      onSubmit={() => setSubmitting(true)}
      className="pb-10"
    >
      <input type="hidden" name="attemptId" value={attemptId} />

      <div className="sticky top-14 z-20 -mx-5 mb-5 border-b border-ink/10 bg-paper/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">Time left</p>
              <p
                className={cn(
                  "font-mono text-xl font-semibold tabular-nums",
                  urgent ? "text-red-600" : "text-ink",
                )}
                aria-live="polite"
              >
                {formatClock(remaining)}
              </p>
            </div>
            <div className="h-8 w-px bg-ink/10" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">Answered</p>
              <p className="font-mono text-xl font-semibold tabular-nums">
                {answeredCount}<span className="text-ink/30">/{questions.length}</span>
              </p>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
            {submitting ? "Scoring…" : "Submit assessment"}
          </button>
        </div>
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-ink/[0.07]">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {questions.map((question, index) => {
          const done = Boolean(answers[question.id]);
          return (
            <a
              key={question.id}
              href={`#q-${question.id}`}
              className={cn(
                "grid h-7 w-7 place-items-center rounded-lg font-mono text-[11px] font-semibold transition",
                done ? "bg-ink text-white" : "bg-ink/[0.06] text-ink/45 hover:bg-ink/[0.12]",
              )}
              aria-label={`Question ${index + 1}${done ? ", answered" : ""}`}
            >
              {index + 1}
            </a>
          );
        })}
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <fieldset
            key={question.id}
            id={`q-${question.id}`}
            className="card scroll-mt-40 p-5"
          >
            <legend className="sr-only">Question {index + 1}</legend>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-ink font-mono text-[11px] font-semibold text-white">
                  {index + 1}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/45">
                  {question.competencyLabel}
                </span>
              </div>
              <span className="flex items-center gap-1" title={`Difficulty ${question.difficulty} of 3`}>
                {[1, 2, 3].map((level) => (
                  <span
                    key={level}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      level <= question.difficulty ? "bg-accent" : "bg-ink/15",
                    )}
                  />
                ))}
              </span>
            </div>

            <p className="text-[14px] font-medium leading-relaxed">{question.prompt}</p>

            <div className="mt-3.5 grid gap-2">
              {question.options.map((option) => (
                <label key={option.id} className="block cursor-pointer">
                  <input
                    type="radio"
                    name={`q_${question.id}`}
                    value={option.id}
                    onChange={() =>
                      setAnswers((previous) => ({ ...previous, [question.id]: option.id }))
                    }
                    className="peer sr-only"
                  />
                  <span className="flex items-start gap-3 rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-ink/75 transition peer-checked:border-accent peer-checked:bg-accent-soft/45 peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 hover:border-ink/25">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-ink/25 font-mono text-[9px] uppercase peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white">
                      {option.id}
                    </span>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-5 py-4">
        <p className="text-[12px] text-ink/55">
          {answeredCount < questions.length
            ? `${questions.length - answeredCount} unanswered — unanswered items score zero.`
            : "All questions answered. Review the highlighted choices before submitting."}
        </p>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Scoring…" : "Submit and see my LOC"}
        </button>
      </div>
    </form>
  );
}
