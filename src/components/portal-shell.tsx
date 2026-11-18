import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { LogoMark } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { Avatar, cn } from "@/components/ui";
import { logoutAction } from "@/server/actions/auth";

export type NavItem = { href: string; label: string };

export type ShellUser = { name: string; email: string; role: string };

/**
 * Shared chrome for the three authenticated portals.
 * The sidebar is the primary navigation on desktop; on mobile it collapses into a
 * horizontally scrollable tab strip so every route stays one tap away.
 */
export function PortalShell({
  portal,
  nav,
  user,
  children,
  accentLabel,
}: {
  portal: "Candidate" | "Employer" | "Admin";
  nav: NavItem[];
  user: ShellUser;
  children: ReactNode;
  accentLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[258px] flex-col bg-ink lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo invert href="/" />
        </div>

        <div className="mx-5 mt-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Portal</p>
          <p className="mt-0.5 text-[13px] font-semibold text-white">{portal}</p>
          {accentLabel ? <p className="mt-0.5 text-[11px] text-accent">{accentLabel}</p> : null}
        </div>

        <nav className="mt-5 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <Avatar name={user.name} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-white/40">{user.email}</p>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between px-2">
            <Link href="/" className="text-[11px] text-white/40 transition hover:text-white/80">
              View public site
            </Link>
            <form action={logoutAction} className="inline">
              <button
                type="submit"
                className="text-[11px] font-semibold text-white/40 transition hover:text-accent"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <span className="text-ink">
              <LogoMark className="h-6 w-6" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">
              {portal}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={28} />
            <form action={logoutAction}>
              <button type="submit" className="text-[11px] font-semibold text-ink/50 hover:text-accent">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="lg:pl-[258px]">
        <div className="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-6 sm:px-8 lg:pt-10">
          {/* Mobile tab strip */}
          <div className="scroll-thin -mx-5 mb-6 flex gap-1 overflow-x-auto px-5 pb-1 lg:hidden">
            {nav.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} variant="light" />
            ))}
          </div>
          <div className={cn("animate-fade-up")}>{children}</div>
        </div>
      </div>
    </div>
  );
}
