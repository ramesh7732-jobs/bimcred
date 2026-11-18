/**
 * BIMcred assessment question bank.
 *
 * The bank is intentionally small and stable: 15 items, 10 competencies,
 * difficulty-weighted scoring, no software-version trivia. Item wording is
 * owned by the product team and reviewed against the cited source before a
 * scoring-bank version is published. Changing an answer, option or difficulty
 * requires a new bank version because it changes candidate LOC scores.
 */

/** Item difficulty. Used directly as the scoring weight: 1 -> 1, 2 -> 2, 3 -> 3. */
export type QuestionDifficulty = 1 | 2 | 3;

/** A single selectable answer. Option ids are always "a", "b", "c" or "d". */
export type QuestionOption = { id: string; label: string };

/** One scored assessment item. */
export type Question = {
  /** Stable item id, e.g. "q01". Never reused for a different item. */
  id: string;
  /** Key from COMPETENCIES. */
  competency: string;
  difficulty: QuestionDifficulty;
  prompt: string;
  /** Exactly four options with ids "a" | "b" | "c" | "d". */
  options: QuestionOption[];
  /** Correct option id. */
  answer: string;
  /** One-sentence rationale shown to the candidate after submission. */
  explanation: string;
  /** Primary source or framework the item is defensible against. */
  source?: string;
};

/**
 * Competency taxonomy used by the assessment, the LOC breakdown and the radar
 * chart. Weights are relative multipliers in the 0.5-1.5 band that total 10.0;
 * divide by the total for a 0-1 share. They rank strengths and gaps, not the
 * headline LOC score (that is difficulty-weighted, see lib/loc.ts).
 */
export const COMPETENCIES: {
  key: string;
  label: string;
  weight: number;
  description: string;
}[] = [
  {
    key: "iso19650",
    label: "ISO 19650 information management",
    weight: 1.4,
    description: "Information requirements, CDE states and delivery-phase workflow.",
  },
  {
    key: "lod",
    label: "LOD, LOI and model progression",
    weight: 1.2,
    description: "Level of development, level of information need and model progression.",
  },
  {
    key: "clash",
    label: "Coordination and clash detection",
    weight: 1.1,
    description: "Clash triage, tolerance setting and federated model coordination.",
  },
  {
    key: "quantity",
    label: "5D quantities and estimating",
    weight: 1.0,
    description: "Model-based takeoff, waste factors and estimate reconciliation.",
  },
  {
    key: "schedules",
    label: "4D sequencing",
    weight: 0.9,
    description: "Activity-to-element linking and constructability review.",
  },
  {
    key: "interop",
    label: "IFC and openBIM interoperability",
    weight: 1.0,
    description: "Open exchange schemas, property sets and model fidelity limits.",
  },
  {
    key: "standards",
    label: "US standards and contracts",
    weight: 0.9,
    description: "NBIMS-US, AIA E202/G202, CSI classification and NIBS guidance.",
  },
  {
    key: "delivery",
    label: "Delivery methods and BIM execution",
    weight: 1.0,
    description: "BEPs, delivery-method risk and model reliance allocation.",
  },
  {
    key: "digital-twin",
    label: "Digital twin and handover",
    weight: 0.8,
    description: "COBie, asset data and facility-management handover.",
  },
  {
    key: "automation",
    label: "Automation and computational design",
    weight: 0.7,
    description: "Revit API, Dynamo and repeatable model-checking workflows.",
  },
];

/** Total assessment length, enforced by the server alongside the client timer. */
export const ASSESSMENT_SECONDS = 900;

