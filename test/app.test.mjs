/* Tests d'intégration hors-ligne :
   1) couche données en mode invité (localStorage via jsdom)
   2) rendu du document A4 (DocPreview → HTML) */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
try { Object.defineProperty(global, "navigator", { value: dom.window.navigator, configurable: true }); } catch {}

let n = 0, bad = 0;
const ok = (cond, label, extra) => {
  n++;
  if (cond) console.log("  ok -", label);
  else { bad++; console.error("  FAIL -", label, extra ?? ""); }
};

/* ── 1) db.js en mode invité ── */
const db = await import("../lib/db.js");

const d1 = await db.saveDoc(null, { type: "FACTURE", numero: "FAC-2026-0001", statut: "BROUILLON", date: "2026-07-26", client: { nom: "SARL Alpha" }, lignes: [{ id: "a", quantite: 2, prixUnitaire: 1000, remise: 0, tva: 19 }], tvaActive: true, modePaiement: "ESPECES", paiements: [] });
ok(d1.id && d1.id.startsWith("L"), "saveDoc invité → id local", d1.id);

const d2 = await db.saveDoc(null, { type: "DEVIS", numero: "DEV-2026-0001", statut: "ENVOYE", date: "2026-07-26", client: { nom: "EURL Beta" }, lignes: [] });
let all = await db.listDocs(null);
ok(all.length === 2, "listDocs invité → 2 documents", all.length);
ok(all[0].id === d2.id, "tri : plus récent en premier");

const got = await db.getDoc(null, d1.id);
ok(got && got.client.nom === "SARL Alpha", "getDoc invité");

got.statut = "PAYE";
await db.saveDoc(null, got);
const got2 = await db.getDoc(null, d1.id);
ok(got2.statut === "PAYE", "saveDoc met à jour (statut)");
ok((await db.listDocs(null)).length === 2, "mise à jour sans doublon");

await db.deleteDoc(null, d2.id);
ok((await db.listDocs(null)).length === 1, "deleteDoc invité");

const c1 = await db.saveClient(null, { nom: "SARL Alpha", ville: "Alger", telephone: "0555", notes: "" });
ok(c1.id && c1.id.startsWith("L"), "saveClient invité");
await db.saveClient(null, { ...c1, ville: "Oran" });
const cs = await db.listClients(null);
ok(cs.length === 1 && cs[0].ville === "Oran", "édition client sans doublon", JSON.stringify(cs));
 
const p1 = await db.saveProduit(null, { designation: "Broderie logo", unite: "Pièce", prixUnitaire: 350, tva: 19 });
ok((await db.listProduits(null)).length === 1 && p1.id, "saveProduit invité");
await db.deleteProduit(null, p1.id);
ok((await db.listProduits(null)).length === 0, "deleteProduit invité");

await db.saveProfil(null, { entreprise: { nom: "Djimmy Prints", ville: "Alger" }, logo: null, prefs: { modePaiement: "ESPECES" } });
const prof = await db.getProfil(null);
ok(prof.entreprise.nom === "Djimmy Prints" && prof.prefs.modePaiement === "ESPECES", "profil invité enregistré/rechargé");

ok(db.countLocalDocs() === 1, "countLocalDocs");

/* ── 2) DocPreview → HTML ── */
const React = (await import("react")).default;
const { renderToStaticMarkup } = await import("react-dom/server");
const esbuild = await import("esbuild");
await esbuild.build({
  entryPoints: [new URL("../components/DocPreview.jsx", import.meta.url).pathname],
  bundle: true, format: "esm", jsx: "automatic",
  external: ["react", "react/jsx-runtime"],
  outfile: "test/.docpreview.bundle.mjs",
  logLevel: "silent",
});
const DocPreview = (await import("./.docpreview.bundle.mjs")).default;

const doc = {
  type: "FACTURE", numero: "FAC-2026-0042", statut: "ENVOYE", date: "2026-07-26", dateEcheance: "2026-08-10",
  reference: "DEV-2026-0003",
  entreprise: { nom: "Djimmy Prints", adresse: "Aïn Bénian", ville: "Alger", rc: "23A5058012", nif: "1234", ai: "5678" },
  client: { nom: "SARL Alpha", ville: "Alger", nif: "9999" },
  lignes: [
    { id: "a", designation: "Tenues de travail brodées", quantite: 12, unite: "Pièce", prixUnitaire: 2400, remise: 0, tva: 19 },
    { id: "b", designation: "Livraison", quantite: 1, unite: "Forfait", prixUnitaire: 1500, remise: 0, tva: 19 },
  ],
  tvaActive: true, remiseGlobale: 0, modePaiement: "ESPECES",
  conditionsPaiement: "Paiement à réception",
  paiements: [{ montant: 10000, date: "2026-07-26", mode: "ESPECES" }],
  notes: "Merci de votre confiance.",
};
const html = renderToStaticMarkup(React.createElement(DocPreview, { doc }));

/* HT = 12×2400 + 1500 = 30300 ; TVA 19% = 5757 ; TTC = 36057 ; timbre 1,5% = 540,86 → 541 ; net = 36598 ; solde = 26598 */
ok(html.includes("doc-print"), "id d'impression présent");
ok(html.includes("FAC-2026-0042"), "numéro affiché");
ok(html.includes("Droit de timbre"), "ligne droit de timbre");
ok(html.includes("36") && html.includes("598"), "net à payer 36 598 (timbre inclus)", "");
ok(/trente-six mille cinq cent quatre-vingt-dix-huit dinars/.test(html), "montant en lettres exact");
ok(html.includes("Solde restant"), "solde restant affiché");
ok(html.includes("Réf. :") && html.includes("DEV-2026-0003"), "référence d'origine");
ok(html.includes("RC") && html.includes("23A5058012"), "identifiants fiscaux émetteur");
ok(html.includes("Cachet et signature"), "bloc signature");
ok(html.includes("invoicedz.vercel.app"), "pied de page");

/* BL : pas de prix, pas de timbre, pas de lettres */
const bl = renderToStaticMarkup(React.createElement(DocPreview, { doc: { ...doc, type: "BON_LIVRAISON", paiements: [] } }));
ok(!bl.includes("Net à payer") && !bl.includes("Droit de timbre"), "BL sans montants");

console.log(bad ? `\n${bad}/${n} FAILED` : `\n${n} tests passed`);
process.exit(bad ? 1 : 0);
