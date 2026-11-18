import Link from "next/link";
import { requireRole } from "@/server/auth";
import { auditEntityOptions, recentAudit } from "@/server/queries";
import { formatDate, timeAgo } from "@/lib/format";
import {
  Empty,
  PageHeader,
  SectionTitle,
  Stat,
  cn,
} from "@/components/ui";

export const metadata = { title: "Audit log" };

function actionLabel(action: string): string {
  return action
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .join(" · ");
}

function metaSummary(meta: string): string {
  if (!meta || meta === "{}") return "No metadata";
  try {
    const parsed = JSON.parse(meta) as Record<string, unknown>;
    return Object.entries(parsed)
      .map(([key, value]) => {
        const rendered =
          typeof value === "string"
            ? value
            : typeof value === "number" || typeof value === "boolean"
              ? String(value)
              : JSON.stringify(value);
        return `${key}: ${rendered}`;
      })
      .join(" · ");
  } catch {
    return meta;
  }
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const entity = typeof sp.entity === "string" ? sp.entity : "";

  const [entries, entities] = await Promise.all([recentAudit(100, entity || undefined), auditEntityOptions()]);

  const actors = new Set(entries.map((entry) => entry.actorId ?? "system"));
  const last24h = entries.filter((entry) => Date.now() - entry.createdAt.getTime() < 86_400_000).length;

  return (
    <>
      <PageHeader
        eyebrow="Security"
        title="Audit log"
        description="Append-only record of logins, unlocks, verification changes, credits and assessment events. Metadata never contains passwords or raw OTPs."
        actions={
          <Link href="/admin" className="btn btn-ghost btn-sm">
            Operations overview
          </Link>
        }
      />

      <div className="metric-grid mb-5">
        <Stat label="Events shown" value={entries.length} hint={entity ? `Filtered to ${entity}` : "Most recent 100"} />
        <Stat label="Entities" value={entities.length} hint="Distinct model types" />
        <Stat label="Actors" value={actors.size} hint="Users plus system" tone="accent" />
        <Stat label="Last 24 hours" value={last24h} hint="Recent activity" tone={last24h ? "verify" : "ink"} />
      </div>

      <form method="get" className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-white p-3">
        <select name="entity" defaultValue={entity} className="select h-10 w-auto min-w-[200px] flex-1">
          <option value="">All entities</option>
          {entities.map((option) => (
            <option key={option.entity} value={option.entity}>
              {option.entity} · {option._count._all}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-ink btn-sm h-10">
          Filter
        </button>
        {entity ? (
          <Link href="/admin/audit" className="text-[11px] font-semibold text-ink/40 hover:text-ink">
            Clear
          </Link>
        ) : null}
        <span className="ml-auto text-[11px] text-ink/40">Newest first</span>
      </form>

      {entries.length === 0 ? (
        <Empty
          title="No audit entries match"
          body="Clear the entity filter or perform an action such as approving an employer or unlocking a candidate."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="scroll-thin overflow-x-auto">
            <table className="table-base min-w-[980px]">
              <thead>
                <tr>
                  <th className="w-[88px]">When</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <p className="text-[11px] font-medium text-ink/60">{timeAgo(entry.createdAt)}</p>
                      <p className="mt-0.5 font-mono text-[9.5px] text-ink/30">{formatDate(entry.createdAt)}</p>
                    </td>
                    <td>
                      <span className="inline-flex rounded-md bg-ink/[0.05] px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-ink/70">
                        {entry.action}
                      </span>
                      <p className="mt-1 text-[10.5px] text-ink/40">{actionLabel(entry.action)}</p>
                    </td>
                    <td>
                      {entry.actor ? (
                        <>
                          <p className="text-[11.5px] font-medium">{entry.actor.name}</p>
                          <p className="mt-0.5 text-[10px] text-ink/40">
                            {entry.actor.email} ·{" "}
                            <span className="uppercase tracking-[0.04em]">{entry.actor.role}</span>
                          </p>
                        </>
                      ) : (
                        <span className="badge badge-neutral">System</span>
                      )}
                    </td>
                    <td>
                      <p className="text-[11.5px] text-ink/65">{entry.entity}</p>
                      <p className="mt-0.5 max-w-[160px] truncate font-mono text-[9.5px] text-ink/30">
                        {entry.entityId ?? "—"}
                      </p>
                    </td>
                    <td>
                      <p className="max-w-[360px] break-words font-mono text-[10px] leading-relaxed text-ink/45">
                        {metaSummary(entry.meta)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6">
        <SectionTitle title="Retention & access" hint="Prototype posture" />
        <div className="card card-pad grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/40">Append-only</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/55">
              The app never updates or deletes audit rows. Account deletion sets the actor to null so
              history survives.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/40">Sensitive data</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/55">
              Metadata stores counts, plan keys and enum values — never passwords, raw OTPs, full phone
              numbers or candidate notes.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/40">Production</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/55">
              Ship entries to immutable object storage, add retention schedules and alert on failed
              login bursts.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
