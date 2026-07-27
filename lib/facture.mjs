/* ── invoiceDZ · logique métier pure (testée dans test/facture.test.mjs) ── */

/* ---------- Nombres en lettres (français) ---------- */
const U = ["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
const D = ["","dix","vingt","trente","quarante","cinquante","soixante","soixante-dix","quatre-vingt","quatre-vingt-dix"];

function below100(n) {
  if (n < 20) return U[n];
  const d = Math.floor(n / 10), u = n % 10;
  if (d === 7 || d === 9) {
    const base = d === 7 ? "soixante" : "quatre-vingt";
    if (d === 7 && u === 1) return "soixante et onze";
    return base + "-" + U[10 + u];
  }
  if (u === 0) return d === 8 ? "quatre-vingts" : D[d];
  if (u === 1 && d !== 8) return D[d] + " et un";
  return D[d] + "-" + U[u];
}

/* asMult : "quatre-vingts"/"deux cents" perdent le s devant mille/million */
function below1000(n, asMult) {
  const c = Math.floor(n / 100), r = n % 100;
  if (c === 0) {
    const w = below100(r);
    return asMult && r === 80 ? "quatre-vingt" : w;
  }
  let s = c === 1 ? "cent" : U[c] + " cent";
  if (r === 0) return c > 1 && !asMult ? s + "s" : s;
  return s + " " + below100(r);
}

export function enLettres(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "zéro";
  const G = Math.floor(n / 1e9);
  const M = Math.floor(n / 1e6) % 1000;
  const K = Math.floor(n / 1e3) % 1000;
  const R = n % 1000;
  const parts = [];
  if (G) parts.push(G === 1 ? "un milliard" : below1000(G, false) + " milliards");
  if (M) parts.push(M === 1 ? "un million" : below1000(M, false) + " millions");
  if (K) parts.push(K === 1 ? "mille" : below1000(K, true) + " mille");
  if (R) parts.push(below1000(R, false));
  return parts.join(" ");
}

/* "12 345,50 DA" → "douze mille trois cent quarante-cinq dinars algériens et cinquante centimes" */
export function montantEnLettres(montant) {
  const v = Math.round(Math.abs(montant) * 100) / 100;
  const dinars = Math.floor(v);
  const centimes = Math.round((v - dinars) * 100);
  let s = enLettres(dinars) + (dinars <= 1 ? " dinar algérien" : " dinars algériens");
  if (centimes > 0) s += " et " + enLettres(centimes) + (centimes <= 1 ? " centime" : " centimes");
  return s;
}

export function arreteSentence(typeLabel, montant) {
  return `Arrêté${typeLabel === "Facture" || typeLabel === "Facture Proforma" ? "e la présente " + typeLabel.toLowerCase() : " le présent " + typeLabel.toLowerCase()} à la somme de : ${montantEnLettres(montant)}.`;
}

/* ---------- Droit de timbre (paiement en espèces) · barème LF 2025 ---------- */
/* ≤ 300 DA : exonéré · 300→30 000 : 1 % · 30 000→100 000 : 1,5 % · au-delà : 2 % · minimum 5 DA · arrondi au dinar supérieur */
export function timbreFiscal(ttc) {
  if (!(ttc > 300)) return 0;
  const taux = ttc <= 30000 ? 0.01 : ttc <= 100000 ? 0.015 : 0.02;
  return Math.max(5, Math.ceil(ttc * taux));
}

/* ---------- Calculs document ---------- */
export function calcLigne(l) {
  const q = +l.quantite || 0, pu = +l.prixUnitaire || 0, rem = +l.remise || 0, tv = +l.tva || 0;
  const ht = q * pu * (1 - rem / 100);
  return { ht, tva: ht * (tv / 100), ttc: ht * (1 + tv / 100) };
}

export function calcTotaux(doc) {
  const lignes = doc.lignes || [];
  const remG = +doc.remiseGlobale || 0;
  const tvaOn = doc.tvaActive !== false;
  const sous = lignes.reduce((s, l) => s + calcLigne(l).ht, 0);
  const remAmt = sous * (remG / 100);
  const base = sous - remAmt;
  const totalTVA = tvaOn ? lignes.reduce((s, l) => s + calcLigne(l).tva, 0) * (1 - remG / 100) : 0;
  const ttc = base + totalTVA;
  const especes = doc.modePaiement === "ESPECES" && doc.type !== "BON_LIVRAISON";
  const timbre = especes ? timbreFiscal(ttc) : 0;
  const net = ttc + timbre;
  const paye = (doc.paiements || []).reduce((s, p) => s + (+p.montant || 0), 0);
  return { sous, remAmt, base, totalTVA, ttc, timbre, net, paye, solde: net - paye };
}

/* ---------- Numérotation séquentielle FAC-2026-0001 ---------- */
export const PREFIXES = { FACTURE: "FAC", PROFORMA: "PRO", DEVIS: "DEV", BON_COMMANDE: "BC", BON_LIVRAISON: "BL" };

export function nextNumero(type, docs, annee) {
  const y = annee || new Date().getFullYear();
  const pref = PREFIXES[type] || "DOC";
  const re = new RegExp("^" + pref + "-" + y + "-(\\d+)$");
  let max = 0;
  for (const d of docs || []) {
    const m = re.exec(d.numero || "");
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${pref}-${y}-${String(max + 1).padStart(4, "0")}`;
}

/* ---------- Conversions entre documents ---------- */
export const CONVERSIONS = {
  DEVIS: ["FACTURE", "PROFORMA"],
  PROFORMA: ["FACTURE"],
  BON_COMMANDE: ["FACTURE", "BON_LIVRAISON"],
  FACTURE: ["BON_LIVRAISON"],
  BON_LIVRAISON: [],
};

export function convertDoc(src, targetType, numero) {
  const d = JSON.parse(JSON.stringify(src));
  return {
    ...d,
    type: targetType,
    numero,
    statut: "BROUILLON",
    date: new Date().toISOString().split("T")[0],
    dateEcheance: "",
    paiements: [],
    reference: src.numero,
  };
}

/* ---------- Statut automatique après paiement ---------- */
export function statutApresPaiement(doc) {
  const t = calcTotaux(doc);
  if (t.net <= 0) return doc.statut;
  if (t.solde <= 0.009) return "PAYE";
  if (t.paye > 0) return "PARTIEL";
  return doc.statut;
}

export const fmtDA = (n) =>
  new Intl.NumberFormat("fr-DZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0) + " DA";
