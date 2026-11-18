import { redirect } from "next/navigation";
import { requireRole, formatUsPhone } from "@/server/auth";
import { db } from "@/server/db";
import { confirmOtpAction, sendOtpAction } from "@/server/actions/candidate";
import { Crumbs, Field, Flash, PageHeader, SectionTitle, cn } from "@/components/ui";

export const metadata = { title: "Mobile verification" };

export default async function VerifyPhonePage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; verified?: string; error?: string }>;
}) {
  const session = await requireRole("CANDIDATE");
  const sp = await searchParams;

  const user = await db.user.findUnique({
    where: { id: session.uid },
    select: { phone: true, phoneVerified: true },
  });
  if (!user) redirect("/login");

  const pending = await db.phoneVerification.findFirst({
    where: { userId: session.uid, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const pendingValid = pending ? pending.expiresAt.getTime() > now : false;
  const devMode = process.env.DEV_SHOW_OTP === "true";
  const cooldown = pending ? Math.max(0, 60 - Math.floor((now - pending.createdAt.getTime()) / 1000)) : 0;

  return (
    <>
      <Crumbs items={[{ label: "Candidate", href: "/candidate" }, { label: "Mobile verification" }]} />
      <PageHeader
        eyebrow="Trust layer"
        title="Verify your US mobile"
        description="A verified number is what makes the talent pool real. Employers see the badge immediately and can only unlock your contact with a credit."
        actions={
          <span className={cn("badge", user.phoneVerified ? "badge-verify" : "badge-warn")}>
            {user.phoneVerified ? "Verified" : "Unverified"}
          </span>
        }
      />

      {sp.error ? <Flash kind="error" message={sp.error} /> : null}
      {sp.sent ? <Flash kind="ok" message="Code generated. It expires in 10 minutes." /> : null}
      {sp.verified ? (
        <Flash
          kind="ok"
          message="Mobile verified. Your profile now carries the verified badge — next stop, the skill assessment."
        />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <div className="space-y-5">
          {user.phoneVerified ? (
            <div className="card card-pad">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-verify-soft text-lg text-verify">
                  ✓
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold">Your number is verified</h2>
                  <p className="mt-1 font-mono text-[15px] tabular-nums text-ink/70">
                    {formatUsPhone(user.phone)}
                  </p>
                  <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-ink/55">
                    Employers can see that a number is verified, but the digits stay hidden until they
                    spend an unlock credit. You can change the number by contacting support in
                    production; the prototype keeps one number per account.
                  </p>
                  <p className="mt-3 text-[11px] text-ink/40">
                    Verification recorded {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-ink/[0.07] pt-4">
                <a href="/candidate/profile" className="btn btn-ghost btn-sm">
                  Continue to profile
                </a>
                <a href="/candidate/assessment" className="btn btn-ink btn-sm">
                  Go to assessment
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="card card-pad">
                <SectionTitle title="Step 1 · Enter your mobile number" hint="US numbers only, E.164 normalised on the server." />
                <form action={sendOtpAction} className="mt-3 space-y-3">
                  <Field label="US mobile number" htmlFor="phone">
                    <div className="flex items-stretch gap-2">
                      <span className="inline-flex items-center rounded-xl border border-ink/15 bg-ink/[0.03] px-3 font-mono text-sm text-ink/50">
                        +1
                      </span>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        required
                        placeholder="(415) 555-0134"
                        defaultValue={user.phone ? formatUsPhone(user.phone) : ""}
                        className="input"
                      />
                    </div>
                  </Field>
                  <button type="submit" className="btn btn-primary" disabled={cooldown > 0}>
                    {cooldown > 0 ? `Resend available in ${cooldown}s` : "Send verification code"}
                  </button>
                  <p className="text-[11px] leading-relaxed text-ink/40">
                    We store the number against your account but never publish it. A 6-digit code is
                    generated with a 10-minute expiry; requesting a new code invalidates the old one.
                  </p>
                </form>
              </div>

              <div className={cn("card card-pad transition", pendingValid ? "" : "opacity-60")}>
                <SectionTitle
                  title="Step 2 · Enter the 6-digit code"
                  hint={pendingValid ? "Check the SMS. The code expires in 10 minutes." : "Request a code first."}
                />
                <form action={confirmOtpAction} className="mt-3 space-y-3">
                  <Field label="Verification code" htmlFor="code">
                    <input
                      id="code"
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      disabled={!pendingValid}
                      placeholder="000000"
                      className="input font-mono text-lg tracking-[0.35em]"
                    />
                  </Field>
                  <button type="submit" className="btn btn-ink" disabled={!pendingValid}>
                    Verify mobile number
                  </button>
                </form>
              </div>

              {devMode && pendingValid && pending ? (
                <div className="rounded-2xl border border-dashed border-accent/40 bg-accent-soft/40 px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-dark">
                    Prototype mode · no SMS is sent
                  </p>
                  <p className="mt-1.5 flex items-baseline gap-3">
                    <span className="font-mono text-2xl font-semibold tracking-[0.3em] text-ink">
                      {pending.code}
                    </span>
                    <span className="text-[11px] text-ink/50">
                      expires {pending.expiresAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-ink/45">
                    DEV_SHOW_OTP is enabled in .env. Set it to false and wire an SMS provider
                    (Twilio/MessageBird) to send this code for real.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="card card-pad">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">Why we verify</p>
            <ul className="mt-3 space-y-3 text-[12.5px] leading-relaxed text-ink/60">
              <li>
                <span className="font-semibold text-ink">Ghost candidates are expensive.</span> A
                confirmed number means an employer's unlock credit buys a real conversation.
              </li>
              <li>
                <span className="font-semibold text-ink">One person, one score.</span> The number is a
                soft duplicate signal that makes multi-accounting visible to admins.
              </li>
              <li>
                <span className="font-semibold text-ink">Privacy by default.</span> Verification status
                is public to verified employers; the digits are not.
              </li>
            </ul>
          </div>

          <div className="card card-pad">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">Prototype rules</p>
            <dl className="mt-3 space-y-2 text-[11.5px]">
              {[
                ["Code length", "6 digits"],
                ["Expiry", "10 minutes"],
                ["Resend cooldown", "60 seconds"],
                ["Duplicate policy", "Number stored per account; admin-visible"],
                ["Failures", "Unlimited in prototype; production locks after 5"],
              ].map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 border-b border-ink/[0.06] pb-1.5">
                  <dt className="text-ink/45">{key}</dt>
                  <dd className="text-right font-medium text-ink/70">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}
