"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { planFor, UNLOCK_COST } from "@/lib/pricing";
import { toCsv } from "@/lib/profile";

function field(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function multi(form: FormData, key: string): string[] {
  return form
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function audit(actorId: string, action: string, entity: string, entityId: string, meta: Record<string, unknown> = {}) {
  await db.auditLog
    .create({ data: { actorId, action, entity, entityId, meta: JSON.stringify(meta) } })
    .catch(() => undefined);
}

/* ------------------------------------------------------------------ */
/* Company profile & verification                                      */
/* ------------------------------------------------------------------ */

export async function updateCompanyAction(form: FormData): Promise<void> {
  const session = await requireRole("EMPLOYER");
  const employer = await db.employerProfile.findUnique({ where: { userId: session.uid } });
  if (!employer) fail("/employer", "Employer profile not found.");

  const companyName = field(form, "companyName");
  if (companyName.length < 2) fail("/employer", "Company name is required.");

  await db.employerProfile.update({
    where: { id: employer.id },
    data: {
      companyName,
      website: field(form, "website"),
      industry: field(form, "industry"),
      companySize: field(form, "companySize"),
      hqLocation: field(form, "hqLocation"),
    },
  });

  await audit(session.uid, "employer.profile.updated", "EmployerProfile", employer.id);
  revalidatePath("/employer");
  redirect("/employer?saved=1");
}

export async function requestVerificationAction(): Promise<void> {
  const session = await requireRole("EMPLOYER");
  const employer = await db.employerProfile.findUnique({ where: { userId: session.uid } });
  if (!employer) fail("/employer", "Employer profile not found.");
  if (employer.verified) fail("/employer", "This company is already verified.");

  await audit(session.uid, "employer.verification_requested", "EmployerProfile", employer.id, {
    companyName: employer.companyName,
    website: employer.website,
  });

  revalidatePath("/employer");
  revalidatePath("/admin/employers");
  redirect("/employer?requested=1");
}

/* ------------------------------------------------------------------ */
/* Credit-based candidate unlock                                       */
/* ------------------------------------------------------------------ */

export async function unlockCandidateAction(form: FormData): Promise<void> {
  const session = await requireRole("EMPLOYER");
  const candidateId = field(form, "candidateId");

  const employer = await db.employerProfile.findUnique({
    where: { userId: session.uid },
    include: { subscription: true },
  });
  if (!employer) fail("/employer", "Employer profile not found.");
  if (!employer.verified) {
    fail(`/employer/talent/${candidateId}`, "Your company must be verified before you can unlock contact details.");
  }

  const candidate = await db.candidateProfile.findUnique({
    where: { id: candidateId },
    include: { user: { select: { phoneVerified: true, name: true } } },
  });
  if (!candidate) fail("/employer/talent", "Candidate not found.");
  if (!candidate.visible || candidate.locScore == null || !candidate.user.phoneVerified) {
    fail("/employer/talent", "That candidate is no longer available in the talent pool.");
  }

  const already = await db.talentView.findUnique({
    where: { employerId_candidateId: { employerId: employer.id, candidateId } },
  });
  if (already) {
    redirect(`/employer/talent/${candidateId}`);
  }

  let failure: string | null = null;

  try {
    await db.$transaction(async (tx) => {
      const subscription = await tx.subscription.findUnique({ where: { employerId: employer.id } });
      if (!subscription || subscription.creditsRemaining < UNLOCK_COST) {
        throw new Error("NO_CREDITS");
      }

      // Conditional update keeps the balance non-negative even under retries.
      const decremented = await tx.subscription.updateMany({
        where: { employerId: employer.id, creditsRemaining: { gte: UNLOCK_COST } },
        data: {
          creditsRemaining: { decrement: UNLOCK_COST },
          creditsUsed: { increment: UNLOCK_COST },
        },
      });
      if (decremented.count === 0) throw new Error("NO_CREDITS");

      await tx.talentView.create({
        data: { employerId: employer.id, candidateId, unlockCost: UNLOCK_COST },
      });

      await tx.auditLog.create({
        data: {
          actorId: session.uid,
          action: "employer.candidate.unlocked",
          entity: "CandidateProfile",
          entityId: candidateId,
          meta: JSON.stringify({
            cost: UNLOCK_COST,
            employer: employer.companyName,
            remaining: subscription.creditsRemaining - UNLOCK_COST,
          }),
        },
      });
    });
  } catch (error) {
    failure = error instanceof Error ? error.message : "UNLOCK_FAILED";
  }

  if (failure === "NO_CREDITS") {
    fail(`/employer/talent/${candidateId}`, "You are out of unlock credits. Top up on the billing page.");
  }
  if (failure) {
    fail(`/employer/talent/${candidateId}`, "That unlock could not be completed. Try again.");
  }

  revalidatePath("/employer");
  revalidatePath("/employer/talent");
  revalidatePath(`/employer/talent/${candidateId}`);
  revalidatePath("/employer/billing");
  revalidatePath("/admin/audit");
  redirect(`/employer/talent/${candidateId}?unlocked=1`);
}

/* ------------------------------------------------------------------ */
/* Candidate reports (moderation)                                      */
/* ------------------------------------------------------------------ */

export async function createReportAction(form: FormData): Promise<void> {
  const session = await requireRole("EMPLOYER");
  const candidateId = field(form, "candidateId");
  const reason = field(form, "reason");
  const details = field(form, "details").slice(0, 600);

  const employer = await db.employerProfile.findUnique({ where: { userId: session.uid } });
  if (!employer) fail("/employer/talent", "Employer profile not found.");

  const candidate = await db.candidateProfile.findUnique({
    where: { id: candidateId },
    select: { id: true, userId: true },
  });
  if (!candidate) fail("/employer/talent", "Candidate not found.");
  if (reason.length < 3) {
    fail(`/employer/talent/${candidateId}`, "Choose a reason for the report.");
  }

  await db.report.create({
    data: {
      reporterId: session.uid,
      candidateId: candidate.id,
      reportedUserId: candidate.userId,
      reason,
      details,
      status: "OPEN",
    },
  });

  await audit(session.uid, "employer.candidate.reported", "CandidateProfile", candidate.id, {
    reason,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirect(`/employer/talent/${candidateId}?reported=1`);
}

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

export async function createJobAction(form: FormData): Promise<void> {
  const session = await requireRole("EMPLOYER");
  const employer = await db.employerProfile.findUnique({
    where: { userId: session.uid },
    include: { subscription: true, jobs: { select: { status: true } } },
  });
  if (!employer) fail("/employer/jobs/new", "Employer profile not found.");

  const title = field(form, "title");
  if (title.length < 4) fail("/employer/jobs/new", "Add a job title of at least 4 characters.");

  if (!employer.verified) {
    fail("/employer/jobs/new", "Your company must be verified before you can publish a role.");
  }

  const plan = planFor(employer.subscription?.plan ?? "TRIAL");
  if (plan.jobPosts !== -1) {
    const live = employer.jobs.filter((job) => job.status !== "CLOSED").length;
    if (live >= plan.jobPosts) {
      fail("/employer/jobs/new", `Your ${plan.name} plan includes ${plan.jobPosts} active job posts. Close a role or upgrade.`);
    }
  }

  const minLoc = Number.parseInt(field(form, "minLoc") || "300", 10);
  const maxLoc = Number.parseInt(field(form, "maxLoc") || "500", 10);
  if (!Number.isFinite(minLoc) || !Number.isFinite(maxLoc) || minLoc < 100 || maxLoc > 500 || minLoc > maxLoc) {
    fail("/employer/jobs/new", "Use a LOC window inside 100–500 with the floor below the ceiling.");
  }

  const salaryMin = Number.parseInt(field(form, "salaryMin") || "0", 10);
  const salaryMax = Number.parseInt(field(form, "salaryMax") || "0", 10);
  if (salaryMin && salaryMax && salaryMin > salaryMax) {
    fail("/employer/jobs/new", "Minimum salary cannot be higher than the maximum.");
  }

  const job = await db.job.create({
    data: {
      employerId: employer.id,
      title,
      description: field(form, "description"),
      location: field(form, "location"),
      workMode: field(form, "workMode") || "HYBRID",
      employmentType: field(form, "employmentType") || "FULL_TIME",
      minLoc: Math.max(100, Math.min(500, minLoc)),
      maxLoc: Math.max(100, Math.min(500, maxLoc)),
      salaryMin: salaryMin > 0 ? salaryMin : null,
      salaryMax: salaryMax > 0 ? salaryMax : null,
      competencies: toCsv(multi(form, "competencies")),
      status: "OPEN",
    },
  });

  await audit(session.uid, "employer.job.created", "Job", job.id, { title });

  revalidatePath("/employer/jobs");
  revalidatePath("/candidate/jobs");
  redirect("/employer/jobs?created=1");
}

export async function setJobStatusAction(form: FormData): Promise<void> {
  const session = await requireRole("EMPLOYER");
  const jobId = field(form, "jobId");
  const status = field(form, "status");

  if (!["OPEN", "CLOSED", "DRAFT"].includes(status)) {
    fail("/employer/jobs", "Unknown job status.");
  }

  const job = await db.job.findUnique({ where: { id: jobId }, include: { employer: true } });
  if (!job || job.employer.userId !== session.uid) {
    fail("/employer/jobs", "Job not found.");
  }

  await db.job.update({ where: { id: job.id }, data: { status } });
  await audit(session.uid, "employer.job.status_changed", "Job", job.id, { status });

  revalidatePath("/employer/jobs");
  revalidatePath("/candidate/jobs");
  redirect("/employer/jobs?updated=1");
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                            */
/* ------------------------------------------------------------------ */

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["REVIEWED", "SHORTLISTED", "REJECTED"],
  REVIEWED: ["SHORTLISTED", "INTERVIEW", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "OFFER", "REJECTED"],
  INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: ["REVIEWED"],
  WITHDRAWN: [],
};

export async function moveApplicationAction(form: FormData): Promise<void> {
  const session = await requireRole("EMPLOYER");
  const applicationId = field(form, "applicationId");
  const status = field(form, "status");

  const employer = await db.employerProfile.findUnique({ where: { userId: session.uid } });
  if (!employer) fail("/employer/pipeline", "Employer profile not found.");

  const application = await db.application.findUnique({ where: { id: applicationId } });
  if (!application || application.employerId !== employer.id) {
    fail("/employer/pipeline", "Application not found.");
  }

  const allowed = ALLOWED_TRANSITIONS[application.status] ?? [];
  if (!allowed.includes(status)) {
    fail("/employer/pipeline", `Cannot move an application from ${application.status} to ${status}.`);
  }

  await db.application.update({ where: { id: application.id }, data: { status } });
  await audit(session.uid, "employer.application.moved", "Application", application.id, {
    from: application.status,
    to: status,
  });

  revalidatePath("/employer/pipeline");
  revalidatePath("/candidate/applications");
  redirect("/employer/pipeline?moved=1");
}

export async function saveApplicationNoteAction(form: FormData): Promise<void> {
  const session = await requireRole("EMPLOYER");
  const applicationId = field(form, "applicationId");
  const note = field(form, "note").slice(0, 600);

  const employer = await db.employerProfile.findUnique({ where: { userId: session.uid } });
  if (!employer) fail("/employer/pipeline", "Employer profile not found.");

  const application = await db.application.findUnique({ where: { id: applicationId } });
  if (!application || application.employerId !== employer.id) {
    fail("/employer/pipeline", "Application not found.");
  }

  await db.application.update({ where: { id: application.id }, data: { note } });
  revalidatePath("/employer/pipeline");
  redirect("/employer/pipeline?saved=1");
}

/* ------------------------------------------------------------------ */
/* Billing (simulated - no payment processor in the prototype)         */
/* ------------------------------------------------------------------ */

export async function changePlanAction(form: FormData): Promise<void> {
  const session = await requireRole("EMPLOYER");
  const planKey = field(form, "plan");
  const plan = planFor(planKey);

  const employer = await db.employerProfile.findUnique({ where: { userId: session.uid } });
  if (!employer) fail("/employer/billing", "Employer profile not found.");

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  await db.subscription.upsert({
    where: { employerId: employer.id },
    create: {
      employerId: employer.id,
      plan: plan.key,
      creditsRemaining: plan.credits,
      creditsUsed: 0,
      currentPeriodEnd: periodEnd,
    },
    update: {
      plan: plan.key,
      creditsRemaining: plan.credits,
      currentPeriodEnd: periodEnd,
    },
  });

  await audit(session.uid, "billing.plan.changed", "Subscription", employer.id, {
    plan: plan.key,
    credits: plan.credits,
  });

  revalidatePath("/employer/billing");
  redirect("/employer/billing?plan=1");
}

export async function topUpCreditsAction(form: FormData): Promise<void> {
  const session = await requireRole("EMPLOYER");
  const amountRaw = Number.parseInt(field(form, "amount") || "10", 10);
  const amount = Number.isFinite(amountRaw) ? Math.min(500, Math.max(1, amountRaw)) : 10;

  const employer = await db.employerProfile.findUnique({ where: { userId: session.uid } });
  if (!employer) fail("/employer/billing", "Employer profile not found.");

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

  await audit(session.uid, "billing.credits.top_up", "Subscription", employer.id, { amount });

  revalidatePath("/employer/billing");
  revalidatePath("/employer/talent");
  redirect("/employer/billing?topup=1");
}
