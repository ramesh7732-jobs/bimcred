import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Field, Flash } from "@/components/ui";
import { getSession, homeFor } from "@/server/auth";
import { loginAction } from "@/server/actions/auth";

export const metadata = { title: "Sign in" };

const DEMO_ACCOUNTS = [
  {
    role: "Candidate",
    email: "maya.chen@example.com",
    password: "Candidate123!",
    detail: "LOC 414 · Austin, TX",
  },
  {
    role: "Employer",
    email: "talent@aecbuild.com",
    password: "Employer123!",
    detail: "AEC Build Group · Growth",
  },
  {
    role: "Admin",
    email: "admin@bimcred.com",
    password: "Admin123!",
    detail: "Operations console",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));

  const sp = await searchParams;

  return (
    <AuthShell
      title="Sign in to BIMcred"
      subtitle="One account works across the candidate, employer and admin portals. Your role decides where you land."
      footer={
        <p>
          New here?{" "}
          <Link href="/signup" className="link">
            Create a free account
          </Link>
        </p>
      }
      aside={
        <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">
            Demo accounts · one click
          </p>
          <div className="mt-3 grid gap-2">
            {DEMO_ACCOUNTS.map((demo) => (
              <form key={demo.role} action={loginAction} className="flex items-center gap-3">
                <input type="hidden" name="email" value={demo.email} />
                <input type="hidden" name="password" value={demo.password} />
                <button
                  type="submit"
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white px-3 py-2 text-left transition hover:border-ink/25 hover:bg-paper"
                >
                  <span>
                    <span className="block text-[12.5px] font-semibold text-ink">
                      Continue as {demo.role}
                    </span>
                    <span className="block text-[11px] text-ink/45">{demo.detail}</span>
                  </span>
                  <span className="text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-accent">
                    →
                  </span>
                </button>
              </form>
            ))}
          </div>
        </div>
      }
    >
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}
      {sp.email ? (
        <div className="mb-4 rounded-xl bg-ink/[0.04] px-4 py-3 text-xs text-ink/60">
          Last attempted: <span className="font-semibold text-ink">{sp.email}</span>
        </div>
      ) : null}

      <form action={loginAction} className="space-y-4">
        <Field label="Work or personal email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={sp.email ?? ""}
            placeholder="you@company.com"
            className="input"
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="input"
          />
        </Field>

        <button type="submit" className="btn btn-primary btn-lg w-full">
          Sign in
        </button>
      </form>

      <p className="mt-4 text-[11px] leading-relaxed text-ink/40">
        Demo passwords are seeded for local testing only. In production this screen would also offer
        SSO and password reset through the identity provider.
      </p>
    </AuthShell>
  );
}
