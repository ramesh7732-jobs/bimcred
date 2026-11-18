import { requireRole } from "@/server/auth";
import { PortalShell } from "@/components/portal-shell";

export const metadata = { title: "Candidate portal" };

const NAV = [
  { href: "/candidate", label: "Overview" },
  { href: "/candidate/profile", label: "Profile & visibility" },
  { href: "/candidate/verify-phone", label: "Mobile verification" },
  { href: "/candidate/assessment", label: "Skill assessment" },
  { href: "/candidate/jobs", label: "Job feed" },
  { href: "/candidate/applications", label: "Applications" },
];

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("CANDIDATE");
  return (
    <PortalShell
      portal="Candidate"
      nav={NAV}
      user={{ name: session.name, email: session.email, role: session.role }}
      accentLabel="Free account · never charged"
    >
      {children}
    </PortalShell>
  );
}
