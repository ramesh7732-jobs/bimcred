/**
 * BIMcred demo seed.
 *
 * Run with:  npx tsx prisma/seed.ts
 *
 * Properties:
 * - Idempotent: every write is an upsert keyed by a stable unique key
 *   (email, userId, employerId, compound unique, or a fixed demo id).
 * - Deterministic: all business values, scores, and timestamps are constants.
 *   Password hashes are the only salted values and are only written on create.
 * - Self-contained: imports only @prisma/client and bcryptjs so it runs under
 *   tsx without tsconfig path aliases.
 */

import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers and constants
// ---------------------------------------------------------------------------

const d = (iso: string): Date => new Date(iso);

/** Deterministic stand-in for a salted IP hash. */
const ipHash = (tag: string): string =>
  createHash("sha256").update(`bimcred-seed:${tag}`).digest("hex");

/**
 * LOC bands used by the demo data. Keep in sync with src/lib/loc.ts.
 *   100-199 Emerging | 200-299 Developing | 300-399 Competent |
 *   400-449 Proficient | 450-500 Expert
 */
const LOC_BANDS = [
  { label: "Emerging", min: 100, max: 199 },
  { label: "Developing", min: 200, max: 299 },
  { label: "Competent", min: 300, max: 399 },
  { label: "Proficient", min: 400, max: 449 },
  { label: "Expert", min: 450, max: 500 },
] as const;

function bandFor(score: number): string {
  const band = LOC_BANDS.find((b) => score >= b.min && score <= b.max);
  if (!band) {
    throw new Error(`LOC score ${score} is outside the supported 100-500 range`);
  }
  return band.label;
}

type Role = "CANDIDATE" | "EMPLOYER" | "ADMIN";

type SeedUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  phoneVerified: boolean;
};

type SeedCandidate = {
  id: string;
  email: string;
  headline: string;
  currentTitle: string;
  location: string;
  yearsExperience: number;
  availability: "OPEN" | "NOT_LOOKING" | "CONTRACT";
  workAuthorization: "US_CITIZEN" | "GREEN_CARD" | "H1B" | "OTHER";
  remoteOk: boolean;
  bio: string;
  software: string;
  disciplines: string;
  visible: boolean;
  locScore: number;
  locVerifiedAt: string;
};

type SeedEmployer = {
  id: string;
  email: string;
  contactName: string;
  phone: string;
  companyName: string;
  website: string;
  industry: string;
  companySize: string;
  hqLocation: string;
  verified: boolean;
  plan: "TRIAL" | "STARTER" | "GROWTH" | "ENTERPRISE";
  creditsRemaining: number;
  creditsUsed: number;
  currentPeriodEnd: string;
};

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = "admin@bimcred.com";

const USERS: SeedUser[] = [
  {
    id: "usr_admin",
    email: ADMIN_EMAIL,
    name: "Ops Admin",
    role: "ADMIN",
    phone: null,
    phoneVerified: false,
  },
  // Candidates
  {
    id: "usr_maya",
    email: "maya.chen@example.com",
    name: "Maya Chen",
    role: "CANDIDATE",
    phone: "+15125550142",
    phoneVerified: true,
  },
  {
    id: "usr_daniel",
    email: "daniel.whitfield@example.com",
    name: "Daniel Whitfield",
    role: "CANDIDATE",
    phone: "+13035550188",
    phoneVerified: true,
  },
  {
    id: "usr_priya",
    email: "priya.raman@example.com",
    name: "Priya Raman",
    role: "CANDIDATE",
    phone: "+13125550167",
    phoneVerified: true,
  },
  {
    id: "usr_marcus",
    email: "marcus.bell@example.com",
    name: "Marcus Bell",
    role: "CANDIDATE",
    phone: "+14045550119",
    phoneVerified: true,
  },
  {
    id: "usr_elena",
    email: "elena.vasquez@example.com",
    name: "Elena Vasquez",
    role: "CANDIDATE",
    phone: "+16175550134",
    phoneVerified: true,
  },
  {
    id: "usr_tom",
    email: "tom.okafor@example.com",
    name: "Tom Okafor",
    role: "CANDIDATE",
    phone: "+12065550175",
    phoneVerified: true,
  },
  {
    id: "usr_sarah",
    email: "sarah.lindqvist@example.com",
    name: "Sarah Lindqvist",
    role: "CANDIDATE",
    phone: "+16025550126",
    phoneVerified: true,
  },
  {
    id: "usr_james",
    email: "james.park@example.com",
    name: "James Park",
    role: "CANDIDATE",
    phone: "+12125550193",
    phoneVerified: true,
  },
  // Employers
  {
    id: "usr_dana",
    email: "talent@aecbuild.com",
    name: "Dana Whitmore",
    role: "EMPLOYER",
    phone: "+15125550100",
    phoneVerified: true,
  },
  {
    id: "usr_noah",
    email: "hiring@meridiandesign.com",
    name: "Noah Fields",
    role: "EMPLOYER",
    phone: "+13125550101",
    phoneVerified: true,
  },
  {
    id: "usr_ines",
    email: "careers@northlineinfra.com",
    name: "Ines Alvarez",
    role: "EMPLOYER",
    phone: "+12065550102",
    phoneVerified: true,
  },
];

