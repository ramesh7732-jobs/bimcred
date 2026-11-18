# BIMcred Improvement Backlog

Status: living document, first version written 2026-11-17. Owner: product lead (currently the founding engineer), reviewed monthly. Scope: everything after the working prototype. This document is not a spec and not a promise. It is a ranked list of bets with the evidence we have today, the signal that would tell us we were right, and the condition under which we stop.

Companion document: `docs/05b-roadmap.md` turns the top of this list into dated phases with go/no-go gates.

---

## 1. How this backlog was built

### 1.1 Inputs

Four sources, in order of weight:

1. The prototype itself. Fifteen questions, four response options, LOC mapped from 100 to 500, three portals (candidate, employer, admin), credit-based unlocks, PostgreSQL on Neon's free tier, cookie sessions. Any improvement that assumes infrastructure we do not have is marked as such.
2. The candidate flow, walked end to end by the team: sign up, verify a US mobile number, take the test, receive a score, become searchable. Every friction point observed in that walk is represented here.
3. The employer flow, walked end to end: land, see the plan table, sign up, browse previews, hit the filter wall, upgrade, unlock a candidate. Anything that blocks a recruiter from reaching a first unlock within ten minutes is treated as high impact by default.
4. Structured conversations with BIM practitioners and hiring managers. The count is small (single digits per role at the time of writing). We label confidence accordingly rather than pretending the sample is larger.

We deliberately did not build this list from competitor feature matrices. It is easy to copy a feature list and impossible to copy the reason a feature exists. Where a comparable product has already validated a pattern we say so in the item, but validation in another market is evidence for confidence 2 or 3, not 5.

### 1.2 Scoring model

Every item is scored with a stripped-down RICE variant. Reach is held at a constant of 1 for the beta because our population is too small (tens of candidates, fewer than twenty employers) for a reach figure to be anything but noise. At public-launch scale we reintroduce reach as a measured monthly figure and rescore. Removing reach now prevents the classic failure mode where a feature for 100 percent of a 30-person beta outranks a feature for the 20 employers who actually pay.

Formula:

```
EffortWeight = S -> 1, M -> 2, L -> 3
Score        = (Impact x Confidence) / EffortWeight
```

Impact and Confidence are integers from 1 to 5. Scores therefore land between 0.33 and 25.0. Scores are compared within a theme and across themes; the top of the list is dominated by cheap, high-confidence work, which is the intended behaviour for a seed-stage team.

Impact rubric (effect on one of four outcomes: verified candidate supply, paid employer conversion, paid retention, legal or trust risk reduction):

| Impact | Meaning |
| --- | --- |
| 5 | Moves a primary conversion metric by a visible margin, or removes a blocking legal risk |
| 4 | Improves a primary metric indirectly, or removes a recurring support burden |
| 3 | Quality-of-life improvement with a measurable but modest effect |
| 2 | Nice to have, mostly cosmetic or defensive |
| 1 | Speculative, no clear metric owner |

Confidence rubric:

| Confidence | Evidence standard |
| --- | --- |
| 5 | Observed directly in the prototype or in our own funnel data |
| 4 | Recurring theme in at least eight practitioner conversations, or a hard legal requirement |
| 3 | Three or more consistent conversations plus a clear mechanism |
| 2 | Plausible mechanism, no direct evidence yet |
| 1 | Founder intuition only |

Effort rubric: S is at most one engineering week including review and copy; M is two to four weeks for one full-stack engineer including tests and migration; L is more than a month, requires a specialist, or depends on an external party (lawyer, university, ATS vendor). Effort is engineering effort only. Design time and BIM subject-matter review are noted in the dependencies when they dominate.

Risk levels used in each item:

- Low: reversible in a day, no user-visible trust impact.
- Medium: reversible with a migration or a customer conversation.
- High: touches scoring, money, personal data or a contractual commitment.

### 1.3 Fields every item carries

| Field | Purpose |
| --- | --- |
| ID | Stable reference used by the roadmap and by PR titles (`FI-24`) |
| Problem | The specific BIMcred failure, not a generic industry complaint |
| Proposal | The smallest version that would produce a signal |
| Timing | Why this belongs now or later, tied to a phase |
| Dependencies | Other items, external parties, or data that must exist first |
| Owner | Role, not a person; roles are Eng-FS, Eng-Data, Design, BIM SME, Founder/GTM, Ops, Counsel |
| Effort, Impact, Confidence, Score | The scoring model above |
| Leading indicator | The metric we watch in the first four weeks, before revenue can respond |
| Risk | What gets worse if we ship this badly |

### 1.4 Standing constraints

These apply to every item and are not repeated in each block.

- Candidates are never charged. Any feature that monetises the candidate side is out of scope regardless of score.
- Ranking is never for sale. Sponsored placement can affect job posts, never candidate order in a shortlist.
- The LOC score is computed by our own deterministic test logic. No LLM may produce or adjust a score. An LLM may help write items for human review only.
- Every feature that touches candidate data must be deletable per candidate and exportable per employer. If we cannot answer a deletion request in 30 days, the feature does not ship.
- No feature may use a protected characteristic as a scoring or ranking input. Location is the only proxy we allow, and only because hiring is physical.

### 1.5 What "done" means for a backlog item

An item is done when three things exist: the leading indicator is instrumented before launch, a rollback path is documented, and the item is either moved into the "proven" column in this document or killed with a one-paragraph note. We do not keep zombie items that nobody intends to build. Quarterly review removes them.

---

## 2. Themes and why they are ordered this way

### (a) Trust and assessment science

The product's only durable asset is the claim that a LOC score means something. If employers stop believing the number, the credit model becomes a random profile directory and price collapses to job-board levels. Every item here protects the meaning of the score: calibration, exposure control, integrity signals, sub-scores, and a plain explanation a candidate can read. This theme comes first because it is the only theme where a failure is not recoverable by shipping faster.

### (b) Talent-side value

Candidates supply the inventory. They will tolerate an assessment if it produces something they can use: a badge, a salary benchmark, a gap-driven learning plan, a profile that ranks in search. The trap is building candidate features that only exist to feed the employer side. Each item here must answer "what does the candidate get in the first five minutes". Referral and public profiles are the two cheapest distribution loops we have, which is why they score well despite modest impact.

### (c) Employer workflow

Employers pay for first contact and then for the ability to run a process without leaving our product. Workflow features are retention features: an employer with notes, scorecards and a pipeline in BIMcred has switching cost that a list of profiles never creates. We sequence this after trust because a beautiful pipeline full of unverified candidates does not sell.

### (d) Data and network effects

Structured data compounds: a canonical BIM role taxonomy makes matching, salary bands and job posting all cheaper. Hire outcomes let us tell an employer "people with this profile were hired at this level in 38 days", which no job board can say. This theme is deliberately late because it needs volume to be honest, and because building a taxonomy before observing how employers actually search is how taxonomies end up unused.

### (e) Monetisation

The prototype has one revenue mechanism: plan plus credits. That is enough to prove willingness to pay and not enough to run a company. The additions here are ordered by how little they damage trust: usage top-ups and annual contracts are clean, per-hire fees are strategically risky for a talent-first brand, and featured candidate boosts are gated behind a rule that they cannot change ranking. Anything that resembles selling candidate data is refused in section 4.

### (f) Platform and scale

Nothing in this theme makes a user happy today. All of it prevents a specific predictable failure: free-tier connection limits under concurrent writes, in-memory rate limits that reset on deploy, no queue so a slow email blocks a request, no audit trail when an enterprise asks who viewed a candidate. We schedule the minimum viable version of each at the trigger point described in section 8, not before.

### (g) Compliance and accessibility

This is the theme where being early is cheap and being late is existential. The FCRA question in particular determines whether we are a job board or a consumer reporting agency. We do not answer it in this document; we state when a lawyer must. Accessibility is treated as a product requirement because a skills assessment that excludes qualified people with disabilities undermines the entire talent-first premise.

Ordering note: scores are not the only ordering. Theme (a) and (g) items are allowed to jump the queue when a legal deadline or a trust incident sets the date. The roadmap reflects that override explicitly.

---

## 3. The item catalogue

Ranked shortlist first, then full detail grouped by theme. The shortlist is the top fifteen items by score with impact as the tie-break; it is not a commitment to build all fifteen, and the roadmap only takes the subset that fits two engineers.

| Rank | ID | Item | Score | Effort |
| --- | --- | --- | --- | --- |
| 1 | FI-39 | Credit top-ups | 25.0 | S |
| 2 | FI-59 | FCRA applicability memo | 25.0 | S |
| 3 | FI-64 | DPA and subprocessor templates | 25.0 | S |
| 4 | FI-11 | Score receipt and audit trail | 20.0 | S |
| 5 | FI-20 | Badge and LinkedIn share | 20.0 | S |
| 6 | FI-23 | Work-authorisation and relocation filters | 20.0 | S |
| 7 | FI-25 | Employer saved searches and digests | 20.0 | S |
| 8 | FI-52 | Feature flags | 20.0 | S |
| 9 | FI-54 | Observability: error tracking and tracing | 20.0 | S |
| 10 | FI-56 | Edge rate limiting | 20.0 | S |
| 11 | FI-62 | Plain-language LOC explainer | 20.0 | S |
| 12 | FI-03 | Item exposure control and retirement | 16.0 | S |
| 13 | FI-04 | Proctoring-lite integrity signals | 16.0 | S |
| 14 | FI-15 | Salary transparency bands | 16.0 | S |
| 15 | FI-40 | Annual contracts and procurement pack | 16.0 | S |

### Theme (a): trust and assessment science

#### FI-01 Adaptive item selection (IRT-lite)
- **Problem:** Everyone answers the same fifteen questions. A strong candidate is bored by easy items and a weaker candidate is demoralised by items above their level; both produce a noisier score than a test that targets the candidate. **Proposal:** Select each next item from a three-parameter pool using a 2PL model with fixed discrimination and calibrated difficulty, seeded from the current question bank. Ship as a shadow mode first: compute an adaptive score alongside the linear score and compare rank stability.
- **Timing:** Later. Needs FI-02 calibration data and a pool of at least 120 live items; adaptive selection over 15 items with 60 items is worse than linear. **Dependencies:** FI-02, FI-07, a 15-question minimum-length rule so employers can still quote a comparable number.
- **Owner:** Eng-Data | **Effort:** M | **Impact:** 5 | **Confidence:** 3 | **Score:** 7.5 | **Risk:** High
- **Leading indicator:** Correlation between linear and adaptive rank on the same candidate; target above 0.85 before replacing anything.
- **Risk:** A half-calibrated adaptive test produces scores that move between attempts for no reason a candidate can understand. Do not expose two score systems to employers.

#### FI-02 Item calibration and quality reporting
- **Problem:** The prototype's items have never been analysed. We do not know which questions discriminate between strong and weak candidates and which are simply confusing, so every score inherits unknown error. **Proposal:** Nightly job computes per-item difficulty (proportion correct), discrimination (point-biserial against total score), distractor distribution and flag rate. Admin dashboard lists items to review with a suggestion, never an automatic change.
- **Timing:** Now. This is the cheapest way to make the existing score more defensible and it validates or kills the adaptive path. **Dependencies:** Enough attempts per item to be meaningful (we set a floor of 30 responses before reporting; below that the item shows as "insufficient data").
- **Owner:** Eng-Data | **Effort:** M | **Impact:** 5 | **Confidence:** 4 | **Score:** 10.0 | **Risk:** Medium
- **Leading indicator:** Number of items with discrimination below 0.20 that are retired or rewritten per month; target four in the first quarter.
- **Risk:** Teaching to a small sample. With 50 candidates, item statistics are unstable; report confidence intervals and never hard-fail an item on one month of data.

#### FI-03 Item exposure control and retirement
- **Problem:** Fifteen questions are publicly visible and screenshots circulate. Without exposure tracking we cannot tell whether a high score means competence or memorisation, and we have no repeatable retirement process. **Proposal:** Track exposure counts per item, cap each item at a share of monthly attempts, rotate from a reserve pool, and maintain a retirement log with reason (leaked, low discrimination, outdated software version, ambiguous wording).
- **Timing:** Now. Costs almost nothing while the bank is small and prevents a credibility problem we could not fix retroactively. **Dependencies:** Admin item table with a status field; no schema risk.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 4 | **Confidence:** 4 | **Score:** 16.0 | **Risk:** Low
- **Leading indicator:** Share of attempts served from items exposed fewer than 200 times; target above 60 percent by week eight.
- **Risk:** Rotating items faster than we can calibrate them makes scores incomparable across cohorts. Hold a fixed anchor set of eight items constant for at least two quarters.

