/** Outbound signup notification. Uses FormSubmit's free AJAX endpoint; no paid service. */

const DEFAULT_RECIPIENT = "ramesh@jobs2india.com";

type SignupNotice = {
  name: string;
  email: string;
  role: "CANDIDATE" | "EMPLOYER";
  companyName?: string;
};

export async function notifySignup({ name, email, role, companyName }: SignupNotice): Promise<void> {
  const recipient = process.env.SIGNUP_NOTIFY_EMAIL || DEFAULT_RECIPIENT;
  const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`;
  const roleLabel = role === "EMPLOYER" ? "Employer" : "Candidate";
  const message = [
    `A new ${roleLabel.toLowerCase()} signed up on BIMcred.`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Role: ${roleLabel}`,
    ...(companyName ? [`Company: ${companyName}`] : []),
    `Signed up: ${new Date().toISOString()}`,
  ].join("\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `BIMcred: new ${roleLabel.toLowerCase()} signup — ${name}`,
        _template: "table",
        name,
        email,
        role: roleLabel,
        ...(companyName ? { company: companyName } : {}),
        message,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Signup notification failed:", response.status, await response.text());
    }
  } catch (error) {
    // The signup must never fail because of an outbound email problem.
    console.error("Signup notification failed:", error);
  } finally {
    clearTimeout(timer);
  }
}
