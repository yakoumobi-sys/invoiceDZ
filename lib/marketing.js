/* ── invoiceDZ · envoi groupé (SERVEUR UNIQUEMENT) ───────────────────────
   Email / SMS via Brevo. WhatsApp reste non branché (voir plus bas) —
   chaque canal vérifie ses identifiants de fournisseur (variables
   d'environnement) avant tout envoi et renvoie clairement "non configuré"
   plutôt que d'échouer silencieusement ou de simuler un envoi. */

const BREVO_API_URL = "https://api.brevo.com/v3";

function brevoSenderEmail() { return process.env.BREVO_SENDER_EMAIL || ""; }
function brevoSenderName() { return process.env.BREVO_SENDER_NAME || "invoicedz"; }
function brevoSmsSender() { return process.env.BREVO_SMS_SENDER || "invoicedz"; }

export function emailConfigured() {
  return !!process.env.BREVO_API_KEY && !!brevoSenderEmail();
}
export function smsConfigured() {
  return !!process.env.BREVO_API_KEY;
}
export function whatsappConfigured() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
}

export function channelConfigured(channel) {
  if (channel === "email") return emailConfigured();
  if (channel === "sms") return smsConfigured();
  if (channel === "whatsapp") return whatsappConfigured();
  return false;
}

/* Remplace {prenom}, {nom}, {entreprise} dans un gabarit par les valeurs du destinataire. */
export function renderTemplate(template, recipient) {
  return (template || "")
    .replace(/\{prenom\}/gi, recipient.prenom || "")
    .replace(/\{nom\}/gi, recipient.nom || "")
    .replace(/\{entreprise\}/gi, recipient.entreprise || "");
}

/* Numéro algérien local ou international -> E.164 ("+213…"). */
function toE164(phone) {
  let d = (phone || "").replace(/[^\d+]/g, "");
  if (!d) return null;
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "213" + d.slice(1);
  return "+" + d;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;")
    .replace(/\n/g, "<br>");
}

async function sendBrevoEmail(recipient, subject, message) {
  try {
    const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        sender: { name: brevoSenderName(), email: brevoSenderEmail() },
        to: [{ email: recipient.email, name: [recipient.prenom, recipient.nom].filter(Boolean).join(" ") || undefined }],
        subject: subject || "invoicedz",
        htmlContent: `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#13251E;">${escapeHtml(message)}</div>`,
        textContent: message,
      }),
    });
    if (res.ok) return { ok: true };
    const errBody = await res.json().catch(() => ({}));
    return { ok: false, reason: "PROVIDER_ERROR", detail: errBody.message || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, reason: "PROVIDER_ERROR", detail: e.message };
  }
}

async function sendBrevoSms(recipient, message) {
  const phone = toE164(recipient.telephone);
  if (!phone) return { ok: false, reason: "NO_CONTACT" };
  try {
    const res = await fetch(`${BREVO_API_URL}/transactionalSMS/sms`, {
      method: "POST",
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ sender: brevoSmsSender(), recipient: phone, content: message, type: "transactional" }),
    });
    if (res.ok) return { ok: true };
    const errBody = await res.json().catch(() => ({}));
    return { ok: false, reason: "PROVIDER_ERROR", detail: errBody.message || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, reason: "PROVIDER_ERROR", detail: e.message };
  }
}

async function dispatchOne(channel, recipient, { subject, body }) {
  const message = renderTemplate(body, recipient);
  const renderedSubject = subject ? renderTemplate(subject, recipient) : undefined;

  if (channel === "email") {
    if (!emailConfigured()) return { ok: false, reason: "NOT_CONFIGURED" };
    if (!recipient.email) return { ok: false, reason: "NO_CONTACT" };
    return sendBrevoEmail(recipient, renderedSubject, message);
  }

  if (channel === "sms") {
    if (!smsConfigured()) return { ok: false, reason: "NOT_CONFIGURED" };
    if (!recipient.telephone) return { ok: false, reason: "NO_CONTACT" };
    return sendBrevoSms(recipient, message);
  }

  if (channel === "whatsapp") {
    if (!whatsappConfigured()) return { ok: false, reason: "NOT_CONFIGURED" };
    if (!recipient.telephone) return { ok: false, reason: "NO_CONTACT" };
    // TODO brancher Twilio WhatsApp Business API. Rappel : hors fenêtre de
    // 24h suivant un message du client, seuls des modèles pré-approuvés
    // par Meta peuvent être envoyés — un message libre échouera.
    return { ok: false, reason: "NOT_CONFIGURED" };
  }

  return { ok: false, reason: "UNKNOWN_CHANNEL" };
}

/* recipients: [{ id, email, telephone, prenom, nom, entreprise }]. */
export async function sendBulk(channel, recipients, { subject, body }) {
  const results = { sent: 0, skippedNoContact: 0, skippedNotConfigured: 0, failed: 0, total: recipients.length, errors: [] };
  for (const r of recipients) {
    const res = await dispatchOne(channel, r, { subject, body });
    if (res.ok) results.sent++;
    else if (res.reason === "NOT_CONFIGURED") results.skippedNotConfigured++;
    else if (res.reason === "NO_CONTACT") results.skippedNoContact++;
    else {
      results.failed++;
      if (res.detail && results.errors.length < 3 && !results.errors.includes(res.detail)) results.errors.push(res.detail);
    }
  }
  return results;
}
