import Link from "next/link";
import { cn } from "@/components/ui";

/**
 * BIMcred mark: a stacked "level" glyph (two offset planes) with a signal dot.
 * Pure CSS/SVG so it renders identically at every size with no asset pipeline.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn("h-7 w-7", className)}>
      <rect x="2.5" y="8" width="13" height="13" rx="3" fill="currentColor" opacity="0.28" />
      <rect x="8.5" y="3" width="13" height="13" rx="3" fill="currentColor" />
      <circle cx="18" cy="18" r="3.25" fill="#ED5B26" />
    </svg>
  );
}

export function Logo({
  invert = false,
  href = "/",
  compact = false,
}: {
  invert?: boolean;
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="BIMcred home">
      <span className={cn("shrink-0", invert ? "text-white" : "text-ink")}>
        <LogoMark />
      </span>
      {!compact ? (
        <span
          className={cn(
            "text-[17px] font-semibold leading-none tracking-tight",
            invert ? "text-white" : "text-ink",
          )}
        >
          BIM<span className="text-accent">cred</span>
        </span>
      ) : null}
    </Link>
  );
}
