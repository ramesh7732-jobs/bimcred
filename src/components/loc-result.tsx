import { COMPETENCIES } from "@/lib/questions";
import { bandFor } from "@/lib/loc";
import { cn } from "@/components/ui";

type AttemptAnswer = {
  competency: string;
  correct: boolean;
  weight: number;
  difficulty: number;
};

const BAND_COLOR: Record<string, string> = {
  Emerging: "#5D7387",
  Developing: "#B7791F",
  Competent: "#ED5B26",
  Proficient: "#0F7A58",
  Expert: "#0C1B2A",
};

/** Circular LOC dial. 100 = empty arc, 500 = full arc. */
export function ScoreRing({
  score,
  band,
  size = 136,
}: {
  score: number;
  band: string | null;
  size?: number;
}) {
  const stroke = 9;
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, (score - 100) / 400));
  const color = BAND_COLOR[band ?? ""] ?? "#0C1B2A";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`LOC ${score} out of 500`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#0C1B2A" strokeOpacity="0.08" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[30px] font-semibold leading-none tabular-nums">{score}</span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink/40">LOC</span>
      </div>
    </div>
  );
}

/** Simple 10-axis radar used as a shape cue; exact numbers live in the bars. */
export function CompetencyRadar({
  values,
  size = 208,
}: {
  values: { label: string; pct: number }[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 14;
  const axes = values.length || 1;

  const point = (index: number, ratio: number): [number, number] => {
    const angle = (Math.PI * 2 * index) / axes - Math.PI / 2;
    return [cx + Math.cos(angle) * radius * ratio, cy + Math.sin(angle) * radius * ratio];
  };

  const polygon = (ratio: number): string =>
    values.map((_, index) => point(index, ratio).join(",")).join(" ");

  const shape = values
    .map((value, index) => point(index, Math.max(0.04, Math.min(1, value.pct / 100))).join(","))
    .join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon
          key={ratio}
          points={polygon(ratio)}
          fill="none"
          stroke="#0C1B2A"
          strokeOpacity={ratio === 1 ? 0.14 : 0.07}
          strokeWidth="1"
        />
      ))}
      {values.map((_, index) => {
        const [x, y] = point(index, 1);
        return <line key={index} x1={cx} y1={cy} x2={x} y2={y} stroke="#0C1B2A" strokeOpacity="0.06" strokeWidth="1" />;
      })}
      <polygon points={shape} fill="#ED5B26" fillOpacity="0.16" stroke="#ED5B26" strokeWidth="1.75" strokeLinejoin="round" />
      {values.map((value, index) => {
        const [x, y] = point(index, Math.max(0.04, Math.min(1, value.pct / 100)));
        return <circle key={value.label} cx={x} cy={y} r="2.4" fill="#ED5B26" />;
      })}
    </svg>
  );
}

function summarise(answers: AttemptAnswer[]) {
  const rows = COMPETENCIES.map((competency) => {
    const items = answers.filter((answer) => answer.competency === competency.key);
    const total = items.length;
    const correct = items.filter((item) => item.correct).length;
    const points = items.reduce((sum, item) => sum + (item.correct ? item.weight : 0), 0);
    const pointsMax = items.reduce((sum, item) => sum + item.weight, 0);
    return {
      key: competency.key,
      label: competency.label,
      total,
      correct,
      points,
      pointsMax,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }).filter((row) => row.total > 0);

  const strengths = [...rows]
    .filter((row) => row.pct >= 70)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 2)
    .map((row) => row.label);

  const gaps = [...rows]
    .filter((row) => row.pct < 60)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 2)
    .map((row) => row.label);

  return { rows, strengths, gaps };
}

/**
 * Candidate-facing result panel. Shared by the assessment page (immediately
 * after submit) and the dashboard (standing record).
 */
export function LocResultCard({
  locScore,
  locBand,
  rawScore,
  answers,
  submittedAt,
  compact = false,
}: {
  locScore: number;
  locBand: string | null;
  rawScore: number;
  answers: AttemptAnswer[];
  submittedAt: Date | null;
  compact?: boolean;
}) {
  const band = bandFor(locScore);
  const { rows, strengths, gaps } = summarise(answers);
  const radarValues = rows.length >= 3 ? rows.map((row) => ({ label: row.label, pct: row.pct })) : [];

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Level of Competence
          </p>
          <p className="mt-0.5 text-[13px] font-semibold">
            {band.label} band · {band.min}–{band.max}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-verify">
            <span className="h-1 w-1 rounded-full bg-verify" />
            Verified attempt
          </span>
          {submittedAt ? (
            <span className="text-[11px] text-ink/40">
              {submittedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          ) : null}
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={locScore} band={band.label} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h3 className="text-lg font-semibold">{band.label}</h3>
              <span className="badge badge-neutral">{Math.round(rawScore)}% weighted</span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/60">{band.description}</p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink/40">
              <span className="font-semibold text-ink/55">What this signals to employers: </span>
              {band.employerSignal}
            </p>
          </div>
        </div>

        {rows.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-[208px_1fr] sm:items-center">
            {!compact && radarValues.length > 0 ? (
              <div className="mx-auto hidden sm:block">
                <CompetencyRadar values={radarValues} />
              </div>
            ) : null}
            <div className="space-y-2.5">
              {rows.map((row) => (
                <div key={row.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[11.5px] text-ink/60">{row.label}</span>
                    <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-ink/40">
                      {row.correct}/{row.total}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        row.pct >= 80 ? "bg-verify" : row.pct >= 50 ? "bg-accent" : "bg-warn",
                      )}
                      style={{ width: `${Math.max(row.pct, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(strengths.length > 0 || gaps.length > 0) && !compact ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-verify-soft/60 px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-verify">Strengths</p>
              <p className="mt-1 text-[12px] text-ink/70">
                {strengths.length > 0 ? strengths.join(" · ") : "Keep building — no clear strengths yet."}
              </p>
            </div>
            <div className="rounded-xl bg-warn-soft/60 px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-warn">Growth areas</p>
              <p className="mt-1 text-[12px] text-ink/70">
                {gaps.length > 0 ? gaps.join(" · ") : "No weak sections in this attempt."}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
