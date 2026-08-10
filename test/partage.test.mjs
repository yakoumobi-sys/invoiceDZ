/* Tests unitaires des fonctions pures de lib/partage.js (liens WhatsApp/email, CSV) */
import { waLink, mailLink, messageDocument, csvDocs, csvClients, csvProduits } from "../lib/partage.js";

let n = 0, bad = 0;
const ok = (cond, label, extra) => {
  n++;
  if (cond) console.log("  ok -", label);
  else { bad++; console.error("  FAIL -", label, extra ?? ""); }
};

/* ---- waLink : normalisation des numéros algériens ---- */
ok(waLink("0555123456", "test") === "https://wa.me/213555123456?text=test", "waLink : 0X local -> 213X international");
ok(waLink("+213555123456", "test") === "https://wa.me/213555123456?text=test", "waLink : +213 déjà international");
ok(waLink("00213555123456", "test") === "https://wa.me/213555123456?text=test", "waLink : 00213 -> 213");
ok(waLink("", "test") === null, "waLink : numéro vide -> null");
ok(waLink(undefined, "test") === null, "waLink : numéro absent -> null");
ok(decodeURIComponent(waLink("0555123456", "Bonjour, ça va ?").split("text=")[1]) === "Bonjour, ça va ?", "waLink : message encodé correctement");

/* ---- mailLink ---- */
ok(mailLink("client@test.dz", "Sujet", "Corps") === "mailto:client@test.dz?subject=Sujet&body=Corps", "mailLink : format de base");
ok(mailLink("", "Sujet", "Corps") === null, "mailLink : email vide -> null");
ok(mailLink(undefined, "Sujet", "Corps") === null, "mailLink : email absent -> null");

/* ---- messageDocument ---- */
const doc = {
  type: "FACTURE", numero: "FAC-2026-0099", statut: "ENVOYE", date: "2026-06-01", dateEcheance: "2026-06-15",
  client: { nom: "SARL Retard", email: "client@test.dz", telephone: "0555123456" },
  lignes: [{ quantite: 1, prixUnitaire: 10000, remise: 0, tva: 19 }],
  tvaActive: true, remiseGlobale: 0, modePaiement: "VIREMENT", paiements: [],
};
const msg = messageDocument(doc);
ok(msg.subject === "Facture FAC-2026-0099", "messageDocument : sujet", msg.subject);
ok(msg.body.includes("SARL Retard"), "messageDocument : nom du client dans le corps");
ok(msg.body.includes("FAC-2026-0099"), "messageDocument : numéro dans le corps");
ok(/11[\s  ]?900,00 DA/.test(msg.body), "messageDocument : montant TTC dans le corps", msg.body);
ok(msg.body.includes("15/06/2026"), "messageDocument : échéance formatée jj/mm/aaaa", msg.body);

const bl = { type: "BON_LIVRAISON", numero: "BL-2026-0001", client: { nom: "Client BL" }, lignes: [] };
const msgBl = messageDocument(bl);
ok(!msgBl.body.includes("DA"), "messageDocument : pas de montant pour un bon de livraison", msgBl.body);

/* ---- csvDocs / csvClients / csvProduits ---- */
const csv = csvDocs([doc]);
ok(csv.startsWith("Numéro;Type;Statut;Client;Date;Échéance;Net à payer (DA);Solde restant (DA)"), "csvDocs : en-tête");
ok(csv.includes("FAC-2026-0099"), "csvDocs : ligne du document");
ok(csv.includes("SARL Retard"), "csvDocs : nom client");

const csvC = csvClients([{ nom: "Client; avec virgule, et guillemet \"x\"", telephone: "0555", email: "a@b.dz", adresse: "", ville: "Alger", nif: "", rc: "" }]);
ok(csvC.includes('"Client; avec virgule, et guillemet ""x"""'), "csvClients : échappement CSV correct", csvC);

const csvP = csvProduits([{ designation: "Broderie", unite: "Pièce", prixUnitaire: 350, tva: 19 }]);
ok(csvP.includes("Broderie;Pièce;350.00;19"), "csvProduits : ligne produit", csvP);

console.log(bad ? `\n${bad}/${n} FAILED` : `\n${n} tests passed`);
if (bad) process.exit(1);
