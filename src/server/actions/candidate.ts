"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { normalizeUsPhone, randomOtp, requireRole } from "@/server/auth";
import { scoreAssessment } from "@/lib/loc";
import { ASSESSMENT_SECONDS, QUESTIONS } from "@/lib/questions";
import { profileCompleteness, toCsv } from "@/lib/profile";
import { jobMatchScore } from "@/lib/format";

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
    .create({
      data: { actorId, action, entity, entityId, meta: JSON.stringify(meta) },
    })
    .catch(() => undefined);
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export async function updateProfileAction(form: FormData): Promise<void> {
  const session = await requireRole("CANDIDATE");
  const profile = await db.candidateProfile.findUnique({ where: { userId: session.uid } });
  if (!profile) fail("/candidate/profile", "Candidate profile not found.");

  const headline = field(form, "headline");
  const location = field(form, "location");
  const yearsRaw = Number.parseInt(field(form, "yearsExperience") || "0", 10);

  if (headline.length < 8) {
    fail("/candidate/profile", "Headline needs at least 8 characters so employers know what you do.");
  }
  if (location.length < 3) {
    fail("/candidate/profile", "Add your city and state (for example, Austin, TX).");
  }

  const yearsExperience = Number.isFinite(yearsRaw) ? Math.max(0, Math.min(50, yearsRaw)) : 0;

  await db.candidateProfile.update({
    where: { id: profile.id },
    data: {
      headline,
      currentTitle: field(form, "currentTitle"),
      location,
      yearsExperience,
      availability: field(form, "availability") || "OPEN",
      workAuthorization: field(form, "workAuthorization") || "US_CITIZEN",
      remoteOk: form.get("remoteOk") === "on",
      bio: field(form, "bio"),
      disciplines: toCsv(multi(form, "disciplines")),
      software: toCsv(multi(form, "software")),
      visible: form.get("visible") === "on",
    },
  });

  await audit(session.uid, "candidate.profile.updated", "CandidateProfile", profile.id, {
    yearsExperience,
    visible: form.get("visible") === "on",
  });

  revalidatePath("/candidate");
  revalidatePath("/candidate/profile");
  revalidatePath("/employer/talent");
  redirect("/candidate/profile?saved=1");
}

/* ------------------------------------------------------------------ */
/* US mobile verification                                              */
/* ------------------------------------------------------------------ */