const CANDIDATES: SeedCandidate[] = [
  {
    id: "cand_maya",
    email: "maya.chen@example.com",
    headline:
      "MEP BIM coordinator who turns federated models into buildable packages",
    currentTitle: "Senior BIM Coordinator",
    location: "Austin, TX",
    yearsExperience: 6,
    availability: "OPEN",
    workAuthorization: "US_CITIZEN",
    remoteOk: true,
    bio: "Six years coordinating mechanical, electrical, and plumbing packages on healthcare and higher-education projects. Comfortable running clash cycles and authoring coordination standards.",
    software: "revit,navisworks,dynamo,bim360",
    disciplines: "mep",
    visible: true,
    locScore: 414,
    locVerifiedAt: "2026-11-10T14:26:00.000Z",
  },
  {
    id: "cand_daniel",
    email: "daniel.whitfield@example.com",
    headline: "Structural BIM lead for steel and precast delivery",
    currentTitle: "BIM Manager - Structures",
    location: "Denver, CO",
    yearsExperience: 9,
    availability: "CONTRACT",
    workAuthorization: "GREEN_CARD",
    remoteOk: true,
    bio: "Leads structural model production and contractor coordination for aviation and industrial work. Heavy Tekla and IFC exchange experience.",
    software: "tekla,ifc,navisworks,revit",
    disciplines: "structure",
    visible: true,
    locScore: 443,
    locVerifiedAt: "2026-11-08T16:40:00.000Z",
  },
  {
    id: "cand_priya",
    email: "priya.raman@example.com",
    headline: "Architect and Revit model manager with a standards habit",
    currentTitle: "BIM Specialist",
    location: "Chicago, IL",
    yearsExperience: 4,
    availability: "OPEN",
    workAuthorization: "H1B",
    remoteOk: true,
    bio: "Architecture background with production leadership on mixed-use projects. Owns model audits, template upkeep, and Solibri rule sets.",
    software: "revit,archicad,solibri,bim360",
    disciplines: "architecture",
    visible: true,
    locScore: 357,
    locVerifiedAt: "2026-11-06T18:05:00.000Z",
  },
  {
    id: "cand_marcus",
    email: "marcus.bell@example.com",
    headline: "Construction-side VDC lead focused on field-ready models",
    currentTitle: "VDC Manager",
    location: "Atlanta, GA",
    yearsExperience: 14,
    availability: "NOT_LOOKING",
    workAuthorization: "US_CITIZEN",
    remoteOk: false,
    bio: "Fourteen years across GC and trade coordination. Runs clash resolution, 4D reviews, and handover model validation.",
    software: "navisworks,revit,bim360,recap",
    disciplines: "construction",
    visible: true,
    locScore: 486,
    locVerifiedAt: "2026-11-12T13:20:00.000Z",
  },
  {
    id: "cand_elena",
    email: "elena.vasquez@example.com",
    headline: "Architectural designer moving into full-time BIM production",
    currentTitle: "BIM Designer",
    location: "Boston, MA",
    yearsExperience: 3,
    availability: "OPEN",
    workAuthorization: "GREEN_CARD",
    remoteOk: true,
    bio: "Documentation and model production for residential and cultural work. Building depth in IFC coordination and scan-to-BIM.",
    software: "revit,recap,ifc",
    disciplines: "architecture",
    visible: false,
    locScore: 286,
    locVerifiedAt: "2026-11-04T15:10:00.000Z",
  },
  {
    id: "cand_tom",
    email: "tom.okafor@example.com",
    headline: "Civil infrastructure modeler bridging design and construction",
    currentTitle: "BIM Technologist",
    location: "Seattle, WA",
    yearsExperience: 8,
    availability: "OPEN",
    workAuthorization: "OTHER",
    remoteOk: true,
    bio: "Corridor and utility models for transit and water programs. Civil 3D to IFC pipelines, plus Dynamo automation for quantity takeoff.",
    software: "civil3d,ifc,dynamo,navisworks",
    disciplines: "infrastructure",
    visible: true,
    locScore: 314,
    locVerifiedAt: "2026-11-09T20:15:00.000Z",
  },
  {
    id: "cand_sarah",
    email: "sarah.lindqvist@example.com",
    headline: "Facilities BIM technician keeping as-built models usable",
    currentTitle: "BIM Technician",
    location: "Phoenix, AZ",
    yearsExperience: 1,
    availability: "OPEN",
    workAuthorization: "US_CITIZEN",
    remoteOk: false,
    bio: "Early-career technician supporting as-built updates and asset data cleanup for campus facilities.",
    software: "revit,bim360",
    disciplines: "facilities",
    visible: false,
    locScore: 171,
    locVerifiedAt: "2026-10-30T19:20:00.000Z",
  },
  {
    id: "cand_james",
    email: "james.park@example.com",
    headline: "Architectural BIM generalist with strong documentation habits",
    currentTitle: "BIM Coordinator",
    location: "New York, NY",
    yearsExperience: 2,
    availability: "OPEN",
    workAuthorization: "H1B",
    remoteOk: true,
    bio: "Production coordination for tenant improvement and adaptive reuse projects. Revit families, sheet setup, and model QA.",
    software: "revit,navisworks,ifc",
    disciplines: "architecture",
    visible: true,
    locScore: 229,
    locVerifiedAt: "2026-11-15T18:35:00.000Z",
  },
];

