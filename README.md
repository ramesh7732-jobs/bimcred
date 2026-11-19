# BIMcred

**A BIM talent assessment and recruitment platform for the US AEC market.**

BIMcred gives BIM professionals a portable **Level of Competence (LOC)** score from 100 to 500, earned through a timed 15-question assessment plus US mobile verification, and gives employers a searchable pool of scored, verified candidates. Employers browse free and spend one credit to reveal contact details. Candidates never pay and are never ranked by who paid.

This repository is a **working prototype**: all three portals, the scoring engine, the credit marketplace, and the admin operations console run end to end against PostgreSQL, with no paid services. It is set up to run on **Vercel Hobby + Neon free Postgres** for a public demo.

---

## Quick start

### Prerequisites

- **Node.js 22 or newer** (developed on Node 26)
- npm 10 or newer
- A free **[Neon](https://neon.tech)** account for PostgreSQL (no credit card). Docker is optional and only needed if you prefer a fully local database.
- No Stripe, SMS or email account required

### Run it

```bash
# 1. Install dependencies
npm install

# 2. Create a free Neon project and copy both connection strings
#    Neon dashboard → Connect → copy the POOLED string (host contains "-pooler")
#    and the DIRECT string. You will paste them in step 3.

# 3. Create your local environment file (once)
#    Windows PowerShell:
Copy-Item .env.example .env
#    macOS / Linux:
cp .env.example .env
#    Then set DATABASE_URL (pooled), DIRECT_URL (direct) and a real SESSION_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 4. Generate the Prisma client, create the schema and seed the demo data
npm run setup

# 5. Start the dev server
npm run dev
```

Open **http://localhost:3000**.

`npm run setup` is idempotent: it regenerates the Prisma client, pushes the schema, and re-runs the deterministic seed with fixed IDs and upserts.

> **Local database options.** The app needs PostgreSQL now, because Prisma fixes the database provider per schema. The simplest option is a second free Neon branch for local work. If you prefer everything offline, run `docker compose up -d db` and use the local URLs commented in `.env.example`.

To publish the demo for free, follow [Deploy free: Vercel + Neon](#deploy-free-vercel--neon) or the detailed [deployment runbook](docs/04c-deployment-runbook.md).

### Demo accounts

| Portal | Email | Password | Notes |
| --- | --- | --- | --- |
| Candidate | `maya.chen@example.com` | `Candidate123!` | Complete profile, verified phone, LOC **414** (Proficient), visible |
| Employer | `talent@aecbuild.com` | `Employer123!` | AEC Build Group, verified, Growth plan, 74 credits |
| Admin | `admin@bimcred.com` | `Admin123!` | Operations console |

The login page also lists these accounts so you can switch portals without hunting through the seed file.

**Other seeded accounts** (all candidates use `Candidate123!`, all employers use `Employer123!`):

- `hiring@meridiandesign.com` — Meridian Design Studio, **unverified** (approval test)
- `careers@northlineinfra.com` — Northline Infrastructure, verified, 9 credits
- `elena.vasquez@example.com` — LOC 286, hidden from search
- `sarah.lindqvist@example.com` — LOC 171, hidden from search
- `james.park@example.com` — LOC 229, subject of the open abuse report
- `tom.okafor@example.com` — LOC 314, score issued

---

## What to try

### Candidate (Maya)

1. Sign in and open `/candidate` — score ring, LOC band, competency breakdown and next action.
2. `/candidate/profile` — edit profile sections, toggle talent-pool visibility.
3. `/candidate/jobs` — filter roles and apply; `/candidate/applications` tracks status.
4. Sign up a fresh candidate to see the gates: the assessment stays locked until the profile is 100% complete **and** a US mobile number is verified.
5. On `/candidate/verify-phone`, request a code. With `DEV_SHOW_OTP=true` the generated six-digit code appears in the on-screen dev banner. There is no fixed OTP.

### Employer (AEC Build Group)

1. `/employer` — verification state, credit balance and next action.
2. `/employer/talent` — filter by LOC band/floor, discipline, software, state and availability. Previews are anonymised and free.
3. Open a candidate and click **Unlock contact** — one credit reveals phone and email; reopening the same candidate is free.
4. `/employer/jobs/new` — publish a role; `/employer/pipeline` — move applicants through New → Shortlisted → Interview → Offer → Hired.
5. `/employer/billing` — credit balance, mock top-up packs and unlock ledger.
6. Sign in as `hiring@meridiandesign.com` to see the unverified state: browse allowed, unlock and job posting blocked.

### Admin

1. `/admin` — daily triage board: pending employers, open moderation reports and recent audit activity.
2. `/admin/employers` — approve or revoke verification and grant credits.
3. `/admin/users` — phone-verification state, LOC and visibility, with audited manual overrides.
4. `/admin/assessments` — per-question attempts and accuracy, competency coverage and LOC distribution.
5. `/admin/audit` — append-only log of logins, unlocks, credit changes, moderation and assessment events.

---

## Deploy free: Vercel + Neon

The whole stack fits inside free tiers: **Vercel Hobby** for the Next.js app and **Neon Free** for PostgreSQL. No credit card is required for either.

1. **Create the production database.** In Neon, create a project (for example `bimcred`, region `us-east-2`). Copy the **pooled** connection string (its host contains `-pooler`) and the **direct** one.
2. **Seed it once from your machine.** In `.env`, set `DATABASE_URL` to the pooled URL (append `&pgbouncer=true&connection_limit=5` if it is missing) and `DIRECT_URL` to the direct URL. Then run:

   ```bash
   npx prisma db push
   npm run db:seed
   ```

3. **Push the code to GitHub.** Create an empty repository and push this folder. Install Git first if `git --version` fails (`winget install --id Git.Git -e`), or use GitHub Desktop.
4. **Import the repository in Vercel.** Framework preset: **Next.js**. Leave the build command on the default (`npm run build`, which now runs `prisma generate` first).
5. **Add environment variables** in Vercel → Project → Settings → Environment Variables (Production and Preview):

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | the Neon pooled URL |
   | `DIRECT_URL` | the Neon direct URL |
   | `SESSION_SECRET` | 32+ random characters (generate with the one-liner above) |
   | `DEV_SHOW_OTP` | `true` for the no-SMS demo, `false` once a real SMS provider is connected |

6. **Deploy**, then open the deployment URL and sign in with the demo accounts above.

> **No Git?** You can publish from this folder with the Vercel CLI instead: `npx vercel login`, `npx vercel --prod`, and set the same variables with `npx vercel env add`. GitHub is still recommended for future updates.

**Know before you share the link**

- Vercel Hobby is for personal, non-commercial projects. A demo or portfolio link is fine; a paid product needs Vercel Pro or another host.
- The demo accounts are public by design, **including the admin account**. Anyone with the link can approve employers or grant credits. After reviewer access ends, rotate the admin password:

  ```bash
  npx tsx scripts/set-password.ts admin@bimcred.com "a-new-long-password"
  ```

- `DEV_SHOW_OTP=true` is required for self-serve phone verification because no SMS is sent. Anyone can read the code for a number they control; never use it for real accounts.
- The Neon free tier suspends idle compute and wakes on the next request, so the first page load after a quiet period can take a second or two.

The full production checklist, custom domain, rollback and smoke tests live in [`docs/04c-deployment-runbook.md`](docs/04c-deployment-runbook.md).

---

## Route map

| Public | Route |
| --- | --- |
| Landing | `/` |
| Sign up | `/signup` |
| Sign in | `/login` |

| Candidate portal | Route |
| --- | --- |
| Dashboard and LOC result | `/candidate` |
| Profile and visibility | `/candidate/profile` |
| US mobile verification | `/candidate/verify-phone` |
| Timed assessment | `/candidate/assessment` |
| Job feed and apply | `/candidate/jobs` |
| Application tracker | `/candidate/applications` |

| Employer portal | Route |
| --- | --- |
| Dashboard and verification | `/employer` |
| Talent search | `/employer/talent` |
| Candidate detail and unlock | `/employer/talent/[id]` |
| Jobs | `/employer/jobs` |
| Post a job | `/employer/jobs/new` |
| Hiring pipeline | `/employer/pipeline` |
| Credits and billing | `/employer/billing` |

| Admin portal | Route |
| --- | --- |
| Triage board | `/admin` |
| Candidate accounts | `/admin/users` |
| Employer verification and credits | `/admin/employers` |
| Question health and LOC distribution | `/admin/assessments` |
| Audit log | `/admin/audit` |

---

## How the LOC score works

LOC means **Level of Competence**. It deliberately borrows the LOD idea of progressive definition and applies it to people: a higher score means a candidate answered more of the harder items correctly under a time box, not that they have a certain number of years of experience.

- **15 questions, 15 minutes.** One completed attempt in the prototype. The timer is server-anchored, selections are held in the browser and posted on submit (no mid-attempt autosave), and the open tab submits automatically at zero.
- **Difficulty weights.** Each item is worth 1, 2 or 3 points; the bank totals 28 weight.
- **Weighted accuracy** = earned weight / 28.
- **LOC** = `round(100 + weightedAccuracy × 400)`, clamped to 100–500.
- **Bands are derived from the score**, so label and number cannot disagree:

| LOC | Band | Meaning |
| --- | --- | --- |
| 100–199 | Emerging | Recognizes BIM concepts; suited to supervised production or internship roles |
| 200–299 | Developing | Routine modeling and documentation with support on coordination and standards |
| 300–399 | Competent | Independent across common workflows; can own a defined workstream |
| 400–449 | Proficient | Leads coordination and information-management decisions on a project |
| 450–500 | Expert | Program-level BIM/VDC leadership, standards ownership and high-risk advisory |

The authoritative implementation is `src/lib/loc.ts`; the item bank is `src/lib/questions.ts`. UI components never reimplement the formula.

**Demo fixture:** Maya earned 22 of 28 weight (12 correct), which is 78.57% weighted accuracy, rounds to LOC **414**, band **Proficient**.

---

## Architecture

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS v3 with a small in-repo design system (`src/components/ui.tsx`) |
| Data | Prisma 6 + PostgreSQL (Neon free tier for the hosted demo), pooled runtime URL plus a direct URL for schema pushes and seeding |
| Mutations | Next.js server actions with redirect-based flash messages |
| Session | HMAC-signed `httpOnly` cookie (`bimcred_session`), role-aware route guards |
| Passwords | bcryptjs hashes |
| Seeding | `tsx prisma/seed.ts`, deterministic fixed IDs and upserts |

```
src/
  app/                 route tree for public, candidate, employer and admin areas
  components/          shared UI primitives, portal shells, LOC visuals
  lib/                 pure domain logic: questions, scoring, pricing, profile, journeys, format
  server/              auth/session, Prisma client, queries (read layer), server actions (write layer)
prisma/
  schema.prisma        12-model data contract
  seed.ts              deterministic demo data and printed credentials
docs/                  product, journey, database, architecture, security and roadmap documents
```

**Data flow:** pages call the read layer in `src/server/queries.ts`; forms post to server actions in `src/server/actions/*`; actions validate, write through Prisma, append an audit row, revalidate affected paths, and redirect with a status query parameter. Pages render that parameter as a flash message.

**Money and credits:** one credit equals one new employer–candidate relationship, not one profile view. Unlocks are idempotent and company-scoped. Repeat opens are free. Billing is a local mock: no payment processor is called.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | `prisma generate` then a production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:push` | Push the schema to PostgreSQL |
| `npm run db:seed` | Re-run the deterministic demo seed |
| `npm run db:reset` | Destructive reset: drop, recreate and reseed |
| `npm run setup` | Generate + push + seed in one step |
| `npx tsx scripts/set-password.ts <email> <password>` | Rotate any account password, for example the admin demo |

Use `npm run db:reset` whenever you want a clean reviewer state after clicking through the demo.

---

## Prototype limitations

These are deliberate scope cuts, documented in the design docs:

- **No real SMS, email, payments or object storage.** The OTP is generated and stored server-side; in dev it is displayed on screen. Credit packs are mock purchases that update the subscription balance; there is no invoice table.
- **One completed assessment attempt** per account. Retakes, a cooldown policy and mid-attempt answer autosave are designed but not shipped.
- **Phone verification is lightweight.** There is no wrong-guess lockout and no cross-account phone uniqueness; both are documented target-product controls.
- **Employer verification is manual and text-based.** No document upload, KYB or domain DNS check.
- **One database region and no migration history.** Schema changes use `prisma db push`. A paid production deployment would baseline forward-only migrations, add point-in-time recovery, and move the session secret into a managed store.
- **Hosted demo free-tier limits.** Vercel Hobby is non-commercial and Neon Free sleeps when idle; both are fine for review, not for paying customers.
- **Shortlisting is modeled through unlock state.** The "My shortlist" view lists candidates your company has unlocked and compares them side by side; there is no free shortlist, note field or job-scoped shortlist.
- **Job posting consumes plan allowance, not credits.** Trial allows three active posts; only contact unlocks consume credits.
- **No public candidate profiles or SEO pages.** Visibility only controls inclusion in employer search.
- **No password reset delivery.** Candidates and employers can sign up and sign in; reset email is out of scope.
- **The seed timestamps are fixed** so the demo is reproducible. Relative labels such as "Active this week" are stable but not live.

`tsconfig` is strict; ESLint is disabled during `next build` for speed but the source has no `any` in domain code.

---

## Design documentation

| Document | Contents |
| --- | --- |
| [`docs/01-core-features.md`](docs/01-core-features.md) | Feature catalogue, acceptance criteria, LOC model, risks |
| [`docs/02-user-journeys.md`](docs/02-user-journeys.md) | Step-by-step journeys for all three portals and a reviewer script |
| [`docs/03-database-design.md`](docs/03-database-design.md) | 12-model schema, relationships, seed catalogue and reviewer SQL |
| [`docs/04-architecture.md`](docs/04-architecture.md) | Runtime architecture, boundaries and scaling path |
| [`docs/04b-security-and-compliance.md`](docs/04b-security-and-compliance.md) | Threat model, privacy posture, compliance notes |
| [`docs/04c-deployment-runbook.md`](docs/04c-deployment-runbook.md) | Environments, deploy and rollback runbook |
| [`docs/05-future-improvements.md`](docs/05-future-improvements.md) | Prioritized backlog (64 items) with RICE-lite scoring |
| [`docs/05b-roadmap.md`](docs/05b-roadmap.md) | Phased roadmap, milestones and go-to-market plan |

---

## Troubleshooting

**`Environment variable not found: DATABASE_URL`**
Copy `.env.example` to `.env`, paste your Neon pooled and direct URLs, and re-run `npm run setup`.

**`@prisma/client did not initialize yet`**
Run `npm run db:generate`. If you changed `prisma/schema.prisma`, run `npm run setup`.

**`Can't reach database server` / `P1001`**
The Neon project is suspended or the URL is wrong. Open the Neon dashboard to wake it, re-copy the pooled URL, and confirm the host contains `-pooler` for `DATABASE_URL`.

**`prepared statement "s0" already exists`**
The pooled URL is missing the PgBouncer flag. Append `&pgbouncer=true` to `DATABASE_URL` and redeploy.

**The database is in a strange state after testing**
Run `npm run db:reset`. This drops and recreates the schema in the configured database, then reseeds. It is destructive: never point it at data you want to keep.

**Port 3000 is already in use**
Run `npm run dev -- -p 3001` and use `http://localhost:3001`.

**Next.js warns about multiple lockfiles**
`next.config.ts` now pins `outputFileTracingRoot` to this folder, so the warning no longer appears. If you see it again, an unrelated `package-lock.json` exists above the project directory.

**Prisma schema validation fails with a BOM error**
Save `prisma/schema.prisma` as UTF-8 **without BOM**. Some Windows editors add a BOM at byte 0, which Prisma rejects.

---

## Security notes for reviewers

- Sessions are HMAC-signed, `httpOnly`, `SameSite=Lax` cookies; the secret comes from `SESSION_SECRET`, and the app refuses to start a production session without a 32+ character value.
- Passwords are bcrypt-hashed; the seed prints plaintext demo credentials by design.
- Contact data is redacted server-side for locked candidates, not just hidden in the UI.
- Credit spends are transactional and company-scoped; the same candidate cannot be charged twice by the same employer.
- Every privileged action appends an `AuditLog` row with actor, entity, action and non-sensitive metadata.
- `DEV_SHOW_OTP=true` is required for the no-SMS hosted demo so new candidates can verify a phone. It is not gated by `NODE_ENV`; turn it off as soon as a real SMS provider is connected, and never use the public demo for real candidate data.
