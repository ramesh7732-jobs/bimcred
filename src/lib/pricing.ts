/**
 * BIMcred pricing catalogue and billing helpers.
 *
 * Why credits instead of per-seat pricing
 * ---------------------------------------
 * BIM hiring is bursty, not continuous. A VDC manager might fill two BIM
 * coordinator roles in March and then hire nobody until October. Per-seat
 * pricing punishes an employer for keeping a login for the months in between,
 * so seats get shared, activity becomes invisible, and the account churns at
 * renewal. Credits invert that: an employer pays for the relationships it
 * actually opens, and the seat is free to keep.
 *
 * A credit is therefore not "a profile view". Unlocks are idempotent - once an
 * employer has unlocked a candidate, re-opening that candidate is free forever.
 * One credit equals one new relationship between an employer and a verified
 * candidate, which is the only event BIMcred can defend as valuable.
 *
 * This also keeps the candidate side honest: candidates are never charged,
 * never boosted by paying us, and never ranked by who paid. Revenue comes from
 * employers wanting more first-contact capacity, which is a demand signal we
 * can measure (top-up rate, credit burn-down) rather than a paywall we have to
 * defend in sales calls.
 *
 * All prices are USD, exclusive of tax, and represent the list price in the
 * local prototype. Nothing here reads the database: the catalogue is a pure
 * constant so the landing page, billing page and admin console cannot drift.
 */

/** Billing tier identifiers, ordered from cheapest to most expensive. */
export type PlanKey = "TRIAL" | "STARTER" | "GROWTH" | "ENTERPRISE";

/** A purchasable BIMcred plan. All monetary values are USD. */
export type Plan = {
  key: PlanKey;
  name: string;
  /** List price per month when billed monthly. */
  priceMonthly: number;
  /** Effective price per month when billed annually. */
  priceAnnual: number;
  /** Contact unlocks included per month. */
  credits: number;
  /** Recruiter seats included; -1 means unlimited. */
  seats: number;
  /** Whether candidate search filters are available at all. */
  searchFilters: boolean;
  /** Active job posts included; -1 means unlimited. */
  jobPosts: number;
  /** Whether the hiring pipeline board is included. */
  pipeline: boolean;
  /** Whether funnel and usage analytics are included. */
  analytics: boolean;
  /** Whether API and webhook access is included. */
  api: boolean;
  /** Support and availability commitment, in plain language. */
  sla: string;
  /** One-line positioning statement. */
  tagline: string;
  /** Four to six short marketing bullets. */
  features: string[];
  /** Marks the recommended plan. At most one plan sets this. */
  highlight?: boolean;
};

/** Cost in credits of one first-time candidate unlock. */
export const UNLOCK_COST = 1;

const TRIAL_PLAN: Plan = {
  key: "TRIAL",
  name: "Trial",
  priceMonthly: 0,
  priceAnnual: 0,
  credits: 10,
  seats: 1,
  searchFilters: false,
  jobPosts: 3,
  pipeline: false,
  analytics: false,
  api: false,
  sla: "Community support, best effort",
  tagline: "See the talent pool before you pay.",
  features: [
    "Full 15-question LOC assessment for candidates",
    "10 contact unlocks per month",
    "3 active job posts",
    "Browse candidate previews without filters",
    "1 recruiter seat",
  ],
};

const STARTER_PLAN: Plan = {
  key: "STARTER",
  name: "Starter",
  priceMonthly: 149,
  priceAnnual: 119,
  credits: 25,
  seats: 3,
  searchFilters: true,
  jobPosts: 10,
  pipeline: false,
  analytics: false,
  api: false,
  sla: "Email support, 1 business day",
  tagline: "For the recruiter who hires BIM staff a few times a year.",
  features: [
    "Filter by LOC score, discipline, software and location",
    "25 contact unlocks per month",
    "3 recruiter seats",
    "10 active job posts",
    "CSV export of candidates you have unlocked",
    "Email support, 1 business day",
  ],
};