const EMPLOYERS: SeedEmployer[] = [
  {
    id: "emp_aec",
    email: "talent@aecbuild.com",
    contactName: "Dana Whitmore",
    phone: "+15125550100",
    companyName: "AEC Build Group",
    website: "https://aecbuild.example.com",
    industry: "Architecture, Engineering & Construction",
    companySize: "201-500",
    hqLocation: "Austin, TX",
    verified: true,
    plan: "GROWTH",
    creditsRemaining: 74,
    creditsUsed: 1,
    currentPeriodEnd: "2026-12-15T23:59:59.000Z",
  },
  {
    id: "emp_meridian",
    email: "hiring@meridiandesign.com",
    contactName: "Noah Fields",
    phone: "+13125550101",
    companyName: "Meridian Design Studio",
    website: "https://meridiandesign.example.com",
    industry: "Architecture",
    companySize: "11-50",
    hqLocation: "Chicago, IL",
    verified: false,
    plan: "STARTER",
    creditsRemaining: 25,
    creditsUsed: 0,
    currentPeriodEnd: "2026-12-08T23:59:59.000Z",
  },
  {
    id: "emp_northline",
    email: "careers@northlineinfra.com",
    contactName: "Ines Alvarez",
    phone: "+12065550102",
    companyName: "Northline Infrastructure",
    website: "https://northlineinfra.example.com",
    industry: "Civil Engineering",
    companySize: "501-1000",
    hqLocation: "Seattle, WA",
    verified: true,
    plan: "TRIAL",
    creditsRemaining: 9,
    creditsUsed: 1,
    currentPeriodEnd: "2026-11-30T23:59:59.000Z",
  },
];

// ---------------------------------------------------------------------------
// Jobs, applications, views, audit, moderation
// ---------------------------------------------------------------------------

type SeedJob = {
  id: string;
  employerId: string;
  title: string;
  description: string;
  location: string;
  workMode: "REMOTE" | "HYBRID" | "ONSITE";
  employmentType: "FULL_TIME" | "CONTRACT" | "PART_TIME" | "INTERNSHIP";
  minLoc: number;
  maxLoc: number;
  salaryMin: number | null;
  salaryMax: number | null;
  competencies: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
  createdAt: string;
};

const JOBS: SeedJob[] = [
  {
    id: "job_aec_mep_senior",
    employerId: "emp_aec",
    title: "Senior BIM Coordinator - MEP",
    description:
      "Lead MEP coordination on a 420,000 sq ft healthcare campus. Own the federated model, chair clash reviews, and publish trade packages against the project BEP.",
    location: "Austin, TX",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    minLoc: 340,
    maxLoc: 500,
    salaryMin: 95000,
    salaryMax: 125000,
    competencies: "iso19650,lod,clash,delivery",
    status: "OPEN",
    createdAt: "2026-10-28T14:00:00.000Z",
  },
  {
    id: "job_aec_struct_manager",
    employerId: "emp_aec",
    title: "BIM Manager - Structural",
    description:
      "Set structural modelling standards across three offices, mentor coordinators, and run the ISO 19650 information cycle for aviation and industrial clients.",
    location: "Denver, CO",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    minLoc: 400,
    maxLoc: 500,
    salaryMin: 120000,
    salaryMax: 150000,
    competencies: "iso19650,lod,standards,delivery,automation",
    status: "OPEN",
    createdAt: "2026-11-02T16:30:00.000Z",
  },
  {
    id: "job_meridian_revit",
    employerId: "emp_meridian",
    title: "Revit Production Specialist",
    description:
      "Production-focused role on mixed-use and cultural projects. Model authoring, sheet sets, and quantity schedules with a small design team.",
    location: "Chicago, IL",
    workMode: "ONSITE",
    employmentType: "FULL_TIME",
    minLoc: 260,
    maxLoc: 400,
    salaryMin: 70000,
    salaryMax: 92000,
    competencies: "lod,quantity,schedules",
    status: "OPEN",
    createdAt: "2026-11-05T15:10:00.000Z",
  },
  {
    id: "job_northline_digital_twin",
    employerId: "emp_northline",
    title: "Digital Twin Engineer",
    description:
      "Build the operational twin for a regional transit program: asset data schema, IFC handover, and dashboard integrations with the client's maintenance system.",
    location: "Seattle, WA",
    workMode: "HYBRID",
    employmentType: "CONTRACT",
    minLoc: 320,
    maxLoc: 480,
    salaryMin: 90000,
    salaryMax: 120000,
    competencies: "digital-twin,interop,automation",
    status: "OPEN",
    createdAt: "2026-11-08T18:45:00.000Z",
  },
  {
    id: "job_northline_clash",
    employerId: "emp_northline",
    title: "Clash Detection Analyst",
    description:
      "Own clash detection and resolution tracking across a light-rail corridor. Federate Civil 3D, Revit, and utility models, then drive issues to closure.",
    location: "Atlanta, GA",
    workMode: "REMOTE",
    employmentType: "CONTRACT",
    minLoc: 240,
    maxLoc: 380,
    salaryMin: 60000,
    salaryMax: 80000,
    competencies: "clash,interop,iso19650",
    status: "OPEN",
    createdAt: "2026-11-10T13:05:00.000Z",
  },
  {
    id: "job_meridian_standards",
    employerId: "emp_meridian",
    title: "BIM Standards Lead",
    description:
      "Draft role for a part-time standards owner: template governance, LOD matrices, and information delivery plans for a growing practice.",
    location: "Boston, MA",
    workMode: "ONSITE",
    employmentType: "PART_TIME",
    minLoc: 380,
    maxLoc: 500,
    salaryMin: null,
    salaryMax: null,
    competencies: "standards,iso19650,delivery",
    status: "DRAFT",
    createdAt: "2026-11-12T17:20:00.000Z",
  },
];

