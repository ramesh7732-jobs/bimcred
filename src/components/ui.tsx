import Link from "next/link";
import type { ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
/* ------------------------------------------------------------------ */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-dark">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold sm:text-[28px]">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-ink/55">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "ink",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "ink" | "accent" | "verify" | "warn";
}) {
  const toneClass =
    tone === "accent"
      ? "text-accent-dark"
      : tone === "verify"
        ? "text-verify"
        : tone === "warn"
          ? "text-warn"
          : "text-ink";
  return (
    <div className="card card-pad">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/45">{label}</p>
      <p className={cn("kpi mt-2", toneClass)}>{value}</p>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-ink/50">{hint}</p> : null}
    </div>
  );
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white/60 px-6 py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.05]">
        <span className="h-2 w-2 rounded-full bg-accent" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink/55">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Flash({ kind, message }: { kind: "error" | "ok" | "info"; message: string }) {
  const styles =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : kind === "ok"
        ? "border-verify/20 bg-verify-soft text-verify"
        : "border-ink/10 bg-ink/[0.04] text-ink/70";
  return (
    <div className={cn("mb-5 rounded-xl border px-4 py-3 text-sm font-medium", styles)} role="status">
      {message}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-ink/45">{hint}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LOC-specific visual language                                        */
/* ------------------------------------------------------------------ */

export const BAND_STYLES: Record<string, string> = {
  Emerging: "bg-ink/[0.07] text-ink/70",
  Developing: "bg-warn-soft text-warn",
  Competent: "bg-accent-soft text-accent-dark",
  Proficient: "bg-verify-soft text-verify",
  Expert: "bg-ink text-white",
};

export function bandClass(band: string | null | undefined): string {
  return BAND_STYLES[band ?? ""] ?? "bg-ink/[0.07] text-ink/70";
}

export function LocPill({
  score,
  band,
  size = "md",
}: {
  score: number | null | undefined;
  band?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  if (score == null) {
    return <span className="badge badge-neutral">Not scored</span>;
  }
  const pad = size === "lg" ? "px-3 py-1.5 text-sm" : size === "sm" ? "px-2 py-0.5 text-[10px]" : "";
  return (
    <span className={cn("badge whitespace-nowrap", bandClass(band), pad)}>
      <span className="font-mono tabular-nums">{score}</span>
      <span className="opacity-60">LOC</span>
    </span>
  );
}

export function LocMeter({
  score,
  showLabels = false,
}: {
  score: number | null | undefined;
  showLabels?: boolean;
}) {
  const value = score ?? 100;
  const pct = Math.max(0, Math.min(100, ((value - 100) / 400) * 100));
  const band =
    value >= 450 ? "Expert" : value >= 400 ? "Proficient" : value >= 300 ? "Competent" : value >= 200 ? "Developing" : "Emerging";
  const fill =
    band === "Expert" ? "bg-ink" : band === "Proficient" ? "bg-verify" : band === "Competent" ? "bg-accent" : band === "Developing" ? "bg-warn" : "bg-ink/35";
  return (
    <div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-ink/[0.08]">
        <div className={cn("h-full rounded-full transition-all", fill)} style={{ width: `${pct}%` }} />
        {[200, 300, 400, 450].map((tick) => (
          <span
            key={tick}
            aria-hidden
            className="absolute top-0 h-full w-px bg-paper/90"
            style={{ left: `${((tick - 100) / 400) * 100}%` }}
          />
        ))}
      </div>
      {showLabels ? (
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-ink/40">
          <span>100</span>
          <span>200</span>
          <span>300</span>
          <span>400</span>
          <span>500</span>
        </div>
      ) : null}
    </div>
  );
}

export function Progress({ value, tone = "accent" }: { value: number; tone?: "accent" | "verify" | "ink" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const fill = tone === "verify" ? "bg-verify" : tone === "ink" ? "bg-ink" : "bg-accent";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.08]">
      <div className={cn("h-full rounded-full transition-all", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const palette = ["bg-ink text-white", "bg-accent-soft text-accent-dark", "bg-verify-soft text-verify", "bg-warn-soft text-warn"];
  const idx = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % palette.length;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full text-[11px] font-bold", palette[idx])}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {letters || "B"}
    </span>
  );
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink/[0.06] py-2 last:border-0">
      <span className="text-xs text-ink/50">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{children}</span>
    </div>
  );
}

export function Crumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-ink/45" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 ? <span aria-hidden>/</span> : null}
          {item.href ? (
            <Link href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink/70">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
