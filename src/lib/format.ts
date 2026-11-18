import { parseCsv } from "./profile";

/** Format a date as "12 Mar 2026". */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/** Short relative time such as "3h ago", "2d ago". */
export function timeAgo(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return "Pay not disclosed";
  const k = (n: number) => `$${Math.round(n / 1000)}k`;
  if (min && max && min !== max) return `${k(min)} – ${k(max)}`;
  return k((min ?? max) as number);
}

/**
 * Heuristic 0-100 fit between a posting and a candidate. Deliberately
 * explainable: LOC window fit (70 points), experience (15) and tool overlap (15).
 * Never used to rank candidates against each other in search, only to help a
 * candidate triage the job feed.
 */
export function jobMatchScore(
  job: { minLoc: number; maxLoc: number; competencies: string },
  candidate: { locScore: number | null; yearsExperience: number; software: string; disciplines: string },
): number {
  if (candidate.locScore == null) return 0;

  const min = job.minLoc > 0 ? job.minLoc : 100;
  const max = job.maxLoc > 0 ? job.maxLoc : 500;
  let locFit = 0;
  if (candidate.locScore >= min && candidate.locScore <= max) locFit = 1;
  else if (candidate.locScore < min) locFit = Math.max(0, 1 - (min - candidate.locScore) / 150);
  else locFit = Math.max(0, 1 - (candidate.locScore - max) / 150);

  const expFit = Math.min(1, candidate.yearsExperience / 6);
  const tools = parseCsv(candidate.software);
  const overlap = parseCsv(job.competencies).length > 0 ? Math.min(1, tools.length / 5) : 1;

  return Math.round(Math.min(100, 70 * locFit + 15 * expFit + 15 * overlap));
}

/** Percentage helper that never divides by zero. */
export function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/** Clamp helper. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Safe positive integer parse with a fallback. */
export function toInt(value: string | null | undefined, fallback = 0): number {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}
