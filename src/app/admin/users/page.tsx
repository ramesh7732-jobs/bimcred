import Link from "next/link";
import { requireRole } from "@/server/auth";
import { formatUsPhone } from "@/server/auth";
import { adminUsers } from "@/server/queries";
import {
  setCandidateVisibilityAction,
  setPhoneVerifiedAction,
} from "@/server/actions/admin";
import { formatDate } from "@/lib/format";
import {
  Empty,
  Flash,
  LocPill,
  PageHeader,
  SectionTitle,
  cn,
} from "@/components/ui";

export const metadata = { title: "Candidates & users" };

const ROLE_STYLES: Record<string, string> = {
  CANDIDATE: "badge-neutral",
  EMPLOYER: "badge-accent",
  ADMIN: "badge-dark",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; updated?: string; error?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const query = (sp.q ?? "").trim();
  const role = sp.role === "CANDIDATE" || sp.role === "EMPLOYER" || sp.role === "ADMIN" ? sp.role : "";

  const allUsers = await adminUsers(query);
  const users = role ? allUsers.filter((user) => user.role === role) : allUsers;

  const counts = {
    all: allUsers.length,
    candidates: allUsers.filter((user) => user.role === "CANDIDATE").length,
    employers: allUsers.filter((user) => user.role === "EMPLOYER").length,
    admins: allUsers.filter((user) => user.role === "ADMIN").length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Candidates & users"
        description="Inspect verification state, LOC score and visibility. Every manual change is audited against the admin who made it."
        actions={
          <Link href="/admin/employers" className="btn btn-ghost btn-sm">
            Employer accounts
          </Link>
        }
      />

      {sp.updated ? <Flash kind="ok" message="User record updated and written to the audit log." /> : null}
      {sp.error ? <Flash kind="error" message={sp.error} /> : null}

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-white p-3">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search name, email or phone"
          className="input h-10 flex-1 sm:min-w-[240px]"
        />
        <select name="role" defaultValue={role} className="select h-10 w-auto min-w-[140px]">
          <option value="">All roles</option>
          <option value="CANDIDATE">Candidates</option>
          <option value="EMPLOYER">Employers</option>
          <option value="ADMIN">Admins</option>
        </select>
        <button type="submit" className="btn btn-ink btn-sm h-10">
          Search
        </button>
        {query || role ? (
          <Link href="/admin/users" className="text-[11px] font-semibold text-ink/40 hover:text-ink">
            Reset
          </Link>
        ) : null}
        <span className="ml-auto text-[11px] text-ink/40">
          {counts.candidates} candidates · {counts.employers} employers · {counts.admins} admins
        </span>
      </form>

      <div className="mb-3 flex items-center gap-1 rounded-xl bg-ink/[0.05] p-1">
        {[
          { label: `All · ${counts.all}`, value: "" },
          { label: `Candidates · ${counts.candidates}`, value: "CANDIDATE" },
          { label: `Employers · ${counts.employers}`, value: "EMPLOYER" },
          { label: `Admins · ${counts.admins}`, value: "ADMIN" },
        ].map((tab) => (
          <Link
            key={tab.value || "all"}
            href={`/admin/users${tab.value ? `?role=${tab.value}` : ""}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition",
              role === tab.value ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {users.length === 0 ? (
        <Empty
          title="No users match that search"
          body="Try a different email fragment, remove the role filter, or confirm the account was created locally."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="scroll-thin overflow-x-auto">
            <table className="table-base min-w-[920px]">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>LOC / company</th>
                  <th>State</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <p className="text-[12.5px] font-semibold">{user.name}</p>
                      <p className="mt-0.5 text-[10.5px] text-ink/40">{user.email}</p>
                    </td>
                    <td>
                      <span className={cn("badge", ROLE_STYLES[user.role] ?? "badge-neutral")}>{user.role}</span>
                    </td>
                    <td>
                      <p className="font-mono text-[11px] tabular-nums text-ink/60">{formatUsPhone(user.phone)}</p>
                      <p className="mt-0.5 text-[10px]">
                        {user.phoneVerified ? (
                          <span className="font-semibold text-verify">Phone verified</span>
                        ) : (
                          <span className="text-ink/35">Unverified</span>
                        )}
                      </p>
                    </td>
                    <td>
                      {user.candidate ? (
                        <div>
                          <LocPill score={user.candidate.locScore} band={user.candidate.locBand} size="sm" />
                          <p className="mt-1 text-[10px] text-ink/40">
                            {user.candidate.visible ? "Visible in search" : "Hidden"}
                          </p>
                        </div>
                      ) : user.employer ? (
                        <div>
                          <p className="text-[11.5px] font-medium">{user.employer.companyName}</p>
                          <p className="mt-0.5 text-[10px]">
                            {user.employer.verified ? (
                              <span className="font-semibold text-verify">Verified</span>
                            ) : (
                              <span className="text-warn">Pending</span>
                            )}
                            {user.employer.subscription
                              ? ` · ${user.employer.subscription.plan} · ${user.employer.subscription.creditsRemaining} cr`
                              : ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-ink/35">No profile</span>
                      )}
                    </td>
                    <td>
                      <span className="text-[10.5px] text-ink/45">
                        {user.candidate
                          ? user.candidate.visible
                            ? "Discoverable"
                            : "Hidden by candidate/admin"
                          : user.employer
                            ? user.employer.verified
                              ? "Approved"
                              : "Awaiting approval"
                            : "—"}
                      </span>
                    </td>
                    <td className="text-[10.5px] text-ink/45">{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {user.candidate ? (
                          <>
                            <form action={setPhoneVerifiedAction}>
                              <input type="hidden" name="userId" value={user.id} />
                              <input type="hidden" name="verified" value={user.phoneVerified ? "false" : "true"} />
                              <button type="submit" className="btn btn-ghost btn-sm">
                                {user.phoneVerified ? "Unverify phone" : "Verify phone"}
                              </button>
                            </form>
                            <form action={setCandidateVisibilityAction}>
                              <input type="hidden" name="candidateId" value={user.candidate.id} />
                              <input type="hidden" name="visible" value={user.candidate.visible ? "false" : "true"} />
                              <button type="submit" className="btn btn-quiet btn-sm">
                                {user.candidate.visible ? "Hide" : "Restore"}
                              </button>
                            </form>
                          </>
                        ) : user.employer ? (
                          <Link href="/admin/employers" className="btn btn-ghost btn-sm">
                            Manage
                          </Link>
                        ) : (
                          <span className="text-[10px] text-ink/30">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6">
        <SectionTitle title="Role reference" hint="Access is enforced server-side in every layout and action" />
        <div className="card card-pad grid gap-4 sm:grid-cols-3">
          <div>
            <span className="badge badge-neutral">CANDIDATE</span>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink/55">
              Owns profile, phone verification, one assessment attempt and applications.
            </p>
          </div>
          <div>
            <span className="badge badge-accent">EMPLOYER</span>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink/55">
              Searches scored talent, spends credits on unlocks, posts roles and runs a pipeline.
            </p>
          </div>
          <div>
            <span className="badge badge-dark">ADMIN</span>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink/55">
              Verifies employers, assists candidates, grants credits and resolves moderation reports.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
