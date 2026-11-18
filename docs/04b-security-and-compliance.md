# BIMcred — Security and Compliance

Status: working policy for the prototype plus the production target it is designed to reach.
Companion documents: `04-architecture.md` (controls in context) and `04c-deployment-runbook.md`
(operational steps).

> **This document is engineering policy, not legal advice.** Employment-law, privacy, and
> accessibility statements here describe what the product does and why. Counsel must review them
> before launch, and the EEOC section in particular must be reviewed by an employment lawyer.

Every control below is labelled either **implemented** (present in the repository) or **target**
(required before production, not in the prototype). The distinction matters: this is a hosted
free-tier demo on PostgreSQL, with a custom session cookie and no SMS, email, payment, or storage
integration.

---

## 1. Scope and security objectives

BIMcred processes three sensitive classes of data: account credentials, a US mobile number used as a
proof of possession, and professional profile data that can identify a person to a prospective
employer. The security objectives follow from that:

1. **Only the right employer sees a candidate's identity, and only after paying.** Confidentiality of
   candidate PII is the paid product, so a leak is not only a privacy incident but a revenue incident.
2. **Credits cannot be conjured or double-spent.** Integrity of the credit balance is a financial
   control.
3. **A published LOC score is reproducible and defensible.** Integrity of the assessment, and of the
   audit trail behind it.
4. **Availability of the employer portal during business hours.** A talent marketplace that is down
   is a marketplace that is not earning.
5. **We can answer "who saw what, when" for any candidate.** Auditability underpins every DSAR and
   every dispute, even though admin reads are not yet audited (section 6).

Out of scope for the prototype, documented as gaps in section 14: payment card data (no payment
integration exists), background checks, identity documents, and health data.

---

## 2. Asset inventory and classification

| Asset | Where it lives | Classification | Confidentiality | Integrity | Availability |
| --- | --- | --- | --- | --- | --- |
| Password hashes | `User.passwordHash`, bcrypt cost 10 | Restricted | High | High | Medium |
| Session cookies | Browser, HMAC-SHA256 signed, no server-side record | Restricted | High | High | Medium |
| `SESSION_SECRET` | Environment store, with a hard-coded development fallback in code | Secret | Critical | Critical | High |
| Phone numbers | `User.phone`; `PhoneVerification` has no phone column | Restricted PII | High | Medium | Medium |
| OTP codes | `PhoneVerification.code`, plaintext in the prototype | Secret | Critical | High | Low |
| Candidate identity (name, email, location) | `User.name`, `User.email`, `CandidateProfile` | Restricted PII | High | Medium | Medium |
| Assessment question bank and answer key | `src/lib/questions.ts`, server-only import | Confidential | High | Critical | Medium |
| Assessment answers and LOC scores | `AssessmentAttempt`, `AssessmentAnswer`, `CandidateProfile` | Confidential, personal | Medium | Critical | Medium |
| Credit balance and unlock history | `Subscription`, `TalentView` | Confidential, financial | Medium | Critical | High |
| Audit log | `AuditLog` | Confidential, evidentiary | High | Critical | Medium |
| Employer company data and jobs | `EmployerProfile`, `Job` | Confidential | Medium | Medium | High |
| Application pipeline | `Application` | Confidential PII | High | Medium | Medium |
| Admin console | `/admin/*` | Restricted | Critical | Critical | Medium |

Handling rules: Restricted data may appear in a server-rendered page for the data subject or an
authorised viewer, and nowhere else. It must not enter logs, analytics, error reports, test fixtures,
screenshots in tickets, or the repository. Secrets exist only in the environment store and the
password manager. There is no analytics or error-reporting SDK today.

---

## 3. Threat model (STRIDE)

Method: per-asset STRIDE walkthrough, then a control and a residual-risk judgement. Likelihood and
impact are qualitative. "Residual" describes the repository as it stands, not the production target.

### 3.1 Session and credentials

| STRIDE | Threat | Control (implemented) | Residual |
| --- | --- | --- | --- |
| Spoofing | Stolen cookie replayed | `HttpOnly`, `SameSite=Lax`, `Secure` when `NODE_ENV=production`, 7-day expiry, HMAC verification with `timingSafeEqual` | Medium until device revocation and MFA exist; a stolen cookie is valid for up to seven days |
| Spoofing | Forged token with `alg: none` or a swapped algorithm | Custom `payload.signature` format has no algorithm header; verification is always HMAC-SHA256 with one key | Low |
| Tampering | Role claim edited to `ADMIN` | Payload is covered by the HMAC; `requireRole` trusts the signed claim and does not reload the user | Low for forgery; role changes in the database are not reflected until expiry |
| Repudiation | User denies an action | `AuditLog` with actor id, action, entity, timestamp for signup, login, and the mutations listed in section 6 | Low |
| Information disclosure | Token readable by JavaScript or a third party | `HttpOnly`, no token in URLs or `localStorage`, `SameSite=Lax`, no `Domain` attribute | Low |
| Denial of service | Credential stuffing | bcrypt cost 10 and a uniform failure message; **no login rate limit, lockout, CAPTCHA, or MFA** | High until a shared limiter exists |
| Elevation of privilege | Candidate calls an employer action directly | Every action calls `requireRole`; tenant ids come from the session; ownership re-asserted on the row | Low |

