import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LOC_BANDS } from "@/lib/loc";

/**
 * Split-screen frame for /login and /signup. The left panel does the product
 * education work (what LOC is, why verification matters) so the form stays
 * focused, and it is hidden on small screens where the form is the whole job.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  aside,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-white lg:flex xl:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] grain" aria-hidden />
        <div className="relative">
          <Logo invert />
          <p className="mt-14 max-w-sm text-[13px] font-semibold uppercase tracking-[0.18em] text-accent">
            Level of Competence
          </p>
          <h2 className="mt-3 max-w-md text-[34px] font-semibold leading-[1.12] tracking-tight text-white">
            Proof before the first call.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/55">
            Every candidate verifies a US mobile number and passes a timed BIM assessment. Employers
            search a pool that is already scored, not a pile of claims.
          </p>

          <div className="mt-10 max-w-md space-y-px overflow-hidden rounded-2xl border border-white/10">
            {LOC_BANDS.map((band) => (
              <div
                key={band.key}
                className="flex items-center justify-between gap-4 bg-white/[0.035] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] tabular-nums text-white/35">
                    {band.min}–{band.max}
                  </span>
                  <span className="text-[13px] font-semibold text-white/85">{band.label}</span>
                </div>
                <span className="text-[11px] text-white/35">LOC</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-10 flex items-center justify-between text-[11px] text-white/35">
          <span>BIMcred · US BIM talent infrastructure</span>
          <span>Prototype build</span>
        </div>
      </aside>

      <main className="flex flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
            <Link href="/" className="text-xs font-semibold text-ink/50 hover:text-ink">
              Back to site
            </Link>
          </div>

          <div className="hidden justify-end lg:flex">
            <Link href="/" className="text-xs font-semibold text-ink/40 transition hover:text-ink">
              ← Back to public site
            </Link>
          </div>

          <div className="mt-2 lg:mt-10">
            <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink/55">{subtitle}</p>
          </div>

          {aside ? <div className="mt-5">{aside}</div> : null}

          <div className="mt-7">{children}</div>

          {footer ? <div className="mt-6 text-sm text-ink/55">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
