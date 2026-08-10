import { enLettres, montantEnLettres, timbreFiscal, calcTotaux, nextNumero, convertDoc, statutApresPaiement, arreteSentence, isOverdue } from "../lib/facture.mjs";

let n = 0, bad = 0;
const eq = (got, want, label) => {
  n++;
  if (JSON.stringify(got) === JSON.stringify(want)) console.log("  ok -", label);
  else { bad++; console.error("  FAIL -", label, "\n    got:", got, "\n    want:", want); }
};
const close = (got, want, label) => {
  n++;
  if (Math.abs(got - want) < 0.01) console.log("  ok -", label);
  else { bad++; console.error("  FAIL -", label, "got:", got, "want:", want); }
};

/* ---- enLettres ---- */
eq(enLettres(0), "zéro", "0");
eq(enLettres(21), "vingt et un", "21");
eq(enLettres(71), "soixante et onze", "71");
eq(enLettres(80), "quatre-vingts", "80");
eq(enLettres(81), "quatre-vingt-un", "81");
eq(enLettres(91), "quatre-vingt-onze", "91");
eq(enLettres(99), "quatre-vingt-dix-neuf", "99");
eq(enLettres(100), "cent", "100");
eq(enLettres(101), "cent un", "101");
eq(enLettres(200), "deux cents", "200");
eq(enLettres(201), "deux cent un", "201");
eq(enLettres(777), "sept cent soixante-dix-sept", "777");
eq(enLettres(1000), "mille", "1000");
eq(enLettres(1001), "mille un", "1001");
eq(enLettres(80000), "quatre-vingt mille", "80000 (pas de s devant mille)");
eq(enLettres(200000), "deux cent mille", "200000 (pas de s devant mille)");
eq(enLettres(33970), "trente-trois mille neuf cent soixante-dix", "33970");
eq(enLettres(1000000), "un million", "1e6");
eq(enLettres(2500000), "deux millions cinq cent mille", "2.5e6");
eq(enLettres(1234567), "un million deux cent trente-quatre mille cinq cent soixante-sept", "1234567");

/* ---- montantEnLettres ---- */
eq(montantEnLettres(1), "un dinar algérien", "1 DA");
eq(montantEnLettres(2), "deux dinars algériens", "2 DA");
eq(montantEnLettres(12345.5), "douze mille trois cent quarante-cinq dinars algériens et cinquante centimes", "12345,50");
eq(montantEnLettres(100.01), "cent dinars algériens et un centime", "100,01");
eq(montantEnLettres(250.0), "deux cent cinquante dinars algériens", "sans centimes");
eq(arreteSentence("Facture", 100).startsWith("Arrêtée la présente facture à la somme de : cent dinars"), true, "phrase d'arrêté");

/* ---- timbre fiscal LF2025 ---- */
eq(timbreFiscal(0), 0, "timbre 0");
eq(timbreFiscal(300), 0, "timbre ≤300 exonéré");
eq(timbreFiscal(301), 5, "timbre 301 → min 5 DA");
eq(timbreFiscal(11900), 119, "timbre 11 900 × 1% = 119");
eq(timbreFiscal(30000), 300, "timbre 30 000 × 1%");
eq(timbreFiscal(33970), 510, "timbre 33 970 × 1,5% = 509,55 → 510");
eq(timbreFiscal(100000), 1500, "timbre 100 000 × 1,5%");
eq(timbreFiscal(150000), 3000, "timbre 150 000 × 2%");

/* ---- totaux ---- */
const docBase = {
  type: "FACTURE", tvaActive: true, remiseGlobale: 0, modePaiement: "VIREMENT",
  lignes: [{ quantite: 2, prixUnitaire: 1000, remise: 0, tva: 19 }],
};
let t = calcTotaux(docBase);
close(t.sous, 2000, "sous-total HT");
close(t.totalTVA, 380, "TVA 19%");
close(t.ttc, 2380, "TTC");
eq(t.timbre, 0, "pas de timbre (virement)");
close(t.net, 2380, "net = ttc sans timbre");

t = calcTotaux({ ...docBase, modePaiement: "ESPECES" });
eq(t.timbre, 24, "timbre espèces = ceil(2380×1%)=24");
close(t.net, 2404, "net = ttc + timbre");