type SeedApplication = {
  jobId: string;
  candidateId: string;
  employerId: string;
  status:
    | "SUBMITTED"
    | "REVIEWED"
    | "SHORTLISTED"
    | "INTERVIEW"
    | "OFFER"
    | "HIRED"
    | "REJECTED"
    | "WITHDRAWN";
  note: string;
  matchScore: number;
  createdAt: string;
};

const APPLICATIONS: SeedApplication[] = [
  {
    jobId: "job_aec_mep_senior",
    candidateId: "cand_maya",
    employerId: "emp_aec",
    status: "SHORTLISTED",
    note: "Strong MEP coordination sample; available in two weeks.",
    matchScore: 92,
    createdAt: "2026-11-11T14:25:00.000Z",
  },
  {
    jobId: "job_aec_struct_manager",
    candidateId: "cand_daniel",
    employerId: "emp_aec",
    status: "INTERVIEW",
    note: "Portfolio reviewed; panel scheduled for next week.",
    matchScore: 88,
    createdAt: "2026-11-12T16:10:00.000Z",
  },
  {
    jobId: "job_meridian_revit",
    candidateId: "cand_priya",
    employerId: "emp_meridian",
    status: "SUBMITTED",
    note: "",
    matchScore: 74,
    createdAt: "2026-11-13T15:40:00.000Z",
  },
];

type SeedQuestion = {
  questionId: string;
  competency: string;
  difficulty: 1 | 2 | 3;
  weight: 1 | 2 | 3;
  correctOption: "a" | "b" | "c" | "d";
};

/**
 * Question bank metadata, aligned with src/lib/questions.ts. Total weight 28.
 * The per-candidate correct sets in ATTEMPTS determine every published LOC.
 */
const QUESTIONS: SeedQuestion[] = [
  { questionId: "q01", competency: "iso19650", difficulty: 1, weight: 1, correctOption: "c" },
  { questionId: "q02", competency: "lod", difficulty: 1, weight: 1, correctOption: "a" },
  { questionId: "q03", competency: "clash", difficulty: 1, weight: 1, correctOption: "a" },
  { questionId: "q04", competency: "standards", difficulty: 1, weight: 1, correctOption: "b" },
  { questionId: "q05", competency: "delivery", difficulty: 1, weight: 1, correctOption: "d" },
  { questionId: "q06", competency: "iso19650", difficulty: 2, weight: 2, correctOption: "b" },
  { questionId: "q07", competency: "quantity", difficulty: 2, weight: 2, correctOption: "d" },
  { questionId: "q08", competency: "schedules", difficulty: 2, weight: 2, correctOption: "c" },
  { questionId: "q09", competency: "interop", difficulty: 2, weight: 2, correctOption: "a" },
  { questionId: "q10", competency: "digital-twin", difficulty: 2, weight: 2, correctOption: "d" },
  { questionId: "q11", competency: "automation", difficulty: 2, weight: 2, correctOption: "c" },
  { questionId: "q12", competency: "clash", difficulty: 2, weight: 2, correctOption: "a" },
  { questionId: "q13", competency: "lod", difficulty: 3, weight: 3, correctOption: "b" },
  { questionId: "q14", competency: "standards", difficulty: 3, weight: 3, correctOption: "d" },
  { questionId: "q15", competency: "delivery", difficulty: 3, weight: 3, correctOption: "c" },
];

const TOTAL_WEIGHT = QUESTIONS.reduce((sum, question) => sum + question.weight, 0);

type SeedAttempt = {
  id: string;
  email: string;
  submittedAt: string;
  durationSec: number;
  /** Items this candidate answered correctly; everything else is a miss. */
  correctQuestionIds: string[];
};