### 3.2 Phone verification

| STRIDE | Threat | Control (implemented) | Residual |
| --- | --- | --- | --- |
| Spoofing | Attacker verifies a number they do not control | Code compared to the active row for the session user; 10-minute TTL; single use via `consumedAt` | Low in the intended SMS flow; the demo shows the code in the UI |
| Spoofing | SMS interception or SIM swap | No carrier signals, no velocity check, no manual review in the prototype | Medium; production needs carrier data and a review queue |
| Tampering | Code brute force | 6 digits, but the code is compared as a plain string with **no attempt counter and no constant-time compare** | Medium: an attacker with a session can retry until the code expires |
| Repudiation | User claims they never requested a code | `PhoneVerification` row plus audit `candidate.phone.otp_sent` | Low |
| Information disclosure | Code leaked in logs or UI | Code is not logged by the app. `DEV_SHOW_OTP=true` renders it in the candidate page and is **not** gated by `NODE_ENV` | High if the flag is left on in a public deployment |
| Denial of service | SMS bombing a victim's number | 60-second resend cooldown per user; no IP or per-phone cap because there is no transport yet | Medium once a provider is connected |
| Elevation of privilege | Verify a number already linked to another account | No uniqueness constraint on `User.phone`; two accounts can verify the same number | Medium; a duplicate identity signal can enter the pool |

### 3.3 Candidate PII and the paywall

| STRIDE | Threat | Control (implemented) | Residual |
| --- | --- | --- | --- |
| Spoofing | Employer creates multiple accounts to farm free views | Employer must be verified by an admin before unlocking; one employer profile per user; one charge per `(employer, candidate)` pair | Medium: no domain check, no signup limit, no CAPTCHA |
| Tampering | Client-side manipulation of the unlock flag | Reveal is decided by a `TalentView` row in the server component, never by a client flag. The detail page loads email/phone but renders them only inside the `unlocked` branch | Low for the rendered response; the projection is broader than it needs to be |
| Repudiation | Employer denies scraping | `TalentView` records every paid reveal; no search audit and no response watermarking | Medium: an employer can still read visible fields at machine speed |
| Information disclosure | PII in list responses, page source, or error traces | `searchTalent` selects only `name` and `phoneVerified` from `User`; names redacted to "Maya C."; no PII in errors | Low for the list; the detail page trusts the unlock gate |
| Denial of service | Mass search to enumerate the pool | `cuid` ids, pagination, no email/phone/name search for employers, no autocomplete | Medium: no search rate limit |
| Elevation of privilege | Candidate reads another candidate's profile | `/candidate/*` scopes by `session.uid`; ids are not enumerable; no shared links | Low |

### 3.4 Credits and billing

| STRIDE | Threat | Control (implemented) | Residual |
| --- | --- | --- | --- |
| Spoofing | Forged payment webhook grants credits | There is no payment integration and no webhook endpoint. Plan changes and top-ups are simulated server actions gated by `EMPLOYER` | Low now; unacceptable once real money moves |
| Tampering | Negative or inflated credit values from the client | Credits are never accepted from a form. Top-up amounts are fixed plan constants; admin grants are clamped to 1–500 | Low |
| Repudiation | Employer disputes a charge | `TalentView` plus `AuditLog` (`employer.candidate.unlocked`, `billing.*`) form a record; there is no provider receipt | Medium without a payment provider |
| Information disclosure | Another employer's balance or invoices | Scoped by the `employerId` derived from `session.uid`; 404 on mismatch | Low |
| Denial of service | Unlock loop exhausts provider quota | Credit requirement and a unique pair per unlock; no unlock rate limit | Low while billing is simulated |
| Elevation of privilege | Candidate or employer calls the admin grant action | `requireRole("ADMIN")`; no reason field, but every grant is audited with the amount | Low |

### 3.5 Assessment integrity

