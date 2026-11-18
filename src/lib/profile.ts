/**
 * Pure profile helpers shared by the candidate UI, server actions and search.
 * No database imports here so client components can use the labels safely.
 */

export const DISCIPLINES: { key: string; label: string }[] = [
  { key: "architecture", label: "Architecture" },
  { key: "structure", label: "Structure" },
  { key: "mep", label: "MEP" },
  { key: "infrastructure", label: "Infrastructure" },
  { key: "construction", label: "Construction" },
  { key: "facilities", label: "Facilities" },
];

export const SOFTWARE: { key: string; label: string }[] = [
  { key: "revit", label: "Revit" },
  { key: "navisworks", label: "Navisworks" },
  { key: "archicad", label: "Archicad" },
  { key: "tekla", label: "Tekla" },
  { key: "civil3d", label: "Civil 3D" },
  { key: "dynamo", label: "Dynamo" },
  { key: "ifc", label: "IFC / openBIM" },
  { key: "solibri", label: "Solibri" },
  { key: "bim360", label: "BIM 360 / ACC" },
  { key: "recap", label: "ReCap" },
];

export const AVAILABILITY: { key: string; label: string }[] = [
  { key: "OPEN", label: "Open to offers" },
  { key: "NOT_LOOKING", label: "Not looking" },
  { key: "CONTRACT", label: "Contract / freelance" },
];

export const WORK_AUTH: { key: string; label: string }[] = [
  { key: "US_CITIZEN", label: "US citizen" },
  { key: "GREEN_CARD", label: "Green card" },
  { key: "H1B", label: "H-1B" },
  { key: "OTHER", label: "Other / requires sponsorship" },
];

export const WORK_MODES: { key: string; label: string }[] = [
  { key: "REMOTE", label: "Remote" },
  { key: "HYBRID", label: "Hybrid" },
  { key: "ONSITE", label: "On-site" },
];

export const EMPLOYMENT_TYPES: { key: string; label: string }[] = [
  { key: "FULL_TIME", label: "Full-time" },
  { key: "CONTRACT", label: "Contract" },
  { key: "PART_TIME", label: "Part-time" },
  { key: "INTERNSHIP", label: "Internship" },
];

export const APPLICATION_STATUSES = [
  "SUBMITTED",
  "REVIEWED",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "New",
  REVIEWED: "Reviewed",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-ink/[0.07] text-ink/70",
  REVIEWED: "bg-ink/[0.07] text-ink/70",
  SHORTLISTED: "bg-accent-soft text-accent-dark",
  INTERVIEW: "bg-accent-soft text-accent-dark",
  OFFER: "bg-verify-soft text-verify",
  HIRED: "bg-verify text-white",
  REJECTED: "bg-red-50 text-red-600",
  WITHDRAWN: "bg-ink/[0.05] text-ink/40",
};

export function parseCsv(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toCsv(values: string[]): string {
  return values.filter(Boolean).join(",");
}

export function labelFor(list: { key: string; label: string }[], key: string): string {
  return list.find((item) => item.key === key)?.label ?? key;
}

export type ProfileCompletenessInput = {
  headline: string;
  currentTitle: string;
  location: string;
  yearsExperience: number;
  disciplines: string;
  software: string;
  bio: string;
};

/**
 * Weighted completeness score, 0-100. The assessment requires exactly 100 so
 * the rule is intentionally simple, visible to the candidate and impossible to
 * game by submitting whitespace.
 */
export function profileCompleteness(p: ProfileCompletenessInput): number {
  let score = 0;
  if (p.headline.trim().length >= 8) score += 15;
  if (p.location.trim().length >= 3) score += 15;
  if (p.currentTitle.trim().length >= 2) score += 10;
  if (Number(p.yearsExperience) > 0) score += 10;
  if (parseCsv(p.disciplines).length > 0) score += 15;
  const tools = parseCsv(p.software);
  if (tools.length >= 3) score += 15;
  else if (tools.length > 0) score += 7;
  if (p.bio.trim().length >= 60) score += 20;
  return Math.min(100, score);
}

export const COMPLETENESS_RULES: { label: string; points: number; test: (p: ProfileCompletenessInput) => boolean }[] = [
  { label: "Headline of 8+ characters", points: 15, test: (p) => p.headline.trim().length >= 8 },
  { label: "US city and state", points: 15, test: (p) => p.location.trim().length >= 3 },
  { label: "Current job title", points: 10, test: (p) => p.currentTitle.trim().length >= 2 },
  { label: "At least one year of experience", points: 10, test: (p) => Number(p.yearsExperience) > 0 },
  { label: "One or more disciplines", points: 15, test: (p) => parseCsv(p.disciplines).length > 0 },
  { label: "Three or more BIM tools", points: 15, test: (p) => parseCsv(p.software).length >= 3 },
  { label: "Bio of 60+ characters", points: 20, test: (p) => p.bio.trim().length >= 60 },
];
