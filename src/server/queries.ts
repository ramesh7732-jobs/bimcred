import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { parseCsv, profileCompleteness } from "@/lib/profile";
import type { SessionUser } from "@/server/auth";

/**
 * Read-side data access. Every function here is scoped to a single portal and
 * returns only what that portal is allowed to render. Employer-facing queries
 * never select candidate email/phone; those columns are fetched behind the
 * TalentView unlock gate in the candidate detail page.
 */

export const CANDIDATE_USER = {
  id: true,
  name: true,
  email: true,
  phone: true,
  phoneVerified: true,
  createdAt: true,
} as const;

export async function loadCandidateContext(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      candidate: {
        include: {
          attempts: {
            where: { status: "COMPLETED" },
            orderBy: { submittedAt: "desc" },
            take: 1,
            include: { answers: true },
          },
          applications: {
            orderBy: { createdAt: "desc" },
            include: {
              job: { include: { employer: { select: { companyName: true, hqLocation: true } } } },
            },
          },
          _count: { select: { views: true } },
        },
      },
    },
  });

  if (!user?.candidate) return null;

  const profile = user.candidate;
  const completeness = profileCompleteness(profile);
  const latestAttempt = profile.attempts[0] ?? null;

  return {
    user,
    profile,
    completeness,
    latestAttempt,
    applications: profile.applications,
    viewsCount: profile._count.views,
  };
}

export type CandidateContext = NonNullable<Awaited<ReturnType<typeof loadCandidateContext>>>;

export async function loadEmployerContext(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      employer: {
        include: {
          subscription: true,
          jobs: {
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { applications: true } } },
          },
          views: {
            orderBy: { createdAt: "desc" },
            take: 6,
            include: {
              candidate: {
                include: { user: { select: { name: true } } },
              },
            },
          },
          _count: { select: { views: true, jobs: true } },
        },
      },
    },
  });

  if (!user?.employer) return null;

  const employer = user.employer;
  const openJobs = employer.jobs.filter((job) => job.status === "OPEN").length;
  const applicationCount = await db.application.count({ where: { employerId: employer.id } });
  const newApplications = await db.application.count({
    where: { employerId: employer.id, status: "SUBMITTED" },
  });

  return {
    user,
    employer,
    subscription: employer.subscription,
    jobs: employer.jobs,
    openJobs,
    applicationCount,
    newApplications,
    unlocked: employer._count.views,
    recentViews: employer.views,
  };
}

export type EmployerContext = NonNullable<Awaited<ReturnType<typeof loadEmployerContext>>>;

/* ------------------------------------------------------------------ */
/* Talent search                                                       */
/* ------------------------------------------------------------------ */

export type TalentFilters = {
  q: string;
  band: string;
  minLoc: number;
  discipline: string;
  software: string;
  availability: string;
  minYears: number;
  remoteOnly: boolean;
  location: string;
};

const BAND_LABELS: Record<string, string> = {
  emerging: "Emerging",
  developing: "Developing",
  competent: "Competent",
  proficient: "Proficient",
  expert: "Expert",
};

export function parseTalentFilters(
  sp: Record<string, string | string[] | undefined>,
): TalentFilters {
  const one = (key: string): string => {
    const value = sp[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  };
  const num = (key: string): number => {
    const n = Number.parseInt(one(key), 10);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    q: one("q"),
    band: one("band").toLowerCase(),
    minLoc: num("minLoc"),
    discipline: one("discipline"),
    software: one("software"),
    availability: one("availability"),
    minYears: num("minYears"),
    remoteOnly: one("remote") === "1",
    location: one("location"),
  };
}

export function hasActiveFilters(f: TalentFilters): boolean {
  return Boolean(
    f.q || f.band || f.minLoc || f.discipline || f.software || f.availability || f.minYears || f.remoteOnly || f.location,
  );
}

export async function searchTalent(filters: TalentFilters, limit = 60) {
  const where: Prisma.CandidateProfileWhereInput = {
    visible: true,
    locScore: { not: null },
    user: { phoneVerified: true },
  };

  if (filters.band && BAND_LABELS[filters.band]) {
    where.locBand = BAND_LABELS[filters.band];
  }
  if (filters.minLoc > 0) {
    where.locScore = { gte: filters.minLoc };
  }
  if (filters.minYears > 0) {
    where.yearsExperience = { gte: filters.minYears };
  }
  if (filters.discipline) {
    where.disciplines = { contains: filters.discipline };
  }
  if (filters.software) {
    where.software = { contains: filters.software };
  }
  if (filters.availability) {
    where.availability = filters.availability;
  }
  if (filters.remoteOnly) {
    where.remoteOk = true;
  }
  if (filters.location) {
    where.location = { contains: filters.location };
  }
  if (filters.q) {
    where.OR = [
      { headline: { contains: filters.q } },
      { currentTitle: { contains: filters.q } },
      { bio: { contains: filters.q } },
    ];
  }

  const rows = await db.candidateProfile.findMany({
    where,
    orderBy: [{ locScore: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: {
      user: { select: { name: true, phoneVerified: true } },
    },
  });

  return rows;
}

export type TalentRow = Awaited<ReturnType<typeof searchTalent>>[number];

export async function talentPoolStats() {
  const [total, scored, byBand, verified] = await Promise.all([
    db.candidateProfile.count({ where: { visible: true } }),
    db.candidateProfile.count({ where: { visible: true, locScore: { not: null } } }),
    db.candidateProfile.groupBy({
      by: ["locBand"],
      where: { visible: true, locScore: { not: null } },
      _count: { _all: true },
    }),
    db.user.count({ where: { role: "CANDIDATE", phoneVerified: true } }),
  ]);

  return { total, scored, byBand, verified };
}

export async function isUnlocked(
  employerId: string,
  candidateId: string,
): Promise<boolean> {
  const view = await db.talentView.findUnique({
    where: { employerId_candidateId: { employerId, candidateId } },
    select: { id: true },
  });
  return Boolean(view);
}

export async function unlockedCandidateIds(employerId: string): Promise<Set<string>> {
  const views = await db.talentView.findMany({ where: { employerId }, select: { candidateId: true } });
  return new Set(views.map((view) => view.candidateId));
}

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

export async function openJobsForCandidate(locScore: number | null) {
  const jobs = await db.job.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      employer: { select: { companyName: true, hqLocation: true, verified: true } },
      _count: { select: { applications: true } },
    },
  });
  return jobs.filter((job) => {
    if (locScore == null) return true;
    // Show roles whose LOC floor the candidate could still grow into.
    return locScore >= job.minLoc - 100;
  });
}