#### FI-04 Proctoring-lite integrity signals
- **Problem:** A verified phone number proves a US number, not that the person answering is the person who owns the profile. Employers will ask about this in the first demo. **Proposal:** Webcam-free integrity score built from timing anomalies (answers faster than reading time), tab blur and focus loss, paste events, answer-change patterns, and IP velocity across accounts. Surface a flag to admin, never auto-reject; a flagged attempt gets a human review queue and an optional retake.
- **Timing:** Now. Required before any employer sees a score as trustworthy, and cheap because it is server-side event timing we already have. **Dependencies:** Event timestamps stored per answer (currently discarded), a privacy notice update naming the signals collected.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 4 | **Confidence:** 4 | **Score:** 16.0 | **Risk:** Medium
- **Leading indicator:** Flag rate per hundred attempts (expect 2 to 8; outside that band the thresholds are wrong) and appeal overturn rate below 30 percent.
- **Risk:** False accusations. Never tell an employer "this candidate cheated". Say "integrity signals present, human-reviewed" and give the candidate a path to retake. Log every manual decision.

#### FI-05 Retake policy and cooldown economics
- **Problem:** Unlimited immediate retakes turn the score into a maximum over attempts, which rewards persistence rather than competence and makes the number easy to game. No retakes at all punishes a genuinely bad day. **Proposal:** One free retake after 30 days, a second after 90 days, with the displayed score being the latest verified attempt plus a "best verified score" field that decays in employer filters after twelve months. Retake attempts do not consume employer credits.
- **Timing:** Now, bundled with the integrity work. Policy is cheap; retrofitting it after employers build workflows on score history is not. **Dependencies:** Attempt history table, employer-facing explanation of which score they are seeing.
- **Owner:** Founder/GTM | **Effort:** S | **Impact:** 3 | **Confidence:** 4 | **Score:** 12.0 | **Risk:** Medium
- **Leading indicator:** Support tickets asking for an exception per month; if above five, the window is too strict.
- **Risk:** Employers may read a retake as a second chance that inflates scores. Publish the distribution of score change between attempts so the effect is visible rather than speculated about.

#### FI-06 Cohort benchmarking and percentile bands
- **Problem:** A raw 380 means nothing to a hiring manager. Is that top quartile for a BIM coordinator with four years of experience, or average? **Proposal:** Show a percentile band against a declared cohort (discipline, years of experience band, software stack) with the cohort size printed beside it. Suppress any cohort below 30 candidates and say "not enough peers yet".
- **Timing:** Next. Needs a few hundred verified attempts; launching earlier produces percentiles computed from thirty people. **Dependencies:** FI-07 sub-scores for discipline segmentation, minimum cohort policy, consistency with the LOC explainer (FI-62).
- **Owner:** Eng-Data | **Effort:** M | **Impact:** 4 | **Confidence:** 4 | **Score:** 8.0 | **Risk:** Medium
- **Leading indicator:** Employer click-through on candidates with a visible percentile versus without; target a 10 percent relative improvement.
- **Risk:** Percentiles can imply precision we do not have. Always show the band (for example "65th to 80th") rather than a single percentile number.

#### FI-07 LOC v2 with discipline sub-scores
- **Problem:** One number hides the difference between a structural modeller, a MEP coordinator and a BIM manager. Employers hiring for coordination are shown the same score as employers hiring for content production. **Proposal:** Keep the 100 to 500 headline LOC for continuity, add four sub-scores (modelling, coordination and clash, data and standards, project delivery) reported as bands, plus a confidence indicator based on item count per sub-score. Version the scale so old and new scores are never mixed in a filter without a label.
- **Timing:** Next. Requires FI-02 plus a larger bank; sub-scores need at least six items each to be reportable. **Dependencies:** FI-02, FI-36 taxonomy, test length increase to 25 or 30 items, candidate communication plan.
- **Owner:** BIM SME | **Effort:** L | **Impact:** 5 | **Confidence:** 3 | **Score:** 5.0 | **Risk:** High
- **Leading indicator:** Employer filter usage by sub-score; target 30 percent of searches using at least one sub-score within eight weeks of launch.
- **Risk:** Version fragmentation. Freeze LOC v1 scores at their issue date, keep them visible, and do not translate old scores into new sub-scores.

#### FI-08 Portfolio and model-sample review
- **Problem:** A multiple-choice test cannot see whether someone can actually build a coordinated model. Employers repeatedly ask for "something real". **Proposal:** Optional paid-neutral add-on where a candidate uploads a model extract (IFC plus screenshots, no client-identifying content) and a BIM SME scores it against a five-criterion rubric with written feedback. Review is free to the candidate, batched weekly, and produces a verified artefact badge.
- **Timing:** Next. It creates candidate value and a defensible differentiator, but needs a reviewer rota and a rights/confidentiality policy first. **Dependencies:** Storage for large files, IFC viewer (start with server-side thumbnail plus download), reviewer contract, FI-09 for reviewer credentials.
- **Owner:** BIM SME | **Effort:** M | **Impact:** 5 | **Confidence:** 3 | **Score:** 7.5 | **Risk:** High
- **Leading indicator:** Share of reviewed candidates who complete an employer unlock within 30 days; compare with unreviewed cohort.
- **Risk:** Confidential client models leaking through our storage. Require an explicit attestation, strip metadata, cap retention at 90 days, and never make upload mandatory.

#### FI-09 Verified CPD hours
- **Problem:** "Continuing professional development" is self-reported everywhere. Employers cannot tell a genuinely current practitioner from a lapsed one. **Proposal:** Lightweight CPD ledger: candidate adds a course or event, uploads a certificate, reviewer verifies issuer and hours. Export a one-page CPD summary for interviews. Start with a curated issuer whitelist (Autodesk, buildingSMART, university extensions, recognised AEC training providers).
- **Timing:** Later. Only worth building once employers ask for it in renewal conversations, and only with a fraud-resistant verification path. **Dependencies:** FI-08 reviewer rota, document storage, issuer whitelist.
- **Owner:** Ops | **Effort:** M | **Impact:** 3 | **Confidence:** 3 | **Score:** 4.5 | **Risk:** Medium
- **Leading indicator:** Percentage of new candidates adding at least one CPD entry in the first month; below 15 percent means the effort is misplaced.
- **Risk:** Verification theatre: rubber-stamping PDFs creates liability without trust. If we cannot verify an issuer, mark the entry "self-reported" and do not use the word verified.

#### FI-10 Practical task sandbox (Revit and Dynamo style)
- **Problem:** Even a good multiple-choice score does not prove someone can parameterise a family, write a Dynamo graph or clean a model for handover. **Proposal:** Browser-based task environment that does not require a Revit licence: scripted Dynamo-style graph problems, IFC property queries, and a model-hygiene exercise scored by assertions. Prototype three tasks, run with twenty candidates, and measure completion and inter-rater agreement.
- **Timing:** Horizon. Highest potential differentiation and highest cost; needs an authoring tool and non-trivial sandboxing. **Dependencies:** FI-07, task authoring by BIM SME, isolated execution environment, licensing review for any Autodesk-adjacent content.
- **Owner:** Eng-FS | **Effort:** L | **Impact:** 5 | **Confidence:** 2 | **Score:** 3.3 | **Risk:** High
- **Leading indicator:** Task completion rate above 60 percent and score correlation with LOC above 0.5; both must hold before it appears in a profile.
- **Risk:** Building a product we cannot maintain. Sandboxes rot as software versions change. Do not start until there is a paying design partner funding the maintenance.

#### FI-11 Score receipt and audit trail
- **Problem:** When a candidate gets 310 and expected 400, we have no answer. When an employer asks how a score was generated, "our test" is not an answer. **Proposal:** Per-attempt receipt listing date, duration, item topics (not item text), integrity flags reviewed, scoring version, and a plain-language paragraph explaining what the band means. Append-only storage, downloadable by the candidate, referenced by ID in any dispute.
- **Timing:** Now. It is a day of work and it is the foundation for every dispute, audit and enterprise security review that follows. **Dependencies:** Attempt and version columns on the result record.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 4 | **Confidence:** 5 | **Score:** 20.0 | **Risk:** Low
- **Leading indicator:** Dispute emails resolved by linking the receipt without a human investigation; target 80 percent.
- **Risk:** Publishing item topics can leak the bank. Keep topics coarse (for example "coordination workflows") and never expose option text.

### Theme (b): talent-side value

#### FI-12 Public opt-in profile with SEO
- **Problem:** Candidates do their work inside a login wall, so the only traffic we get is paid or referred. BIM queries in search engines are specific and high-intent ("BIM coordinator salary", "ISO 19650 naming convention"), and we currently answer none of them. **Proposal:** Opt-in public profile at a stable URL with a verified badge, LOC band, discipline tags and a short "what I work on" section. Default is private. Add three or four genuinely useful reference pages (LOC explained, BIM role map, software stack comparison) that link into the profile directory.
- **Timing:** Next. Needs the taxonomy (FI-36) to avoid pages that say nothing, and a privacy review before any indexable page exists. **Dependencies:** FI-36, FI-62, consent capture that survives an audit, sitemap and canonical URL strategy.
- **Owner:** Eng-FS | **Effort:** M | **Impact:** 4 | **Confidence:** 4 | **Score:** 8.0 | **Risk:** Medium
- **Leading indicator:** Organic sessions per week and profile-to-signup rate; if organic is under 100 sessions in month two the content angle is wrong.
- **Risk:** Candidates being findable by their current employer. Ship with a "hide from my current company" control and an immediate unpublish button that purges within one hour, not one deploy.

#### FI-13 Candidate referral programme
- **Problem:** Supply is the bottleneck and paid acquisition of BIM professionals is expensive and imprecise. Practitioners already refer each other into roles. **Proposal:** Every verified candidate gets a personal link. A referred candidate who completes the assessment and verifies a phone number earns the referrer a reward that is not cash-for-data: a free portfolio review slot, a premium badge, or a gift card funded from marketing spend. Cap at five rewards per person per quarter, and fraud-check by device and phone cohort.
- **Timing:** Next. Cheap, and it only works while the community is small enough that referrals feel personal. **Dependencies:** Unique link tracking, reward fulfilment process, anti-fraud rules, clear statement that rewards never affect a score.
- **Owner:** Founder/GTM | **Effort:** S | **Impact:** 3 | **Confidence:** 4 | **Score:** 12.0 | **Risk:** Medium
- **Leading indicator:** Referred signups as a share of new verified candidates; target 15 percent by month three.
- **Risk:** Referral farms producing fake profiles that pollute the verified pool. Require phone verification plus an integrity score, and never count a reward until the referred candidate has been active for 14 days.

#### FI-14 Saved searches and job alerts for candidates
- **Problem:** A candidate visits once, takes the test and leaves. There is no reason to return, so our supply goes stale and employer responses decay. **Proposal:** Candidate saves a search (discipline, city, remote, salary floor) and receives a weekly digest. Include an employer-view count ("three employers unlocked your profile this week") to close the loop and create a reason to keep the profile current.
- **Timing:** Now. It is the cheapest retention feature in the product and it makes the employer demand side visible to candidates. **Dependencies:** Email provider with a proper bounce and complaint path, unsubscribe that works in one click, matching query engine.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 3 | **Confidence:** 5 | **Score:** 15.0 | **Risk:** Low
- **Leading indicator:** Four-week return rate of candidates who enable an alert versus those who do not.
- **Risk:** Digest fatigue. One email per week maximum, no re-engagement spam, and suppress after 21 days of no opens.

