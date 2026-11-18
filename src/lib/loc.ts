/**
 * LOC (Level of Competence) scoring engine.
 *
 * NOTE: This module is deliberately pure. It has no database, clock or random
 * dependencies, so a submitted attempt always produces the same score for the
 * same answer set and bank version. That determinism is what makes an LOC
 * defensible to an employer and reproducible in an audit.
 *
 * Scoring model:
 *   1. Every item carries a difficulty weight (1 -> 1, 2 -> 2, 3 -> 3).
 *   2. weighted accuracy = sum(weight of correct items) / sum(weight of all 15 items).
 *      Unanswered, unknown-question and duplicate answers never add credit.
 *      For duplicates the last answer for an item wins (form resubmission).
 *   3. locScore = clamp(round(100 + weightedAccuracy * 400), 100, 500).
 *      The transform is monotonic, so more correct difficulty-weighted answers
 *      can never lower the score, and it is bounded, so one lucky attempt
 *      cannot claim an off-scale result.
 *   4. The band is derived from locScore, not from a separate lookup, so band
 *      and score can never disagree.
 *
 * Why this is defensible:
 *   - Weighted accuracy is transparent and auditable: an employer can see the
 *     item-level breakdown behind the number.
 *   - Difficulty weighting makes guessing unprofitable. In bank version 1 no
 *     single fixed letter accounts for more than 8 of 28 available weight, so a
 *     uniform guess lands in the Developing band at best, and the three
 *     difficulty-3 items are worth 9 of 28 total weight.
 *   - The 15-minute server-enforced time box limits lookups and tool assistance;
 *     a candidate cannot score 450+ by researching each item.
 *   - The score is a signal from a fixed, reviewed bank, not a psychometric
 *     certification. It must never be the sole basis for a hiring decision.
 */

import { COMPETENCIES, QUESTIONS } from "./questions";

/** One submitted answer. Unknown question ids are ignored by the scorer. */
export type ScoreAnswer = { questionId: string; optionId: string };

/** Per-competency result used by the candidate radar chart and employer card. */
export type CompetencyScore = {
  /** Competency key from COMPETENCIES. */
  competency: string;
  /** Human-readable competency label. */
  label: string;
  /** Items answered correctly in this competency. */
  correct: number;
  /** Items in this competency in the current bank. */
  total: number;
  /** Unweighted accuracy as an integer percentage (0..100). */
  pct: number;
  /** Competency weight from COMPETENCIES (ranking only, not the LOC formula). */
  weight: number;
  /** Difficulty weight earned in this competency. */
  points: number;
  /** Difficulty weight available in this competency. */
  pointsMax: number;
};

/** Item-level record of one attempt, retained for audit and explanations. */
export type AttemptBreakdown = {
  questionId: string;
  competency: string;
  difficulty: number;
  weight: number;
  /** Selected option id, or "" when the item was left unanswered. */
  selected: string;
  /** Correct option id for the item. */
  answer: string;
  correct: boolean;
};

/** A published LOC band with candidate-facing and employer-facing meaning. */
export type LocBand = {
  key: string;
  label: string;
  /** Inclusive lower bound. */
  min: number;
  /** Inclusive upper bound. */
  max: number;
  description: string;
  employerSignal: string;
};

/** Complete, serialisable output of one scored attempt. */
export type ScoreResult = {
  /** 100..500 integer; the published Level of Competence. */
  locScore: number;
  /** 0..100 weighted accuracy, rounded to two decimals for display. */
  rawScore: number;
  /** Number of correctly answered items. */
  correct: number;
  /** Number of items in the bank (including unanswered items). */
  total: number;
  /** Band containing locScore. */
  band: LocBand;
  /** Per-competency results in COMPETENCIES order. */
  byCompetency: CompetencyScore[];
  /** Item-level results in bank order. */
  breakdown: AttemptBreakdown[];
  /** Up to two competency labels worth highlighting to the candidate. */
  strengths: string[];
  /** Up to two competency labels worth improving. */
  gaps: string[];
};

/** Lowest possible LOC score. */
export const LOC_MIN = 100;
/** Highest possible LOC score. */
export const LOC_MAX = 500;

const EMERGING: LocBand = {
  key: "emerging",
  label: "Emerging",
  min: 100,
  max: 199,
  description:
    "Recognizes BIM concepts and vocabulary but has limited applied project experience.",
  employerSignal:
    "Suited to supervised production or internship roles with structured review; do not assign independent coordination.",
};

const DEVELOPING: LocBand = {
  key: "developing",
  label: "Developing",
  min: 200,
  max: 299,
  description:
    "Handles routine modeling and documentation tasks with support on coordination and standards decisions.",
  employerSignal:
    "Can contribute to a discipline team on defined tasks; expect review on model setup, quantities and exchanges.",
};

const COMPETENT: LocBand = {
  key: "competent",
  label: "Competent",
  min: 300,
  max: 399,
  description:
    "Works independently across common BIM workflows and can own a defined workstream with normal QA.",
  employerSignal:
    "Qualified for BIM coordinator, model manager or senior technician roles on typical projects.",
};

const PROFICIENT: LocBand = {
  key: "proficient",
  label: "Proficient",
  min: 400,
  max: 449,
  description:
    "Leads coordination and information-management decisions and can defend technical trade-offs to a project team.",
  employerSignal:
    "Qualified to lead a project's BIM delivery, mentor staff and own federated model quality.",
};

