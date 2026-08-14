/* ── invoiceDZ · envoi groupé (SERVEUR UNIQUEMENT) ───────────────────────
   Email / SMS / WhatsApp — chaque canal vérifie ses identifiants de
   fournisseur (variables d'environnement) avant tout envoi. Tant qu'aucun
   fournisseur n'est configuré, sendBulk() renvoie clairement "non
   configuré" pour chaque destinataire plutôt que d'échouer silencieusement
   ou de simuler un envoi. Brancher un vrai fournisseur (Brevo, Twilio, …)
   ne demande de modifier que dispatchOne() ci-dessous. */

export function emailConfigured() {
  return !!process.env.BREVO_API_KEY;
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

async function dispatchOne(channel, recipient, { subject, body }) {
  const message = renderTemplate(body, recipient);
  const renderedSubject = subject ? renderTemplate(subject, recipient) : undefined;

  if (channel === "email") {
    if (!emailConfigured()) return { ok: false, reason: "NOT_CONFIGURED" };
    if (!recipient.email) return { ok: false, reason: "NO_CONTACT" };
    // TODO brancher un fournisseur (ex. Brevo POST /v3/smtp/email avec BREVO_API_KEY).
    return { ok: false, reason: "NOT_CONFIGURED" };
  }

  if (channel === "sms") {
    if (!smsConfigured()) return { ok: false, reason: "NOT_CONFIGURED" };
    if (!recipient.telephone) return { ok: false, reason: "NO_CONTACT" };
    // TODO brancher un fournisseur (ex. Brevo POST /v3/transactionalSMS/sms).
    return { ok: false, reason: "NOT_CONFIGURED" };
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
  const results = { sent: 0, skippedNoContact: 0, skippedNotConfigured: 0, failed: 0, total: recipients.length };
  for (const r of recipients) {
    const res = await dispatchOne(channel, r, { subject, body });
    if (res.ok) results.sent++;
    else if (res.reason === "NOT_CONFIGURED") results.skippedNotConfigured++;
    else if (res.reason === "NO_CONTACT") results.skippedNoContact++;
    else results.failed++;
  }
  return results;
}