#### FI-15 Salary transparency bands on job posts
- **Problem:** BIM salaries vary enormously by discipline and metro, and vague postings waste everyone's time. Candidates suspect the number is negotiable downwards; employers get unqualified applications. **Proposal:** Require a band on every job post, validated against the compensation intelligence dataset once it exists (FI-38). Until then, offer a suggested band generated from LOC and metro, clearly labelled as a suggestion. Show the band on the public job page for SEO value.
- **Timing:** Now. Low effort, strong candidate signal, and it feeds the dataset. **Dependencies:** Metro list, discipline list, position on whether bands are mandatory for all plans (we recommend mandatory, including Trial).
- **Owner:** Founder/GTM | **Effort:** S | **Impact:** 4 | **Confidence:** 4 | **Score:** 16.0 | **Risk:** Low
- **Leading indicator:** Share of job posts with a band (target 100 percent because it is required) and application-to-unlock rate on banded posts.
- **Risk:** Suggested bands anchoring employers to numbers we cannot defend. Label suggestions as "market range, based on N BIMcred postings" with N shown, and never show a suggestion with fewer than 20 data points.

#### FI-16 Interview preparation packs
- **Problem:** A candidate scoring 340 still does not know how to talk about clash resolution in an interview, and a failed interview is attributed to the platform that introduced them. **Proposal:** Short, role-specific prep packs: six questions a hiring manager will ask, a worked answer outline, and two things to bring (a model sample, a coordination example). Generated by the BIM SME, not by an LLM at runtime.
- **Timing:** Next. High candidate value per unit of effort, but content quality is the whole product. **Dependencies:** Role taxonomy, BIM SME authoring time (about two days for the first four roles).
- **Owner:** BIM SME | **Effort:** M | **Impact:** 3 | **Confidence:** 4 | **Score:** 6.0 | **Risk:** Low
- **Leading indicator:** Pack open rate among candidates who receive an unlock and self-reported interview confidence in a two-question survey.
- **Risk:** Generic advice that reads like a careers blog. Every pack must name BIM artefacts (federated model, clash matrix, COBie deliverable), or it does not ship.

#### FI-17 Gap-driven skills roadmap
- **Problem:** The test tells a candidate they scored 310 but not what to learn. That is a verdict without a next step, which is the fastest way to lose a candidate after their first attempt. **Proposal:** Map missed item topics to a curated learning path: three links per gap, ordered by prerequisite, with an estimated time commitment. Do not sell courses. Mark progress when a candidate retakes and improves the relevant sub-score.
- **Timing:** Next. Depends on sub-scores (FI-07) to attribute gaps credibly. **Dependencies:** FI-07, topic tagging of the item bank, curated link review quarterly to avoid dead links.
- **Owner:** BIM SME | **Effort:** M | **Impact:** 4 | **Confidence:** 3 | **Score:** 6.0 | **Risk:** Medium
- **Leading indicator:** Percentage of low scorers who open a roadmap and the share who retake within 90 days.
- **Risk:** Implying a causal learning guarantee. Say "topics to review", never "you will reach 400 by completing this".

#### FI-18 Mentorship matching
- **Problem:** Junior BIM professionals want guidance and senior practitioners want a lightweight way to give back, but neither will cold-message a stranger. **Proposal:** Opt-in mentor pool with a structured commitment (two 30-minute calls per quarter), matched on discipline and city. Start as a manual concierge match for the first 20 pairs to learn what matching criteria matter.
- **Timing:** Later. It is a two-sided marketplace with all the cold-start problems, and it does not help employers pay us. **Dependencies:** Vetting for mentors, safeguarding and code of conduct, scheduling, a way to remove a pair without drama.
- **Owner:** Ops | **Effort:** L | **Impact:** 3 | **Confidence:** 2 | **Score:** 2.0 | **Risk:** High
- **Leading indicator:** Pair survival past the second call; below 50 percent means matching or expectations are wrong.
- **Risk:** Duty of care and reputational exposure when a match goes badly. Only run with a written code of conduct, a report path, and a human reviewing every mentor application.

#### FI-19 Employer reviews (moderated)
- **Problem:** Candidates take a job through BIMcred and then discover the reality: unpaid overtime, no model standards, a "BIM manager" who is really a CAD drafter. That experience damages our brand more than any marketing fixes. **Proposal:** Post-hire anonymous reviews with structured dimensions (model maturity, mentoring, tools, workload) and a free-text field. Publish only after moderation and a minimum of three reviews per employer; otherwise show an aggregate count without scores.
- **Timing:** Later. Needs hire outcomes (FI-37) to know who actually got hired, and moderation capacity. **Dependencies:** FI-37, moderation rota, defamation review of the policy, employer right of reply.
- **Owner:** Ops | **Effort:** M | **Impact:** 3 | **Confidence:** 3 | **Score:** 4.5 | **Risk:** High
- **Leading indicator:** Review submission rate among confirmed hires; below 20 percent the ask is too heavy.
- **Risk:** Employers retaliating against identifiable reviewers, or threatening legal action. Anonymise at collection, strip identifying text patterns, and involve counsel before publishing the first review.

#### FI-20 Verifiable badge and LinkedIn sharing
- **Problem:** A candidate's LOC score is trapped in our product. They cannot put it on a CV or a LinkedIn profile, so the credential does not travel and we get no distribution. **Proposal:** Public verification page with a signed, non-guessable slug, Open Graph image showing the band and issue date, and a one-click "add to LinkedIn profile" that links to the verification page. Badge shows the band, never the exact score, so it ages gracefully.
- **Timing:** Now. Highest score in the talent theme and it doubles as a growth loop with no paid acquisition. **Dependencies:** FI-11 receipt, FI-12 public page, image rendering, revocation path for suspended accounts.
- **Owner:** Design | **Effort:** S | **Impact:** 4 | **Confidence:** 5 | **Score:** 20.0 | **Risk:** Low
- **Leading indicator:** Badge shares per hundred verified candidates and referral traffic from LinkedIn to the verification page.
- **Risk:** Stale badges misrepresenting current competence. Print the issue date large, add "verified as of", and expire the badge visual after 18 months while keeping the record.

#### FI-21 Progressive web app
- **Problem:** BIM professionals are on site, in a trailer or on a train, often with poor connectivity. A desktop-only web app means the assessment and job alerts are unusable exactly when they have time to use them. **Proposal:** Installable PWA with offline shell, cached profile, push notifications for unlocks and messages, and a mobile-first assessment layout with a resumable attempt. No native app until retention proves it is needed.
- **Timing:** Next. Assessment must be usable on a phone regardless; the push and offline shell can follow. **Dependencies:** Service worker strategy, push permission prompts that do not tank conversion, session handling on mobile Safari.
- **Owner:** Eng-FS | **Effort:** M | **Impact:** 3 | **Confidence:** 4 | **Score:** 6.0 | **Risk:** Medium
- **Leading indicator:** Mobile assessment completion rate versus desktop; target within five percentage points.
- **Risk:** Cached personal data on a shared device. Never cache candidate contact details, and clear the cache on logout explicitly.

#### FI-22 AI CV builder tuned to BIM roles
- **Problem:** BIM candidates describe themselves in tool lists ("Revit, Navisworks, AutoCAD") that do not distinguish a coordinator from a modeller. Their CVs under-sell them and employers skim past. **Proposal:** CV builder that prompts for artefacts and outcomes (model size, coordination cycle, standards adopted, clash reduction process) and drafts bullet points in BIM vocabulary. Deterministic template, LLM used for phrasing suggestions only, with every generated line editable and never auto-submitted.
- **Timing:** Later. Requires the taxonomy and a careful evaluation of generated text before it touches a hiring decision. **Dependencies:** FI-36, LLM evaluation harness, clear provenance label on generated content.
- **Owner:** Eng-FS | **Effort:** M | **Impact:** 3 | **Confidence:** 2 | **Score:** 3.0 | **Risk:** High
- **Leading indicator:** Share of candidates who keep at least half of the generated phrasing and the CV-to-unlock rate versus a plain upload.
- **Risk:** Homogenised CVs and fabricated achievements. Prompt for facts the candidate confirms one by one, forbid invented numbers, and keep an audit of what the model wrote.

#### FI-23 Work-authorisation and relocation preferences
- **Problem:** Employers waste credits unlocking candidates who cannot work in the US or will not relocate to a site in Texas. Every wasted unlock is a support ticket and a churn signal. **Proposal:** Candidate-declared fields: work authorisation status (US citizen, permanent resident, visa with sponsorship needed, other), willingness to relocate (no, within metro, nationwide), and travel tolerance. These become filters on every paid plan, and they are declared, not verified, with a clear label.
- **Timing:** Now. Highest-value filter after LOC and the cheapest to ship. **Dependencies:** Careful wording to avoid discriminatory phrasing, legal review of the authorisation categories, candidate ability to edit and hide.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 4 | **Confidence:** 5 | **Score:** 20.0 | **Risk:** Medium
- **Leading indicator:** Wasted-unlock refund requests per hundred unlocks; target below two.
- **Risk:** Authorisation questions can be used to screen out protected groups. Follow the standard I-9 category framing, do not ask about national origin or age, and keep the field out of any ranking model.

### Theme (c): employer workflow

#### FI-24 Semantic matching and ranked shortlists
- **Problem:** Filter search only works if the recruiter knows the vocabulary. An employer typing "person who can run clash detection on a hospital job" gets nothing unless they also know to filter Navisworks and coordination. **Proposal:** Embed candidate profiles and job descriptions, retrieve top 50 by vector similarity, then rerank with explicit, inspectable rules (LOC band, discipline match, recency, metro). Show "why this candidate" with the matched fields. Never hide the filters behind the model.
- **Timing:** Later. Needs profile volume and a relevance evaluation set before it can be trusted; a bad ranker is worse than no ranker. **Dependencies:** FI-49 pgvector, FI-36 taxonomy, a labelled set of 200 candidate-job pairs from real searches, FI-52 flags for A/B testing.
- **Owner:** Eng-Data | **Effort:** L | **Impact:** 5 | **Confidence:** 3 | **Score:** 5.0 | **Risk:** High
- **Leading indicator:** Unlock rate per search session versus filter-only baseline, and zero-result searches per session.
- **Risk:** Embedding bias amplifying majority profiles. Evaluate recall across disciplines before launch, keep a filter-only path, and never rank by who paid.

#### FI-25 Employer saved searches and digests
- **Problem:** Recruiters re-run the same filters every morning and forget the product for weeks. New-and-matched candidates are invisible unless they log in. **Proposal:** Save a filter set, choose daily or weekly digest, show only candidates verified since the last digest with a one-click unlock. Include credit balance and a cap so an employer cannot burn a month of credits on a notification.
- **Timing:** Now. It is the retention feature most likely to change weekly active employers, and it is cheap. **Dependencies:** Query serialisation, email templating, per-plan credit guard.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 4 | **Confidence:** 5 | **Score:** 20.0 | **Risk:** Low
- **Leading indicator:** Weekly active employers with at least one saved search; target 50 percent of paying accounts by week six.
- **Risk:** Digest spam that trains employers to ignore us. Cap at one per day, suppress empty digests, and never send a digest that costs a credit without an explicit click.

#### FI-26 Candidate compare view
- **Problem:** Choosing between three shortlisted BIM coordinators means three browser tabs and a mental spreadsheet. The comparison is the actual decision. **Proposal:** Select up to four candidates, compare LOC band, sub-scores, software, metro, salary expectation, availability and verified artefacts in one table. Export to PDF for hiring-manager review. No auto-generated "winner".
- **Timing:** Next. Directly increases unlocks per shortlist and is a straightforward UI build. **Dependencies:** FI-07 for sub-scores, PDF export pipeline, consistent null handling for missing fields.
- **Owner:** Design | **Effort:** S | **Impact:** 3 | **Confidence:** 5 | **Score:** 15.0 | **Risk:** Low
- **Leading indicator:** Compare sessions per shortlist and unlocks per compare session versus baseline.
- **Risk:** Encouraging checkbox hiring on a single number. Show uncertainty bands and make the "not enough data" state explicit.