export type JobRow = Awaited<ReturnType<typeof openJobsForCandidate>>[number];

export async function candidateApplications(candidateId: string) {
  return db.application.findMany({
    where: { candidateId },
    orderBy: { createdAt: "desc" },
    include: {
      job: { include: { employer: { select: { companyName: true, hqLocation: true } } } },
    },
  });
}

export async function employerApplications(employerId: string) {
  return db.application.findMany({
    where: { employerId },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { id: true, title: true, location: true } },
      candidate: {
        include: { user: { select: { name: true, phoneVerified: true } } },
      },
    },
  });
}

export type EmployerApplicationRow = Awaited<ReturnType<typeof employerApplications>>[number];

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export async function adminOverview() {
  const [candidates, employers, verifiedEmployers, attempts, unlocks, openReports, pendingEmployers] =
    await Promise.all([
      db.user.count({ where: { role: "CANDIDATE" } }),
      db.user.count({ where: { role: "EMPLOYER" } }),
      db.employerProfile.count({ where: { verified: true } }),
      db.assessmentAttempt.count({ where: { status: "COMPLETED" } }),
      db.talentView.count(),
      db.report.count({ where: { status: "OPEN" } }),
      db.employerProfile.findMany({
        where: { verified: false },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, email: true, createdAt: true } } },
        take: 8,
      }),
    ]);

  const [phoneVerified, scored] = await Promise.all([
    db.user.count({ where: { role: "CANDIDATE", phoneVerified: true } }),
    db.candidateProfile.count({ where: { locScore: { not: null } } }),
  ]);

  return {
    candidates,
    employers,
    verifiedEmployers,
    attempts,
    unlocks,
    openReports,
    pendingEmployers,
    phoneVerified,
    scored,
  };
}

export async function locDistribution() {
  const bands = ["Emerging", "Developing", "Competent", "Proficient", "Expert"];
  const rows = await db.candidateProfile.groupBy({
    by: ["locBand"],
    where: { locScore: { not: null } },
    _count: { _all: true },
    _avg: { locScore: true },
  });
  const total = rows.reduce((sum, row) => sum + row._count._all, 0);
  return bands.map((band) => {
    const match = rows.find((row) => row.locBand === band);
    return { band, count: match?._count._all ?? 0, avg: Math.round(match?._avg.locScore ?? 0), total };
  });
}

export async function questionAnalytics() {
  const rows = await db.assessmentAnswer.groupBy({
    by: ["questionId", "competency", "difficulty"],
    _count: { _all: true },
    _avg: { weight: true },
  });

  const correctRows = await db.assessmentAnswer.groupBy({
    by: ["questionId"],
    where: { correct: true },
    _count: { _all: true },
  });
  const correctById = new Map(correctRows.map((row) => [row.questionId, row._count._all]));

  return rows
    .map((row) => {
      const attempts = row._count._all;
      const correct = correctById.get(row.questionId) ?? 0;
      return {
        questionId: row.questionId,
        competency: row.competency,
        difficulty: row.difficulty,
        attempts,
        correct,
        correctRate: attempts ? Math.round((correct / attempts) * 100) : 0,
      };
    })
    .sort((a, b) => a.questionId.localeCompare(b.questionId));
}

export async function recentAudit(limit = 40, entity?: string) {
  return db.auditLog.findMany({
    where: entity ? { entity } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { name: true, role: true, email: true } } },
  });
}

export async function auditEntityOptions() {
  const rows = await db.auditLog.groupBy({ by: ["entity"], _count: { _all: true } });
  return rows.sort((a, b) => b._count._all - a._count._all);
}

export async function adminUsers(query: string) {
  return db.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query } },
            { name: { contains: query } },
            { phone: { contains: query } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      candidate: { select: { id: true, locScore: true, locBand: true, visible: true, location: true } },
      employer: { select: { id: true, companyName: true, verified: true, subscription: true } },
    },
  });
}

export async function adminEmployers() {
  return db.employerProfile.findMany({
    orderBy: [{ verified: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
      subscription: true,
      _count: { select: { jobs: true, views: true } },
    },
  });
}

export async function openReports() {
  return db.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    include: {
      reporter: { select: { name: true, role: true } },
      candidate: { include: { user: { select: { name: true, email: true } } } },
    },
    take: 10,
  });
}

/** Percent of a candidate's software list that appears in a job's competency list. */
export function toolOverlap(candidateSoftware: string, jobCompetencies: string): number {
  const tools = parseCsv(candidateSoftware);
  const comps = parseCsv(jobCompetencies);
  if (!tools.length || !comps.length) return 0;
  return Math.round((tools.filter((tool) => comps.includes(tool)).length / comps.length) * 100);
}
