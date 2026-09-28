/**
 * Outbound email.
 *
 * There is no mail library here on purpose. `deliver` below is the only place
 * that talks to a provider, so swapping Resend for SES, Postmark or an SMTP
 * relay means rewriting one function rather than threading a new SDK through
 * the app.
 *
 * With no provider configured, mail is written to the server log instead of
 * being dropped. A reset link that only appears in the console is still a
 * working reset link in development, and it makes the absence obvious rather
 * than silent.
 */

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

const FROM = process.env.MAIL_FROM ?? "TasteUrKnowledge <onboarding@resend.dev>";

/**
 * Hands the message to whatever provider is configured.
 *
 * Returns false when nothing was actually sent, so callers can log it - but
 * never surfaces that to the person who asked, since "no mail was sent"
 * reveals whether an address is on file.
 */
async function deliver(mail: Mail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      [
        "",
        "─".repeat(72),
        "  EMAIL NOT SENT - no RESEND_API_KEY set. Message below.",
        "─".repeat(72),
        `  To:      ${mail.to}`,
        `  Subject: ${mail.subject}`,
        "",
        mail.text.replace(/^/gm, "  "),
        "─".repeat(72),
        "",
      ].join("\n")
    );
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
      }),
    });

    if (!response.ok) {
      console.error("Email provider rejected the message:", await response.text());
      return false;
    }
    return true;
  } catch (error) {
    // A mail outage must not turn into a 500 on a login screen.
    console.error("Failed to send email:", error);
    return false;
  }
}

/** The reset link email. Plain text, because that is all it needs to be. */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
  validMinutes: number
): Promise<boolean> {
  return deliver({
    to,
    subject: "Reset your TasteUrKnowledge password",
    text: [
      `Hello ${name},`,
      "",
      "Somebody asked to reset the password for your TasteUrKnowledge account.",
      "Open the link below to choose a new one:",
      "",
      resetUrl,
      "",
      `This link works once and expires in ${validMinutes} minutes.`,
      "",
      "If this was not you, ignore this email. Your password has not changed,",
      "and nobody can get into your account with this message alone.",
      "",
      "TasteUrKnowledge",
    ].join("\n"),
  });
}