#### FI-27 Team seats, shared notes and mentions
- **Problem:** A recruiter unlocks a candidate, the hiring manager cannot see the notes, and the same candidate gets unlocked again by a colleague. Credits leak and the account feels like a personal tool, not a team system. **Proposal:** Seat management with roles (owner, recruiter, hiring manager, viewer), candidate-level notes with @mentions, and an unlock ledger visible to the whole account showing who unlocked what and when. Duplicate unlocks stay free as they already do.
- **Timing:** Next. It justifies the 3-seat Starter and 10-seat Growth difference, which is currently a number on a pricing page with no product behind it. **Dependencies:** Role model in the schema, notification system, audit log (FI-57) for enterprise.
- **Owner:** Eng-FS | **Effort:** M | **Impact:** 4 | **Confidence:** 4 | **Score:** 8.0 | **Risk:** Medium
- **Leading indicator:** Seats active per paying account in a 30-day window; target 2.0 on Starter and 5.0 on Growth.
- **Risk:** Seat sprawl inflated by shared logins (which we cannot prevent) or, worse, blocked by aggressive seat enforcement that angers users. Count seats softly during the beta and enforce only at renewal.

#### FI-28 ATS connectors (Greenhouse, Lever, Workable)
- **Problem:** Employers will not run two processes. If a candidate has to be re-entered into their ATS, our pipeline becomes a side tool and churns. **Proposal:** One-way push first: send an unlocked candidate to the employer's ATS with a BIMcred source tag and a link back. Then two-way status sync, then webhooks for unlock events. Start with the one ATS most requested by the first ten employers.
- **Timing:** Later. Each connector is an ongoing maintenance commitment and the APIs differ; build only against named demand. **Dependencies:** FI-34 API keys, FI-57 audit log, partner sandbox accounts, a support runbook for auth failures.
- **Owner:** Eng-FS | **Effort:** L | **Impact:** 5 | **Confidence:** 3 | **Score:** 5.0 | **Risk:** High
- **Leading indicator:** Share of unlocked candidates pushed to an ATS within 24 hours; target 40 percent on connected accounts.
- **Risk:** Becoming an integration maintenance company with two engineers. Cap at three connectors and require 20 percent of ARR to depend on each before adding another.

#### FI-29 Interview scheduling
- **Problem:** Coordinating a hiring manager, a BIM lead and a candidate across three calendars is where BIM hiring pipelines stall, and it happens off our platform today. **Proposal:** Availability links, proposed slots inside the pipeline, calendar invites with video link, and automatic reminder emails. No built-in video; use the employer's meeting tool.
- **Timing:** Next. Mid-sized build with immediate perceived value and no model risk. **Dependencies:** Calendar OAuth, timezone handling, cancellation and reschedule flows, email deliverability.
- **Owner:** Eng-FS | **Effort:** M | **Impact:** 3 | **Confidence:** 4 | **Score:** 6.0 | **Risk:** Medium
- **Leading indicator:** Interviews scheduled inside BIMcred as a share of all interviews recorded; target 35 percent by week ten.
- **Risk:** Timezone and DST bugs producing missed interviews, which are unforgivable. Use IANA timezones end to end and test with a fixed set of zones.

#### FI-30 Structured scorecards and interview kits
- **Problem:** Interview feedback arrives as "good Revit skills, seems nice". Employers cannot compare candidates and we cannot learn what predicts a good hire. **Proposal:** Per-role scorecard with five competencies, anchored 1 to 5 descriptions written for BIM roles, plus a suggested question per competency. Aggregate scores at the candidate level and surface them in compare view.
- **Timing:** Next. It creates structured outcome data, which is the input to the hire-outcome flywheel (FI-37). **Dependencies:** FI-36 taxonomy, FI-37 consent model for outcome data, BIM SME authoring.
- **Owner:** BIM SME | **Effort:** M | **Impact:** 4 | **Confidence:** 4 | **Score:** 8.0 | **Risk:** Medium
- **Leading indicator:** Scorecards completed per interview loop; target 70 percent completion.
- **Risk:** Anchoring interviewers on our LOC band, producing a self-fulfilling signal. Scorecards must not display the LOC band until after ratings are saved.

#### FI-31 Offer and funnel analytics
- **Problem:** Employers cannot see where their BIM pipeline leaks: unlock to screen, screen to interview, interview to offer. Without that they blame the talent pool. **Proposal:** Funnel view per job with conversion rates, median days per stage, drop-off reasons, and offer acceptance tracking with a voluntary reason. Compare against the employer's own historical baseline, not against other companies.
- **Timing:** Later. Needs enough volume per employer to be meaningful and depends on pipeline stages being used consistently. **Dependencies:** FI-27, FI-30, FI-37, a warehouse or at least a read replica (FI-48).
- **Owner:** Eng-Data | **Effort:** M | **Impact:** 4 | **Confidence:** 4 | **Score:** 8.0 | **Risk:** Medium
- **Leading indicator:** Weekly analytics viewers per account; target two named users per Growth account.
- **Risk:** Benchmarks computed from too few employers, which are both privacy and credibility problems. Show benchmarks only above 10 contributing accounts and never expose individual company data.

#### FI-32 Seat-level usage analytics
- **Problem:** We renew accounts without knowing whether the seats are used, and admins cannot see which recruiter is burning credits on poor-fit unlocks. **Proposal:** Account admin view: unlocks per seat, searches per seat, response rate by recruiter, credit burn-down versus plan, and a projection of overage. Exportable CSV. No individual keystroke tracking.
- **Timing:** Next. It is a retention and expansion tool and it prepares the top-up conversation (FI-39). **Dependencies:** Event logging on unlock and search, role permissions, clear data retention statement for internal analytics.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 3 | **Confidence:** 5 | **Score:** 15.0 | **Risk:** Low
- **Leading indicator:** Admin logins to the usage view per month and the share of accounts that top up after hitting 80 percent of credits.
- **Risk:** Managers using it to surveil recruiters. Restrict to aggregate counts per seat, no timestamps of individual searches, and state that in the UI.

#### FI-33 Talent pools and silver-medalist re-engagement
- **Problem:** A strong candidate who lost to another finalist is forgotten. That is the cheapest hire in the market and we let it evaporate. **Proposal:** Named pools per account, automatic "runner-up" tagging when a job closes, and a re-engagement prompt when a new job opens with a high match. Candidates can opt out of re-engagement at any time, and each prompt shows why they were matched.
- **Timing:** Later. Depends on job closure data and unlocks being reliable. **Dependencies:** FI-24 matching, FI-31 funnel, candidate notification preferences, credit accounting for re-unlocks (re-unlock of an already unlocked candidate is free, which makes this cheap to run).
- **Owner:** Eng-FS | **Effort:** M | **Impact:** 4 | **Confidence:** 4 | **Score:** 8.0 | **Risk:** Low
- **Leading indicator:** Re-engagement response rate and hires sourced from pools as a share of total hires; target 15 percent by month nine.
- **Risk:** Candidates feeling like consolation prizes. Never use that language internally in outbound copy, and let candidates hide themselves from a specific employer.

#### FI-34 Public API, webhooks and Slack or Teams alerts
- **Problem:** Enterprise employers want unlock events in their own systems. Without an integration surface, the Enterprise plan has nothing to justify its price beyond credits. **Proposal:** Token-authenticated REST endpoints for jobs, candidates and unlocks; signed webhooks for unlock, note and stage-change events; Slack and Teams apps posting new matches to a channel. Rate limits per token, scoped permissions, rotation and revocation.
- **Timing:** Later, but ahead of white-label. It is the cheapest way to make Enterprise real and it unlocks the ATS work. **Dependencies:** FI-56 edge rate limiting, FI-57 audit log, OpenAPI spec, developer docs, sandbox environment.
- **Owner:** Eng-FS | **Effort:** M | **Impact:** 4 | **Confidence:** 4 | **Score:** 8.0 | **Risk:** Medium
- **Leading indicator:** Number of Enterprise accounts with at least one active token, and webhook delivery success above 99 percent.
- **Risk:** A leaked token exposing candidate data. Scope tokens to one account, log every read, and make rotation a one-click action with a 24-hour overlap.

#### FI-35 Agency and multi-recruiter accounts
- **Problem:** AEC staffing agencies place more BIM roles than most general contractors, but they work across many clients and need separate pools and branding. A single-employer account does not fit them. **Proposal:** Agency plan with client sub-accounts, per-client talent pools, candidate sharing rules between recruiters, and a margin-friendly credit pool with a higher top-up ceiling. Agencies pay more and churn less when the workflow fits.
- **Timing:** Later. It is a different sales motion and it risks distracting from the direct-employer wedge in the first year. **Dependencies:** FI-27 roles, FI-33 pools, FI-34 API, a contract template for agency use, credit pooling logic.
- **Owner:** Founder/GTM | **Effort:** M | **Impact:** 3 | **Confidence:** 3 | **Score:** 4.5 | **Risk:** Medium
- **Leading indicator:** Agency accounts as a share of new ARR; if it exceeds 40 percent too early, the product is drifting towards staffing and away from AEC firms.
- **Risk:** Agencies spam candidates and damage the talent-first brand. Cap outbound per candidate per month and enforce a quality bar on job posts.

### Theme (d): data and network effects

#### FI-36 Canonical BIM role and skills taxonomy
- **Problem:** Every job post invents its own titles ("BIM Technician", "VDC Engineer", "Digital Construction Lead") and every profile lists tools in a different order. Matching, salary bands and sub-scores all need the same vocabulary, and right now each feature would invent its own. **Proposal:** Versioned taxonomy of 25 to 35 BIM roles, each mapped to competencies, typical software, seniority bands and adjacent titles. Admin- editable, with an alias table learned from real job posts. Expose as a stable enum to the app and a readable page for SEO.
- **Timing:** Next. It is a dependency for four other themes and becomes more expensive the more ad hoc tags accumulate. **Dependencies:** 200 real job descriptions (from our own posts plus employer-submitted ones), BIM SME review, alias maintenance owner.
- **Owner:** BIM SME | **Effort:** M | **Impact:** 5 | **Confidence:** 4 | **Score:** 10.0 | **Risk:** Medium
- **Leading indicator:** Share of new job posts that resolve to a taxonomy role without an admin edit; target 80 percent by week ten.
- **Risk:** A taxonomy that reflects the SME's world rather than the market's. Derive candidate roles from postings, not from a standards document, and review aliases monthly.

#### FI-37 Hire-outcome flywheel
- **Problem:** We know who got unlocked; we do not know who got hired, in what role, at what salary, or how long it took. Without outcomes we cannot prove that LOC predicts anything, cannot benchmark, and cannot price on value. **Proposal:** Two-sided outcome capture: employer marks a hire in the pipeline, candidate confirms it (with a one-click "did this introduction lead to a job?" email 30 days later). Reward confirmation with a badge or credit-neutral perk. Store outcome, role, metro, salary band, days-to-hire. Never resell it raw.
- **Timing:** Next. The data takes months to accumulate, so the collection must start before the analysis is needed. **Dependencies:** Pipeline stages used consistently, consent language covering outcome processing, FI-30 scorecards, an analytics store.
- **Owner:** Eng-Data | **Effort:** M | **Impact:** 5 | **Confidence:** 3 | **Score:** 7.5 | **Risk:** High
- **Leading indicator:** Confirmed outcomes per month; target 30 percent of reported hires by month six.
- **Risk:** Employers refusing to share outcomes because it reveals their hiring volume. Make it voluntary, aggregate reporting only, and never show one employer's outcomes to another.

#### FI-38 Compensation intelligence and LOC-to-salary bands
- **Problem:** The single most common candidate question is "what should I be paid", and the most common employer question is "is this candidate's expectation realistic". Neither can be answered from the prototype. **Proposal:** Aggregate salary bands by role, metro, seniority and LOC band, from job posts and confirmed outcomes. Publish candidate-facing ranges and employer-facing expectation ranges on a profile. Show sample size and the freshness date on every band. Suppress cells below 20 observations.
- **Timing:** Later. Requires FI-37 volume, FI-15 structured bands, and a privacy review before any public number exists. **Dependencies:** FI-15, FI-36, FI-37, metro taxonomy, k-anonymity policy.
- **Owner:** Eng-Data | **Effort:** M | **Impact:** 4 | **Confidence:** 3 | **Score:** 6.0 | **Risk:** High
- **Leading indicator:** Candidate and employer views of salary insight pages, and the share of negotiations where both sides reference the band.
- **Risk:** Publishing a range that is really six data points in a trench coat, which then anchors salaries and invites press criticism. Hard threshold of 20 observations, and label every figure "estimate".