| STRIDE | Threat | Control (implemented) | Residual |
| --- | --- | --- | --- |
| Spoofing | Someone else sits the test for the candidate | No identity proof, no proctoring, no timing floors, no device signals | High (accepted and disclosed) |
| Tampering | Answer key extracted from the client bundle | `scoreAssessment` runs on the server; the candidate component receives only `{ id, prompt, options }`, never `answer` | Low |
| Repudiation | Candidate disputes the score | Stored answers (`AssessmentAnswer`), difficulty weights, and a pure deterministic scorer; **no bank-version column** | Low for recompute; a bank change would not be attributable to a version |
| Information disclosure | Candidate sees the key after submission | Review shows per-item correctness, not the correct option; admin sees aggregate item statistics | Low |
| Denial of service | Bot farms attempts | One completed attempt per user, one active attempt at a time, verified phone required, 15-minute time box | Medium: a second account with another number can attempt again |
| Elevation of privilege | Candidate edits a score via the action payload | The score is computed from stored answers; the client never supplies a score or a band | Low |

### 3.6 Admin console and audit trail

| STRIDE | Threat | Control (implemented) | Residual |
| --- | --- | --- | --- |
| Spoofing | Stolen admin session | `ADMIN` role claim; no MFA, no shorter session, no IP allowlist | High: one phished password is a full compromise |
| Tampering | Admin edits or deletes audit rows | No application path to update or delete audit rows; a database operator can still do it | Medium until an append-only role or hash chain exists |
| Repudiation | Admin denies viewing a candidate | **No PII-view audit.** `/admin/users` and `/admin/audit` reads are not recorded | High: read access is invisible |
| Information disclosure | Bulk export of candidates | No export feature exists, so there is no bulk-export control to bypass | Medium: admin pages display contact fields |
| Denial of service | Admin query with no filters on a large table | Admin search accepts a query and paginates; no statement timeout | Low at prototype scale |
| Elevation of privilege | Support user with a normal account performs admin actions | Role enforced at layout and action; no implicit support role | Low |

### 3.7 External integrations

| STRIDE | Threat | Control (implemented) | Residual |
| --- | --- | --- | --- |
| Spoofing | Attacker calls an SMS or payment webhook | No webhook or provider endpoint exists in the prototype | Low now; required before enabling either |
| Tampering | Provider callback alters delivery state incorrectly | No callback path | Not applicable |
| Information disclosure | PII sent to a provider without a DPA | No provider is called. A real SMS adapter would receive the phone number and message body only | Medium until contracts are signed |
| Denial of service | Provider outage blocks signups | The console flow has no provider, so it cannot fail; there is also no delivery retry or fallback | Medium once live SMS is required |

---

## 4. OWASP Top 10 (2021) mapping

| Risk | How it could appear here | Concrete control / status |
| --- | --- | --- |
| A01 Broken access control | Employer opens `/employer/talent/[id]` for an unlocked-by-someone-else candidate and sees contact data; candidate hits an employer action | **Implemented:** role gate in layout and action; `TalentView` check before rendering contact fields; ownership re-assert on job/application mutations; 404 for hidden candidates. **Gap:** PII is selected before the gate and only redacted at render time. |
| A02 Cryptographic failures | Weak session signing, plaintext OTP, weak passwords | **Implemented:** HMAC-SHA256 with `timingSafeEqual`; bcrypt cost 10; `Secure` cookie in production. **Gap:** OTP is plaintext at rest; bcrypt truncates beyond 72 bytes; no password reset. |
| A03 Injection | Raw SQL, template strings in email, CSV formula injection | **Implemented:** Prisma parameterises queries; no `$queryRaw`; React escapes output; no `dangerouslySetInnerHTML`; no CSV/spreadsheet export exists. The `toCsv` helper joins multi-select values with commas and is not an export. |
| A04 Insecure design | Paywall enforced only in UI; credits spendable twice | **Implemented:** unlock invariant is a conditional `updateMany` plus a unique `(employerId, candidateId)` index inside a transaction; no client-supplied balance. **Gap:** no idempotency key, so a double-click can return a generic error after a successful charge. |
| A05 Security misconfiguration | Debug OTP on in production, verbose errors, permissive CORS | **Gap:** `DEV_SHOW_OTP` is not gated by `NODE_ENV`; no security headers or CSP in `next.config.ts`; no CORS because there is no public API. The flag is set to `false` in the compose app service and must be set explicitly in production. |
| A06 Vulnerable components | Outdated Next.js, Prisma, or a transitive dependency | **Partial:** versions are pinned by `package-lock.json`; no `npm audit` step, Dependabot, or automated update policy exists. |
| A07 Identification and authentication failures | No rate limit, enumeration, weak reset | **Gap:** no login/signup rate limit, no lockout, no MFA, no session revocation, no password reset. Login uses a uniform message but not a dummy-hash compare, so timing differs. |
| A08 Software and data integrity failures | Tampered migration, unsigned webhook, edited audit row | **Partial:** no migrations yet; no webhook; audit rows are append-only by application convention only. CI installs from the lockfile when present. |
| A09 Logging and monitoring failures | No record of unlocks, no alert on 5xx | **Partial:** audit rows cover signup, login, unlocks, applications, assessment, billing, and admin mutations. **Gap:** no structured logger, request id, error tracker, metric, or alert. |
| A10 Server-side request forgery | Fetching a candidate-supplied portfolio URL server-side | The prototype never fetches user URLs server-side. There is no link-preview or image-proxy feature. If one is added, allowlist schemes/hosts and block private ranges. |