const EXPERT: LocBand = {
  key: "expert",
  label: "Expert",
  min: 450,
  max: 500,
  description:
    "Demonstrates deep, cross-discipline command of BIM delivery, standards and automation under time pressure.",
  employerSignal:
    "Qualified for program-level BIM/VDC leadership, standards ownership and high-risk delivery advisory.",
};

/** The five published bands. Bounds are inclusive and cover 100..500 without gaps. */
export const LOC_BANDS: LocBand[] = [EMERGING, DEVELOPING, COMPETENT, PROFICIENT, EXPERT];

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const round2 = (value: number): number => Math.round(value * 100) / 100;

const compareKeys = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Map a score to its band. Out-of-range and non-finite inputs are clamped to
 * 100..500 so a caller can never receive an undefined band.
 */
export function bandFor(locScore: number): LocBand {
  const score = Number.isFinite(locScore)
    ? clamp(Math.round(locScore), LOC_MIN, LOC_MAX)
    : LOC_MIN;

  if (score <= EMERGING.max) return EMERGING;
  if (score <= DEVELOPING.max) return DEVELOPING;
  if (score <= COMPETENT.max) return COMPETENT;
  if (score <= PROFICIENT.max) return PROFICIENT;
  return EXPERT;
}

/**
 * Convert weighted accuracy to an LOC score.
 *
 * @param weightedPct Weighted accuracy. The canonical input is a fraction in
 * [0, 1], matching the published formula `round(100 + weightedPct * 400)`:
 * 0 -> 100, 0.5 -> 300 and 1 -> 500. A value above 1 is treated as a
 * percentage in (1, 100] and divided by 100, so UI callers can pass
 * `rawScore` directly. Values outside the range clamp; NaN or Infinity
 * resolves to LOC_MIN. The transform is linear and monotonic.
 */
export function accuracyToLoc(weightedPct: number): number {
  if (!Number.isFinite(weightedPct)) return LOC_MIN;
  const ratio = weightedPct > 1 ? weightedPct / 100 : weightedPct;
  const bounded = clamp(ratio, 0, 1);
  return clamp(Math.round(LOC_MIN + bounded * (LOC_MAX - LOC_MIN)), LOC_MIN, LOC_MAX);
}

/**
 * Score one assessment attempt.
 *
 * Edge cases:
 * - `answers` empty -> locScore 100, every item recorded as unanswered.
 * - Unknown questionId -> ignored (cannot inflate the denominator).
 * - Duplicate questionId -> last answer wins.
 * - Partial answers -> missing items count as wrong for both numerator and
 *   denominator; `total` always equals the full bank size.
 *
 * @param answers Submitted answers, in any order.
 * @returns A fully populated, deterministic ScoreResult.
 */
export function scoreAssessment(answers: ScoreAnswer[]): ScoreResult {
  const selectedByQuestion = new Map<string, string>();

  for (const answer of answers) {
    if (!answer || typeof answer.questionId !== "string") continue;
    if (typeof answer.optionId !== "string") continue;
    selectedByQuestion.set(answer.questionId, answer.optionId);
  }

  let earnedWeight = 0;
  let availableWeight = 0;
  let correct = 0;

  const breakdown: AttemptBreakdown[] = QUESTIONS.map((question) => {
    const selected = selectedByQuestion.get(question.id) ?? "";
    const isCorrect = selected === question.answer;

    availableWeight += question.difficulty;
    if (isCorrect) {
      earnedWeight += question.difficulty;
      correct += 1;
    }

    return {
      questionId: question.id,
      competency: question.competency,
      difficulty: question.difficulty,
      weight: question.difficulty,
      selected,
      answer: question.answer,
      correct: isCorrect,
    };
  });

  const accuracyRatio = availableWeight > 0 ? earnedWeight / availableWeight : 0;
  const locScore = accuracyToLoc(accuracyRatio);

  const byCompetency: CompetencyScore[] = COMPETENCIES.map((competency) => {
    const items = breakdown.filter((item) => item.competency === competency.key);
    const total = items.length;
    const hits = items.filter((item) => item.correct).length;
    const points = items.reduce((sum, item) => sum + (item.correct ? item.weight : 0), 0);
    const pointsMax = items.reduce((sum, item) => sum + item.weight, 0);

    return {
      competency: competency.key,
      label: competency.label,
      correct: hits,
      total,
      pct: total > 0 ? Math.round((hits / total) * 100) : 0,
      weight: competency.weight,
      points,
      pointsMax,
    };
  });

  const scored = byCompetency.filter((item) => item.total > 0);

  const strengths = [...scored]
    .filter((item) => item.pct >= 70)
    .sort(
      (a, b) =>
        b.weight * b.pct - a.weight * a.pct ||
        b.pct - a.pct ||
        compareKeys(a.competency, b.competency),
    )
    .slice(0, 2)
    .map((item) => item.label);

  const gaps = [...scored]
    .filter((item) => item.pct < 60)
    .sort(
      (a, b) =>
        a.weight * a.pct - b.weight * b.pct ||
        a.pct - b.pct ||
        compareKeys(a.competency, b.competency),
    )
    .slice(0, 2)
    .map((item) => item.label);

  return {
    locScore,
    rawScore: round2(accuracyRatio * 100),
    correct,
    total: QUESTIONS.length,
    band: bandFor(locScore),
    byCompetency,
    breakdown,
    strengths,
    gaps,
  };
}
