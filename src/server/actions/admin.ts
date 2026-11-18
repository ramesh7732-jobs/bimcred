"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";

function field(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function audit(actorId: string, action: string, entity: string, entityId: string, meta: Record<string, unknown> = {}) {
  await db.auditLog
    .create({ data: { actorId, action, entity, entityId, meta: JSON.stringify(meta) } })
    .catch(() => undefined);
}

/** Approve (or revoke) an employer's verification. */
export async function setEmployerVerifiedAction(form: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const employerId = field(form, "employerId");
  const verified = field(form, "verified") === "true";

  const employer = await db.employerProfile.findUnique({ where: { id: employerId } });
  if (!employer) fail("/admin/employers", "Employer not found.");

  await db.employerProfile.update({ where: { id: employer.id }, data: { verified } });

  await audit(session.uid, verified ? "admin.employer.verified" : "admin.employer.unverified", "EmployerProfile", employer.id, {
    companyName: employer.companyName,
  });

  revalidatePath("/admin/employers");
  revalidatePath("/admin");
  revalidatePath("/employer");
  revalidatePath("/employer/talent");
  redirect("/admin/employers?updated=1");
}

/** Grant unlock credits (support gesture, sales override, refund). */
export async function grantCreditsAction(form: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const employerId = field(form, "employerId");
  const amountRaw = Number.parseInt(field(form, "amount") || "10", 10);
  const amount = Number.isFinite(amountRaw) ? Math.min(500, Math.max(1, amountRaw)) : 10;

  const employer = await db.employerProfile.findUnique({ where: { id: employerId } });
  if (!employer) fail("/admin/employers", "Employer not found.");

  await db.subscription.upsert({
    where: { employerId: employer.id },
    create: {
      employerId: employer.id,
      plan: "TRIAL",
      creditsRemaining: amount,
      currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
    },
    update: { creditsRemaining: { increment: amount } },
  });

  await audit(session.uid, "admin.credits.granted", "EmployerProfile", employer.id, { amount });

  revalidatePath("/admin/employers");
  revalidatePath("/employer/billing");
  redirect("/admin/employers?granted=1");
}

/** Manually confirm a candidate's mobile number after a support call. */
export async function setPhoneVerifiedAction(form: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const userId = field(form, "userId");
  const verified = field(form, "verified") === "true";

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "CANDIDATE") fail("/admin/users", "Candidate not found.");

  await db.user.update({ where: { id: user.id }, data: { phoneVerified: verified } });
  await audit(session.uid, verified ? "admin.candidate.phone_verified" : "admin.candidate.phone_unverified", "User", user.id);

  revalidatePath("/admin/users");
  revalidatePath("/employer/talent");
  redirect("/admin/users?updated=1");
}

/** Hide or restore a candidate profile in the talent pool (moderation). */
export async function setCandidateVisibilityAction(form: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const candidateId = field(form, "candidateId");
  const visible = field(form, "visible") === "true";

  const candidate = await db.candidateProfile.findUnique({ where: { id: candidateId } });
  if (!candidate) fail("/admin/users", "Candidate profile not found.");

  await db.candidateProfile.update({ where: { id: candidate.id }, data: { visible } });
  await audit(session.uid, visible ? "admin.candidate.visible" : "admin.candidate.hidden", "CandidateProfile", candidate.id);

  revalidatePath("/admin/users");
  revalidatePath("/employer/talent");
  redirect("/admin/users?updated=1");
}

/** Resolve or dismiss a candidate report. */
export async function resolveReportAction(form: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const reportId = field(form, "reportId");
  const status = field(form, "status");
  const resolution = field(form, "resolution").slice(0, 400);

  if (!["RESOLVED", "DISMISSED"].includes(status)) fail("/admin", "Unknown resolution.");

  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report) fail("/admin", "Report not found.");

  await db.report.update({
    where: { id: report.id },
    data: { status, resolution: resolution || (status === "RESOLVED" ? "Action taken." : "No action required.") },
  });

  await audit(session.uid, `admin.report.${status.toLowerCase()}`, "Report", report.id, { resolution });

  revalidatePath("/admin");
  redirect("/admin?resolved=1");
}