/**
 * One completed attempt per scored candidate. The score is derived from the
 * correct set with the same formula as src/lib/loc.ts, so the profile LOC and
 * the item-level breakdown can never disagree.
 */
const ATTEMPTS: SeedAttempt[] = [
  {
    id: "att_maya_2026_11",
    email: "maya.chen@example.com",
    submittedAt: "2026-11-10T14:26:00.000Z",
    durationSec: 1560,
    correctQuestionIds: ["q01", "q02", "q03", "q05", "q06", "q07", "q08", "q09", "q11", "q12", "q14", "q15"],
  },
  {
    id: "att_daniel_2026_11",
    email: "daniel.whitfield@example.com",
    submittedAt: "2026-11-08T16:40:00.000Z",
    durationSec: 1440,
    correctQuestionIds: ["q01", "q02", "q03", "q05", "q06", "q07", "q08", "q09", "q10", "q11", "q12", "q14", "q15"],
  },
  {
    id: "att_priya_2026_11",
    email: "priya.raman@example.com",
    submittedAt: "2026-11-06T18:05:00.000Z",
    durationSec: 1620,
    correctQuestionIds: ["q01", "q02", "q03", "q04", "q05", "q06", "q07", "q08", "q09", "q12", "q15"],
  },
  {
    id: "att_marcus_2026_11",
    email: "marcus.bell@example.com",
    submittedAt: "2026-11-12T13:20:00.000Z",
    durationSec: 1080,
    correctQuestionIds: ["q01", "q02", "q03", "q05", "q06", "q07", "q08", "q09", "q10", "q11", "q12", "q13", "q14", "q15"],
  },
  {
    id: "att_elena_2026_11",
    email: "elena.vasquez@example.com",
    submittedAt: "2026-11-04T15:10:00.000Z",
    durationSec: 1740,
    correctQuestionIds: ["q01", "q02", "q03", "q04", "q05", "q06", "q07", "q08", "q09"],
  },
  {
    id: "att_tom_2026_11",
    email: "tom.okafor@example.com",
    submittedAt: "2026-11-09T20:15:00.000Z",
    durationSec: 1320,
    correctQuestionIds: ["q01", "q02", "q03", "q04", "q05", "q06", "q07", "q08", "q09", "q10"],
  },
  {
    id: "att_sarah_2026_10",
    email: "sarah.lindqvist@example.com",
    submittedAt: "2026-10-30T19:20:00.000Z",
    durationSec: 1800,
    correctQuestionIds: ["q01", "q02", "q03", "q04", "q05"],
  },
  {
    id: "att_james_2026_11",
    email: "james.park@example.com",
    submittedAt: "2026-11-15T18:35:00.000Z",
    durationSec: 1500,
    correctQuestionIds: ["q01", "q02", "q03", "q04", "q05", "q06", "q07"],
  },
];

function scorePattern(correctQuestionIds: string[]): {
  earned: number;
  rawScore: number;
  locScore: number;
} {
  const correct = new Set(correctQuestionIds);
  const earned = QUESTIONS.filter((question) => correct.has(question.questionId)).reduce(
    (sum, question) => sum + question.weight,
    0,
  );
  const ratio = TOTAL_WEIGHT > 0 ? earned / TOTAL_WEIGHT : 0;
  return {
    earned,
    rawScore: Math.round(ratio * 100),
    locScore: Math.max(100, Math.min(500, Math.round(100 + ratio * 400))),
  };
}

const OPTION_IDS = ["a", "b", "c", "d"] as const;

/** Deterministic wrong answer, so seeded breakdowns look like real attempts. */
function wrongOption(correctOption: SeedQuestion["correctOption"], offset: number): string {
  const others = OPTION_IDS.filter((option) => option !== correctOption);
  return others[offset % others.length];
}


