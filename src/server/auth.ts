import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

/**
 * Session + password primitives for BIMcred.
 *
 * The prototype deliberately avoids an external identity provider: a signed,
 * httpOnly cookie is enough to demonstrate role separation, and it keeps the
 * whole app runnable offline. In production this file is the single place to
 * swap in an OIDC provider or rotate to asymmetric (EdDSA) tokens.
 */

export const SESSION_COOKIE = "bimcred_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type Role = "CANDIDATE" | "EMPLOYER" | "ADMIN";

export const ROLES: Role[] = ["CANDIDATE", "EMPLOYER", "ADMIN"];

export type SessionUser = {
  uid: string;
  email: string;
  name: string;
  role: Role;
  exp: number;
};

function secret(): string {
  const value = process.env.SESSION_SECRET;
  // A missing or short secret in production would let anyone forge a session
  // cookie, including an admin one. Fail closed instead of using the dev value.
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) {
    throw new Error(
      "SESSION_SECRET must be set to at least 32 characters in production. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
    );
  }
  return value ?? "bimcred-insecure-dev-secret";
}

export function signSession(
  user: Omit<SessionUser, "exp">,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): string {
  const payload: SessionUser = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionUser | null {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);

  // Constant-time comparison prevents signature-timing leaks.
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionUser;
    if (!parsed || typeof parsed.uid !== "string" || !ROLES.includes(parsed.role)) return null;
    if (typeof parsed.exp !== "number" || parsed.exp * 1000 < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(user: Omit<SessionUser, "exp">): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

const HOME_BY_ROLE: Record<Role, string> = {
  CANDIDATE: "/candidate",
  EMPLOYER: "/employer",
  ADMIN: "/admin",
};

export function homeFor(role: Role): string {
  return HOME_BY_ROLE[role] ?? "/";
}

/** Redirects unauthenticated visitors to /login. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Role gate that is enforced on the server, not in the UI. Every portal layout
 * calls this, and every mutating action re-checks ownership of the row it edits.
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const session = await requireUser();
  if (session.role !== role) redirect(homeFor(session.role));
  return session;
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function randomOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/** E.164-ish normalisation for US numbers: digits only, leading country code stripped. */
export function normalizeUsPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let ten = digits;
  if (digits.length === 11 && digits.startsWith("1")) ten = digits.slice(1);
  if (ten.length !== 10) return null;
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(ten)) return null;
  return `+1${ten}`;
}

export function formatUsPhone(e164: string | null | undefined): string {
  if (!e164) return "Not added";
  const digits = e164.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return e164;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
