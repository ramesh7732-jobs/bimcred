"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

export function NavLink({
  href,
  label,
  variant = "dark",
}: {
  href: string;
  label: string;
  variant?: "dark" | "light";
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition",
        variant === "dark"
          ? active
            ? "bg-white/[0.09] text-white"
            : "text-white/55 hover:bg-white/[0.05] hover:text-white/90"
          : active
            ? "bg-ink/[0.06] text-ink"
            : "text-ink/55 hover:bg-ink/[0.035] hover:text-ink",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-sm transition",
          variant === "dark"
            ? active
              ? "bg-accent"
              : "bg-white/25 group-hover:bg-white/50"
            : active
              ? "bg-accent"
              : "bg-ink/20 group-hover:bg-ink/40",
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}