### Theme (e): monetisation

#### FI-39 Usage-based credit top-ups
- **Problem:** The plan ladder forces a jump from 25 to 75 credits. An employer who needs 30 this month either underpays and stalls or overpays and resents it. Both outcomes damage renewal. **Proposal:** Top-up packs at a per-credit price that is higher than the plan's effective rate (so upgrading stays rational), with a hard monthly cap and an admin approval threshold. Credits expire 12 months after purchase, stated plainly. Show the projected overage before the employer hits the wall.
- **Timing:** Now. Highest-scoring item in the document: trivial to build, direct revenue, and it produces the demand data that tells us whether the plan ladder is right. **Dependencies:** Ledger with idempotent credit transactions, invoice or receipt path, plan-rate maths displayed consistently with `pricing.ts`.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 5 | **Confidence:** 5 | **Score:** 25.0 | **Risk:** Medium
- **Leading indicator:** Share of paying accounts that buy a top-up in a month; above 40 percent means the included credits are too low.
- **Risk:** Cannibalising upgrades and making revenue lumpy. Price top-ups at a visible premium (suggest 1.4x the Growth effective rate) and review the ladder quarterly against actual burn.

#### FI-40 Annual contracts and procurement pack
- **Problem:** AEC firms buy software through procurement, not with a credit card. Without an annual option, W-9, security summary and a DPA, Enterprise deals die in legal review even when the champion wants us. **Proposal:** Annual billing at the catalogue's annual price, with a procurement pack: security overview, data-flow diagram, subprocessor list, DPA, W-9, standard MSA, and a one-page answer to "where is data stored". Keep the pack in the repo so it cannot drift from reality.
- **Timing:** Now. Two documents unlock deals that are otherwise stuck, and the annual price already exists in the plan catalogue. **Dependencies:** FI-64 DPA templates, FI-59 legal review, finance process for invoicing and PO numbers.
- **Owner:** Founder/GTM | **Effort:** S | **Impact:** 4 | **Confidence:** 4 | **Score:** 16.0 | **Risk:** Low
- **Leading indicator:** Days from verbal yes to signed contract; target under 30 for Starter and Growth.
- **Risk:** Committing to an SLA we cannot meet with two engineers. Only offer the 99.9 percent commitment with a status page and an incident process, which means FI-54 before the first Enterprise signature.

#### FI-41 Per-hire success fee hybrid
- **Problem:** Some employers will not pay for access, only for outcomes. Refusing them entirely leaves money and proof on the table. **Proposal:** Optional hybrid: reduced platform fee plus a fixed fee per confirmed hire, capped, with a 90-day guarantee. Requires outcome confirmation (FI-37) to be auditable or the model is unenforceable.
- **Timing:** Horizon. It is strategically risky for a talent-first brand and operationally heavy before outcomes are tracked. **Dependencies:** FI-37, contract templates, invoicing, collections process, a clear anti-circumvention clause.
- **Owner:** Founder/GTM | **Effort:** M | **Impact:** 4 | **Confidence:** 2 | **Score:** 4.0 | **Risk:** High
- **Leading indicator:** Share of new contracts on hybrid terms; if above 50 percent, the access model is failing rather than being complemented.
- **Risk:** Becoming a contingency recruiter, which changes the whole company and puts us in direct conflict with the employers we sell to. Cap hybrid at a minority of ARR and keep it out of self-serve.

#### FI-42 Sponsored job slots
- **Problem:** Employer job posts compete in a single list with no way for an urgent role to get visibility, which is a missed revenue line and a poor experience for urgent hiring. **Proposal:** Clearly labelled sponsored placement at the top of job search for a fixed weekly price, limited to two slots per discipline and never applied to candidate shortlists. Relevance floor: a sponsored job must still satisfy the candidate's filters.
- **Timing:** Later. Needs job-search traffic to be worth anything and a policy that keeps the label unmissable. **Dependencies:** Job search rankings, billing, disclosure policy, performance reporting for the advertiser.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 3 | **Confidence:** 3 | **Score:** 9.0 | **Risk:** Medium
- **Leading indicator:** Click-through on sponsored versus organic and the refund rate (a proxy for irrelevance).
- **Risk:** Eroding the "no pay-to-rank" promise. The label must say "Sponsored" in the same visual weight as the title, and candidate ranking must remain untouched.

#### FI-43 Featured candidate boost (evaluated, narrowly scoped)
- **Problem:** Candidates want visibility, particularly career changers and people outside the main metros, and there is an obvious revenue temptation here. **Proposal:** Never in search results or shortlists. If built at all, an employer funds one labelled spotlight inside a candidate's opted-in weekly digest for a job the candidate already matches, capped at one per candidate per quarter and off by default. Publish the rule and audit it quarterly.
- **Timing:** Horizon, and only if candidate-side demand is explicit. Lowest score in the document by design. **Dependencies:** Public ranking policy page, employer billing, matching that already works, candidate notification preferences.
- **Owner:** Founder/GTM | **Effort:** M | **Impact:** 2 | **Confidence:** 2 | **Score:** 2.0 | **Risk:** High
- **Leading indicator:** Complaints referencing paid visibility per quarter; a single credible complaint is a signal to stop.
- **Risk:** Destroying the trust premise in one screenshot. If there is ever ambiguity about whether money moved a candidate up a shortlist, the feature is not worth the revenue.

#### FI-44 Aggregate insight reports (privacy guardrails)
- **Problem:** AEC firms have no reliable view of BIM salary movement, role scarcity or software adoption, and they ask us for it in almost every sales conversation. It is also the easiest way to look like a data broker. **Proposal:** Quarterly PDF and web report built only from aggregate, k-anonymised data: salary bands, time-to-fill, discipline demand, assessment band distribution. Minimum cell size 20, no employer names, no candidate attributes beyond band. Free for paying accounts, paid standalone.
- **Timing:** Later. Needs volume and a privacy review; publishing early would be a fabrication. **Dependencies:** FI-37, FI-38, aggregation pipeline with a suppression rule, counsel sign-off on the publishing policy.
- **Owner:** Eng-Data | **Effort:** M | **Impact:** 3 | **Confidence:** 3 | **Score:** 4.5 | **Risk:** High
- **Leading indicator:** Downloads by paying accounts and inbound press requests; both are marketing value even when the report is not a revenue line.
- **Risk:** Re-identification through cross-referencing small metros. Suppress any cell where a single employer contributes more than 50 percent of the sample, and never include a metro with fewer than three employers.

#### FI-45 University and AEC programme partnerships
- **Problem:** Graduating architectural engineering and construction management students have no verified signal, and we have no cheap way to seed verified supply each spring. **Proposal:** Programme licence for departments: students take the assessment as part of a BIM course, departments get cohort dashboards, students keep their verified badge after graduation. Free for students, paid by the department or bundled with an employer sponsor.
- **Timing:** Next. It is the most credible supply channel for the first 200 candidates and it produces longitudinal data on score versus career progression. **Dependencies:** FERPA-aware data handling, cohort dashboard, faculty champion per programme, academic calendar timing (recruit in September and January).
- **Owner:** Founder/GTM | **Effort:** M | **Impact:** 4 | **Confidence:** 3 | **Score:** 6.0 | **Risk:** Medium
- **Leading indicator:** Verified students per partner programme per semester; target 25 per programme in the first cohort.
- **Risk:** Students gaming a test their classmates can see. Rotate the item pool per cohort (FI-03), use integrity signals, and never publish an institutional ranking of average scores.

#### FI-46 Enterprise SSO and SCIM provisioning
- **Problem:** Enterprise security review stops at "how do users log in". Local passwords and cookie sessions do not pass a 20-person AEC firm's IT review. **Proposal:** SAML and OIDC SSO, just-in-time account creation, SCIM for seat lifecycle, enforced SSO per account, and a break-glass admin path with audit logging.
- **Timing:** Later, but before the first Enterprise contract is signed. Building it after a verbal yes costs weeks of deal momentum. **Dependencies:** Identity provider test tenants (Okta, Entra, Google), audit log (FI-57), session invalidation semantics.
- **Owner:** Eng-FS | **Effort:** M | **Impact:** 4 | **Confidence:** 5 | **Score:** 10.0 | **Risk:** Medium
- **Leading indicator:** Time to complete an SSO pilot with a prospect; target under five business days.
- **Risk:** Locking ourselves into one IdP's quirks. Implement against the OIDC and SAML specs, test with two providers before shipping, and keep the password path as break-glass only.

#### FI-47 White-label licensing to AEC firms
- **Problem:** Large AEC firms and industry bodies want the assessment under their own brand for internal upskilling and supplier qualification. That is real revenue with no consumer acquisition cost. **Proposal:** Licensed deployment with custom domain, logo, item-bank restriction and a per-seat internal assessment mode. Only after the core product has audited item quality and a stable API.
- **Timing:** Horizon. It is a services business disguised as software and will consume the small team. **Dependencies:** FI-34 API, FI-46 SSO, multi-tenancy, contract template, support staffing.
- **Owner:** Founder/GTM | **Effort:** L | **Impact:** 3 | **Confidence:** 2 | **Score:** 2.0 | **Risk:** High
- **Leading indicator:** Implementation hours per licence; above 80 hours makes it a consultancy, not a product.
- **Risk:** One big licence consuming the roadmap and turning BIMcred into an agency. Require a standard package, a named licensee project manager, and a price that covers at least 100 engineering hours.

### Theme (f): platform and scale

#### FI-48 Postgres scale-out with a read replica
- **Problem:** The app already runs on Postgres, but the Neon free tier shares compute and caps connections. Sustained concurrent unlocks plus analytics queries will exhaust the pooler, and search cannot scale independently. **Proposal:** Move to a paid Postgres tier, add reviewed forward-only migrations, add a read replica for search and analytics queries, and right-size the pooler. Rehearse a restore before the cutover.
- **Timing:** Now, at the trigger point in section 8 (first paying employer or above 20 concurrent sessions). The free tier is sufficient for the demo but not for paid traffic. **Dependencies:** Prisma migration review, backup and restore test, environment parity, a maintenance window and a rollback runbook.
- **Owner:** Eng-FS | **Effort:** M | **Impact:** 5 | **Confidence:** 5 | **Score:** 12.5 | **Risk:** Medium
- **Leading indicator:** p95 write latency and connection-timeout errors per day; both should be near zero after cutover.
- **Risk:** Losing candidate records in a botched cutover. Rehearse on a Neon branch, verify row counts per table, and keep the pre-cutover branch read-only for 14 days.

#### FI-49 pgvector or OpenSearch for semantic search
- **Problem:** Keyword filters cannot handle "clash detection on healthcare projects" or "ISO 19650 implementation". Recruiters describe the work, not the schema. **Proposal:** Start with Postgres plus pgvector to avoid a second datastore; move to OpenSearch only when hybrid keyword ranking and faceting demand it. Store embeddings for profiles and job posts, version the model, and support re-embedding without downtime.
- **Timing:** Next for embedding storage, Later for the ranker (FI-24). Do not add a search cluster before there is a relevance test set. **Dependencies:** FI-48, FI-36 taxonomy, an embedding provider with a data processing agreement, evaluation set of labelled pairs.
- **Owner:** Eng-Data | **Effort:** M | **Impact:** 4 | **Confidence:** 4 | **Score:** 8.0 | **Risk:** Medium
- **Leading indicator:** Zero-result search rate and recall at 50 on the evaluation set; target recall above 0.8.
- **Risk:** Shipping candidate profile text to a third-party embedding API. Use a provider with no training on our data, strip contact fields before embedding, and document it in the DPA and privacy policy.

#### FI-50 Durable queue, transactional outbox and scheduler
- **Problem:** Emails, digests, calibration jobs and webhooks run inline or not at all. A slow SMTP server makes a page load slow, and a deploy during a digest run silently drops half the batch. **Proposal:** Postgres-backed job queue with a transactional outbox so a committed unlock always produces exactly one downstream event. Add a scheduler with idempotency keys, retries with backoff, dead-letter queue and an admin view of stuck jobs.
- **Timing:** Next, before the first digest and calibration job ship. Retrofitting exactly-once semantics after a duplicate-email incident is painful. **Dependencies:** FI-48, idempotency keys on credit and email operations, monitoring.
- **Owner:** Eng-FS | **Effort:** M | **Impact:** 4 | **Confidence:** 5 | **Score:** 10.0 | **Risk:** Medium
- **Leading indicator:** Dead-letter count per day and duplicate-send rate; target zero duplicates.
- **Risk:** Double credit consumption on retry. Every credit mutation must carry an idempotency key enforced by a unique constraint, not application logic.

