"use client";

export type DemoAccount = {
  role: string;
  email: string;
  password: string;
  detail: string;
};

function setInputValue(id: string, value: string) {
  const input = document.getElementById(id);
  if (!(input instanceof HTMLInputElement)) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Shows the seeded demo credentials and fills the sign-in form without submitting it. */
export function DemoAccountList({ accounts }: { accounts: DemoAccount[] }) {
  function fill(account: DemoAccount) {
    setInputValue("email", account.email);
    setInputValue("password", account.password);
    const email = document.getElementById("email");
    if (email instanceof HTMLInputElement) email.focus();
  }

  return (
    <div className="mt-3 grid gap-2">
      {accounts.map((demo) => (
        <div
          key={demo.role}
          className="rounded-xl border border-ink/10 bg-white px-3 py-2"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="block text-[12.5px] font-semibold text-ink">
                {demo.role}
              </span>
              <span className="block text-[11px] text-ink/45">{demo.detail}</span>
            </div>
            <button
              type="button"
              onClick={() => fill(demo)}
              className="btn btn-ghost btn-sm shrink-0"
            >
              Fill
            </button>
          </div>
          <dl className="mt-2 border-t border-ink/5 pt-2 text-[11px]">
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-ink/40">Email</dt>
              <dd className="break-all font-mono text-ink/70">{demo.email}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}