export async function sendOtpAction(form: FormData): Promise<void> {
  const session = await requireRole("CANDIDATE");
  const phone = normalizeUsPhone(field(form, "phone"));

  if (!phone) {
    fail(
      "/candidate/verify-phone",
      "Enter a valid 10-digit US mobile number, for example (415) 555-0134.",
    );
  }

  const settings = await db.user.findUnique({
    where: { id: session.uid },
    select: { phoneVerified: true },
  });
  if (settings?.phoneVerified) {
    fail("/candidate/verify-phone", "This account already has a verified mobile number.");
  }

  const recent = await db.phoneVerification.findFirst({
    where: { userId: session.uid, createdAt: { gte: new Date(Date.now() - 60_000) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    fail("/candidate/verify-phone", "Please wait 60 seconds before requesting another code.");
  }

  await db.phoneVerification.updateMany({
    where: { userId: session.uid, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await db.phoneVerification.create({
    data: {
      userId: session.uid,
      code: randomOtp(),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });

  await db.user.update({ where: { id: session.uid }, data: { phone } });
  await audit(session.uid, "candidate.phone.otp_sent", "User", session.uid);

  revalidatePath("/candidate/verify-phone");
  redirect("/candidate/verify-phone?sent=1");
}

export async function confirmOtpAction(form: FormData): Promise<void> {
  const session = await requireRole("CANDIDATE");
  const code = field(form, "code").replace(/\s/g, "");

  if (!/^\d{6}$/.test(code)) {
    fail("/candidate/verify-phone", "Enter the 6-digit code from the SMS.");
  }

  const verification = await db.phoneVerification.findFirst({
    where: { userId: session.uid, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    fail("/candidate/verify-phone", "No active code. Request a new one.");
  }
  if (verification.expiresAt.getTime() < Date.now()) {
    fail("/candidate/verify-phone", "That code expired. Request a new one.");
  }
  if (verification.code !== code) {
    fail("/candidate/verify-phone", "That code is not correct. Check the SMS and try again.");
  }

  await db.$transaction([
    db.phoneVerification.update({
      where: { id: verification.id },
      data: { consumedAt: new Date() },
    }),
    db.user.update({ where: { id: session.uid }, data: { phoneVerified: true } }),
  ]);

  await audit(session.uid, "candidate.phone.verified", "User", session.uid);

  revalidatePath("/candidate");
  revalidatePath("/candidate/verify-phone");
  revalidatePath("/employer/talent");
  redirect("/candidate/verify-phone?verified=1");
}

/* ------------------------------------------------------------------ */
/* Assessment                                                          */
/* ------------------------------------------------------------------ */

export async function startAssessmentAction(): Promise<void> {
  const session = await requireRole("CANDIDATE");

  const candidate = await db.candidateProfile.findUnique({
    where: { userId: session.uid },
    include: {
      attempts: { where: { status: "COMPLETED" }, select: { id: true }, take: 1 },
    },
  });
  if (!candidate) fail("/candidate", "Candidate profile not found.");

  const fresh = await db.user.findUnique({
    where: { id: session.uid },
    select: { phoneVerified: true },
  });
  if (!fresh?.phoneVerified) {
    fail("/candidate/assessment", "Verify your US mobile number before starting the assessment.");
  }

  const completeness = profileCompleteness(candidate);
  if (completeness < 100) {
    fail(
      "/candidate/assessment",
      `Finish your profile first (${completeness}% complete) so the score can be published against it.`,
    );
  }

  if (candidate.attempts.length > 0) {
    fail("/candidate/assessment", "You have already completed the assessment.");
  }

  const running = await db.assessmentAttempt.findFirst({
    where: { userId: session.uid, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });

  if (running) {
    const elapsed = (Date.now() - running.startedAt.getTime()) / 1000;
    if (elapsed > ASSESSMENT_SECONDS + 60) {
      await db.assessmentAttempt.update({
        where: { id: running.id },
        data: { status: "EXPIRED" },
      });
    } else {
      redirect("/candidate/assessment");
    }
  }

  const attempt = await db.assessmentAttempt.create({
    data: { userId: session.uid, candidateId: candidate.id, status: "IN_PROGRESS" },
  });

  await audit(session.uid, "candidate.assessment.started", "AssessmentAttempt", attempt.id);

  revalidatePath("/candidate/assessment");
  redirect("/candidate/assessment");
}

export async function submitAssessmentAction(form: FormData): Promise<void> {
  const session = await requireRole("CANDIDATE");
  const attemptId = field(form, "attemptId");

  const attempt = await db.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== session.uid) {
    fail("/candidate/assessment", "That attempt could not be found.");
  }
  if (attempt.status !== "IN_PROGRESS") {
    fail("/candidate/assessment", "That attempt has already been submitted.");
  }

  const elapsedSec = Math.max(1, Math.round((Date.now() - attempt.startedAt.getTime()) / 1000));
  if (elapsedSec > ASSESSMENT_SECONDS + 120) {
    await db.assessmentAttempt.update({ where: { id: attempt.id }, data: { status: "EXPIRED" } });
    fail("/candidate/assessment", "Time expired before submission. Start a new attempt.");
  }

  const answers = QUESTIONS.map((question) => ({
    questionId: question.id,
    optionId: field(form, `q_${question.id}`),
  })).filter((answer) => answer.optionId.length > 0);

  const result = scoreAssessment(answers);

  const candidate = await db.candidateProfile.findUnique({ where: { userId: session.uid } });
  if (!candidate) fail("/candidate", "Candidate profile not found.");

  await db.$transaction(async (tx) => {
    await tx.assessmentAnswer.deleteMany({ where: { attemptId: attempt.id } });
    await tx.assessmentAnswer.createMany({
      data: result.breakdown.map((item) => ({
        attemptId: attempt.id,
        questionId: item.questionId,
        competency: item.competency,
        difficulty: item.difficulty,
        selectedOption: item.selected,
        correct: item.correct,
        weight: item.weight,
      })),
    });
    await tx.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "COMPLETED",
        submittedAt: new Date(),
        rawScore: Math.round(result.rawScore),
        locScore: result.locScore,
        durationSec: Math.min(elapsedSec, ASSESSMENT_SECONDS + 120),
      },
    });
    await tx.candidateProfile.update({
      where: { id: candidate.id },
      data: {
        locScore: result.locScore,
        locBand: result.band.label,
        locVerifiedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.uid,
        action: "candidate.assessment.completed",
        entity: "AssessmentAttempt",
        entityId: attempt.id,
        meta: JSON.stringify({
          locScore: result.locScore,
          correct: result.correct,
          total: result.total,
          durationSec: elapsedSec,
        }),
      },
    });
  });

  revalidatePath("/candidate");
  revalidatePath("/candidate/assessment");
  revalidatePath("/employer/talent");
  redirect("/candidate/assessment?result=1");
}

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

export async function applyToJobAction(form: FormData): Promise<void> {
  const session = await requireRole("CANDIDATE");
  const jobId = field(form, "jobId");

  const candidate = await db.candidateProfile.findUnique({
    where: { userId: session.uid },
  });
  if (!candidate) fail("/candidate/jobs", "Candidate profile not found.");
  if (profileCompleteness(candidate) < 100) {
    fail("/candidate/jobs", "Complete your profile before applying to roles.");
  }

  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "OPEN") {
    fail("/candidate/jobs", "That role is no longer open.");
  }

  const existing = await db.application.findUnique({
    where: { jobId_candidateId: { jobId: job.id, candidateId: candidate.id } },
  });
  if (existing) {
    fail("/candidate/jobs", "You have already applied to that role.");
  }

  const matchScore = jobMatchScore(job, candidate);

  await db.application.create({
    data: {
      jobId: job.id,
      candidateId: candidate.id,
      employerId: job.employerId,
      matchScore,
      note: field(form, "note").slice(0, 600),
    },
  });

  await audit(session.uid, "candidate.application.submitted", "Job", job.id, { matchScore });

  revalidatePath("/candidate/jobs");
  revalidatePath("/candidate/applications");
  revalidatePath("/employer/pipeline");
  redirect("/candidate/applications?applied=1");
}

export async function withdrawApplicationAction(form: FormData): Promise<void> {
  const session = await requireRole("CANDIDATE");
  const applicationId = field(form, "applicationId");

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: { candidate: { select: { userId: true } } },
  });
  if (!application || application.candidate.userId !== session.uid) {
    fail("/candidate/applications", "Application not found.");
  }
  if (application.status === "HIRED") {
    fail("/candidate/applications", "You cannot withdraw after an offer is accepted.");
  }

  await db.application.update({
    where: { id: application.id },
    data: { status: "WITHDRAWN" },
  });
  await audit(session.uid, "candidate.application.withdrawn", "Application", application.id);

  revalidatePath("/candidate/applications");
  redirect("/candidate/applications?withdrawn=1");
}
