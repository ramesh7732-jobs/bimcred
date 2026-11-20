"use server";

import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { notifySignup } from "@/server/notify";
import {
  clearSessionCookie,
  hashPassword,
  homeFor,
  normalizeEmail,
  setSessionCookie,
  verifyPassword,
  type Role,
} from "@/server/auth";

function field(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function fail(path: string, message: string, extra: Record<string, string> = {}): never {
  const params = new URLSearchParams({ error: message, ...extra });
  redirect(`${path}?${params.toString()}`);
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Email + password sign-in for all three roles. */
export async function loginAction(form: FormData): Promise<void> {
  const email = normalizeEmail(field(form, "email"));
  const password = field(form, "password");

  if (!email || !password) {
    fail("/login", "Enter your email and password.", { email });
  }

  const user = await db.user.findUnique({ where: { email } });

  // Deliberately identical message for unknown email and wrong password.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    fail("/login", "That email and password combination does not match our records.", { email });
  }

  const role = user.role as Role;
  await setSessionCookie({ uid: user.id, email: user.email, name: user.name, role });

  await db.auditLog
    .create({
      data: {
        actorId: user.id,
        action: "auth.login",
        entity: "User",
        entityId: user.id,
        meta: JSON.stringify({ role }),
      },
    })
    .catch(() => undefined);

  redirect(homeFor(role));
}

/** Candidate or employer self-serve sign-up. Creates the matching profile row. */
export async function signupAction(form: FormData): Promise<void> {
  const name = field(form, "name");
  const email = normalizeEmail(field(form, "email"));
  const password = field(form, "password");
  const roleInput = field(form, "role");
  const role: Role = roleInput === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE";
  const companyName = field(form, "companyName");
  const headline = field(form, "headline");

  const back = role === "EMPLOYER" ? "/signup?as=employer" : "/signup?as=candidate";

  if (name.length < 2) fail(back, "Please enter your full name.", { email });
  if (!validEmail(email)) fail(back, "That email address does not look right.", { email });
  if (password.length < 8) fail(back, "Use at least 8 characters for your password.", { email });
  if (role === "EMPLOYER" && companyName.length < 2) {
    fail(back, "Tell us your company name so we can verify it.", { email });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    fail("/login", "That email is already registered. Sign in instead.", { email });
  }

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role,
      ...(role === "EMPLOYER"
        ? {
            employer: {
              create: {
                companyName,
                subscription: {
                  create: { plan: "TRIAL", creditsRemaining: 10, currentPeriodEnd: periodEnd },
                },
              },
            },
          }
        : {
            candidate: {
              create: {
                headline: headline || "BIM professional",
                visible: false,
              },
            },
          }),
    },
  });

  await db.auditLog
    .create({
      data: {
        actorId: user.id,
        action: "auth.signup",
        entity: "User",
        entityId: user.id,
        meta: JSON.stringify({ role, companyName: role === "EMPLOYER" ? companyName : undefined }),
      },
    })
    .catch(() => undefined);

  await notifySignup({
    name,
    email,
    role,
    companyName: role === "EMPLOYER" ? companyName : undefined,
  });

  await setSessionCookie({ uid: user.id, email: user.email, name: user.name, role });

  redirect(role === "EMPLOYER" ? "/employer?welcome=1" : "/candidate?welcome=1");
}

/** Clears the session cookie and returns to the public site. */
export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
