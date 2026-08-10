"use client";
/* ── invoiceDZ · partage & export ────────────────────────────────────────
   Aucune dépendance backend : liens WhatsApp/email pré-remplis (le client
   choisit son application) et export CSV généré côté navigateur. */
import { DOC_TYPES, STATUTS } from "./constants.js";
import { calcTotaux, fmtDA } from "./facture.mjs";

const fmtDateFr = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

/* Normalise un numéro algérien (0555 12 34 56, +213555…, 00213555…) en indicatif international sans + */
function waDigits(phone) {
  let d = (phone || "").replace(/[^\d+]/g, "");
  if (!d) return "";
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "213" + d.slice(1);
  return d;
}

export function waLink(phone, message) {
  const d = waDigits(phone);
  if (!d) return null;
  return `https://wa.me/${d}?text=${encodeURIComponent(message)}`;
}

export function mailLink(email, subject, body) {
  if (!(email || "").trim()) return null;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* Message de relance / envoi pré-rempli pour un document */
export function messageDocument(doc, entrepriseNom) {
  const t = calcTotaux(doc);
  const ti = DOC_TYPES[doc.type] || DOC_TYPES.FACTURE;
  const showPrix = doc.type !== "BON_LIVRAISON";
  const civ = doc.client?.nom ? `Bonjour ${doc.client.nom},` : "Bonjour,";
  let corps = `${civ}\n\nVeuillez trouver ci-joint votre ${ti.label.toLowerCase()} n° ${doc.numero}`;
  if (showPrix) corps += ` d'un montant de ${fmtDA(t.net)}`;
  if (showPrix && doc.dateEcheance) corps += `, à régler avant le ${fmtDateFr(doc.dateEcheance)}`;
  corps += `.\n\nMerci${entrepriseNom ? " — " + entrepriseNom : ""}.`;
  return { subject: `${ti.label} ${doc.numero}`, body: corps };
}

/* ── Export CSV (documents) ── */
function esc(v) {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function csvDocs(docs) {
  const header = ["Numéro", "Type", "Statut", "Client", "Date", "Échéance", "Net à payer (DA)", "Solde restant (DA)"];
  const rows = docs.map((d) => {
    const t = calcTotaux(d);
    const showPrix = d.type !== "BON_LIVRAISON";
    return [
      d.numero || "",
      (DOC_TYPES[d.type] || {}).label || d.type,
      (STATUTS[d.statut] || {}).label || d.statut,
      d.client?.nom || "",
      fmtDateFr(d.date),
      fmtDateFr(d.dateEcheance),
      showPrix ? t.net.toFixed(2) : "",
      showPrix ? Math.max(0, t.solde).toFixed(2) : "",
    ];
  });
  return [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
}

export function csvClients(clients) {
  const header = ["Nom", "Téléphone", "Email", "Adresse", "Ville", "NIF", "RC"];
  const rows = clients.map((c) => [c.nom || "", c.telephone || "", c.email || "", c.adresse || "", c.ville || "", c.nif || "", c.rc || ""]);
  return [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
}

export function csvProduits(produits) {
  const header = ["Désignation", "Unité", "Prix unitaire HT (DA)", "TVA (%)"];
  const rows = produits.map((p) => [p.designation || "", p.unite || "", (+p.prixUnitaire || 0).toFixed(2), p.tva ?? 19]);
  return [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
}

export function downloadTextFile(filename, content, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob(["﻿" + content], { type: mime }); // BOM : accents lisibles dans Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