Security headers are **not** applied in the repository. There is no `headers()` block, no
`middleware.ts`, and no platform configuration file. The production target is HSTS
(`max-age=63072000; includeSubDomains; preload`, after HTTPS is confirmed), `X-Content-Type-Options:
nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
`Permissions-Policy: camera=(), microphone=(), geolocation=()`, and a CSP starting in report-only
mode with `script-src 'self'` and no `unsafe-eval`. These belong in `next.config.ts` or the hosting
layer before launch.

---

## 5. Secrets handling

| Secret | Storage | Access | Rotation |
| --- | --- | --- | --- |
| `SESSION_SECRET` | Environment store, per environment; code falls back to `bimcred-insecure-dev-secret` when unset | Application runtime only | Quarterly and on suspicion. There is no previous-key overlap, so rotation signs every user out. |
| `DATABASE_URL` (contains DB password) | Environment store | Runtime and migration job | 90 days |
| SMS provider key (reserved) | Not read by the app | — | 90 days once wired |
| Email provider key (reserved) | Not read by the app | — | 90 days once wired |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (reserved) | Not read by the app | — | 90 days / per endpoint once wired |
| Backup encryption key (target) | Separate key store from the backups | Two named custodians | Annually, with re-encryption |

Rules:

1. `.env` is gitignored. `.env.example` contains placeholders only and is reviewed on every change to
   make sure no real value slipped in.
2. No secret is prefixed `NEXT_PUBLIC_`; that prefix ships to the browser and is treated as public.
3. Secrets are never logged, never echoed in error messages, and never included in a support export.
   **There is no startup assertion today.** A missing or placeholder `SESSION_SECRET` does not fail
   fast; the code silently uses the development fallback. Production must add that assertion before
   accepting traffic.
4. Local development uses throwaway values. A developer never has production secrets on a laptop;
   debugging production happens through logs and audited admin tooling.
5. Compromise procedure: rotate `SESSION_SECRET` (which invalidates all sessions), revoke provider
   keys, review the exposure window, notify the incident owner, and record the incident even if no
   data was accessed.
6. The seed script contains public demo passwords and has no production guard; never run it against a production database, and add an explicit `NODE_ENV` refusal before launch.

---

## 6. PII map and lawful basis

BIMcred serves US professionals; some candidates or employers may be in the EU/UK. The table records
the primary basis per purpose. Where two could apply, the more specific is listed; consent is used
only where it is genuinely free and withdrawable. The "Status" column separates current processing
from planned processing.

| Data | Subject | Purpose | Basis | Shared with | Status |
| --- | --- | --- | --- | --- | --- |
| Name, email | Candidate, employer user | Account, service email, receipts | Contract | Nobody today; email provider is planned | Implemented |
| Password hash | All users | Authentication | Contract | Nobody | Implemented |
| Mobile number, verification status | Candidate | Proof of possession, account recovery, fraud prevention | Contract; legitimate interests for fraud | Nobody today; SMS provider is planned | Implemented |
| LOC score and band | Candidate | Delivering the assessment result and the talent product | Contract | Signed-in employers, always visible | Implemented |
| Redacted profile before unlock | Candidate | Marketplace discovery | Contract | Signed-in employers | Implemented |
| Full identity and contact details after unlock | Candidate | Introducing candidate to employer at candidate's direction | Contract; candidate controls search visibility, not post-unlock contact | The unlocking employer only | Implemented |
| Employment history, skills, region | Candidate | Matching and search | Contract | Employers per the visibility rules | Implemented |
| Assessment answers | Candidate | Scoring, dispute resolution, quality assurance | Contract; legitimate interests for integrity | Admins only | Implemented |
| Unlock and credit records | Employer | Billing, dispute resolution, audit | Contract; legal obligation for financial records | Nobody today; payment provider and tax authorities are planned | Implemented (simulated billing) |
| Application and pipeline status | Candidate, employer | Facilitating the application | Contract | The two parties | Implemented |
| Audit log (actor, action, ids) | All users | Security, fraud, accountability | Legitimate interests; legal obligation | Regulators on request | Implemented |
| Server logs with `ipHash` | All users | Security, abuse prevention | Legitimate interests | Hosting and log processor | Target: the field exists but no logger writes it |
| Product analytics (aggregated) | All users | Improving the service | Legitimate interests, with opt-out | Analytics processor | Not implemented |

Not collected, deliberately: race, ethnicity, sex, gender identity, age or date of birth, disability,
religion, national origin, photographs, precise address, government ids, health data. Region is
metro-level only. Marketing email requires explicit opt-in and every message carries an unsubscribe
link; no marketing system exists yet.

Retention is driven by purpose limitation: identification data while the account is active,
assessment and unlock records longer because they back disputes and financial statements, and raw
logs briefly. The schedule below is the target; the prototype runs no scheduled deletion job.

---

## 7. Data retention schedule

| Data | Retention | Then | Basis |
| --- | --- | --- | --- |
| Active account and profile | Life of the account | Anonymise 30 days after a deletion request | Contract |
| Deleted account tombstone (id, hashed email) | 24 months | Hard delete | Fraud prevention, legitimate interests |
| Phone number and verification rows | 12 months after last verification | Delete number, keep a boolean verified flag | Fraud prevention |
| Assessment attempts and answers | 24 months after the attempt, or life of the account if longer | Delete answers, keep score and band with the profile | Dispute resolution, product integrity |
| Unlock records (`TalentView`) | 24 months | Delete, keep aggregate counts | Billing disputes |
| Subscription and credit audit rows tied to payment | 7 years | Delete | Tax and accounting obligation |
| Application and pipeline data | 12 months after the job closes | Delete | Contract, dispute resolution |
| Audit log (non-financial) | 24 months | Delete or archive to cold storage | Security and accountability |
| Security and access logs | 30 days | Delete | Legitimate interests |
| Database backups | 35 days | Expire | Disaster recovery |
| Support tickets | 24 months | Delete | Contract, dispute resolution |
| DSAR and complaint records | 3 years | Delete | Legal obligation, accountability |
| Marketing consent records | Life of consent plus 3 years | Delete | Accountability |

Production runs deletion as a nightly scheduled job, with counts logged (never the deleted values).
Backups age out on their own schedule, so a deletion is complete across backups within 35 days; the
DSAR response states that window. The schedule is policy, not code: there is no scheduler, no
`deletedAt`, and no retention query in the repository.

---

## 8. DSAR and erasure runbook

Applies to access, correction, portability, and deletion requests from candidates and employer users.
Target: acknowledge within 2 business days, complete within 30 calendar days (GDPR one month; CCPA 45
days; we use the shorter).

1. **Intake.** Requests arrive by email to the privacy address or through a support ticket. Log the
   date, requester, and channel in the DSAR register. Do not ask for more data than needed to verify.
2. **Verify identity.** Require a signed-in session and a confirmation email to the address on file,
   or a re-authentication prompt. For an authorised agent, require written authority. Never accept a
   request based on knowing a candidate's name and phone number.
3. **Scope.** Search by `User.id` and cascade: `CandidateProfile`, `PhoneVerification`,
   `AssessmentAttempt`, `AssessmentAnswer`, `Application`, `TalentView`, `Report`, `AuditLog` entries
   where the person is actor or subject. Employer users also cover `EmployerProfile`, `Job`,
   `Subscription`.
4. **Access export.** Produce a JSON file containing profile data, assessment results, applications,
   unlocks (as subject), and the audit events about them. Exclude other people's data, internal fraud
   notes, and security secrets. There is no export tool in the app, so the current procedure is a
   read-only database query run by two people. Deliver through a short-lived signed link, not an email
   attachment.
5. **Correction.** Profile fields are self-service. Assessment records are immutable in the app and
   there is no invalidation or retake action; a correction requires a documented database change
   approved by the incident owner. Do not edit `locScore` without a matching `AssessmentAttempt`.
6. **Erasure.** Anonymise rather than hard-delete rows needed for financial or audit obligations:
   replace name, email, and phone with nulls or a tombstone, delete `PhoneVerification` rows and
   `AssessmentAnswer` rows, keep `TalentView` and financial audit rows with the pseudonymous id. Hard
   delete profile fields that are not needed. Record the action as admin audit metadata without
   retaining the erased values. This is a manual runbook step; there is no erasure endpoint.
7. **Downstream.** Ask the email and SMS providers to delete message logs for the subject where
   contractually possible; confirm the payment provider retains only legally required invoice data.
8. **Respond.** Send a completion notice listing what was provided, corrected, or deleted, and the
   backup ageing window. Log the completion date and the outcome code in the register.
9. **Refusals.** If a request is manifestly unfounded or would harm another person's rights, document
   the reason and the legal basis and inform the requester of the appeal route. Never refuse silently.

Erasure exceptions are recorded in a short internal note: financial records (7 years), active
investigations, and legal holds. The note references the legal basis, not the erased content.

---

## 9. EEOC and adverse-impact guardrails

**This section is product policy, not legal advice, and must be reviewed by employment counsel before
launch.**

BIMcred sells a scored signal used in hiring. That places the LOC score in the neighbourhood of an
employment test under the Uniform Guidelines on Employee Selection Procedures (UGESP) and raises
disparate-impact questions under Title VII. The design position is that BIMcred is a **sourcing and
verification tool**, not an automated decision system, and that employers remain the decision-makers.

Product commitments (several are policy targets, not shipped features):

1. **No automated rejection.** BIMcred never filters candidates out of an employer's view on the basis
   of LOC alone. Search filters are employer choices and are visible in the UI. Pipeline stages are
   moved by humans.
2. **The score is job-related.** Questions map to tasks a BIM professional performs: model
   coordination, clash resolution, LOD conventions, data exchange, and standards. The question bank is
   written against a blueprint, but the schema has no `bankVersion` column and no blueprint is stored
   with an attempt yet.
3. **No protected attributes.** The system does not collect or infer race, sex, age, disability,
   religion, or national origin. Name, photo, school, and postcode are absent from `jobMatchScore`
   (architecture doc, section 4.3). Employers see the score alongside the rest of the profile, not as
   a single gate.
4. **Bands, not false precision.** Five bands with described meanings. Employers are told the band is
   a screening aid with a confidence caveat, not a percentile or an IQ-style measure.
5. **Adverse-impact monitoring (target).** Quarterly, for employers with enough volume, compute
   selection rates by band and by available non-protected groupings (region, years of experience)
   across the unlock-to-interview funnel. If the four-fifths rule indicates adverse impact, review
   whether the band is being used as a cutoff and whether the rubric is valid for that role. Findings
   are shared with the employer as guidance; BIMcred does not adjudicate their hiring decisions. No
   such report exists today.
6. **Candidate transparency.** Candidates see their score, band, per-question correctness after
   submission, and the scoring explanation. The assessment page states that the score is a screening
   signal, not a certification. There is no dispute workflow beyond support.
7. **Accommodation (target).** Candidates can request extended time or an alternative format before
   starting. The prototype does not implement a time multiplier or a request record; the 900-second
   limit is fixed for everyone. Production needs a server-set multiplier and an accommodation record
   that does not store medical detail.
8. **Recordkeeping.** Attempts and unlock records are retained for 24 months under section 7, which
   supports an employer's own UGESP recordkeeping obligations (generally two years for employers above
   the size threshold). Employers remain responsible for their own records.
9. **No adverse-action automation.** BIMcred sends no rejection notices and provides no "auto-reject
   below score" switch. Adding one would require a legal review and a design change, not a config flag.
10. **Model changes are versioned (target).** A rubric change should be a new bank version with a
    recompute and a changelog, so historical comparisons are not silently invalid. The current code has
    one fixed 15-question bank and no version field.

Monitoring is a product-quality loop, not a compliance checkbox: if a band consistently correlates
with a non-job-related characteristic, the question blueprint is reviewed before the score is sold
further.

---

## 10. Accessibility commitment (WCAG 2.1 AA)

BIMcred targets WCAG 2.1 level AA across the three portals, with the assessment treated as the
highest-risk surface because it is timed and score-bearing. The prototype has semantic HTML, visible
labels, and keyboard-reachable forms, but it has **not** been audited against WCAG, has no automated
accessibility check in CI, and has no accommodation flow. The table is the acceptance target for
production.

| Requirement | Implementation target |
| --- | --- |
| Perceivable | Text contrast at least 4.5:1, 3:1 for large text and UI boundaries; no information conveyed by colour alone (LOC bands carry a text label and a pattern, not just a hue); charts have table equivalents |
| Operable | Full keyboard access to every flow, including the assessment and the unlock dialog; visible focus ring; skip-to-content link; no keyboard traps in dialogs; target size at least 24×24 px |
| Understandable | Persistent labels, not placeholder-only; inline error messages tied with `aria-describedby`; consistent navigation; no time limit on profile or job forms |
| Robust | Semantic HTML, landmarks, `aria-live` for OTP status and form results, tested with screen readers |
| Timed content | Assessment countdown announced at 5 and 1 minutes; a server-set accommodation multiplier (1.5× or 2×); answers survive a timeout. **Current gap:** answers are saved only on submit, and the assessment auto-submits at the deadline. |
| Motion | `prefers-reduced-motion` respected; no auto-playing media; no flashing |
| Zoom and reflow | Usable at 200% zoom and 320 px width without horizontal scrolling |
| Forms | Programmatic labels, grouped radio options with `fieldset`/`legend`, error summary at the top of the form, focus moved to the summary |
| Documents | Any downloadable receipt or profile export is a tagged PDF or plain HTML/CSV |

Process target: axe checks in CI, a manual keyboard pass per release, a screen-reader pass (NVDA on
Windows, VoiceOver on macOS) each quarter, and an external audit before enterprise sales. An
accessibility statement and a contact route will be published; a VPAT will be available on request.

---

## 11. Incident response

### 11.1 Severity

| Level | Definition | Examples | Response |
| --- | --- | --- | --- |
| S1 Critical | Confirmed or likely breach of candidate PII, credit integrity failure, total outage, admin compromise | Database exposed, double-spend in production, admin session stolen | Page on-call immediately, incident commander within 15 min, customer and legal notification process started |
| S2 High | Partial outage, single-tenant data exposure, SMS outage blocking signups | Employer sees another employer's pipeline, OTP provider down > 30 min | Respond within 1 hour, fix or mitigate same day |
| S3 Medium | Degraded feature, no data exposure | Search slow, receipts failing, one employer blocked | Respond within 1 business day |
| S4 Low | Cosmetic or single-user issue with a workaround | Broken link, wrong copy | Normal backlog |

### 11.2 Runbook

1. **Detect and declare.** Alert, report, or anomaly. Open an incident channel and a timeline
   document. Assign commander, scribe, and communications lead. One person communicates; nobody
   improvises public statements.
2. **Triage.** Confirm scope: which data, which subjects, which environments, still ongoing? Preserve
   evidence before changing anything (snapshot logs, database state, relevant audit rows).
3. **Contain.** Rotate `SESSION_SECRET` (invalidating every session), revoke provider keys, block the
   offending account, and if necessary take the portal down or put the platform behind maintenance.
   The prototype has no runtime feature flags — `FEATURE_*` variables are documented but unread — so
   "disable the feature flag" is not an available lever yet. Prefer a narrow containment over a full
   shutdown.
4. **Eradicate and recover.** Fix the root cause, deploy through the normal pipeline with a review,
   verify with the smoke checklist, restore from backup if data was corrupted, and confirm that audit
   writes resume.
5. **Notify.** Legal counsel decides whether notification is required and who receives it. Engineering
   supplies the facts: data categories, number of subjects, time window, containment, and contact
   point.
6. **Learn.** Blameless post-incident review within 5 business days for S1/S2: timeline, contributing
   factors, what worked, action items with owners and dates. Publish internally; publish externally
   where a customer or regulator requires it.

Because admin reads are not audited, an investigation cannot currently reconstruct which admin viewed
which candidate. That gap is itself an incident-response limitation and is listed in section 14.

### 11.3 Breach notification clocks

| Regime | Deadline | Notes |
| --- | --- | --- |
| GDPR (EU/EEA) | 72 hours to the supervisory authority after awareness, where the breach is likely to result in a risk to rights and freedoms | Data subjects without undue delay if high risk. Processors notify controllers without undue delay. |
| UK GDPR / ICO | 72 hours to the ICO | Same risk test; record all breaches even when not reportable. |
| US state laws | Varies by state | Most require notice "without unreasonable delay"; some set outer limits (for example 30 days in Colorado and Florida). Some require attorney-general notice above thresholds. Apply the shortest applicable clock. |
| Contractual | Per enterprise agreement | Typically 24–48 hours to the customer contact; check the MSA. |

Practically: treat 72 hours from awareness as the working deadline for any confirmed PII breach,
notify counsel immediately, and let counsel make the final call on reportability. Keep a breach
register even for near misses.

---

## 12. Vendors and subprocessors

The prototype calls none of these. The table is the approved production set; adding a vendor requires
a security review, a DPA, and an entry in the public subprocessor list.

| Vendor | Role | Data categories | Region | Status | Contract requirement |
| --- | --- | --- | --- | --- | --- |
| Vercel | Application hosting, CDN, TLS | Request metadata, redacted logs | US/EU regions selectable | Planned | DPA, SCCs if applicable, log retention setting |
| Neon or Supabase | Managed Postgres | All application data | US (primary) | Planned | DPA, encryption at rest, PITR, private networking |
| Twilio (or equivalent) | SMS delivery | Phone number, message body with code | US | Planned | DPA, message-log retention, opt-out handling |
| Resend or Amazon SES | Transactional email | Email address, name, notification content | US | Planned | DPA, bounce and complaint handling |
| Stripe | Payments, invoices | Employer billing details, card data (never on our servers) | US | Planned | DPA, PCI attestation, webhook signing |
| Cloudflare R2 or S3 | Object storage for CVs and receipts | Candidate documents | US | Planned | DPA, private bucket, signed URLs, encryption |
| Sentry or equivalent | Error tracking | Stack traces, request ids, no PII | US | Planned | DPA, PII scrubbing, sampling |

Vendor review checklist: security questionnaire, SOC 2 or ISO 27001 evidence, subprocessor list,
breach-notification terms, data location, deletion on termination, and an exit plan for the data.

---

## 13. Backup and restore

All rows except the demo note are production targets. Neon's free tier provides backups but the
demo has no tested restore rehearsal; the quickest recovery is a fresh Neon branch plus
`npm run db:reset`.

| Property | Target | Mechanism |
| --- | --- | --- |
| RPO (production) | 5 minutes | Managed Postgres point-in-time recovery with a 7-day window |
| RPO (daily snapshot) | 24 hours | Automated daily snapshot retained 30 days |
| RTO | 4 hours for a regional restore; 1 hour for a bad deploy | Runbook rehearsed quarterly |
| Backup encryption | AES-256 at rest, TLS in transit | Provider-managed keys plus a separately held export key |
| Restore verification | Quarterly | Restore into an isolated environment, apply migrations, verify row counts and audit continuity |
| Audit log protection | Weekly encrypted export | Object storage with immutability window; hash manifest |
| Demo database | Public accounts and no restore rehearsal | Fresh Neon branch plus `npm run db:reset`; never a source of truth |

Restore procedure: declare the incident, freeze writes, identify the target timestamp, restore into a
new instance, verify schema version and a sample of audit rows, point `DATABASE_URL` at the restored
instance, run the smoke checklist, and reconcile post-restore writes from audit and provider records.

---

## 14. What is intentionally simplified in the prototype

Do not mistake the local demo for the production posture. Each simplification has a production
requirement attached.

| Simplification | Risk if shipped as-is | Production requirement |
| --- | --- | --- |
| Dev OTP rendered in the UI (`DEV_SHOW_OTP`), flag read directly and not gated by `NODE_ENV` | Anyone who can load the candidate page can read the code for their own pending number | Real SMS provider; remove the UI reveal; hard-disable the flag and add a startup assertion |
| OTP stored plaintext, no attempt counter, no constant-time compare | A database reader can take over a pending verification; a session holder can brute-force within 10 minutes | Hash the code, add an attempt cap and lockout, compare in constant time |
| No `User.phone` uniqueness | Two accounts can verify one number | A normalised phone table with a uniqueness policy and a support exception path |
| Neon free tier and `db push` | Shared compute, no PITR guarantee, no migration history | Paid managed Postgres with PITR, private networking, reviewed migrations and pooler sizing |
| No rate limiter of any kind | Credential stuffing, scraping, and SMS bombing are cheap; only the OTP 60-second cooldown exists | Shared Redis or Postgres counters on login, signup, OTP, search, unlock, and admin export |
| No password reset | Locked-out users need manual support | Signed single-use reset token, 30-minute TTL, enumeration-safe flow |
| No MFA, including for admins | One phished password is a full compromise | TOTP for admins first, then employers; recovery codes |
| Stateless sessions with no device list | A stolen cookie is valid until expiry; a role change or deletion does not revoke it | Server-side session records or a revocation list, plus device management |
| No MFA-gated admin reads and no PII-view audit | An operator can browse candidate contact data without a trace | Reason-bearing PII-access events, alerting, and a short retention on the audit of reads |
| No security headers or CSP | Clickjacking, MIME sniffing, and script injection have no defence in depth | Headers in `next.config.ts` or the platform, CSP report-only first, HSTS after TLS is stable |
| `SESSION_SECRET` falls back to a development string outside production | A misconfigured production deploy would use a public value and could be forged | Fail-fast length assertion (implemented); encrypted per-environment store and known-placeholder check still required |
| Seed data with public demo accounts, no production guard | The hosted demo intentionally has known credentials, including admin | Separate demo dataset from real data; rotate the admin password with `scripts/set-password.ts` after review |
| No billing integration | Credits are seeded, admin-granted, or simulated; no payment reconciliation | Stripe Checkout, signed webhook, idempotency, refunds, reconciliation job |
| Audit log immutable by application convention only | A privileged operator could rewrite history | Append-only database role, hash chain, weekly immutable export |
| No migrations directory | Schema drift; `db push` has no history | Baseline the Postgres schema and review forward-only migrations |
| No accessibility audit or accommodation flow | WCAG AA compliance is unverified; disabled candidates may be excluded by the fixed timer | External audit, axe checks, keyboard and screen-reader passes, server-set time multiplier |
| Single region, no DR drill | Regional outage means downtime | Multi-zone managed services, tested restore, status page |

Acceptance rule for launch: every row in this table is either closed or explicitly accepted in writing
by the founder, with the residual risk recorded in this document.
