/**
 * Journey model for BIMcred.
 *
 * This module is intentionally dependency-free: the dashboards, the marketing
 * pages and the prototype review checklist all read from the same source of
 * truth. Every route listed here exists in the shipped App Router tree; keep it
 * that way when the UI changes.
 *
 * The next-action helpers are pure and total. They never throw, never read the
 * environment, and always return a step the user can act on, including the
 * terminal "all-set" state.
 */

/** The three signed-in portals in the product. */
export type PortalKey = "candidate" | "employer" | "admin";

/** One actionable step in a portal journey. */
export type JourneyStep = {
  /** Kebab-case identifier. Stable across releases; safe to persist. */
  id: string;
  /** Short label shown in the journey rail. */
  title: string;
  /** One imperative sentence explaining the step and its gating rule. */
  description: string;
  /** Real route in this application, for example "/candidate/assessment". */
  route: string;
  /** Button label, at most 24 characters. */
  cta: string;
  /** Human-readable prerequisite, when the step is gated. */
  gate?: string;
  /** How a reviewer proves in the local prototype that this step works. */
  verify: string;
};

/**
 * Candidate journey in narrative order: account, profile, phone, assessment,
 * score, visibility, jobs, tracker.
 *
 * The dashboard resume card uses the same order (see {@link candidateNextAction});
 * the assessment hard-gates on both profile completion and phone verification.
 */
export const CANDIDATE_JOURNEY: JourneyStep[] = [
  {
    id: "create-account",
    title: "Create your account",
    description:
      "Create a free candidate account with email and password; no card, no fee and no recruiter access until you opt in.",
    route: "/signup",
    cta: "Create free account",
    verify:
      "Open /signup, submit a name, email and password of at least 8 characters, and confirm you land on /candidate signed in.",
  },
  {
    id: "profile",
    title: "Build your profile",
    description:
      "Add headline, city and state, current title, years, disciplines, at least three tools and a short bio so your profile clears the completeness gate.",
    route: "/candidate/profile",
    cta: "Build profile",
    gate: "Account created",
    verify:
      "Open /candidate/profile, fill headline, US city and state, current title, years, one discipline, three software tools and a 60-character bio, then confirm the completeness meter reaches 100%.",
  },
  {
    id: "verify-phone",
    title: "Verify your US mobile",
    description:
      "Verify a US mobile number so employers can see a verified badge and pay a credit to reveal it.",
    route: "/candidate/verify-phone",
    cta: "Verify US mobile",
    gate: "Account created",
    verify:
      "Enter 4155550123 on /candidate/verify-phone, request a code, submit the six-digit code shown in the dev banner, and confirm the status card changes to Verified with the number shown as (415) 555-0123.",
  },
  {
    id: "assessment",
    title: "Take the BIM skill test",
    description:
      "Answer 15 timed BIM questions in 15 minutes with one attempt; answers stay in the open tab and the form submits automatically at zero.",
    route: "/candidate/assessment",
    cta: "Take skill test",
    gate: "US mobile verified and profile 100% complete",
    verify:
      "Open /candidate/assessment, answer all 15 questions, confirm the countdown starts at 15:00 and that submitting produces a LOC score between 100 and 500.",
  },
  {
    id: "review-loc",
    title: "Read your LOC result",
    description:
      "Read your LOC score out of 500, your band, the competency breakdown and your strengths and growth areas.",
    route: "/candidate",
    cta: "See my LOC",
    gate: "Assessment submitted",
    verify:
      "Return to /candidate after submitting and confirm the score ring, band label, competency breakdown and strengths/growth areas are visible.",
  },
  {
    id: "visibility",
    title: "Choose your visibility",
    description:
      "Turn talent-pool visibility on so verified employers can find your scored card; each contact unlock costs them one credit.",
    route: "/candidate/profile",
    cta: "Set visibility",
    gate: "LOC score issued",
    verify:
      "Toggle visibility on at /candidate/profile, then confirm /candidate shows Visible to verified employers and that an employer search at /employer/talent includes the profile.",
  },
  {
    id: "jobs",
    title: "Apply to BIM jobs",
    description:
      "Filter the job feed by keyword, work mode and LOC window, then apply with your scored profile attached in one click.",
    route: "/candidate/jobs",
    cta: "Browse jobs",
    gate: "Profile 100% complete and LOC score issued",
    verify:
      "Open /candidate/jobs, apply a work-mode filter, then submit an application; confirm the success flash and that the role shows Applied in the feed.",
  },
  {
    id: "tracker",
    title: "Track your applications",
    description:
      "Follow every application from submitted to hired, and withdraw while an application is still active.",
    route: "/candidate/applications",
    cta: "Open tracker",
    gate: "At least one application submitted",
    verify:
      "Open /candidate/applications and confirm the new application appears with status New, the role title and the application timestamp.",
  },
];

