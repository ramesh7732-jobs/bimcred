import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import {
  hasActiveFilters,
  loadEmployerContext,
  parseTalentFilters,
  searchTalent,
  talentPoolStats,
  unlockedCandidateIds,
} from "@/server/queries";
import { planFor } from "@/lib/pricing";
import { AVAILABILITY, DISCIPLINES, SOFTWARE, labelFor, parseCsv } from "@/lib/profile";
import {
  Avatar,
  Empty,
  Flash,
  LocMeter,
  LocPill,
  PageHeader,
  SectionTitle,
  cn,
} from "@/components/ui";

export const metadata = { title: "Talent search" };

function redactName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last[0].toUpperCase()}.`;
}

export default async function TalentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole("EMPLOYER");
  const ctx = await loadEmployerContext(session.uid);
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const filters = parseTalentFilters(sp);
  const plan = planFor(ctx.subscription?.plan ?? "TRIAL");
  const canFilter = plan.searchFilters;
  const view = typeof sp.view === "string" ? sp.view : "all";
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const filtered = hasActiveFilters(filters);
  const effective = canFilter ? filters : parseTalentFilters({});

  const [rows, unlockedIds, pool] = await Promise.all([
    searchTalent(effective),
    unlockedCandidateIds(ctx.employer.id),
    talentPoolStats(),
  ]);

  const results = view === "shortlist" ? rows.filter((row) => unlockedIds.has(row.id)) : rows;
  const visibleRows = view === "shortlist" ? rows.filter((row) => unlockedIds.has(row.id)) : results;

  return (
    <>
      <PageHeader
        eyebrow="Verified pool"
        title="Talent search"
        description="Filtering and previews are free. Contact details are revealed per candidate for one credit, and repeat views stay free."
        actions={
          <span className="badge badge-verify">
            {ctx.subscription?.creditsRemaining ?? 0} credits available
          </span>
        }
      />

      {error ? <Flash kind="error" message={error} /> : null}

      {!canFilter ? (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-warn/30 bg-warn-soft/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-relaxed text-ink/65">
            <span className="font-semibold">Filters are a Starter feature.</span> Your {plan.name} plan can
            browse the full pool, but search filters are disabled. Upgrading also adds seats and job
            posts.
          </p>
          <Link href="/employer/billing" className="btn btn-ink btn-sm shrink-0">
            View plans
          </Link>
        </div>
      ) : filtered ? (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-ink/[0.035] px-4 py-2.5">
          <p className="text-[11.5px] text-ink/55">
            Filters applied. <span className="font-semibold text-ink">{visibleRows.length}</span> candidates match.
          </p>
          <Link href="/employer/talent" className="text-[11px] font-semibold text-accent-dark">
            Clear all
          </Link>
        </div>
      ) : null}

      <form method="get" className="card mb-5 p-4">
        {view === "shortlist" ? <input type="hidden" name="view" value="shortlist" /> : null}
        <fieldset disabled={!canFilter} className={cn(!canFilter && "opacity-50")}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="q">
                Keyword
              </label>
              <input
                id="q"
                name="q"
                defaultValue={filters.q}
                placeholder="Headline, title or bio"
                className="input h-10"
              />
            </div>
            <div>
              <label className="label" htmlFor="band">
                LOC band
              </label>
              <select id="band" name="band" defaultValue={filters.band} className="select h-10">
                <option value="">Any band</option>
                <option value="emerging">Emerging (100–199)</option>
                <option value="developing">Developing (200–299)</option>
                <option value="competent">Competent (300–399)</option>
                <option value="proficient">Proficient (400–449)</option>
                <option value="expert">Expert (450–500)</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="minLoc">
                Min LOC
              </label>
              <input
                id="minLoc"
                name="minLoc"
                type="number"
                min={100}
                max={500}
                step={10}
                defaultValue={filters.minLoc || ""}
                placeholder="300"
                className="input h-10"
              />
            </div>
            <div>
              <label className="label" htmlFor="discipline">
                Discipline
              </label>
              <select id="discipline" name="discipline" defaultValue={filters.discipline} className="select h-10">
                <option value="">Any discipline</option>
                {DISCIPLINES.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="software">
                Software
              </label>
              <select id="software" name="software" defaultValue={filters.software} className="select h-10">
                <option value="">Any tool</option>
                {SOFTWARE.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                name="location"
                defaultValue={filters.location}
                placeholder="Austin"
                className="input h-10"
              />
            </div>
            <div>
              <label className="label" htmlFor="minYears">
                Min years
              </label>
              <input
                id="minYears"
                name="minYears"
                type="number"
                min={0}
                max={30}
                defaultValue={filters.minYears || ""}
                placeholder="3"
                className="input h-10"
              />
            </div>
            <div>
              <label className="label" htmlFor="availability">
                Availability
              </label>
              <select id="availability" name="availability" defaultValue={filters.availability} className="select h-10">
                <option value="">Any</option>
                {AVAILABILITY.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex h-10 items-center gap-2 self-end rounded-xl border border-ink/15 bg-white px-3 text-[12px] font-medium text-ink/60">
              <input type="checkbox" name="remote" value="1" defaultChecked={filters.remoteOnly} className="accent-[#ED5B26]" />
              Remote only
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button type="submit" className="btn btn-ink btn-sm" disabled={!canFilter}>
              Apply filters
            </button>
            <span className="text-[11px] text-ink/40">
              {pool.scored} scored candidates in the pool
            </span>
          </div>
        </fieldset>
      </form>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-xl bg-ink/[0.05] p-1">
          <Link
            href="/employer/talent"
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition",
              view === "all" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink",
            )}
          >
            All talent
          </Link>
          <Link
            href="/employer/talent?view=shortlist"
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition",
              view === "shortlist" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink",
            )}
          >
            My shortlist · {unlockedIds.size}
          </Link>
        </div>
        <p className="text-[11px] text-ink/40">
          {visibleRows.length} result{visibleRows.length === 1 ? "" : "s"} · sorted by LOC
        </p>
      </div>

      {visibleRows.length === 0 ? (
        view === "shortlist" ? (
          <Empty
            title="Your shortlist is empty"
            body="Unlock a candidate to add them here. Unlocks persist, so this list is your permanent shortlist and re-opening is free."
            action={
              <Link href="/employer/talent" className="btn btn-ghost btn-sm">
                Back to search
              </Link>
            }
          />
        ) : (
          <Empty
            title="No candidates match those filters"
            body="Try lowering the LOC floor, widening the discipline, or clearing the keyword. The pool grows as candidates finish their assessments."
            action={
              <Link href="/employer/talent" className="btn btn-ghost btn-sm">
                Clear filters
              </Link>
            }
          />
        )
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visibleRows.map((candidate) => {
            const unlocked = unlockedIds.has(candidate.id);
            return (
              <article key={candidate.id} className="card card-hover flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={candidate.user.name} size={38} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[13.5px] font-semibold">
                          {unlocked ? candidate.user.name : redactName(candidate.user.name)}
                        </p>
                        {candidate.user.phoneVerified ? (
                          <span className="badge badge-verify px-1.5 py-0.5 text-[9px]">Verified</span>
                        ) : null}
                      </div>
                      <p className="truncate text-[11.5px] text-ink/50">
                        {candidate.headline || candidate.currentTitle || "BIM professional"}
                      </p>
                    </div>
                  </div>
                  <LocPill score={candidate.locScore} band={candidate.locBand} />
                </div>

                <div className="mt-3.5">
                  <LocMeter score={candidate.locScore} />
                  <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-ink/40">
                    <span>{candidate.locBand}</span>
                    <span>
                      {candidate.location || "US"} · {candidate.yearsExperience} yr
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {parseCsv(candidate.disciplines).slice(0, 2).map((key) => (
                    <span key={key} className="badge badge-neutral">
                      {labelFor(DISCIPLINES, key)}
                    </span>
                  ))}
                  {parseCsv(candidate.software).slice(0, 2).map((key) => (
                    <span key={key} className="badge bg-ink/[0.03] text-ink/50">
                      {labelFor(SOFTWARE, key)}
                    </span>
                  ))}
                  {candidate.remoteOk ? <span className="badge bg-ink/[0.03] text-ink/50">Remote ok</span> : null}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-ink/[0.06] pt-3.5">
                  <span className="text-[11px] text-ink/40">
                    {unlocked ? "Contact unlocked · free to reopen" : "Contact hidden · 1 credit"}
                  </span>
                  <Link
                    href={`/employer/talent/${candidate.id}`}
                    className={cn("btn btn-sm", unlocked ? "btn-ghost" : "btn-primary")}
                  >
                    {unlocked ? "Open profile" : "View & unlock"}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {view === "shortlist" && visibleRows.length > 1 ? (
        <div className="mt-6 card overflow-hidden">
          <div className="border-b border-ink/[0.07] px-5 py-3.5">
            <SectionTitle title="Compare shortlist" hint="Side by side, no additional credits" />
          </div>
          <div className="scroll-thin overflow-x-auto">
            <table className="table-base min-w-[720px]">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>LOC</th>
                  <th>Band</th>
                  <th>Experience</th>
                  <th>Disciplines</th>
                  <th>Tools</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.slice(0, 5).map((candidate) => (
                  <tr key={candidate.id}>
                    <td className="font-medium">{candidate.user.name}</td>
                    <td className="font-mono tabular-nums">{candidate.locScore}</td>
                    <td>{candidate.locBand}</td>
                    <td className="font-mono tabular-nums">{candidate.yearsExperience} yr</td>
                    <td className="text-[12px] text-ink/60">
                      {parseCsv(candidate.disciplines).map((key) => labelFor(DISCIPLINES, key)).join(", ")}
                    </td>
                    <td className="text-[12px] text-ink/60">
                      {parseCsv(candidate.software).slice(0, 3).map((key) => labelFor(SOFTWARE, key)).join(", ")}
                    </td>
                    <td className="text-[12px] text-ink/60">{candidate.location || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
}
