import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { PortalShell } from "@/components/portal-shell";

export const metadata = { title: "Employer portal" };

const NAV = [
  { href: "/employer", label: "Overview" },
  { href: "/employer/talent", label: "Talent search" },
  { href: "/employer/jobs", label: "Jobs" },
  { href: "/employer/pipeline", label: "Pipeline" },
  { href: "/employer/billing", label: "Billing & credits" },
];

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("EMPLOYER");
  const employer = await db.employerProfile.findUnique({
    where: { userId: session.uid },
    select: { companyName: true, verified: true, subscription: { select: { plan: true, creditsRemaining: true } } },
  });

  const label = employer
    ? `${employer.companyName || "Company"} · ${employer.subscription?.plan ?? "TRIAL"}${
        employer.verified ? "" : " · unverified"
      }`
    : "Employer";

  return (
    <PortalShell
      portal="Employer"
      nav={NAV}
      user={{ name: session.name, email: session.email, role: session.role }}
      accentLabel={label}
    >
      {children}
    </PortalShell>
  );
}