/**
 * Employer journey in narrative order: account, verification, credits, search,
 * unlock, shortlist, job post, pipeline.
 */
export const EMPLOYER_JOURNEY: JourneyStep[] = [
  {
    id: "create-company-account",
    title: "Create your company account",
    description:
      "Sign up with your work email and company name; the account starts unverified and cannot spend credits or see contact data.",
    route: "/signup",
    cta: "Create employer account",
    verify:
      "Open /signup, choose the Employer tab, submit company name and work email, and confirm you land on /employer with an Unverified badge.",
  },
  {
    id: "verify-company",
    title: "Verify your company",
    description:
      "Submit a verification request from your company profile so an admin can approve the account before any credit is spendable.",
    route: "/employer",
    cta: "Submit verification",
    gate: "Company account created",
    verify:
      "Click Submit verification on /employer, then sign in as admin at /admin/employers and confirm the company can be approved or revoked.",
  },
  {
    id: "trial-credits",
    title: "Review your trial credits",
    description:
      "Confirm the ten trial unlock credits granted once per verified company; each candidate unlock costs exactly one credit.",
    route: "/employer/billing",
    cta: "View credits",
    gate: "Company verified",
    verify:
      "Open /employer/billing after admin approval and confirm the balance reads 10 credits and the trial grant appears in the ledger.",
  },
  {
    id: "search-talent",
    title: "Search verified talent",
    description:
      "Filter candidates by keyword, LOC band or floor, discipline, software, location, years, availability and remote-only; filtering and previews cost nothing.",
    route: "/employer/talent",
    cta: "Search talent",
    gate: "Company account created",
    verify:
      "On a Starter or Growth plan, open /employer/talent, set a LOC floor and software filter, and confirm the result count updates without changing the credit balance.",
  },
  {
    id: "unlock-candidate",
    title: "Unlock candidate contact",
    description:
      "Spend one credit to reveal a candidate's phone and email; re-opening the same candidate is free and every unlock is written to the audit log.",
    route: "/employer/talent/[id]",
    cta: "Unlock contact",
    gate: "At least one credit available",
    verify:
      "Open a candidate detail page, click Unlock contact, and confirm the phone and email appear, the balance drops by one and /admin/audit records the spend.",
  },
  {
    id: "review-talent",
    title: "Shortlist and compare",
    description:
      "Unlock candidates to build your shortlist and compare up to five side by side; re-opening an unlocked profile is always free.",
    route: "/employer/talent",
    cta: "Build shortlist",
    gate: "At least one search result",
    verify:
      "Unlock two candidates from /employer/talent, open My shortlist and confirm the compare table renders their LOC, band, experience, disciplines, tools and location.",
  },
  {
    id: "post-job",
    title: "Post your first job",
    description:
      "Publish a BIM role with a title, LOC window, work mode and pay range so matching candidates surface in the candidate feed.",
    route: "/employer/jobs/new",
    cta: "Post a job",
    gate: "Company verified",
    verify:
      "Submit /employer/jobs/new with a title, description, LOC window and pay range, then confirm the role appears under /employer/jobs as Open.",
  },
  {
    id: "review-pipeline",
    title: "Review your pipeline",
    description:
      "Move applicants through New, Reviewed, Shortlisted, Interview, Offer and Hired; every transition is audited and appears in the candidate tracker.",
    route: "/employer/pipeline",
    cta: "Review pipeline",
    gate: "At least one application received",
    verify:
      "Open /employer/pipeline, move an applicant from New to Shortlisted, and confirm the candidate tracker at /candidate/applications shows the same status.",
  },
];