#### FI-51 Event bus and analytics pipeline
- **Problem:** Product analytics are reconstructed from database rows after the fact, which is slow and cannot answer funnel questions like "how many employers saw the filter wall and left". **Proposal:** Emit domain events (candidate_verified, search_run, wall_hit, unlock_created, note_added, hire_confirmed) to an append-only sink, then build funnels from that. Use a managed warehouse free tier or Postgres tables at beta scale; do not stand up Kafka.
- **Timing:** Next. The events must be captured before the questions become urgent, but the expensive tooling can wait. **Dependencies:** FI-50 outbox, event schema registry in the repo, retention policy that excludes sensitive fields.
- **Owner:** Eng-Data | **Effort:** L | **Impact:** 3 | **Confidence:** 4 | **Score:** 4.0 | **Risk:** Medium
- **Leading indicator:** Share of key funnel steps with complete event coverage; target 100 percent of the unlock funnel.
- **Risk:** Event sprawl with no owner. Define the schema in version control, require a consumer for every event, and drop events nobody reads after a quarter.

#### FI-52 Feature flags and experiment assignment
- **Problem:** Every change is a deploy and every experiment is a code branch. With a team of two, that turns a two-week test into a two-week build. **Proposal:** Minimal flag service backed by a table: boolean and multivariate flags, stable hashing by account or candidate ID, kill switch, and an audit of who changed what. Not a vendor product at this stage.
- **Timing:** Now. Highest-leverage platform item because it makes every other experiment cheaper. **Dependencies:** None beyond the database; needs discipline about flag removal.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 4 | **Confidence:** 5 | **Score:** 20.0 | **Risk:** Low
- **Leading indicator:** Share of shipped features behind a flag and median flag lifetime; retire flags within 60 days of a decision.
- **Risk:** Permanent flag debt where nobody knows which branch is live. Add a weekly report of flags older than 60 days and delete them deliberately.

#### FI-53 Multi-region deployment
- **Problem:** A US-only prototype is fine until an AEC firm with European operations asks where data is stored and requires EU residency. **Proposal:** Two-region deployment with data residency per account, read locality, and a documented failover. Delay until a contract requires it and the revenue covers the operational overhead.
- **Timing:** Horizon. Do not build this speculatively; it doubles operational surface for a two-person team. **Dependencies:** FI-48, FI-60 residency policy, infrastructure-as-code, on-call process.
- **Owner:** Eng-FS | **Effort:** L | **Impact:** 2 | **Confidence:** 2 | **Score:** 1.3 | **Risk:** High
- **Leading indicator:** Count of deals blocked specifically on residency; zero means the investment is premature.
- **Risk:** Splitting the database and discovering cross-region queries are slow and expensive. Only pursue with a signed contract that funds the work.

#### FI-54 Observability: error tracking and tracing
- **Problem:** We find out about failures from a customer email. An unlock that charges a credit but fails to reveal contact details is invisible until someone complains. **Proposal:** Error tracking with release tagging, OpenTelemetry traces across server actions and database calls, structured logs with a request ID, uptime checks on the candidate and employer entry points, and a status page for Enterprise.
- **Timing:** Now. Without it, every incident costs hours and the 99.9 percent SLA is a lie. **Dependencies:** Free-tier error service, log retention policy that scrubs phone numbers and emails, alert routing to the on-call phone.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 4 | **Confidence:** 5 | **Score:** 20.0 | **Risk:** Low
- **Leading indicator:** Mean time to detect incidents; target under 15 minutes for payment and unlock paths.
- **Risk:** Leaking personal data into error payloads. Configure scrubbing before the first deploy and test it with a deliberate exception containing a phone number.

#### FI-55 Portfolio render and image CDN pipeline
- **Problem:** Portfolio review (FI-08) and profile photos will put large images and model thumbnails through the app server, which will fall over and serve slow pages on site connections. **Proposal:** Signed direct-to-storage uploads, server-side thumbnail generation, responsive formats, immutable cache headers and a CDN in front. Strip EXIF and model metadata on ingest.
- **Timing:** Next, before portfolio review opens to all candidates. **Dependencies:** Object storage, image processing worker, FI-50 queue, retention and deletion job.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 3 | **Confidence:** 5 | **Score:** 15.0 | **Risk:** Low
- **Leading indicator:** p95 image load time on a throttled 3G profile; target under 1.5 seconds.
- **Risk:** Metadata leaking client project names from uploaded screenshots. Strip all metadata and warn candidates in the upload flow, with a manual review of the first fifty uploads.

#### FI-56 Edge rate limiting and abuse defence
- **Problem:** In-memory rate limits reset on every deploy and do not exist across instances, so OTP and unlock endpoints are open to scripted abuse that costs money and pollutes data. **Proposal:** Edge rate limits per IP, per phone prefix, per account and per token, with stricter budgets on OTP send, login and unlock. Add bot signals, disposable-number detection and a challenge on suspicious velocities.
- **Timing:** Now. Every week without this is a week of avoidable spend and fake signups. **Dependencies:** Edge platform configuration, a shared counter store, an alert when a limit triggers more than a threshold per hour.
- **Owner:** Eng-FS | **Effort:** S | **Impact:** 4 | **Confidence:** 5 | **Score:** 20.0 | **Risk:** Medium
- **Leading indicator:** OTP send cost per verified candidate and blocked-request rate; a sudden drop in cost usually means real users are being blocked.
- **Risk:** Locking out legitimate users behind corporate NAT. Use per-phone and per-account budgets as the primary limit and treat IP as a secondary signal.

#### FI-57 Append-only audit log (WORM)
- **Problem:** Enterprise buyers ask who viewed a candidate and who changed a score. Application logs rotate and can be edited by anyone with database access. **Proposal:** Append-only audit table with hash chaining: actor, action, target, timestamp, request ID, before and after hashes. No update or delete permissions for the app role. Export to write-once storage on a schedule.
- **Timing:** Next, before Enterprise sales and before the first data subject access request. **Dependencies:** FI-48, role separation, retention policy, a verification job that detects chain breaks.
- **Owner:** Eng-FS | **Effort:** M | **Impact:** 4 | **Confidence:** 4 | **Score:** 8.0 | **Risk:** Medium
- **Leading indicator:** Chain verification failures (target zero) and time to answer an audit query; target under 30 minutes.
- **Risk:** Logging personal data into an immutable store, which makes deletion requests impossible. Log identifiers and actions, never phone numbers, emails or free-text notes.

### Theme (g): compliance and accessibility

#### FI-58 EEOC adverse-impact monitoring dashboard
- **Problem:** If employers use LOC as a screening gate, the score can produce a disparate impact even when no protected attribute is an input. We cannot see that today, and neither can they. **Proposal:** Voluntary, aggregate demographic data collection at the candidate level (never visible to employers), with selection-rate analysis per stage and per plan. Alert admins when a four-fifths-rule style ratio falls below a threshold. Publish a methodology page. Do not expose employer-level dashboards until counsel reviews the framing.
- **Timing:** Next. Collection must start early because analysis requires volume; the dashboard itself can follow. **Dependencies:** Candidate consent flow, legal review, minimum cell sizes, aggregation pipeline, a clear statement that we do not sell demographic data.
- **Owner:** Counsel | **Effort:** M | **Impact:** 5 | **Confidence:** 4 | **Score:** 10.0 | **Risk:** High
- **Leading indicator:** Voluntary disclosure rate; below 20 percent makes the analysis unreliable and the approach needs redesign (for example, aggregate third-party benchmarks instead).
- **Risk:** Creating a discoverable record of adverse impact that we then fail to act on. Only start collecting if we commit to a remediation policy and a named owner.

#### FI-59 FCRA applicability memo and product decision
- **Problem:** If a LOC score is a "consumer report" used for employment, we may be a consumer reporting agency under the FCRA, with obligations around permissible purpose, disclosures, dispute handling and accuracy. Nobody on the team is qualified to decide this from a blog post. **Proposal:** Paid legal memo answering three questions: does a skills assessment combined with identity verification fall inside or outside the FCRA; what changes if employers use it as a screening criterion; what consumer dispute process is required either way. Write the product decision and the candidate disclosure from the memo.
- **Timing:** Now. It gates how we describe the product to employers, what the terms say, and whether FI-64's templates are sufficient. This is the highest legal-risk item in the document. **Dependencies:** A US employment lawyer with FCRA experience, current product description, sample employer contract, budget approval.
- **Owner:** Counsel | **Effort:** S | **Impact:** 5 | **Confidence:** 5 | **Score:** 25.0 | **Risk:** High
- **Leading indicator:** Memo delivered with a clear yes or no and a written product decision attached; a vague memo is a failure.
- **Risk:** Proceeding without it. Do not enable employer-side automated rejection on LOC until this memo exists, regardless of customer pressure.

#### FI-60 State privacy matrix and data residency posture
- **Problem:** US state privacy laws differ on notice, deletion, opt-out of profiling and sensitive data. A single "we comply with applicable law" sentence is not a policy and will not survive a procurement questionnaire. **Proposal:** Matrix of states where we have candidates or employers, mapping each obligation to a control and an owner. Start with California, then the states where our first enterprise prospects operate. Add a residency statement to the DPA and a data map showing what is stored where.
- **Timing:** Next, before the first 200 candidates. The data map is also required for SOC 2 and for the FCRA memo. **Dependencies:** FI-59, data inventory, counsel review, privacy policy rewrite.
- **Owner:** Counsel | **Effort:** M | **Impact:** 4 | **Confidence:** 4 | **Score:** 8.0 | **Risk:** Medium
- **Leading indicator:** Questionnaire turnaround time for enterprise prospects; target under two business days without founder involvement.
- **Risk:** Writing policy we do not implement. Every mapped control needs a test or a documented manual procedure, reviewed twice a year.

#### FI-61 WCAG 2.2 AA audit and remediation
- **Problem:** A timed skills assessment with poor contrast, no keyboard path and no screen-reader announcements excludes qualified people and invites a discrimination complaint. **Proposal:** External audit of the candidate flow (signup, OTP, assessment, results, profile) against WCAG 2.2 AA, then fix in priority order. Add automated checks to CI, but treat them as a floor; manual testing with two assistive technology users is the real test. Publish an accessibility statement and a feedback route.
- **Timing:** Next, before public launch. Retrofitting a timed test after launch is expensive and looks cynical. **Dependencies:** Audit budget, keyboard and screen-reader test devices, design system tokens for contrast, extra-time accommodation policy for the assessment.
- **Owner:** Design | **Effort:** M | **Impact:** 4 | **Confidence:** 5 | **Score:** 10.0 | **Risk:** Medium
- **Leading indicator:** Automated violations per page (target zero on critical flows) and manual audit issues closed within 30 days.
- **Risk:** Compliance theatre where the audit passes but the test is still unusable with a screen reader. Include at least one real assistive-technology user in acceptance testing, paid for their time.

#### FI-62 Plain-language LOC explainer
- **Problem:** "Level of Competence, 100 to 500" sounds like a credit score. Both candidates and employers assume it is opaque and permanent, which is the worst of both worlds. **Proposal:** One page explaining what is measured, what is not, how the number is computed, what changes it, how long it lasts, and how to dispute it. Written at a general reading level with an example. Link it from every score display and every employer filter.
- **Timing:** Now. It costs a day and it defuses the single most common objection in both sales and candidate support. **Dependencies:** FI-11 receipt, FI-07 for the sub-score explanation, a review by someone outside the team for clarity.
- **Owner:** Founder/GTM | **Effort:** S | **Impact:** 4 | **Confidence:** 5 | **Score:** 20.0 | **Risk:** Low
- **Leading indicator:** Support questions about the meaning of the score per hundred candidates; target below three.
- **Risk:** Over-promising validity. Say "a verified signal of applied BIM knowledge, not a guarantee of job performance" in the first paragraph.

