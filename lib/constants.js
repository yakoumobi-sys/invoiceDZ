export const T = {
  white:"#FFFFFF", bg:"#F7F7F5", ink:"#111110", inkMid:"#444440",
  inkLight:"#88887F", border:"#E4E4DF", accent:"#1A6BFF",
  accentDark:"#0050E0", accentBg:"#EEF4FF", success:"#16A34A",
  warning:"#D97706", danger:"#DC2626", purple:"#7C3AED",
};

export const DOC_TYPES = {
  FACTURE:       { label:"Facture",           prefix:"FAC", color:"#16A34A", icon:"🧾", desc:"Demandez paiement pour vos services" },
  PROFORMA:      { label:"Facture Proforma",  prefix:"PRO", color:"#1A6BFF", icon:"📋", desc:"Estimez avant de facturer officiellement" },
  DEVIS:         { label:"Devis",             prefix:"DEV", color:"#7C3AED", icon:"📝", desc:"Proposez un prix à votre client" },
  BON_COMMANDE:  { label:"Bon de Commande",   prefix:"BC",  color:"#D97706", icon:"🛒", desc:"Confirmez une commande fournisseur" },
  BON_LIVRAISON: { label:"Bon de Livraison",  prefix:"BL",  color:"#444440", icon:"🚚", desc:"Attestez la livraison de marchandises" },
};

export const STATUTS = {
  BROUILLON:  { label:"Brouillon",   color:"#88887F" },
  ENVOYE:     { label:"Envoyé",      color:"#1A6BFF" },
  ACCEPTE:    { label:"Accepté",     color:"#16A34A" },
  REFUSE:     { label:"Refusé",      color:"#DC2626" },
  PAYE:       { label:"Payé",        color:"#16A34A" },
  PARTIEL:    { label:"Partiel",     color:"#D97706" },
  EN_ATTENTE: { label:"En attente",  color:"#D97706" },
  LIVRE:      { label:"Livré",       color:"#16A34A" },
};

export const STATUTS_PAR_TYPE = {
  FACTURE:       ["BROUILLON","ENVOYE","PAYE","PARTIEL"],
  PROFORMA:      ["BROUILLON","ENVOYE","ACCEPTE","REFUSE"],
  DEVIS:         ["BROUILLON","ENVOYE","ACCEPTE","REFUSE"],
  BON_COMMANDE:  ["BROUILLON","ENVOYE","EN_ATTENTE","ACCEPTE"],
  BON_LIVRAISON: ["BROUILLON","ENVOYE","LIVRE"],
};

export const emptyLigne = () => ({
  id: Math.random().toString(36).slice(2),
  designation:"", quantite:1, unite:"Unité", prixUnitaire:0, remise:0, tva:19
});

export const newDoc = (type, entreprise, logo) => ({
  type,
  numero: `${DOC_TYPES[type].prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100)}`,
  statut: "BROUILLON",
  date: new Date().toISOString().split("T")[0],
  dateEcheance: "",
  client: { nom:"", adresse:"", ville:"", email:"", telephone:"", nif:"" },
  lignes: [emptyLigne()],
  notes: "", conditionsPaiement: "Virement / BaridiMob",
  remiseGlobale: 0, tvaActive: true,
  entreprise: entreprise || { nom:"", adresse:"", ville:"", telephone:"", email:"", nif:"", rc:"", ai:"", idFiscal:"", code:"" },
  logo: logo || null,
});

export const calcLigne = l => {
  const ht = l.quantite * l.prixUnitaire * (1 - l.remise / 100);
  return { ht, tva: ht * (l.tva / 100), ttc: ht * (1 + l.tva / 100) };
};

export const calcTotaux = (lignes, rem = 0, tva = true) => {
  const sous = lignes.reduce((s, l) => s + calcLigne(l).ht, 0);
  const remAmt = sous * (rem / 100);
  const base = sous - remAmt;
  const totalTVA = tva ? lignes.reduce((s, l) => s + calcLigne(l).tva, 0) * (1 - rem / 100) : 0;
  return { sous, remAmt, base, totalTVA, ttc: base + totalTVA };
};

export const fmtDA = n =>
  new Intl.NumberFormat("fr-DZ", { minimumFractionDigits:2, maximumFractionDigits:2 }).format(n) + " DA";