/** Admin journey covering the daily operations loop. */
export const ADMIN_JOURNEY: JourneyStep[] = [
  {
    id: "daily-triage",
    title: "Start the daily triage",
    description:
      "Open the operations board and clear employer verification requests and open moderation reports in one pass.",
    route: "/admin",
    cta: "Open ops board",
    verify:
      "Sign in as an admin and confirm /admin lists pending employers and open moderation reports with counts.",
  },
  {
    id: "verify-employers",
    title: "Clear the verification queue",
    description:
      "Approve or revoke company verification; approval makes the trial credits spendable and enables job publishing.",
    route: "/admin/employers",
    cta: "Review queue",
    gate: "Pending verification request",
    verify:
      "Approve a pending company at /admin/employers and confirm the employer account flips to Verified on /employer.",
  },
  {
    id: "audit-candidates",
    title: "Inspect candidate accounts",
    description:
      "Check phone-verification state, LOC score and visibility, and correct them when a support case requires it.",
    route: "/admin/users",
    cta: "Inspect users",
    verify:
      "Open /admin/users, search a candidate by email and confirm verification state, LOC score and visibility are shown with audited toggles.",
  },
  {
    id: "check-assessments",
    title: "Check question health",
    description:
      "Review per-question attempts and correct rate so one bad question does not drag an entire LOC band down.",
    route: "/admin/assessments",
    cta: "Check questions",
    verify:
      "Open /admin/assessments and confirm each question shows attempts, correct rate and competency coverage.",
  },
  {
    id: "read-audit-log",
    title: "Trace the audit log",
    description:
      "Follow each credit spend, unlock, verification and admin action back to an actor, target and timestamp.",
    route: "/admin/audit",
    cta: "Read audit log",
    verify:
      "Open /admin/audit and confirm the employer unlock from the reviewer script appears with actor, candidate and credit delta.",
  },
  {
    id: "resolve-support",
    title: "Resolve the support queue",
    description:
      "Resolve moderation reports from the admin home queue with a written outcome.",
    route: "/admin",
    cta: "Resolve report",
    gate: "Open moderation report",
    verify:
      "Open a moderation report on /admin, add a resolution and confirm it leaves the open queue and is recorded in /admin/audit.",
  },
];

/** All journeys keyed by portal, for generic rail and checklist rendering. */
export const JOURNEYS: Record<PortalKey, JourneyStep[]> = {
  candidate: CANDIDATE_JOURNEY,
  employer: EMPLOYER_JOURNEY,
  admin: ADMIN_JOURNEY,
};

/** Everything the candidate dashboard needs to decide what to show next. */
export type CandidateState = {
  /** A candidate profile record exists for the signed-in account. */
  hasProfile: boolean;
  /** A US mobile number passed OTP verification. */
  phoneVerified: boolean;
  /** An assessment was submitted and a LOC score was issued. */
  hasLoc: boolean;
  /** Every required profile field is filled (the completeness meter reads 100%). */
  profileComplete: boolean;
  /** The candidate opted in to the employer talent pool. */
  visible: boolean;
};

/** The resume card payload consumed by every portal dashboard. */
export type NextAction = {
  /** Stable action id; matches a {@link JourneyStep.id} where the rail has that step, plus "top-up-credits" and "all-set". */
  stepId: string;
  /** Short heading for the card. */
  title: string;
  /** One sentence explaining why this is next and what it unlocks. */
  description: string;
  /** Button label, at most 24 characters. */
  cta: string;
  /** Route the button navigates to. */
  route: string;
  /** Completion of the portal journey at the time of the call, 0 to 100. */
  progress: number;
};

/** Everything the employer dashboard needs to decide what to show next. */
export type EmployerState = {
  /** An admin approved the company and its domain. */
  verified: boolean;
  /** Unused unlock credits on the account. */
  creditsRemaining: number;
  /** At least one job was published. */
  hasJob: boolean;
  /** At least one candidate was shortlisted. */
  hasShortlist: boolean;
};

/** Flat, friendly route map. Values are the only routes the prototype ships. */
export const ROUTES: {
  candidate: Record<string, string>;
  employer: Record<string, string>;
  admin: Record<string, string>;
} = {
  candidate: {
    home: "/candidate",
    verifyPhone: "/candidate/verify-phone",
    assessment: "/candidate/assessment",
    profile: "/candidate/profile",
    jobs: "/candidate/jobs",
    applications: "/candidate/applications",
    login: "/login",
    signup: "/signup",
  },
  employer: {
    home: "/employer",
    talent: "/employer/talent",
    talentProfile: "/employer/talent/[id]",
    jobs: "/employer/jobs",
    newJob: "/employer/jobs/new",
    pipeline: "/employer/pipeline",
    billing: "/employer/billing",
    login: "/login",
    signup: "/signup",
  },
  admin: {
    home: "/admin",
    users: "/admin/users",
    employers: "/admin/employers",
    assessments: "/admin/assessments",
    audit: "/admin/audit",
    login: "/login",
  },
};

/** Clamp a number into the inclusive integer range 0 to 100. */
function asPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return Math.round(value);
}