#### FI-63 SOC 2 Type I readiness, then ISO 27001 roadmap
- **Problem:** Enterprise AEC buyers require a security attestation. Without one, the largest deals stall at the security questionnaire stage regardless of product quality. **Proposal:** Type I first: define the control set, write policies, run them for a quarter, engage an auditor. Use a compliance automation tool only when the manual process hurts. Only commit to ISO 27001 if a specific deal or EU expansion requires it.
- **Timing:** Later. Type I is premature before the platform items (FI-48, FI-54, FI-57) are in place, because the controls would be describing systems that are about to change. **Dependencies:** FI-48, FI-54, FI-57, FI-60, written policies, an owner with time to run the programme, audit budget.
- **Owner:** Eng-FS | **Effort:** L | **Impact:** 4 | **Confidence:** 4 | **Score:** 5.3 | **Risk:** High
- **Leading indicator:** Security questionnaire win rate on Enterprise-stage deals and the number of unanswerable questions; target zero unanswerable after Type I.
- **Risk:** Treating an audit as a marketing badge instead of an operating discipline. If controls are not actually running for the observation window, delay the audit rather than fake the evidence.

#### FI-64 DPA and subprocessor templates
- **Problem:** Every serious employer asks for a data processing agreement. Sending a PDF from a lawyer's inbox with the wrong entity name, no subprocessor list and an undefined breach window slows deals and creates legal exposure. **Proposal:** Versioned DPA in the repo with a subprocessor table (hosting, email, error tracking, LLM provider if any), a 72-hour breach notification commitment, deletion timelines, and a short security exhibit. Counsel-reviewed once, then updated on a schedule, not per deal.
- **Timing:** Now. It is required by the first paying employer and takes a day once counsel has reviewed the template. **Dependencies:** FI-59, subprocessor inventory, entity details, a signature flow that stores the executed version.
- **Owner:** Counsel | **Effort:** S | **Impact:** 4 | **Confidence:** 5 | **Score:** 20.0 | **Risk:** Low
- **Leading indicator:** Time to return a signed DPA; target under three business days.
- **Risk:** Promising breach notification or deletion timelines the team cannot meet. Only commit to what the runbooks in section 8 can deliver, and test the deletion path before signing.

---

## 4. Do not build (first 18 months)

The list matters as much as the backlog. Each of these is tempting, plausible in a pitch deck, and wrong for a two-engineer company with a trust-based product.

### DNB-01 Our own applicant tracking system

Tempting because employers ask "can we just run the whole process here". Wrong because an ATS is a workflow product with infinite edge cases (approvals, offers, e-signature, immigration, internal mobility), it is not what anyone pays us for, and every hour spent on it is an hour not spent on score validity. The counter-move is FI-28: push candidates into the ATS the employer already pays for. Revisit only if three Enterprise accounts commit to paying more for BIMcred than for their ATS.

### DNB-02 Built-in video interviewing

Tempting because scheduling plus video feels like one product. Wrong because video is a commodity (every meeting tool has it), recording interviews creates a new category of sensitive personal data with retention and consent obligations, and the differentiation would be zero. Use the employer's meeting link (FI-29). Revisit never, unless we acquire a video company, which we will not.

### DNB-03 Scraping LinkedIn or job boards for profiles

Tempting because it would fill the supply side overnight. Wrong on three counts: it breaches terms of service, it creates profiles of people who never consented to be assessed or contacted, and it destroys the one claim that makes us defensible, which is that every candidate verified a US phone number and chose to be here. The supply plan in the roadmap is slower and it is the moat.

### DNB-04 Selling candidate data, enrichment or lead lists

Tempting because data buyers appear early and the margin looks infinite. Wrong because it converts candidates into inventory, breaks the talent-first premise, and would make every future privacy commitment suspect. Aggregate insight reports (FI-44) are the only permitted data product, and they are k-anonymised, opt-in-compatible and never contain contact details or individual records.

### DNB-05 Charging candidates for anything

Tempting because candidates are numerous and a $19 "premium verification" looks like easy revenue. Wrong because it turns the verified pool into a paid pool, introduces refund and consumer-protection obligations, and gives employers a reason to distrust the score ("they paid for it"). Candidate value comes from the badge, the benchmark and the visibility, all funded by employers.

### DNB-06 Native iOS and Android apps in year one

Tempting because "mobile" appears in every candidate conversation. Wrong because two apps triple the surface area and review cycles, and a PWA (FI-21) covers the actual need: a resumable assessment and job alerts on a phone. Revisit after retention data shows mobile-only candidates are a meaningful cohort.

### DNB-07 Course marketplace or full LMS

Tempting because gap-driven roadmaps (FI-17) naturally lead to selling courses. Wrong because content production is a different business with a different margin structure, and recommending our own paid courses would compromise the assessment's independence. Link out to existing providers and take no commission.

### DNB-08 Automated hiring recommendations

Tempting because "our AI says hire this person" demos extremely well. Wrong because it makes us responsible for the hiring decision, creates a high-risk automated employment tool under emerging state and local rules, and is indefensible when challenged. Rank and explain, never pronounce (see section 6).

---

## 5. Metrics, guardrails and kill criteria

### 5.1 Metrics that must move

Baselines are unmeasured at the time of writing. The prototype has no analytics pipeline, so the first job in the roadmap is instrumentation, not optimisation. Targets are thresholds for a go decision, not forecasts.

| Metric | Definition | Why it matters | Target by month 6 | Target by month 12 |
| --- | --- | --- | --- | --- |
| Verified candidates | Phone verified plus completed assessment, unique person | The only supply that counts | 200 | 600 |
| Assessment completion rate | Started to submitted, per cohort | Measures whether the test is tolerable | 55 percent | 65 percent |
| Employer activation | Trial account reaching first unlock within 7 days | Predicts paid conversion better than signups | 50 percent | 60 percent |
| Trial to paid | Trial accounts converting within 30 days | Core revenue engine | 15 percent | 22 percent |
| Paid employer retention | Accounts renewing month to month | Validates the credit model | 80 percent | 85 percent |
| Credits burned per paid account | Unlocks plus top-ups per month | Tells us if included credits are right | 60 percent of allowance | 70 percent |
| Time to first unlock | Median minutes from signup to first unlock | Tests the ten-minute promise | 45 minutes | 20 minutes |
| Candidate response rate | Unlocked candidates replying within 72 hours | Measures whether contact is welcome | 35 percent | 50 percent |
| Hire confirmations | Confirmed outcomes per month | The input to every data product | 5 | 25 |
| Net revenue retention | Dollar retention including top-ups | The real health metric for a credit business | 95 percent | 110 percent |

### 5.2 Guardrail metrics that must not get worse

Any experiment that improves a primary metric while breaching a guardrail is rolled back, not argued about.

| Guardrail | Threshold | Response if breached |
| --- | --- | --- |
| Candidate complaint rate | Below 1 per 100 verified candidates per month | Pause outbound features, review copy and unlock notifications |
| Wrong-person or impersonation reports | Below 1 per 500 verified candidates | Freeze new employer accounts until manual review clears |
| Unlock refund rate (wasted credits) | Below 3 percent of unlocks | Fix filters or data quality before any pricing change |
| Duplicate or spam applications per candidate | Below 5 per month | Rate-limit employers and review job post quality |
| Assessment score change after retake | Median absolute change below 40 LOC points | Review item pool and retake messaging |
| Page p95 latency on candidate flows | Below 2.5 seconds on 3G | Stop shipping features, fix performance |
| Email bounce and complaint rate | Complaint below 0.1 percent, bounce below 2 percent | Throttle digests until list hygiene is fixed |
| Employer-reported bad-fit rate | Below 15 percent of confirmed hires | Audit the claim that LOC predicts fit; consider recalibration |
| Accessibility regressions | Zero critical WCAG failures on candidate flows | Block release until fixed |

### 5.3 Kill criteria per major bet

A bet without a kill criterion is a religion. Each row names the signal and the decision date.

| Bet | Kill signal | Decision point | What happens after the kill |
| --- | --- | --- | --- |
| FI-01 adaptive testing | Rank correlation with linear test below 0.85 after two calibration cycles | Month 9 | Keep linear test, publish reliability data instead |
| FI-07 sub-scores | Fewer than 20 percent of employer searches use a sub-score after eight weeks | Month 10 | Keep headline LOC only; reuse sub-score content for candidate feedback |
| FI-08 portfolio review | Fewer than 30 percent of reviewed candidates get an unlock within 30 days, or reviewer hours exceed 20 per week at 50 reviews | Month 7 | Offer it as a paid BIMcred service to design partners only, or stop |
| FI-24 semantic matching | Unlock rate per session not better than filter-only after four weeks of a 50/50 test | Month 12 | Keep filters, add synonym expansion instead |
| FI-28 ATS connectors | Fewer than 15 percent of target accounts use the connector after 90 days | Month 14 | Keep one connector, drop the rest, document the API instead |
| FI-41 per-hire fee | More than 50 percent of new ARR on hybrid terms, or collections above 15 percent of invoiced fees | Month 12 | Return to access-only pricing, keep outcome tracking for data |
| FI-42 sponsored jobs | Candidate complaint rate rises above the guardrail, or click-through below 1 percent | Month 15 | Remove sponsored slots permanently |
| FI-45 university partnerships | Fewer than 25 verified students per partner per semester | Month 10 | Run one-off campus events instead of programme licences |
| FI-47 white-label | Implementation above 80 engineering hours per licence | Month 16 | Decline all licences until a standard package exists |
| FI-53 multi-region | No signed contract requires residency | Month 18 | Stay single-region, revisit annually |
| FI-58 demographic collection | Voluntary disclosure below 20 percent or no remediation policy approved | Month 8 | Stop collecting, rely on external benchmark studies |

### 5.4 Instrumentation rule

No bet starts before its leading indicator is visible in a dashboard a human actually opens weekly. If an item cannot be instrumented, it is not ready to be built. The metrics review is a standing agenda item every Monday, and the review records a decision (continue, change, stop) rather than a discussion.

---

## 6. AI-specific guidance

### 6.1 Principle

AI assists the humans on both sides of the marketplace. It does not decide who gets hired, and it does not produce the LOC score. This is not technophobia; it is the only position that survives an employer asking "why was I not shown this candidate" and a candidate asking "why is my score 310".

Three rules follow from that:

1. Any AI output that a human acts on must be inspectable, attributed and reversible.
2. Any AI output that touches a candidate's record must be deletable with the record.
3. No model output enters a score, a ranking that cannot be explained, or an automated rejection.

### 6.2 Where AI genuinely helps

| Use case | Model role | Human role | Failure mode if wrong | Evaluation metric |
| --- | --- | --- | --- | --- |
| Job description to candidate retrieval (FI-24) | Embed JD and profile, retrieve top 50 | Recruiter reviews and filters | Relevant candidates buried | Recall at 50 on a labelled query set, target above 0.8 |
| Profile and CV parsing | Extract role, software, years, metro into structured fields | Candidate confirms every field before save | Silent mis-parse of seniority, wrong metro | Field-level accuracy above 0.95 on a 200-document gold set |
| Drafting assessment items | Generate candidate item stems and distractors for review | BIM SME edits, tests and signs off | Plausible but wrong technical content | SME acceptance rate, target above 40 percent usable after edit |
| Interview note summarisation | Condense recruiter notes into themes and open questions | Interviewer edits and confirms | Fabricated detail attributed to a candidate | Human correction rate below 20 percent; zero unsupported claims in sampled audits |
| Candidate feedback rewriting | Turn a sub-score report into plain language | Template plus human review of the first 50 | Over-promising or demoralising tone | Readability score and candidate comprehension survey |
| Job post quality suggestions | Flag missing salary band, vague title, impossible requirements | Employer accepts or ignores | Nudging everyone into the same generic post | Adoption rate of suggestions and post-to-application rate |

Everything else is out of scope for now. "AI career coach" and "AI interviewer" are the two most requested features we should decline, because both require the model to make judgements the candidate cannot contest.

### 6.3 Where AI must not be used