const GROWTH_PLAN: Plan = {
  key: "GROWTH",
  name: "Growth",
  priceMonthly: 399,
  priceAnnual: 319,
  credits: 75,
  seats: 10,
  searchFilters: true,
  jobPosts: -1,
  pipeline: true,
  analytics: true,
  api: false,
  sla: "Priority email and chat, same business day",
  tagline: "For AEC teams running several BIM and VDC roles at once.",
  features: [
    "Everything in Starter",
    "75 contact unlocks per month",
    "Unlimited job posts",
    "10 seats with shared notes and mentions",
    "Hiring pipeline with stage analytics",
    "Priority support, same business day",
  ],
  highlight: true,
};

const ENTERPRISE_PLAN: Plan = {
  key: "ENTERPRISE",
  name: "Enterprise",
  priceMonthly: 1200,
  priceAnnual: 960,
  credits: 250,
  seats: -1,
  searchFilters: true,
  jobPosts: -1,
  pipeline: true,
  analytics: true,
  api: true,
  sla: "Priority, 99.9% uptime",
  tagline: "For national AEC firms with procurement and security review.",
  features: [
    "Everything in Growth",
    "250 contact unlocks per month",
    "Unlimited seats across regions",
    "Public API, webhooks and Slack alerts",
    "SSO, audit log and custom DPA",
    "Priority support, 99.9% uptime SLA",
  ],
};

/** All plans in display order: Trial, Starter, Growth, Enterprise. */
export const PLANS: Plan[] = [TRIAL_PLAN, STARTER_PLAN, GROWTH_PLAN, ENTERPRISE_PLAN];

/**
 * Resolves a plan from a loosely-typed string (cookie, query param, DB row).
 *
 * Matching is case-insensitive and ignores surrounding whitespace. Unknown,
 * empty or malformed keys fall back to Trial so callers never have to guard
 * against a thrown error on the billing page.
 *
 * @param key Candidate plan key, for example "growth" or "ENTERPRISE ".
 * @returns The matching plan, or the Trial plan when nothing matches.
 */
export function planFor(key: string): Plan {
  if (typeof key !== "string") {
    return TRIAL_PLAN;
  }
  const normalized = key.trim().toUpperCase();
  const match = PLANS.find((plan) => plan.key === normalized);
  return match ?? TRIAL_PLAN;
}

/**
 * Formats a USD amount for display with thousands separators and no decimals.
 *
 * Defensive by design: negative, infinite and NaN inputs render as "$0" rather
 * than "$NaN" or a negative price on a pricing table.
 *
 * @param n Amount in whole US dollars.
 * @returns A string such as "$0", "$149" or "$1,200".
 */
export function formatUsd(n: number): string {
  const safe = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  const grouped = safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${grouped}`;
}

/**
 * Pluralises a credit count for UI copy.
 *
 * @param n Number of credits; negative and non-finite values are treated as 0.
 * @returns "0 credits", "1 credit" or "25 credits".
 */
export function creditsLabel(n: number): string {
  const safe = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  return `${safe} ${safe === 1 ? "credit" : "credits"}`;
}

/**
 * Discount from monthly to annual billing, as a whole percentage.
 *
 * Derived from the catalogue rather than hard-coded, so the badge on the
 * pricing table can never disagree with the numbers beside it. Free plans and
 * any plan whose annual price is not actually cheaper return 0.
 *
 * @param plan Plan to evaluate.
 * @returns Integer between 0 and 100.
 */
export function annualSavingPct(plan: Plan): number {
  const monthly = plan.priceMonthly;
  const annual = plan.priceAnnual;
  if (!Number.isFinite(monthly) || !Number.isFinite(annual) || monthly <= 0) {
    return 0;
  }
  if (annual >= monthly) {
    return 0;
  }
  const pct = Math.round(((monthly - annual) / monthly) * 100);
  return Math.min(100, Math.max(0, pct));
}
