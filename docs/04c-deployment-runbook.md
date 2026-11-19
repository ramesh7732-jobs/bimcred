# BIMcred — Deployment Runbook

Everything here is copy-pasteable. Commands are given for Windows PowerShell and for macOS/Linux.
Run them from the repository root unless a step says otherwise.

Prerequisites: Node.js 22 or 26 (`node -v`), npm 10 or newer (`npm -v`), Git, and a free
[Neon](https://neon.tech) account for PostgreSQL. Docker is optional and only needed for a fully
local database. No paid service is required to run or host the demo.

Contents: local setup, environment, database, demo accounts, reset, production build locally,
Vercel + Neon deployment, domain, SMS swap-in, rollback, smoke tests, troubleshooting.

> Scope note: the schema targets PostgreSQL and has no `prisma/migrations` directory, no
> `/api/health` route, no security headers, and no SMS, email, payment, or storage integration.
> Schema changes use `prisma db push`. Steps that assume otherwise are marked as production work,
> not current behaviour.

---

## 1. Local setup — Windows PowerShell

1. Confirm the toolchain.

   ```powershell
   node -v
   npm -v
   ```

2. Install dependencies. A `package-lock.json` is committed, so `npm ci` is the correct command.

   ```powershell
   npm ci
   ```

   If the lockfile is out of step with `package.json`, use `npm install` once and commit the updated
   lockfile.

3. Create the environment file.

   ```powershell
   Copy-Item .env.example .env
   ```

4. Generate a real session secret and put it in `.env` as `SESSION_SECRET`.

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

5. Set the local values in `.env`. The minimum is:

   ```dotenv
   DATABASE_URL="postgresql://user:password@ep-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=5"
   DIRECT_URL="postgresql://user:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require"
   SESSION_SECRET="<paste the generated value>"
   NODE_ENV="development"
   DEV_SHOW_OTP="true"
   ```

   `DATABASE_URL` is the pooled string (host contains `-pooler`) and is what the app uses at
   runtime. `DIRECT_URL` is the unpooled string used by `db push` and the seed, which need a real
   session. Using a separate Neon branch for local work keeps demo data untouched.

   `APP_URL` is present in the example but no module reads it. Leave it at `http://localhost:3000`
   for documentation; it does not enable an origin check.

6. Generate the Prisma client, create or update the schema, and seed demo data. `npm run setup` runs
   all three; the individual scripts are `db:generate`, `db:push`, and `db:seed`.

   ```powershell
   npm run setup
   ```

7. Start the development server.

   ```powershell
   npm run dev
   ```

8. Open `http://localhost:3000`. Confirm the seeded data with `npx prisma studio` or the admin
   dashboard; there is no local database file any more.

## 2. Local setup — macOS and Linux

Install, configure, and seed. The `.env` values are the same as step 1.5.

```bash
node -v && npm -v
npm ci
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# edit .env with both Neon URLs and the generated secret, then:
npm run setup
npm run dev
```

## 3. Environment variables

`.env.example` is the authority. `.env` is gitignored and must never be committed.

| Variable | Read by the app | Required locally | Example | Notes |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Yes (Prisma) | Yes | Neon pooled URL | Runtime URL. Append `?sslmode=require&pgbouncer=true&connection_limit=5` for serverless. |
| `DIRECT_URL` | Prisma CLI only | Yes | Neon direct URL | Unpooled URL for `db push` and seeding. Not used by the running app. |
| `SESSION_SECRET` | Yes (`src/server/auth.ts`) | Yes | 32 random bytes, base64 | Rotating it logs everyone out; there is no previous-key overlap. In production the app throws instead of falling back to the public dev string. |
| `APP_URL` | No | No | `http://localhost:3000` | Reserved. There is no origin check and no email link builder. |
| `NODE_ENV` | Yes | Yes | `development` | `production` adds `Secure` to the cookie and enforces the session-secret check. Vercel sets it. |
| `DEV_SHOW_OTP` | Yes (`verify-phone/page.tsx`) | Yes for the OTP demo | `true` | Read directly; **not** gated by `NODE_ENV`. Required for the no-SMS hosted demo; turn it off when a real SMS provider is connected. |
| `LOG_LEVEL` | No | No | `debug` | Reserved for a logger that does not exist. |
| `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_API_SECRET`, `SMS_SENDER_ID`, `SMS_WEBHOOK_SECRET` | No | No | `console` / empty | Reserved for a real SMS adapter. The code is generated locally and never sent. |
| `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM` | No | No | `console` / empty | Reserved; no email is sent. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | No | No | empty | Reserved; billing is simulated. |
| `BLOB_READ_WRITE_TOKEN` | No | No | empty | Reserved; no uploads exist. |
| `FEATURE_SMS_LIVE`, `FEATURE_BILLING`, `FEATURE_OBJECT_STORAGE` | No | No | `false` | Reserved flags; no code reads them, so they are not kill switches. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `APP_PORT` | No (Compose only) | No | `bimcred` | Interpolated by `docker-compose.yml`. |

Never put a real secret in `.env.example`, a commit, a screenshot, or a support ticket.

---

## 4. Database tasks

| Task | Command |
| --- | --- |
| Regenerate the client after a schema edit | `npm run db:generate` |
| Apply the schema to the database | `npm run db:push` |
| Seed demo data | `npm run db:seed` |
| Reset and reseed | `npm run db:reset` |
| Generate, push, and seed in one step | `npm run setup` |
| Inspect data in a browser | `npx prisma studio` |
| Validate the schema | `npx prisma validate` |
| Rotate an account password | `npx tsx scripts/set-password.ts <email> <password>` |
| Create a migration history (production hardening) | `npx prisma migrate dev --name describe_the_change` |
| Apply migrations in staging or production | `npx prisma migrate deploy` |

There is no `prisma/migrations` directory in the repository. `db:push` is correct for the demo
database, including the hosted Neon one. A paid production deployment should baseline a reviewed
migration history first; do not point `migrate deploy` at a database that has no history.

---

## 5. Demo accounts

`prisma/seed.ts` creates 8 candidates, 3 employers, 6 jobs, 3 applications, 2 paid unlocks, and one
open report. All seeded candidates use `Candidate123!`; all seeded employers use `Employer123!`.

| Portal | Email | Password | State |
| --- | --- | --- | --- |
| Admin | `admin@bimcred.com` | `Admin123!` | Full admin access |
| Candidate | `maya.chen@example.com` | `Candidate123!` | Phone verified, LOC 414, completed assessment, one application to an AEC Build job |
| Employer (verified) | `talent@aecbuild.com` | `Employer123!` | AEC Build Group, GROWTH, 74 credits remaining, 1 used, has already unlocked Maya Chen |
| Employer (unverified) | `hiring@meridiandesign.com` | `Employer123!` | Meridian Design Studio, STARTER, 25 credits; cannot unlock or publish until an admin verifies it |
| Employer (verified, trial) | `careers@northlineinfra.com` | `Employer123!` | Northline Infrastructure, TRIAL, 9 credits, has already unlocked Tom Okafor |

Other seeded candidates (`daniel.whitfield@example.com`, `priya.raman@example.com`, and five more)
share the candidate password and cover the other LOC bands.

Demo credentials are intentionally weak and public. Seeding a dedicated Neon database for the public
demo is expected; never run the seed against a database that holds real candidates or employers.
After reviewer access ends, rotate the admin password:

```bash
npx tsx scripts/set-password.ts admin@bimcred.com "a-new-long-password"
```

---

## 6. Reset the database

`npm run db:reset` runs `prisma db push --force-reset` followed by the seed. It drops and recreates
the schema in whatever database `DIRECT_URL` points at, then reseeds. Check the URL before running it
and stop the dev server so requests do not fail mid-reset.

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
npm run db:reset
```

macOS/Linux:

```bash
pkill -f "next dev" || true
npm run db:reset
```

`--force-reset` drops everything, including any data created during review. The seed is idempotent,
so re-running `npm run db:seed` alone restores the demo rows without another destructive reset.

---

## 7. Run a production build locally

1. Ensure the schema is current, then build and start:

   ```bash
   npm run db:push
   npm run build
   npm start
   ```

   `npm run build` runs `prisma generate` itself.

2. Open `http://localhost:3000`.

Notes: `npm start` sets `NODE_ENV=production`, so the cookie is `Secure`; over plain HTTP on a
non-localhost host the browser drops it. Use `npm run dev` for an HTTP smoke test. `DEV_SHOW_OTP` is
**not** disabled by `NODE_ENV`. Keep it `true` for the no-SMS demo, or set it to `false` and use the
seeded verified candidate when an SMS provider is connected. A "dynamic server usage" build error
means a cookie-reading page was statically rendered; add
`export const dynamic = "force-dynamic"` to that portal layout.

---

## 8. Deploy to Vercel with Neon Postgres

The repository is already configured for this path: `prisma/schema.prisma` declares
`provider = "postgresql"` with `url` (pooled) and `directUrl`, and `npm run build` runs
`prisma generate`. These steps produce a free public demo.

1. Create the database. In Neon, create a project in the region closest to the users (for a US
   product, `us-east-2` or `us-west-2`, ideally matching the Vercel region). Copy both connection
   strings:
   - **Pooled** (host contains `-pooler`): for the application at runtime.
   - **Direct**: for `db push`, the seed and any future migrations.

2. Create the schema and seed the demo once, from your machine. Point `.env` at the production Neon
   project, then:

   ```bash
   npx prisma db push
   npm run db:seed
   ```

   `db push` and the seed use `DIRECT_URL`. Use `npm run db:reset` instead if you want a guaranteed
   clean state; it is destructive, so never aim it at data you want to keep.

3. Push the repository to GitHub and import it in Vercel. Framework preset: Next.js. Root directory:
   repository root. Install command: `npm ci` (or the default). Build command: leave the default,
   which runs `npm run build` and therefore `prisma generate && next build`. Node version: 22.

4. Set environment variables for Production:

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | Pooled Neon URL with `?sslmode=require&pgbouncer=true&connection_limit=5` |
   | `DIRECT_URL` | Direct Neon URL with `?sslmode=require` |
   | `SESSION_SECRET` | 32 random bytes, base64, generated fresh (not the local one) |
   | `DEV_SHOW_OTP` | `true` for the no-SMS demo; `false` once a real SMS provider is connected |
   | `APP_URL` | `https://your-project.vercel.app` (reserved; no current effect) |

   `NODE_ENV` is set to `production` by Vercel; do not override it.

5. Optional: add the same variables to Preview, pointing at a separate Neon branch, so preview
   deployments cannot mutate the demo data.

6. Deploy. Watch the build log for `prisma generate`, then run the smoke checklist in section 12
   against the deployment URL. There is no `/api/health` endpoint; use `/login` and the three portals
   for the check.

7. If you do not use Git, deploy from this folder with the Vercel CLI instead:
   `npx vercel login`, `npx vercel --prod`, then add the same variables with `npx vercel env add`.
   GitHub remains the better path for later changes because every push redeploys automatically.

8. Treat the demo as public. The seeded admin account can approve employers, grant credits and change
   visibility, and `DEV_SHOW_OTP=true` shows phone codes for any number a visitor controls. When
   reviewer access ends, rotate the password with
   `npx tsx scripts/set-password.ts admin@bimcred.com "a-new-long-password"` or delete the demo
   database. Vercel Hobby is for personal, non-commercial projects; a paid product needs Vercel Pro
   or another host.

---

## 9. Domain and TLS

1. In Vercel, add the domain under Project → Settings → Domains.
2. At the DNS provider, create the record Vercel shows: an `A` record to `76.76.21.21` for an apex
   domain, or a `CNAME` to `cname.vercel-dns.com` for a subdomain.
3. Wait for verification. Vercel issues and renews a Let's Encrypt certificate automatically; TLS 1.2+
   is enforced and HTTP redirects to HTTPS.
4. Set `APP_URL` to the canonical HTTPS origin for documentation. It is not read by the app, so a
   mismatch does **not** cause mutations to fail; there is no origin check.
5. Add HSTS only after the domain is confirmed working on HTTPS for all subdomains you control, and
   add the remaining security headers deliberately. Neither is in `next.config.ts` today.
6. Keep `www` as a redirect to the apex (or the reverse), never both serving the app, so cookies and
   links stay on one origin.
7. With `NODE_ENV=production`, the session cookie is `Secure`; confirm the site is served over HTTPS
   before signing in, or the browser silently drops the cookie.

---

## 10. SMS provider swap-in checklist

The prototype has no SMS transport and no adapter interface. `sendOtpAction` generates a six-digit
code, stores it in `PhoneVerification.code` as plaintext, and the candidate page renders it when
`DEV_SHOW_OTP=true`. Before sending a real message:

1. Choose a provider with US long-code or toll-free support and a DPA available.
2. Buy a number or register a sender, and complete any US carrier registration the provider requires.
3. Store the key in the environment store, never in `.env.example` or the repository.
4. Add a provider module and call it from `sendOtpAction` after the row is created; keep a console
   adapter for local development.
5. Send a real message end to end with `DEV_SHOW_OTP=false` and confirm the code arrives within 10
   seconds.
6. Verify the 10-minute expiry and the 60-second resend cooldown against the live provider, including
   a provider timeout.
7. Before launch, hash the code at rest, add a per-code attempt cap and lockout, compare in constant
   time, and remove the UI reveal. None of these exist today.
8. Add delivery-failure handling: timeout, retry with backoff, circuit breaker, and a user-visible
   "could not send" message that does not consume an attempt.
9. Configure provider spend alerts and a per-day cap to catch SMS bombing.
10. Confirm the phone number is never written to application logs and that provider message logs have
    a defined retention period.
11. Update the privacy policy and subprocessor list.
12. Run the OTP smoke test in staging with a real handset before enabling in production.

---

## 11. Rollback

**Application rollback (bad deploy, good schema).** In Vercel, Deployments → select the last known
good deployment → Promote to Production, or from the CLI:

```bash
vercel rollback
```

Rollback is instant because the previous build is still available. Re-run the smoke checklist.

**Schema rollback.** There is no migration history, so `db push` changes cannot be down-migrated. Use
expand/contract instead: the previous application version must tolerate the new schema for one
release. If a schema change corrupted data, restore a Neon branch to the timestamp before the change,
point `DIRECT_URL` and `DATABASE_URL` at the restored branch, redeploy the previous build, and
reconcile writes made after the restore point from the audit log and provider records. Before any
risky change, create a Neon branch as a snapshot: it is free and instant.

**Feature kill switch.** There is no working kill switch. `FEATURE_SMS_LIVE`, `FEATURE_BILLING`, and
`FEATURE_OBJECT_STORAGE` are documented but no module reads them. Contain an incident by promoting the
previous deployment or taking the portal down; do not rely on changing a `FEATURE_*` value.

**Communication.** Note the rollback in the incident record with the deploy id, the reason, and the
verification that followed. If any candidate data was exposed, follow the incident process in
`04b-security-and-compliance.md`, section 11.

---

## 12. Smoke test checklist (15 checks)

Run after every deploy, in this order. Each check names the portal and the expected result.

| # | Portal | Check | Pass condition |
| --- | --- | --- | --- |
| 1 | Public | Open `/` | 200, hero renders, no console errors, no mixed content |
| 2 | Public | Open `/login` and `/signup` | Forms render, labels present, keyboard reachable |
| 3 | Auth | Sign up a new candidate | Redirect to `/candidate/verify-phone`, session cookie present and `HttpOnly` |
| 4 | Candidate | Request and enter the OTP | Phone marked verified; code shown only when `DEV_SHOW_OTP` is on |
| 5 | Candidate | Start `/candidate/assessment` | 15 questions, countdown running, answers held in the form (they save only on submit) |
| 6 | Candidate | Submit the assessment | LOC integer within 100–500, band matches the range, result persisted |
| 7 | Candidate | Edit and save `/candidate/profile` | Changes persist after reload; the search visibility toggle takes effect |
| 8 | Candidate | `/candidate/jobs` and apply to a new job | Application created once; a duplicate submit does not create a second row |
| 9 | Candidate | `/candidate/applications` | Application and stage visible; no other candidate's data |
| 10 | Employer | `/employer` and `/employer/talent` | Balance visible; list shows redacted names and no email/phone in the page source |
| 11 | Employer | Sign in as AEC and unlock a candidate it has not unlocked | Contact details appear, balance drops by exactly 1, a second visit is free |
| 12 | Employer | Create a job on `/employer/jobs/new` | Job appears under `/employer/jobs`; validation rejects an empty title; an unverified employer cannot publish |
| 13 | Employer | Move an application in `/employer/pipeline` | Stage persists after reload; an audit row is written |
| 14 | Employer | `/employer/billing` | Balance equals granted minus used; unlock history matches step 11 |
| 15 | Admin | `/admin`, `/admin/users`, `/admin/employers`, `/admin/assessments`, `/admin/audit` | Pages load for admin; audit shows the unlock and the login; a candidate session is redirected to `/candidate` |

Additional negative checks worth running when time allows: candidate opens `/employer` (redirected to
`/candidate`), employer opens `/admin` (redirected to `/employer`), unlock with zero credits (no
reveal, no negative balance), a wrong OTP (error, and no attempt counter is decremented because none
exists), and a session cookie edited by one character (signed out).

---

## 13. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `EADDRINUSE: address already in use :3000` | Another dev server or process owns the port | Windows: `netstat -ano \| findstr :3000` then `Stop-Process -Id <pid> -Force`. macOS/Linux: `lsof -i :3000` then `kill <pid>`. Or run `npm run dev -- -p 3001`. |
| Prisma engine download fails (`ECONNRESET`, 403) | Corporate proxy, firewall, or a cached partial download | Retry on a clean network; clear the Prisma cache under `%LOCALAPPDATA%\Prisma` (Windows) or `~/.cache/prisma` (macOS/Linux); set `HTTPS_PROXY`/`HTTP_PROXY`; as a last resort set `PRISMA_ENGINES_MIRROR`. |
| `The database file is locked` on Windows | An old SQLite build is still running | The current app does not use SQLite. Pull the latest code, delete `prisma/dev.db` if present, and re-run `npm run setup`. |
| Hydration mismatch warnings | Locale-dependent date or number formatting, `Math.random`, or `Date.now()` in render | Format dates server-side with an explicit locale and time zone; pass formatted strings to the client; never generate random values during render. |
| Cookie not set, or login appears to succeed but the next page is anonymous | `Secure` cookie over plain HTTP, a different host (`127.0.0.1` vs `localhost`), or `NODE_ENV=production` on a local HTTP server | Use `http://localhost:3000` consistently; keep `NODE_ENV=development` for HTTP; clear cookies for the site and retry. |
| Redirected to your own portal instead of seeing a 403 | `requireRole` redirects a wrong-role session to that role's home | Expected. Sign in with an account that has the required role. |
| `@prisma/client did not initialize yet` | Client not generated after install or schema change | `npm run db:generate`, then restart the dev server and the TypeScript server. |
| `P1001: Can't reach database server` | Wrong host, Neon project suspended, or IP allowlist | Wake the Neon project, check the connection string and `sslmode=require`, confirm the host is the pooled endpoint for runtime. |
| `prepared statement "s0" already exists` | The pooled URL is missing the PgBouncer flag | Append `&pgbouncer=true` to `DATABASE_URL` in Vercel and redeploy. |
| `too many connections for role` | Runtime is using the direct URL, or `connection_limit` is too high for serverless | Use the pooled URL at runtime, keep `connection_limit=5`, and reserve `DIRECT_URL` for `db push` and the seed. |
| `P3005: The database schema is not empty` during a reset | A DDL command was run without `--force-reset` against an existing schema | For the disposable demo database, run `npm run db:reset` (drops and reseeds) or create a fresh Neon branch. |
| Build fails with "Dynamic server usage" | A page reading cookies was statically rendered | Add `export const dynamic = "force-dynamic"` to the portal layout; do not silence the warning. |
| Dev OTP is not shown | `DEV_SHOW_OTP` is not `"true"`, the account is already verified, or the page is rendering after the code expired | Set `DEV_SHOW_OTP="true"`, restart the server, use an unverified candidate, and request a new code. Codes live in the database, so a restart does not invalidate them. |
| Everything 500s after a deploy | Missing environment variable, wrong pooled URL, or a session secret shorter than 32 characters | Check the deploy log and the function log for the first error; verify every key in section 8.4 is set for the environment. Roll back first, diagnose second. |
| The unlock button returns a generic error but the profile is unlocked | Two submits raced; the unique `(employerId, candidateId)` constraint rejected the second charge | Reload the page. This is expected without an idempotency key; no credit was lost on the second request. |

Operating notes: exercise a schema change in a low-traffic window even with expand/contract; confirm
the nightly snapshot before any migration once backups exist; rotate `SESSION_SECRET` on schedule and
immediately on suspicion, expecting a global sign-out; point the uptime monitor at `/login` (there is
no `/api/health`); and record whatever command actually fixed an incident in this runbook.