- Computing, adjusting or predicting a LOC score. The score comes from deterministic item scoring and a documented mapping. No model may override an answer, infer a missing answer or smooth a result.
- Final hiring decisions or automated rejection. Even a "strong no" recommendation is a decision aid that will be treated as a decision.
- Inferring protected or sensitive attributes from names, photos, schools, accent in writing, or GitHub activity. This is both a legal risk and a data quality poison.
- Generating experience or achievements on a CV that the candidate did not confirm item by item.
- Screening candidates by anything other than declared, job-related criteria. Location is permitted only because hiring is physical and only as a filter the candidate can see and contest.

### 6.4 Risks and mitigations

| Risk | Concrete scenario | Mitigation |
| --- | --- | --- |
| Hallucination | A summary invents a clash-detection project the candidate never described | Retrieval-grounded summarisation, quote-linked claims, human confirmation before save, sampled audits |
| PII leakage to a model vendor | Candidate phone numbers and emails sent in a parsing request | Strip contact fields before inference, contract for zero retention and no training, log only hashes |
| Prompt injection through uploaded content | A CV contains instructions that alter extraction behaviour | Treat all document text as data, never as instructions, constrain output to a schema, validate server side |
| Silent model drift | A vendor updates the model and relevance quietly degrades | Version every model call, pin versions, run the gold set on a schedule, alert on metric drop |
| Homogenised output | Every CV and job post reads identically, reducing signal | Templates with variation, forbid generated superlatives, keep candidate voice editable |
| Cost creep | Embedding every profile on every edit | Batch on write, cache embeddings, re-embed only on material change, budget alert per month |
| Regulatory drift | A state defines "automated employment decision tool" broadly enough to include ranking | Keep ranking explainable and filter-based, legal review of FI-24 before launch, no rejected-candidate output |

### 6.5 Human-in-the-loop requirements

- Item generation: a named BIM SME approves each item in writing before it enters the bank. Generated items are marked as such in the admin table forever.
- Parsing: the candidate sees and confirms every extracted field. Unconfirmed fields are not searchable.
- Summaries: the author confirms the summary before it is visible to anyone else.
- Ranking: every ranked list can be re-sorted by explicit filters, and the UI states which signals contributed to the order.
- Disputes: a human answers every score or profile dispute within five business days, with the FI-11 receipt attached.

### 6.6 Model evaluation plan

1. Gold sets per task, stored in the repo, versioned, with a fixed evaluation script. Start at 200 examples for parsing and 50 for summarisation.
2. Acceptance thresholds agreed before the first run, not after seeing results. If a task cannot reach its threshold, it does not ship.
3. Regression runs on every prompt or model change, with a diff of failing examples in the pull request.
4. Red-team pass before launch: prompt injection in uploaded documents, attempts to extract other candidates' data through a query, and attempts to make the parser infer protected attributes.
5. Cost and latency budgets per request, tracked weekly. A feature that costs more per unlock than the credit margin is not viable, whatever its quality.
6. Quarterly review of every AI feature against three questions: is it still needed, is it still accurate, and would a human reviewer catch its worst failure? If the answer to the last question is no, add a review step or remove the feature.

---

## 7. Three experiments for the next quarter

Rules for all three: one primary metric, pre-registered thresholds, no peeking and stopping early on a good week, and a written decision within five days of the readout. "Inconclusive" is a valid result and must be recorded as such.

### E-01 The filter wall: what exactly is behind it

**Hypothesis.** A trial employer who can see that 12 candidates match their filters (with role, band and metro on three visible cards) converts to paid more often than one who sees an empty state and a price. Seeing the inventory makes the upgrade a purchase rather than a gamble.

**Design.** Account-level A/B during the 14-day trial. Arm A is the current hard wall. Arm B shows a count, three masked cards with band and discipline, and a single upgrade call to action. Assignment by account ID hash, fixed for the account's lifetime so an employer never sees both. Primary metric: paid conversion within 14 days of trial start. Secondary: time from trial start to upgrade, and support tickets mentioning "can I see who". Guardrails: refund rate and complaint rate.

**Sample size logic.** With a 15 percent baseline, detecting a 10 percentage point absolute lift at 80 percent power and 5 percent alpha needs roughly 250 trial accounts per arm under a normal approximation. We expect 40 to 60 trials in the quarter, so the test is underpowered by design. We therefore pre-register a directional rule: a minimum of 20 accounts per arm, a raw difference of at least 15 percentage points, and a consistent direction in time-to-upgrade. If the difference is smaller than the standard error of the difference (about 15 percentage points at 20 per arm), we call it inconclusive rather than a win, and we do not ship on the strength of it.

**Success metric.** Paid conversion of at least 30 percent in arm B versus 15 percent in arm A, with no guardrail breach.

**Decision rule.** Ship if the directional rule is met and the qualitative interviews with five arm-B employers say the preview reduced uncertainty. Kill the variant if arm B converts lower for two consecutive cohorts. Either way, record the numbers so the next test starts from evidence.

### E-02 Campus seeding: reward framing and completion

**Hypothesis.** Students invited through a BIM course with a specific benchmark ("see how you compare with coordinators in your metro") plus a completion reward finish the assessment at a higher rate than students invited with a generic "build your profile" message. The first framing gives them a reason to care about the result rather than the platform.

**Design.** Three partner programmes, roughly 30 students each. Individual randomisation within each programme, stratified by year of study. Arm A: generic invitation. Arm B: benchmark framing plus a completion reward (verified badge plus a fixed-value gift card funded from marketing, not from employer revenue). Same 25-minute assessment, same deadline. Primary metric: completion rate within 14 days of invitation. Secondary: phone verification rate, badge share rate, and 30-day return rate. Contamination is expected because students talk; record whether a student in arm A saw an arm-B message and analyse both as-randomised and excluding reported contamination.

**Sample size logic.** A 20 percent baseline versus 40 percent alternative, with 90 students total (45 per arm), gives a standard error of the difference of about 9.5 percentage points. A 20 point difference is roughly 2.1 standard errors, which is adequate for a directional decision at this stage, though not for a public claim. If the observed difference is under 15 points we extend to a second semester rather than declaring failure.

**Success metric.** Completion of at least 40 percent in arm B, phone verification of at least 70 percent of completers, and at least 25 verified candidates per programme.

**Decision rule.** Scale the benchmark framing to all campus partners if arm B beats arm A by 15 points or more and verification holds. If arm B wins on completion but verification is below 60 percent, fix the verification step before scaling. If both arms are below 25 percent completion, the assessment is too long for a student context and the product needs a short-form variant.

### E-03 Concierge onboarding for the first employers

**Hypothesis.** A 30-minute human onboarding session where we run the first search together, unlock one candidate and draft the outreach message cuts median time to first unlock from days to under one business day, and doubles activation. The blocker for a trial employer is not desire, it is not knowing what a good filter looks like.

**Design.** Alternating assignment by signup order to concierge (30-minute call within 48 hours) versus self-serve with the standard empty state and help docs. Cohort capped at 20 accounts per arm or eight weeks, whichever comes first. Primary metric: median time to first unlock. Secondary: activation within seven days, unlock-to-reply rate, and 30-day retention. Guardrail: founder hours per activation, which must stay under 45 minutes or the motion does not scale.

**Sample size logic.** Time to first unlock is a skewed continuous outcome, so we compare medians with a rank-based test rather than proportions. With 20 per arm, a shift from a median of three days to under one day is a large effect and detectable; smaller shifts are not. We accept that this experiment proves whether the motion works at all, not its precise size, and we would confirm any positive result with a product change tested on more accounts.

**Success metric.** Median time to first unlock under one business day in the concierge arm, activation at 70 percent or higher, and founder time per activation under 45 minutes.

**Decision rule.** If successful, encode the concierge script into the product as a guided first search (FI-25 and onboarding copy) and keep the human call only for Growth and Enterprise. If time to first unlock does not improve, the problem is the inventory or the pricing, not the onboarding, and the next experiment should test pricing instead. Stop after 40 accounts regardless; the founder cannot spend the quarter on calls.

---

## 8. Technical debt register for the prototype

The prototype deliberately took shortcuts to get the flows working. Each shortcut is listed with the interest it charges, not just the principle it violates. All cost figures are internal engineering estimates, clearly labelled as estimates, not measurements.

| ID | Debt | Current state | Cost of delay (estimate) | Trigger to fix | Linked item |
| --- | --- | --- | --- | --- | --- |
| TD-01 | Neon free tier, no replica or migrations | Shared compute, connection cap, `db push` schema changes | Connection timeouts under load; no reviewed migration history or point-in-time recovery | First paying employer or 20 concurrent sessions | FI-48 |
| TD-02 | Comma-separated multi-value fields | Software, disciplines and locations stored as delimited strings | Every new filter is a string-splitting bug; no index, no referential integrity; roughly one day lost per filter feature | Before the third filter or the first taxonomy feature | FI-36 |
| TD-03 | Development OTP | Code rendered in the candidate UI (`DEV_SHOW_OTP=true`), including on the free demo | Blocks a real public launch; anyone can verify a number they control | Before any real candidate data | FI-56 |
| TD-04 | In-memory rate limits | Reset on deploy, per process | OTP and unlock abuse, plus false confidence in tests; unbounded SMS cost | Before public beta | FI-56 |
| TD-05 | No job queue | Emails and digests inline, best effort | Duplicate emails, dropped digests, slow pages; roughly half a day per incident | Before the first digest feature | FI-50 |
| TD-06 | No automated tests | Manual clicking through three portals | Every release risks credits, auth and scoring; regression cost grows with each feature; estimate two days per release by month six | Immediately, starting with credit ledger, scoring and auth | FI-50, FI-57 |
| TD-07 | No audit log | Application logs only, mutable, rotated | Cannot answer enterprise security review or a data access request; blocks Enterprise revenue | Before the first Enterprise proposal | FI-57 |
| TD-08 | No backup or restore rehearsal | Local file copy at best | A lost database ends the company; unquantifiable | Before the first 50 verified candidates | FI-48 |
| TD-09 | Single session secret, no rotation | One env value, never rotated, cookie lifetime long | A leaked secret compromises every session; long-lived cookies widen the window | Before public launch | FI-54 |
| TD-10 | No observability | Server logs read manually | Mean time to detect incidents measured in hours or customer emails; SLA impossible | Before the first paid SLA | FI-54 |
| TD-11 | No CI pipeline | Tests and type checks run by hand, inconsistently | Regressions reach production; type drift across agents and contributors | Immediate | FI-52 |
| TD-12 | Seed and admin data mixed with real data | Demo candidates indistinguishable from verified ones | Employers unlock fake profiles, credits are wasted, trust collapses on discovery | Before the first external employer | FI-53 (data hygiene), FI-11 |

### 8.1 How we pay it down

- Twenty percent of engineering capacity each sprint goes to debt, chosen by the table above and never by what is most fun.
- A debt item that blocks a revenue event (first employer, first Enterprise contract) is promoted to the next sprint without discussion.
- No new feature may deepen a listed debt. If a feature needs comma-separated fields to work, the feature waits for TD-02.
- Test coverage starts with three areas, because they are the ones where a bug costs money or trust: the credit ledger, the scoring and LOC mapping, and the auth and session path.

### 8.2 Debt we are consciously accepting

Some shortcuts are correct for this stage and should not be "fixed" yet: a single-region deployment, no warehouse, no container orchestration, cookie sessions instead of an identity provider, and no mobile app. These are decisions, not debt. They are revisited at the triggers in the roadmap, and until then nobody re-litigates them in a pull request.

---

## 9. Review cadence and change log

- Monthly: rescore the top twenty items, remove anything that has been killed, and confirm that owners still exist. Scores change when evidence changes.
- Quarterly: full review with the roadmap. Any item that has been "next" for two quarters without a decision is either scheduled or deleted.
- After every experiment: append the result to this document under the relevant item. A backlog without recorded outcomes becomes a wish list within a quarter.

| Version | Date | Change | Author role |
| --- | --- | --- | --- |
| 0.1 | 2026-11-17 | Initial backlog: 64 items, 8 do-not-build entries, 3 experiments, debt register | Product lead |

Item count: 64 across seven themes. Of those, 22 are graded S and can ship inside a sprint, 33 are M and need a real project, and 9 are L and require either a specialist or a signed customer before they start.
