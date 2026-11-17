// POST /api/contact  { name, email, subject, message, website (honeypot), startedAt }
// Validates input, blocks spam, and emails the message to CONTACT_TO_EMAIL via Resend.
import { send, readJson, clientIp, rateLimiter } from "../lib/http.js";

const limited = rateLimiter({ max: 5, windowMs: 10 * 60_000 });
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

/** Backend validation (the frontend runs the same rules, but the server never trusts the browser). */
export function validate(input) {
  const errors = {};
  const str = (v) => (typeof v === "string" ? v.trim() : "");
  const data = {
    name: str(input.name),
    email: str(input.email).toLowerCase(),
    subject: str(input.subject),
    message: str(input.message),
  };

  if (data.name.length < 2 || data.name.length > 80) errors.name = "Name must be 2-80 characters.";
  if (!EMAIL_RE.test(data.email) || data.email.length > 254) errors.email = "Please enter a valid email address.";
  if (data.subject.length < 3 || data.subject.length > 120) errors.subject = "Subject must be 3-120 characters.";
  if (data.message.length < 10 || data.message.length > 5000) errors.message = "Message must be 10-5000 characters.";
  // header-injection guard: single-line fields may not contain line breaks
  for (const f of ["name", "email", "subject"]) if (/[\r\n]/.test(data[f])) errors[f] = "Line breaks are not allowed.";

  return { data, errors, ok: Object.keys(errors).length === 0 };
}

/** Basic spam checks: honeypot, too-fast submission, too many links. Returns a reason or null. */
export function spamReason(input, data, now = Date.now()) {
  if (typeof input.website === "string" && input.website.trim() !== "") return "honeypot";
  const started = Number(input.startedAt);
  if (!started || now - started < 3000) return "too-fast";
  const links = (data.message.match(/https?:\/\/|www\./gi) || []).length;
  if (links > 3) return "too-many-links";
  return null;
}

export const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Use POST." });
  if (limited(clientIp(req))) {
    return send(res, 429, { ok: false, error: "Too many messages. Please try again in a few minutes." });
  }

  let input;
  try {
    input = await readJson(req, 10_000);
  } catch (e) {
    return send(res, e.status || 400, { ok: false, error: e.message });
  }

  const { data, errors, ok } = validate(input);
  if (!ok) return send(res, 400, { ok: false, error: "Please fix the highlighted fields.", errors });

  const spam = spamReason(input, data);
  if (spam) {
    console.warn(`Contact form: blocked as spam (${spam}) from ${clientIp(req)}`);
    // pretend success so bots learn nothing
    return send(res, 200, { ok: true });
  }

  const html = `
    <h2>New message from your portfolio</h2>
    <p><b>Name:</b> ${escapeHtml(data.name)}<br>
       <b>Email:</b> ${escapeHtml(data.email)}<br>
       <b>Subject:</b> ${escapeHtml(data.subject)}</p>
    <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
    <hr><small>Sent ${new Date().toISOString()} from the portfolio contact form.</small>`;
  const text = `Name: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject}\n\n${data.message}`;

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!key || !to) {
    // Local development without keys: show the email in the terminal instead of sending it.
    console.log("\n===== CONTACT FORM (not sent: RESEND_API_KEY / CONTACT_TO_EMAIL missing) =====\n" + text + "\n=====\n");
    return send(res, 200, { ok: true, dev: true });
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "Portfolio Contact <onboarding@resend.dev>",
        to: [to],
        reply_to: data.email,
        subject: `[Portfolio] ${data.subject}`,
        html,
        text,
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error("Resend error:", r.status, detail);
      return send(res, 502, { ok: false, error: "Could not send your message right now. Please try again later." });
    }
    return send(res, 200, { ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return send(res, 500, { ok: false, error: "Could not send your message right now. Please try again later." });
  }
}
