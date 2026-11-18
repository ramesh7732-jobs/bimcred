import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Field, Flash } from "@/components/ui";
import { getSession, homeFor } from "@/server/auth";
import { signupAction } from "@/server/actions/auth";

export const metadata = { title: "Create an account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; error?: string; email?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));

  const sp = await searchParams;
  const asEmployer = sp.as === "employer";

  const tabs = [
    { href: "/signup?as=candidate", label: "I'm a BIM professional", active: !asEmployer },
    { href: "/signup?as=employer", label: "I'm hiring", active: asEmployer },
  ];

  return (
    <AuthShell
      title={asEmployer ? "Create your employer account" : "Create your free candidate account"}
      subtitle={
        asEmployer
          ? "Start with 10 unlock credits. An admin verifies your company before credits become spendable."
          : "Free forever. Verify a US mobile, take the 15-minute assessment, and publish a LOC score employers can trust."
      }
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="link">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-ink/[0.05] p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              tab.active
                ? "rounded-lg bg-white px-3 py-2 text-center text-[12.5px] font-semibold text-ink shadow-sm"
                : "rounded-lg px-3 py-2 text-center text-[12.5px] font-medium text-ink/50 transition hover:text-ink"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      <form action={signupAction} className="space-y-4">
        <input type="hidden" name="role" value={asEmployer ? "EMPLOYER" : "CANDIDATE"} />

        <Field label={asEmployer ? "Your name" : "Full name"} htmlFor="name">
          <input
            id="name"
            name="name"
            required
            minLength={2}
            autoComplete="name"
            placeholder="Jordan Alvarez"
            className="input"
          />
        </Field>

        <Field label="Work email" htmlFor="email" hint={asEmployer ? "Use your company domain - it speeds up verification." : undefined}>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={sp.email ?? ""}
            placeholder={asEmployer ? "you@aecfirm.com" : "you@example.com"}
            className="input"
          />
        </Field>

        {asEmployer ? (
          <Field label="Company name" htmlFor="companyName">
            <input
              id="companyName"
              name="companyName"
              required
              placeholder="Meridian Design Studio"
              className="input"
            />
          </Field>
        ) : (
          <Field
            label="Current role"
            htmlFor="headline"
            hint="You can refine this later. It is the first line employers see."
          >
            <input
              id="headline"
              name="headline"
              placeholder="BIM Coordinator - MEP"
              className="input"
            />
          </Field>
        )}

        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className="input"
          />
        </Field>

        <button type="submit" className="btn btn-primary btn-lg w-full">
          {asEmployer ? "Create employer account" : "Create free account"}
        </button>
      </form>

      <p className="mt-4 text-[11px] leading-relaxed text-ink/40">
        By continuing you agree that BIMcred may verify your mobile number and store your assessment
        result. Candidates are never charged and never ranked by payment.
      </p>
    </AuthShell>
  );
}