// ---------------------------------------------------------------------------
// Seed routine
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("Seeding BIMcred demo data...");

  const adminHash = bcrypt.hashSync("Admin123!", 10);
  const candidateHash = bcrypt.hashSync("Candidate123!", 10);
  const employerHash = bcrypt.hashSync("Employer123!", 10);

  const hashForRole = (role: Role): string => {
    if (role === "ADMIN") return adminHash;
    if (role === "EMPLOYER") return employerHash;
    return candidateHash;
  };

  // --- Users -------------------------------------------------------------
  const userIdByEmail = new Map<string, string>();
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        phone: u.phone,
        phoneVerified: u.phoneVerified,
      },
      create: {
        id: u.id,
        email: u.email,
        passwordHash: hashForRole(u.role),
        name: u.name,
        role: u.role,
        phone: u.phone,
        phoneVerified: u.phoneVerified,
        createdAt: d("2026-10-20T12:00:00.000Z"),
      },
    });
    userIdByEmail.set(u.email, user.id);
  }

  const userId = (email: string): string => {
    const id = userIdByEmail.get(email);
    if (!id) throw new Error(`Seed user missing: ${email}`);
    return id;
  };

  // --- Candidate profiles ------------------------------------------------
  const candidateIdByEmail = new Map<string, string>();
  for (const c of CANDIDATES) {
    const profile = await prisma.candidateProfile.upsert({
      where: { userId: userId(c.email) },
      update: {
        headline: c.headline,
        currentTitle: c.currentTitle,
        location: c.location,
        yearsExperience: c.yearsExperience,
        availability: c.availability,
        workAuthorization: c.workAuthorization,
        remoteOk: c.remoteOk,
        bio: c.bio,
        software: c.software,
        disciplines: c.disciplines,
        visible: c.visible,
        locScore: c.locScore,
        locBand: bandFor(c.locScore),
        locVerifiedAt: d(c.locVerifiedAt),
      },
      create: {
        id: c.id,
        userId: userId(c.email),
        headline: c.headline,
        currentTitle: c.currentTitle,
        location: c.location,
        yearsExperience: c.yearsExperience,
        availability: c.availability,
        workAuthorization: c.workAuthorization,
        remoteOk: c.remoteOk,
        bio: c.bio,
        software: c.software,
        disciplines: c.disciplines,
        visible: c.visible,
        locScore: c.locScore,
        locBand: bandFor(c.locScore),
        locVerifiedAt: d(c.locVerifiedAt),
        createdAt: d("2026-10-21T12:00:00.000Z"),
      },
    });
    candidateIdByEmail.set(c.email, profile.id);
  }

  const candidateId = (email: string): string => {
    const id = candidateIdByEmail.get(email);
    if (!id) throw new Error(`Seed candidate missing: ${email}`);
    return id;
  };

  // --- Employer profiles and subscriptions -------------------------------
  const employerIdByEmail = new Map<string, string>();
  const subscriptionIdByEmployerId = new Map<string, string>();
  for (const e of EMPLOYERS) {
    const profile = await prisma.employerProfile.upsert({
      where: { userId: userId(e.email) },
      update: {
        companyName: e.companyName,
        website: e.website,
        industry: e.industry,
        companySize: e.companySize,
        hqLocation: e.hqLocation,
        verified: e.verified,
      },
      create: {
        id: e.id,
        userId: userId(e.email),
        companyName: e.companyName,
        website: e.website,
        industry: e.industry,
        companySize: e.companySize,
        hqLocation: e.hqLocation,
        verified: e.verified,
        createdAt: d("2026-10-22T12:00:00.000Z"),
      },
    });
    employerIdByEmail.set(e.email, profile.id);

    const subscription = await prisma.subscription.upsert({
      where: { employerId: profile.id },
      update: {
        plan: e.plan,
        creditsRemaining: e.creditsRemaining,
        creditsUsed: e.creditsUsed,
        currentPeriodEnd: d(e.currentPeriodEnd),
      },
      create: {
        id: `sub_${e.id.replace(/^emp_/, "")}`,
        employerId: profile.id,
        plan: e.plan,
        creditsRemaining: e.creditsRemaining,
        creditsUsed: e.creditsUsed,
        currentPeriodEnd: d(e.currentPeriodEnd),
        createdAt: d("2026-10-22T12:05:00.000Z"),
      },
    });
    subscriptionIdByEmployerId.set(profile.id, subscription.id);
  }

  const employerId = (email: string): string => {
    const id = employerIdByEmail.get(email);
    if (!id) throw new Error(`Seed employer missing: ${email}`);
    return id;
  };

  // --- Jobs --------------------------------------------------------------
  for (const j of JOBS) {
    await prisma.job.upsert({
      where: { id: j.id },
      update: {
        employerId: j.employerId,
        title: j.title,
        description: j.description,
        location: j.location,
        workMode: j.workMode,
        employmentType: j.employmentType,
        minLoc: j.minLoc,
        maxLoc: j.maxLoc,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        competencies: j.competencies,
        status: j.status,
      },
      create: {
        id: j.id,
        employerId: j.employerId,
        title: j.title,
        description: j.description,
        location: j.location,
        workMode: j.workMode,
        employmentType: j.employmentType,
        minLoc: j.minLoc,
        maxLoc: j.maxLoc,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        competencies: j.competencies,
        status: j.status,
        createdAt: d(j.createdAt),
      },
    });
  }

  // --- Applications ------------------------------------------------------
  for (const a of APPLICATIONS) {
    await prisma.application.upsert({
      where: {
        jobId_candidateId: {
          jobId: a.jobId,
          candidateId: a.candidateId,
        },
      },
      update: {
        employerId: a.employerId,
        status: a.status,
        note: a.note,
        matchScore: a.matchScore,
      },
      create: {
        id: `app_${a.jobId.replace(/^job_/, "")}_${a.candidateId.replace(/^cand_/, "")}`,
        jobId: a.jobId,
        candidateId: a.candidateId,
        employerId: a.employerId,
        status: a.status,
        note: a.note,
        matchScore: a.matchScore,
        createdAt: d(a.createdAt),
      },
    });
  }

  // --- Talent views (paid unlocks) --------------------------------------
  const viewAecMaya = await prisma.talentView.upsert({
    where: {
      employerId_candidateId: {
        employerId: employerId("talent@aecbuild.com"),
        candidateId: candidateId("maya.chen@example.com"),
      },
    },
    update: {
      unlockCost: 1,
      note: "Unlocked for Senior BIM Coordinator - MEP.",
    },
    create: {
      id: "view_aec_maya",
      employerId: employerId("talent@aecbuild.com"),
      candidateId: candidateId("maya.chen@example.com"),
      unlockCost: 1,
      note: "Unlocked for Senior BIM Coordinator - MEP.",
      createdAt: d("2026-11-11T14:20:00.000Z"),
    },
  });

  await prisma.talentView.upsert({
    where: {
      employerId_candidateId: {
        employerId: employerId("careers@northlineinfra.com"),
        candidateId: candidateId("tom.okafor@example.com"),
      },
    },
    update: {
      unlockCost: 1,
      note: "Unlocked for the infrastructure modelling pipeline.",
    },
    create: {
      id: "view_northline_tom",
      employerId: employerId("careers@northlineinfra.com"),
      candidateId: candidateId("tom.okafor@example.com"),
      unlockCost: 1,
      note: "Unlocked for the infrastructure modelling pipeline.",
      createdAt: d("2026-11-12T17:35:00.000Z"),
    },
  });

  // --- Phone verifications ----------------------------------------------
  await prisma.phoneVerification.upsert({
    where: { id: "pv_maya_consumed" },
    update: {
      userId: userId("maya.chen@example.com"),
      code: "482913",
      expiresAt: d("2026-11-10T14:10:00.000Z"),
      consumedAt: d("2026-11-10T14:02:00.000Z"),
    },
    create: {
      id: "pv_maya_consumed",
      userId: userId("maya.chen@example.com"),
      code: "482913",
      expiresAt: d("2026-11-10T14:10:00.000Z"),
      consumedAt: d("2026-11-10T14:02:00.000Z"),
      createdAt: d("2026-11-10T14:00:00.000Z"),
    },
  });

  await prisma.phoneVerification.upsert({
    where: { id: "pv_james_pending" },
    update: {
      userId: userId("james.park@example.com"),
      code: "771204",
      expiresAt: d("2026-11-16T09:10:00.000Z"),
      consumedAt: null,
    },
    create: {
      id: "pv_james_pending",
      userId: userId("james.park@example.com"),
      code: "771204",
      expiresAt: d("2026-11-16T09:10:00.000Z"),
      consumedAt: null,
      createdAt: d("2026-11-16T09:00:00.000Z"),
    },
  });

  await prisma.phoneVerification.upsert({
    where: { id: "pv_sarah_consumed" },
    update: {
      userId: userId("sarah.lindqvist@example.com"),
      code: "905118",
      expiresAt: d("2026-10-30T19:15:00.000Z"),
      consumedAt: d("2026-10-30T19:07:00.000Z"),
    },
    create: {
      id: "pv_sarah_consumed",
      userId: userId("sarah.lindqvist@example.com"),
      code: "905118",
      expiresAt: d("2026-10-30T19:15:00.000Z"),
      consumedAt: d("2026-10-30T19:07:00.000Z"),
      createdAt: d("2026-10-30T19:05:00.000Z"),
    },
  });

  // --- Assessment attempts ----------------------------------------------
  for (const attempt of ATTEMPTS) {
    const candidate = CANDIDATES.find((item) => item.email === attempt.email);
    if (!candidate) {
      throw new Error(`Seed attempt ${attempt.id} references unknown candidate ${attempt.email}`);
    }

    const scored = scorePattern(attempt.correctQuestionIds);
    if (candidate.locScore !== scored.locScore) {
      throw new Error(
        `Seed LOC drift for ${attempt.email}: profile ${candidate.locScore}, pattern ${scored.locScore}`,
      );
    }

    const submittedAt = d(attempt.submittedAt);
    const startedAt = new Date(submittedAt.getTime() - attempt.durationSec * 1000);

    const saved = await prisma.assessmentAttempt.upsert({
      where: { id: attempt.id },
      update: {
        userId: userId(attempt.email),
        candidateId: candidateId(attempt.email),
        startedAt,
        submittedAt,
        status: "COMPLETED",
        rawScore: scored.rawScore,
        locScore: scored.locScore,
        durationSec: attempt.durationSec,
        ipHash: ipHash(attempt.email),
      },
      create: {
        id: attempt.id,
        userId: userId(attempt.email),
        candidateId: candidateId(attempt.email),
        startedAt,
        submittedAt,
        status: "COMPLETED",
        rawScore: scored.rawScore,
        locScore: scored.locScore,
        durationSec: attempt.durationSec,
        ipHash: ipHash(attempt.email),
      },
    });

    const correctSet = new Set(attempt.correctQuestionIds);
    for (const [index, q] of QUESTIONS.entries()) {
      const correct = correctSet.has(q.questionId);
      const selectedOption = correct ? q.correctOption : wrongOption(q.correctOption, index);
      await prisma.assessmentAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: saved.id,
            questionId: q.questionId,
          },
        },
        update: {
          competency: q.competency,
          difficulty: q.difficulty,
          selectedOption,
          correct,
          weight: q.weight,
        },
        create: {
          id: `ans_${attempt.id}_${q.questionId}`,
          attemptId: saved.id,
          questionId: q.questionId,
          competency: q.competency,
          difficulty: q.difficulty,
          selectedOption,
          correct,
          weight: q.weight,
        },
      });
    }
  }

  // --- Audit log ---------------------------------------------------------
  const auditEntries = [
    {
      id: "log_001",
      actorId: userId(ADMIN_EMAIL),
      action: "employer.verified",
      entity: "EmployerProfile",
      entityId: employerId("careers@northlineinfra.com"),
      meta: JSON.stringify({
        companyName: "Northline Infrastructure",
        verifiedBy: ADMIN_EMAIL,
      }),
      createdAt: d("2026-10-25T16:05:00.000Z"),
    },
    {
      id: "log_002",
      actorId: userId(ADMIN_EMAIL),
      action: "subscription.credits.granted",
      entity: "Subscription",
      entityId: subscriptionIdByEmployerId.get(employerId("talent@aecbuild.com")) ?? null,
      meta: JSON.stringify({
        plan: "GROWTH",
        creditsAdded: 75,
        creditsRemaining: 75,
      }),
      createdAt: d("2026-10-26T14:30:00.000Z"),
    },
    {
      id: "log_003",
      actorId: userId("talent@aecbuild.com"),
      action: "candidate.unlocked",
      entity: "TalentView",
      entityId: viewAecMaya.id,
      meta: JSON.stringify({
        candidateId: candidateId("maya.chen@example.com"),
        unlockCost: 1,
      }),
      createdAt: d("2026-11-11T14:20:00.000Z"),
    },
    {
      id: "log_004",
      actorId: null,
      action: "maintenance.loc_recalculated",
      entity: "CandidateProfile",
      entityId: null,
      meta: JSON.stringify({ evaluated: 8, changed: 0, run: "nightly" }),
      createdAt: d("2026-11-16T03:00:00.000Z"),
    },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.upsert({
      where: { id: entry.id },
      update: {
        actorId: entry.actorId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        meta: entry.meta,
      },
      create: entry,
    });
  }

  // --- Moderation report -------------------------------------------------
  await prisma.report.upsert({
    where: { id: "rpt_001" },
    update: {
      reporterId: userId("talent@aecbuild.com"),
      candidateId: candidateId("james.park@example.com"),
      reportedUserId: userId("james.park@example.com"),
      reason: "Credential mismatch",
      details:
        "Portfolio lists a project that is not present in the submitted work history. Requesting admin review before shortlisting.",
      status: "OPEN",
      resolution: "",
    },
    create: {
      id: "rpt_001",
      reporterId: userId("talent@aecbuild.com"),
      candidateId: candidateId("james.park@example.com"),
      reportedUserId: userId("james.park@example.com"),
      reason: "Credential mismatch",
      details:
        "Portfolio lists a project that is not present in the submitted work history. Requesting admin review before shortlisting.",
      status: "OPEN",
      resolution: "",
      createdAt: d("2026-11-14T18:45:00.000Z"),
    },
  });

  // --- Summary -----------------------------------------------------------
  const [
    users,
    candidates,
    employers,
    subscriptions,
    jobs,
    applications,
    views,
    attempts,
    answers,
    verifications,
    auditLogs,
    reports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.candidateProfile.count(),
    prisma.employerProfile.count(),
    prisma.subscription.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.talentView.count(),
    prisma.assessmentAttempt.count(),
    prisma.assessmentAnswer.count(),
    prisma.phoneVerification.count(),
    prisma.auditLog.count(),
    prisma.report.count(),
  ]);

  console.table([
    { table: "User", rows: users },
    { table: "CandidateProfile", rows: candidates },
    { table: "EmployerProfile", rows: employers },
    { table: "Subscription", rows: subscriptions },
    { table: "Job", rows: jobs },
    { table: "Application", rows: applications },
    { table: "TalentView", rows: views },
    { table: "AssessmentAttempt", rows: attempts },
    { table: "AssessmentAnswer", rows: answers },
    { table: "PhoneVerification", rows: verifications },
    { table: "AuditLog", rows: auditLogs },
    { table: "Report", rows: reports },
  ]);

  console.log("\nDemo credentials");
  console.table([
    { portal: "Admin", email: ADMIN_EMAIL, password: "Admin123!" },
    { portal: "Candidate", email: "maya.chen@example.com", password: "Candidate123!" },
    { portal: "Employer", email: "talent@aecbuild.com", password: "Employer123!" },
  ]);

  console.log(
    "Seed complete: 8 candidates (LOC 171-486), 3 employers, 6 jobs, 3 applications, 2 unlocks, 1 open report.",
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