/** The published question bank. Order is stable and used for attempt breakdowns. */
export const QUESTIONS: Question[] = [
  {
    id: "q01",
    competency: "iso19650",
    difficulty: 1,
    prompt:
      "Under ISO 19650-2, which document states the information the appointing party requires from the delivery team?",
    options: [
      { id: "a", label: "BIM Execution Plan (BEP)" },
      { id: "b", label: "Master Information Delivery Plan (MIDP)" },
      { id: "c", label: "Exchange Information Requirements (EIR)" },
      { id: "d", label: "Task Information Delivery Plan (TIDP)" },
    ],
    answer: "c",
    explanation:
      "The EIR captures the appointing party's requirements; the delivery team responds with a BEP and delivery plans that show how those requirements will be met.",
    source: "ISO 19650-2",
  },
  {
    id: "q02",
    competency: "lod",
    difficulty: 1,
    prompt:
      "Under the BIMForum LOD Specification, which level represents an element as a generic placeholder with approximate quantity, size, shape and location?",
    options: [
      { id: "a", label: "LOD 200" },
      { id: "b", label: "LOD 300" },
      { id: "c", label: "LOD 350" },
      { id: "d", label: "LOD 400" },
    ],
    answer: "a",
    explanation:
      "LOD 200 uses generic placeholders with approximate geometry; LOD 300 fixes accurate size, shape, location and orientation, and LOD 350 adds interfaces.",
    source: "BIMForum LOD Specification",
  },
  {
    id: "q03",
    competency: "clash",
    difficulty: 1,
    prompt:
      "A supply duct passes through a structural steel beam with no opening. Which clash category does this represent?",
    options: [
      { id: "a", label: "Hard clash" },
      { id: "b", label: "Soft or clearance clash" },
      { id: "c", label: "Workflow clash" },
      { id: "d", label: "Duplicate clash" },
    ],
    answer: "a",
    explanation:
      "Two solids occupying the same space is a hard clash; clearance clashes involve buffer zones and workflow clashes involve timing or trade sequencing.",
    source: "NBIMS-US coordination practice",
  },
  {
    id: "q04",
    competency: "standards",
    difficulty: 1,
    prompt: "Which NIBS publication is the US consensus-based national BIM standard?",
    options: [
      { id: "a", label: "ISO 19650-1" },
      { id: "b", label: "NBIMS-US" },
      { id: "c", label: "AIA E202" },
      { id: "d", label: "CSI OmniClass" },
    ],
    answer: "b",
    explanation:
      "NBIMS-US is published by the National Institute of Building Sciences and provides US consensus requirements, while ISO 19650 is international and E202 and OmniClass are contract and classification tools.",
    source: "NIBS / NBIMS-US",
  },
  {
    id: "q05",
    competency: "delivery",
    difficulty: 1,
    prompt: "What is the primary purpose of a BIM Execution Plan (BEP)?",
    options: [
      { id: "a", label: "To record the contractor's bid price for model production" },
      { id: "b", label: "To replace the project schedule with a 4D simulation" },
      { id: "c", label: "To certify individual staff competence in BIM software" },
      {
        id: "d",
        label: "To define how the team will produce, exchange and manage information against the EIR",
      },
    ],
    answer: "d",
    explanation:
      "A BEP is the delivery team's response to the EIR and sets out roles, standards, methods, software and information delivery milestones.",
    source: "ISO 19650-2 / NBIMS-US",
  },
  {
    id: "q06",
    competency: "iso19650",
    difficulty: 2,
    prompt:
      "In an ISO 19650 common data environment, approved information shared with the delivery team but not yet authorized for the appointing party sits in which state?",
    options: [
      { id: "a", label: "Work in progress" },
      { id: "b", label: "Shared" },
      { id: "c", label: "Published" },
      { id: "d", label: "Archived" },
    ],
    answer: "b",
    explanation:
      "Shared holds approved information for the delivery team; Published is authorized for the appointing party, and Archived retains the audit history.",
    source: "ISO 19650-1",
  },
  {
    id: "q07",
    competency: "quantity",
    difficulty: 2,
    prompt:
      "When using a model-based quantity takeoff as the basis for a structural concrete estimate, what is the most defensible next step?",
    options: [
      { id: "a", label: "Use the model value unadjusted because it is geometrically exact" },
      { id: "b", label: "Round the total up by 25 percent and treat it as contingency" },
      { id: "c", label: "Re-export at LOD 200 so the quantities are simpler to price" },
      {
        id: "d",
        label: "Reconcile quantities with independent checks and apply documented waste factors",
      },
    ],
    answer: "d",
    explanation:
      "Model takeoff is a strong starting point, but estimate quality depends on cross-checks, documented waste and reconciliation against independent quantities.",
    source: "ASPE / CSI estimating practice",
  },
  {
    id: "q08",
    competency: "schedules",
    difficulty: 2,
    prompt:
      "What is the most defensible way to build a 4D sequence from a BIM model and a construction schedule?",
    options: [
      { id: "a", label: "Animate the model camera path so it follows planned site progress" },
      { id: "b", label: "Apply one start date to every element in a trade and rely on the viewer" },
      {
        id: "c",
        label: "Link activities to model elements through a stable identifier and review the logic",
      },
      { id: "d", label: "Export the schedule to PDF and annotate drawings by hand" },
    ],
    answer: "c",
    explanation:
      "4D depends on traceable activity-to-element links and reviewed construction logic; camera animation and bulk dates do not verify sequence.",
    source: "4D sequencing practice",
  },
  {
    id: "q09",
    competency: "interop",
    difficulty: 2,
    prompt: "What does an IFC property set (IfcPropertySet) carry in an openBIM exchange?",
    options: [
      {
        id: "a",
        label: "Named, typed properties such as fire rating or manufacturer attached to an object",
      },
      { id: "b", label: "The geometric representation of an element" },
      { id: "c", label: "The project's spatial containment hierarchy" },
      { id: "d", label: "Editing permissions for the federated model" },
    ],
    answer: "a",
    explanation:
      "Property sets carry non-geometric attributes so information such as fire rating, material or asset data survives exchange between authoring tools.",
    source: "IFC 4.3",
  },
  {
    id: "q10",
    competency: "digital-twin",
    difficulty: 2,
    prompt: "COBie is best described as which of the following?",
    options: [
      { id: "a", label: "A proprietary Autodesk format for facility models" },
      { id: "b", label: "A clash report format used during coordination" },
      { id: "c", label: "A compression method for large IFC files" },
      {
        id: "d",
        label: "A structured, open schema for handing over asset and maintenance data at closeout",
      },
    ],
    answer: "d",
    explanation:
      "COBie organizes facility, product and maintenance data in a consistent structure so owners can load it into CMMS or asset systems.",
    source: "buildingSMART / NIBS COBie",
  },
  {
    id: "q11",
    competency: "automation",
    difficulty: 2,
    prompt: "Why must a Revit API add-in wrap model modifications in a Transaction?",
    options: [
      { id: "a", label: "To queue changes until the next project save" },
      { id: "b", label: "To convert elements to IFC during execution" },
      { id: "c", label: "To make a set of changes atomic and undoable as one operation" },
      { id: "d", label: "To bypass worksharing permissions on central models" },
    ],
    answer: "c",
    explanation:
      "A transaction commits or rolls back a group of changes together, which keeps the model consistent and lets the user undo the operation as a unit.",
    source: "Revit API",
  },
  {
    id: "q12",
    competency: "clash",
    difficulty: 2,
    prompt:
      "A coordination report returns 3,200 clashes, many duplicated or intentional penetrations. What is the most defensible next step?",
    options: [
      {
        id: "a",
        label: "Refine search sets, tolerances and grouping, and agree a clash matrix before reissue",
      },
      { id: "b", label: "Issue the full report to every trade and let them triage it" },
      { id: "c", label: "Discard every clash smaller than 50 mm without review" },
      { id: "d", label: "Delete the duplicate elements from the federated model" },
    ],
    answer: "a",
    explanation:
      "Clash volume is managed by scoping the test and agreeing responsibility; unfiltered reports create noise and erode trust in coordination.",
    source: "ISO 19650-2 coordination practice",
  },
  {
    id: "q13",
    competency: "lod",
    difficulty: 3,
    prompt: "How does level of information need (LOIN) differ from level of development (LOD)?",
    options: [
      { id: "a", label: "LOIN applies only to architecture while LOD applies only to MEP" },
      {
        id: "b",
        label: "LOIN defines information for a purpose, while LOD describes element progression",
      },
      { id: "c", label: "LOIN is a software setting that overrides the project LOD table" },
      { id: "d", label: "They are interchangeable terms under NBIMS-US" },
    ],
    answer: "b",
    explanation:
      "LOIN ties information delivery to a use case, so geometry detail and information detail can be specified independently rather than assumed from a single LOD number.",
    source: "ISO 19650-1 / EN 17412-1",
  },
  {
    id: "q14",
    competency: "standards",
    difficulty: 3,
    prompt: "In AIA Document E202, what does the Model Element Table establish?",
    options: [
      { id: "a", label: "The project's professional liability limits" },
      { id: "b", label: "The contractor's schedule of values" },
      { id: "c", label: "The required file naming and folder structure" },
      {
        id: "d",
        label: "Authorized model uses and the responsible author for elements by phase",
      },
    ],
    answer: "d",
    explanation:
      "E202 uses the Model Element Table to record which elements may be relied on for which uses, by whom, at each phase, which is the core of model reliance allocation.",
    source: "AIA E202",
  },
  {
    id: "q15",
    competency: "delivery",
    difficulty: 3,
    prompt:
      "An owner wants to rely on the architect's design model for construction procurement. What is the most defensible contractual step?",
    options: [
      { id: "a", label: "State that all models are informational only and cannot be relied on" },
      { id: "b", label: "Require the architect to warrant the model is accurate for construction" },
      {
        id: "c",
        label: "Add a BIM exhibit defining permitted reliance, tolerances and responsibility",
      },
      { id: "d", label: "Have the contractor remodel at its own cost without a contract change" },
    ],
    answer: "c",
    explanation:
      "Reliance is allocated explicitly through a BIM protocol or exhibit that states permitted uses, tolerances and responsibility, rather than through an implied warranty or silence.",
    source: "AIA E202 / ConsensusDocs BIM addendum",
  },
];

const QUESTIONS_BY_ID: ReadonlyMap<string, Question> = new Map(
  QUESTIONS.map((question) => [question.id, question]),
);

/** Look up a single item by id. Returns undefined for unknown ids. */
export function getQuestion(id: string): Question | undefined {
  return QUESTIONS_BY_ID.get(id);
}
