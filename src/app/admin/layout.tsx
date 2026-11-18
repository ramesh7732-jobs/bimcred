import { requireRole } from "@/server/auth";
import { PortalShell } from "@/components/portal-shell";

export const metadata = { title: "Operations console" };

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/employers", label: "Employers" },
  { href: "/admin/users", label: "Candidates & users" },
  { href: "/admin/assessments", label: "Assessment health" },
  { href: "/admin/audit", label: "Audit log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("ADMIN");

  return (
    <PortalShell
      portal="Admin"
      nav={NAV}
      user={{ name: session.name, email: session.email, role: session.role }}
      accentLabel="Operations console"
    >
      {children}
    </PortalShell>
  );
}
