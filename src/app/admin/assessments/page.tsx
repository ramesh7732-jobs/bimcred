import Link from "next/link";
import { requireRole } from "@/server/auth";
import { locDistribution, questionAnalytics } from "@/server/queries";
import { COMPETENCIES, QUESTIONS } from "@/lib/questions";
import { LOC_BANDS } from "@/lib/loc";
import {
  Flash,
  LocMeter,
  PageHeader,
  SectionTitle,
  Stat,
  cn,
} from "@/components/ui";

export const metadata = { title: "Assessment health" };

const DIFFICULTY_LABEL: Record<number, string> = {
  1: "Recall",
  2: "Applied",
  3: "Analysis",
};

export default async function AdminAssessmentsPage() {
  await requireRole("ADMIN");

  const [analytics, bands] = await Promise.all([questionAnalytics(), locDistribution()]);
  const analyticsById = new Map(analytics.map((row) => [row.questionId, row]));

  const rows = QUESTIONS.map((question) => {
    const data = analyticsById.get(question.id);
    return {
      id: question.id,
      prompt: question.prompt,
      competency: question.competency,
      difficulty: question.difficulty,
      answer: question.answer,
      attempts: data?.attempts ?? 0,
      correct: data?.correct ?? 0,
      correctRate: data?.correctRate ?? 0,
    };
  });

  const legacy = analytics.filter((row) => !QUESTIONS.some((question) => question.id === row.questionId));
  const seen = rows.filter((row) => row.attempts > 0);
  const busiestAttempts = Math.max(0, ...analytics.map((row) => row.attempts));
  const weightedRate = seen.length
    ? Math.round(seen.reduce((sum, row) => sum + row.correctRate, 0) / seen.length)
    : 0;
  const flagged = seen.filter((row) => row.correctRate < 60);
  const bandTotal = bands.reduce((sum, band) => sum + band.count, 0);

  const competencyRows = COMPETENCIES.map((competency) => {
    const items = rows.filter((row) => row.competency === competency.key);
    const attempts = items.reduce((sum, item) => sum + item.attempts, 0);
    const correct = items.reduce((sum, item) => sum + item.correct, 0);
    return {
      ...competency,
      items: items.length,
      attempts,
      correct,
      rate: attempts ? Math.round((correct / attempts) * 100) : 0,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Quality"
        title="Assessment health"
        description="Per-item accuracy across submitted attempts. Low-volume items are flagged rather than silently trusted."
        actions={
          <Link href="/admin/audit" className="btn btn-ghost btn-sm">
            Audit log
          </Link>
        }
      />

      <div className="metric-grid mb-5">
        <Stat label="Bank size" value={QUESTIONS.length} hint={`${COMPETENCIES.length} competencies`} />
        <Stat label="Items attempted" value={seen.length} hint="With at least one answer" tone={seen.length ? "verify" : "ink"} />
        <Stat label="Mean correct rate" value={weightedRate ? `${weightedRate}%` : "—"} hint="Across attempted items" tone="accent" />
        <Stat label="Needs review" value={flagged.length} hint="Below 60% correct" tone={flagged.length ? "warn" : "ink"} />
      </div>

      {analytics.length === 0 ? (
        <Flash kind="info" message="No answered questions yet. Complete a candidate assessment to populate item analytics." />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr] lg:items-start">
        <div className="card overflow-hidden">
          <div className="border-b border-ink/[0.07] px-5 py-4">
            <SectionTitle
              title="Item performance"
              hint={`${busiestAttempts} answer rows at the busiest item · all-time`}
            />
          </div>
          <div className="scroll-thin overflow-x-auto">
            <table className="table-base min-w-[760px]">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Competency</th>
                  <th>Difficulty</th>
                  <th>Attempts</th>
                  <th>Correct rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const competency = COMPETENCIES.find((item) => item.key === row.competency);
                  return (
                    <tr key={row.id}>
                      <td>
                        <p className="font-mono text-[11.5px] font-semibold tabular-nums">{row.id}</p>
                        <p className="mt-0.5 line-clamp-2 max-w-[280px] text-[10.5px] leading-relaxed text-ink/45">
                          {row.prompt}
                        </p>
                      </td>
                      <td className="text-[11.5px] text-ink/60">{competency?.label ?? row.competency}</td>
                      <td>
                        <span className="badge badge-neutral">
                          {row.difficulty} · {DIFFICULTY_LABEL[row.difficulty] ?? "Item"}
                        </span>
                      </td>
                      <td className="font-mono text-[11.5px] tabular-nums text-ink/60">{row.attempts}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink/[0.07]">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                row.attempts === 0
                                  ? "bg-ink/15"
                                  : row.correctRate >= 80
                                    ? "bg-verify"
                                    : row.correctRate >= 60
                                      ? "bg-accent"
                                      : "bg-warn",
                              )}
                              style={{ width: `${Math.max(row.correctRate, 2)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10.5px] tabular-nums text-ink/50">
                            {row.attempts ? `${row.correctRate}%` : "—"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card card-pad">
            <SectionTitle title="Competency coverage" hint="Items and observed accuracy" />
            <div className="mt-3 space-y-2.5">
              {competencyRows.map((row) => (
                <div key={row.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[11.5px] text-ink/60">{row.label}</span>
                    <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink/35">
                      {row.items} item{row.items === 1 ? "" : "s"} · {row.attempts ? `${row.rate}%` : "unseen"}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
                    <div
                      className={cn("h-full rounded-full", row.rate >= 70 ? "bg-verify" : row.rate > 0 ? "bg-accent" : "bg-ink/15")}
                      style={{ width: `${row.attempts ? Math.max(row.rate, 3) : 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <SectionTitle title="LOC spread" hint={`${bandTotal} scored candidates`} />
            <div className="mt-3 space-y-2.5">
              {bands.map((band) => (
                <div key={band.band} className="flex items-center gap-2">
                  <span className="w-[86px] shrink-0 text-[11px] text-ink/55">{band.band}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        band.band === "Expert"
                          ? "bg-ink"
                          : band.band === "Proficient"
                            ? "bg-verify"
                            : band.band === "Competent"
                              ? "bg-accent"
                              : band.band === "Developing"
                                ? "bg-warn"
                                : "bg-ink/30",
                      )}
                      style={{ width: `${bandTotal ? Math.max(3, (band.count / bandTotal) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-ink/40">
                    {band.count}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <LocMeter score={bandTotal ? Math.round(bands.reduce((sum, band) => sum + band.avg * band.count, 0) / bandTotal) : null} showLabels />
            </div>
          </div>

          <div className="card card-pad">
            <SectionTitle title="Band reference" hint="Published LOC ranges" />
            <div className="mt-2 space-y-1">
              {LOC_BANDS.map((band) => (
                <div key={band.key} className="flex items-center justify-between border-b border-ink/[0.05] py-1.5 last:border-0">
                  <span className="text-[11.5px] text-ink/60">{band.label}</span>
                  <span className="font-mono text-[10.5px] tabular-nums text-ink/35">
                    {band.min}–{band.max}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {legacy.length > 0 ? (
        <div className="mt-6 card overflow-hidden">
          <div className="border-b border-ink/[0.07] px-5 py-4">
            <SectionTitle title="Historical items" hint="Answer rows from a retired or seeded question bank" />
          </div>
          <div className="scroll-thin overflow-x-auto">
            <table className="table-base min-w-[560px]">
              <thead>
                <tr>
                  <th>Question id</th>
                  <th>Competency</th>
                  <th>Attempts</th>
                  <th>Correct</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {legacy.map((row) => (
                  <tr key={row.questionId}>
                    <td className="font-mono text-[11.5px]">{row.questionId}</td>
                    <td className="text-[11.5px] text-ink/60">{row.competency}</td>
                    <td className="font-mono tabular-nums">{row.attempts}</td>
                    <td className="font-mono tabular-nums">{row.correct}</td>
                    <td className="font-mono tabular-nums">{row.correctRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
}
