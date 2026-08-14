import { calcLigne as _calcLigne, calcTotaux as _calcTotaux, fmtDA as _fmtDA } from "./facture.mjs";

/* ── Identité visuelle invoicedz ─────────────────────────────
   Tirée du logo : document vert sapin + éclair vert feuille.
   Sapin  = actions, marque, titres forts.
   Feuille = énergie, réussite, accents. */
export const T = {
  white: "#FFFFFF",
  bg: "#F4F7F3",
  ink: "#13251E",
  inkMid: "#3E5248",
  inkLight: "#79897E",
  border: "#E0E7DE",
  accent: "#1C4A3D",       /* vert sapin (logo, boutons primaires) */
  accentDark: "#12362B",
  accentBg: "#E9F2EA",
  leaf: "#63BE3A",         /* vert éclair du logo */
  leafDark: "#3E8F1D",
  leafBg: "#EFF8E9",
  success: "#2E8B33",
  warning: "#C07A08",
  danger: "#D23B2E",
  purple: "#6D4ACD",
};

export const DOC_TYPES = {
  FACTURE:       { label: "Facture",          prefix: "FAC", color: "#1C4A3D", icon: "🧾", desc: "Demandez le paiement de vos ventes et services" },
  PROFORMA:      { label: "Facture Proforma", prefix: "PRO", color: "#2C6E9C", icon: "📋", desc: "Chiffrez avant de facturer officiellement" },
  DEVIS:         { label: "Devis",            prefix: "DEV", color: "#6D4ACD", icon: "📝", desc: "Proposez un prix à votre client" },
  BON_COMMANDE:  { label: "Bon de Commande",  prefix: "BC",  color: "#C07A08", icon: "🛒", desc: "Confirmez une commande fournisseur" },
  BON_LIVRAISON: { label: "Bon de Livraison", prefix: "BL",  color: "#3E5248", icon: "🚚", desc: "Attestez la livraison de marchandises" },
};

export const STATUTS = {
  BROUILLON:  { label: "Brouillon",  color: "#79897E" },
  ENVOYE:     { label: "Envoyé",     color: "#2C6E9C" },
  ACCEPTE:    { label: "Accepté",    color: "#2E8B33" },
  REFUSE:     { label: "Refusé",     color: "#D23B2E" },
  PAYE:       { label: "Payé",       color: "#2E8B33" },
  PARTIEL:    { label: "Partiel",    color: "#C07A08" },
  EN_ATTENTE: { label: "En attente", color: "#C07A08" },
  LIVRE:      { label: "Livré",      color: "#2E8B33" },
};

export const STATUTS_PAR_TYPE = {
  FACTURE:       ["BROUILLON", "ENVOYE", "PARTIEL", "PAYE"],
  PROFORMA:      ["BROUILLON", "ENVOYE", "ACCEPTE", "REFUSE"],
  DEVIS:         ["BROUILLON", "ENVOYE", "ACCEPTE", "REFUSE"],
  BON_COMMANDE:  ["BROUILLON", "ENVOYE", "EN_ATTENTE", "ACCEPTE"],
  BON_LIVRAISON: ["BROUILLON", "ENVOYE", "LIVRE"],
};

export const MODES_PAIEMENT = [
  { value: "VIREMENT", label: "Virement bancaire" },
  { value: "ESPECES",  label: "Espèces (droit de timbre)" },
  { value: "CHEQUE",   label: "Chèque" },
  { value: "CCP",      label: "CCP / BaridiMob" },
  { value: "CARTE",    label: "Carte CIB / Edahabia" },
  { value: "AUTRE",    label: "Autre" },
];

export const UNITES = ["Unité", "Pièce", "Heure", "Jour", "Kg", "m", "m²", "m³", "Litre", "Lot", "Forfait", "Service"];

export const SECTEURS = [
  "Commerce / Vente au détail",
  "Services aux entreprises",
  "Industrie / Fabrication",
  "BTP / Construction",
  "Technologie / Informatique",
  "Santé",
  "Éducation / Formation",
  "Restauration / Hôtellerie",
  "Transport / Logistique",
  "Agriculture / Agroalimentaire",
  "Finance / Assurance",
  "Artisanat",
  "Autre",
];

export const EFFECTIFS = [
  { value: "1", label: "Juste moi" },
  { value: "2-5", label: "2 à 5" },
  { value: "6-10", label: "6 à 10" },
  { value: "11-50", label: "11 à 50" },
  { value: "51-200", label: "51 à 200" },
  { value: "200+", label: "Plus de 200" },
];

export const emptyLigne = () => ({
  id: Math.random().toString(36).slice(2),
  designation: "", quantite: 1, unite: "Unité", prixUnitaire: 0, remise: 0, tva: 19,
});

export const newDoc = (type, entreprise, logo, prefs = {}) => ({
  type,
  numero: "",
  statut: "BROUILLON",
  date: new Date().toISOString().split("T")[0],
  dateEcheance: "",
  reference: "",
  client: { id: null, nom: "", adresse: "", ville: "", email: "", telephone: "", nif: "", rc: "" },
  lignes: [emptyLigne()],
  notes: "",
  conditionsPaiement: prefs.conditionsPaiement || "Paiement à réception",
  modePaiement: prefs.modePaiement || "VIREMENT",
  remiseGlobale: 0,
  tvaActive: prefs.tvaActive !== false,
  paiements: [],
  entreprise: entreprise || { nom: "", adresse: "", ville: "", telephone: "", email: "", nif: "", rc: "", ai: "", idFiscal: "", code: "" },
  logo: logo || null,
});

/* Réexports de la logique testée (compatibilité ascendante) */
export const calcLigne = _calcLigne;
export const fmtDA = _fmtDA;
export const calcTotaux = (lignesOuDoc, rem = 0, tva = true) =>
  Array.isArray(lignesOuDoc)
    ? _calcTotaux({ lignes: lignesOuDoc, remiseGlobale: rem, tvaActive: tva })
    : _calcTotaux(lignesOuDoc);