t = calcTotaux({ ...docBase, remiseGlobale: 10 });
close(t.base, 1800, "remise globale 10% → base");
close(t.totalTVA, 342, "TVA après remise globale");
close(t.ttc, 2142, "TTC après remise");

t = calcTotaux({ ...docBase, tvaActive: false });
close(t.ttc, 2000, "sans TVA → ttc = base");

t = calcTotaux({ ...docBase, modePaiement: "ESPECES", paiements: [{ montant: 1000 }, { montant: 404 }] });
close(t.paye, 1404, "total payé");
close(t.solde, 1000, "solde restant");

/* BL jamais de timbre même en espèces */
t = calcTotaux({ ...docBase, type: "BON_LIVRAISON", modePaiement: "ESPECES" });
eq(t.timbre, 0, "BL sans timbre");

/* ---- numérotation ---- */
const docs = [
  { numero: "FAC-2026-0001" }, { numero: "FAC-2026-0007" }, { numero: "FAC-2025-0099" },
  { numero: "DEV-2026-0002" }, { numero: "libre-123" },
];
eq(nextNumero("FACTURE", docs, 2026), "FAC-2026-0008", "next FAC 2026");
eq(nextNumero("DEVIS", docs, 2026), "DEV-2026-0003", "next DEV 2026");
eq(nextNumero("PROFORMA", docs, 2026), "PRO-2026-0001", "next PRO (aucun)");
eq(nextNumero("FACTURE", [], 2026), "FAC-2026-0001", "premier numéro");

/* ---- conversion ---- */
const devis = { type: "DEVIS", numero: "DEV-2026-0003", statut: "ACCEPTE", date: "2026-07-01",
  client: { nom: "SARL Test" }, lignes: [{ quantite: 1, prixUnitaire: 500, tva: 19 }], paiements: [{ montant: 100 }] };
const fac = convertDoc(devis, "FACTURE", "FAC-2026-0008");
eq(fac.type, "FACTURE", "conversion type");
eq(fac.numero, "FAC-2026-0008", "conversion numéro");
eq(fac.statut, "BROUILLON", "conversion statut reset");
eq(fac.reference, "DEV-2026-0003", "référence origine");
eq(fac.paiements, [], "paiements remis à zéro");
eq(fac.client.nom, "SARL Test", "client copié");
eq(devis.statut, "ACCEPTE", "source intacte");

/* ---- statut après paiement ---- */
eq(statutApresPaiement({ ...docBase, paiements: [{ montant: 2380 }] }), "PAYE", "payé intégralement");
eq(statutApresPaiement({ ...docBase, paiements: [{ montant: 100 }] }), "PARTIEL", "paiement partiel");
eq(statutApresPaiement({ ...docBase, statut: "ENVOYE", paiements: [] }), "ENVOYE", "sans paiement inchangé");

/* ---- retard (isOverdue) ---- */
const factureImpayee = { type: "FACTURE", statut: "ENVOYE", dateEcheance: "2026-01-01", paiements: [],
  lignes: [{ quantite: 1, prixUnitaire: 1000, tva: 19 }] };
eq(isOverdue(factureImpayee, "2026-07-01"), true, "en retard : échéance dépassée, solde dû");
eq(isOverdue({ ...factureImpayee, dateEcheance: "2026-12-01" }, "2026-07-01"), false, "pas en retard : échéance future");
eq(isOverdue({ ...factureImpayee, statut: "PAYE" }, "2026-07-01"), false, "pas en retard : déjà payée");
eq(isOverdue({ ...factureImpayee, dateEcheance: "" }, "2026-07-01"), false, "pas en retard : sans échéance");
eq(isOverdue({ ...factureImpayee, type: "BON_LIVRAISON" }, "2026-07-01"), false, "pas en retard : bon de livraison");
eq(isOverdue({ ...factureImpayee, paiements: [{ montant: 1190 }] }, "2026-07-01"), false, "pas en retard : soldée par un paiement");

console.log(bad ? `\n${bad}/${n} FAILED` : `\n${n} tests passed`);
process.exit(bad ? 1 : 0);