/** The four candidate gates, in contract order. */
function candidateGates(s: CandidateState): boolean[] {
  return [
    s.hasProfile && s.profileComplete,
    s.phoneVerified,
    s.hasLoc,
    s.visible,
  ];
}

/**
 * Percentage of the candidate journey complete, 0 to 100.
 * Pure, monotonic in every state flag, and exactly 0 / 100 at the endpoints.
 */
export function candidateProgress(s: CandidateState): number {
  const done = candidateGates(s).filter(Boolean).length;
  return asPercent((done / 4) * 100);
}

/**
 * The single next action for a candidate. First unmet gate wins, in this order:
 * profile, US mobile, assessment, visibility. When every gate is met the
 * function returns the terminal "all-set" action pointing at the job feed.
 */
export function candidateNextAction(s: CandidateState): NextAction {
  const progress = candidateProgress(s);

  if (!s.hasProfile || !s.profileComplete) {
    return {
      stepId: "profile",
      title: "Complete your profile",
      description:
        "Fill every required profile field so your scored card is credible and the assessment unlocks.",
      cta: "Finish profile",
      route: ROUTES.candidate.profile,
      progress,
    };
  }

  if (!s.phoneVerified) {
    return {
      stepId: "verify-phone",
      title: "Verify your US mobile",
      description:
        "Confirm a US mobile number so employers see a verified badge and can unlock your contact.",
      cta: "Verify mobile",
      route: ROUTES.candidate.verifyPhone,
      progress,
    };
  }

  if (!s.hasLoc) {
    return {
      stepId: "assessment",
      title: "Take the BIM skill test",
      description:
        "Complete the 15-minute assessment to earn a LOC score between 100 and 500; one attempt only.",
      cta: "Start assessment",
      route: ROUTES.candidate.assessment,
      progress,
    };
  }

  if (!s.visible) {
    return {
      stepId: "visibility",
      title: "Choose your visibility",
      description:
        "Turn on talent-pool visibility so verified employers can find your scored profile.",
      cta: "Set visibility",
      route: ROUTES.candidate.profile,
      progress,
    };
  }

  return {
    stepId: "all-set",
    title: "You are discoverable",
    description:
      "Your profile is complete, verified and scored; keep applying and keep the tracker up to date.",
    cta: "Browse jobs",
    route: ROUTES.candidate.jobs,
    progress,
  };
}

/** The four employer gates, in contract order. */
function employerGates(s: EmployerState): boolean[] {
  return [s.verified, s.creditsRemaining > 0, s.hasJob, s.hasShortlist];
}

/**
 * Percentage of the employer journey complete, 0 to 100.
 * Pure, monotonic in every state flag, and exactly 0 / 100 at the endpoints.
 */
export function employerProgress(s: EmployerState): number {
  const done = employerGates(s).filter(Boolean).length;
  return asPercent((done / 4) * 100);
}

/**
 * The single next action for an employer. First unmet gate wins, in this order:
 * company verification, credits, first job, shortlist. When every gate is met
 * the function returns the terminal "all-set" action pointing at the pipeline.
 */
export function employerNextAction(s: EmployerState): NextAction {
  const progress = employerProgress(s);

  if (!s.verified) {
    return {
      stepId: "verify-company",
      title: "Verify your company",
      description:
        "Submit a verification request so an admin can approve the company before credits become spendable.",
      cta: "Submit verification",
      route: ROUTES.employer.home,
      progress,
    };
  }

  if (s.creditsRemaining <= 0) {
    return {
      stepId: "top-up-credits",
      title: "Top up your credits",
      description:
        "Buy unlock credits to reveal verified candidate contact details; one credit per new candidate.",
      cta: "Buy credits",
      route: ROUTES.employer.billing,
      progress,
    };
  }

  if (!s.hasJob) {
    return {
      stepId: "post-job",
      title: "Post your first job",
      description:
        "Publish a BIM role with a LOC floor and pay range so matching candidates can apply.",
      cta: "Post a job",
      route: ROUTES.employer.newJob,
      progress,
    };
  }

  if (!s.hasShortlist) {
    return {
      stepId: "review-talent",
      title: "Shortlist verified talent",
      description:
        "Search scored candidates, unlock the ones worth contacting and build a comparison shortlist.",
      cta: "Find talent",
      route: ROUTES.employer.talent,
      progress,
    };
  }

  return {
    stepId: "all-set",
    title: "Pipeline is running",
    description:
      "Verification, credits, a live job and a shortlist are all in place; review applicants next.",
    cta: "Open pipeline",
    route: ROUTES.employer.pipeline,
    progress,
  };
}
