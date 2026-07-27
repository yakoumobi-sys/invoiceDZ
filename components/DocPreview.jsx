"use client";
import { T, DOC_TYPES, MODES_PAIEMENT } from "../lib/constants.js";
import { calcLigne, calcTotaux, fmtDA, montantEnLettres } from "../lib/facture.mjs";

const fmtDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

/* Aperçu A4 partagé : éditeur, page document, impression (#doc-print) */
export default function DocPreview({ doc }) {
  const ti = DOC_TYPES[doc.type] || DOC_TYPES.FACTURE;
  const t = calcTotaux(doc);
  const showPrix = doc.type !== "BON_LIVRAISON";
  const showTVA = doc.tvaActive !== false && showPrix;
  const ent = doc.entreprise || {};
  const cl = doc.client || {};
  const modeLabel = (MODES_PAIEMENT.find((m) => m.value === doc.modePaiement) || {}).label || doc.conditionsPaiement;
  const acomptes = (doc.paiements || []).length > 0;

  const fiscal = [
    ent.rc && ["RC", ent.rc], ent.nif && ["NIF", ent.nif], ent.ai && ["AI", ent.ai],
    ent.idFiscal && ["NIS", ent.idFiscal], ent.code && ["Code", ent.code],
  ].filter(Boolean);

  return (
    <div id="doc-print" style={{ background: "#fff", border: "1px solid " + T.border, borderRadius: 12, padding: "42px 44px", boxShadow: "0 6px 28px rgba(19,37,30,.08)", color: "#161B18", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontSize: 12.5, lineHeight: 1.45 }}>

      {/* ── En-tête ── */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          {doc.logo && <img src={doc.logo} alt="" style={{ height: 54, maxWidth: 170, objectFit: "contain", marginBottom: 10, display: "block" }} />}
          <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: -0.4, color: "#111" }}>{ent.nom || "Votre entreprise"}</div>
          <div style={{ marginTop: 5, fontSize: 10.5, color: "#565E59", lineHeight: 1.8 }}>
            {ent.adresse && <div>{ent.adresse}{ent.ville ? ", " + ent.ville : ""}</div>}
            {!ent.adresse && ent.ville && <div>{ent.ville}</div>}
            {(ent.telephone || ent.email) && <div>{[ent.telephone, ent.email].filter(Boolean).join(" · ")}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ background: ti.color, color: "#fff", padding: "7px 18px", borderRadius: 7, fontWeight: 800, fontSize: 12, letterSpacing: 1.6, display: "inline-block", textTransform: "uppercase" }}>{ti.label}</div>
          <div style={{ fontWeight: 800, fontSize: 17, marginTop: 9, letterSpacing: -0.3 }}>{doc.numero || "—"}</div>
          <div style={{ fontSize: 10.5, color: "#565E59", marginTop: 6, lineHeight: 1.8 }}>
            <div>Date : <b style={{ color: "#161B18" }}>{fmtDate(doc.date)}</b></div>
            {doc.dateEcheance && <div>Échéance : <b style={{ color: "#161B18" }}>{fmtDate(doc.dateEcheance)}</b></div>}
            {doc.reference && <div>Réf. : {doc.reference}</div>}
          </div>
        </div>
      </div>

      {/* Identifiants fiscaux émetteur */}
      {fiscal.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 9.5, color: "#565E59", borderTop: "1px solid #E8ECE8", borderBottom: "1px solid #E8ECE8", padding: "7px 0", margin: "16px 0 0" }}>
          {fiscal.map(([k, v]) => <span key={k}><b style={{ color: "#39423C" }}>{k}</b> {v}</span>)}
        </div>
      )}

      {/* ── Destinataire ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "22px 0 24px" }}>
        <div style={{ background: "#F4F8F3", border: "1px solid #E1E9E0", borderRadius: 9, padding: "13px 17px", minWidth: 250, maxWidth: 330 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#7B8880", textTransform: "uppercase", fontWeight: 700, marginBottom: 5 }}>
            {doc.type === "BON_COMMANDE" ? "Fournisseur" : "Client"}
          </div>
          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{cl.nom || "—"}</div>
          <div style={{ fontSize: 10.5, color: "#565E59", marginTop: 3, lineHeight: 1.8 }}>
            {cl.adresse && <div>{cl.adresse}{cl.ville ? ", " + cl.ville : ""}</div>}
            {!cl.adresse && cl.ville && <div>{cl.ville}</div>}
            {(cl.telephone || cl.email) && <div>{[cl.telephone, cl.email].filter(Boolean).join(" · ")}</div>}
            {cl.nif && <div>NIF : {cl.nif}</div>}
            {cl.rc && <div>RC : {cl.rc}</div>}
          </div>
        </div>
      </div>

      {/* ── Lignes ── */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#1C4A3D", color: "#fff" }}>
            {["N°", "Désignation", "Qté", "Unité", ...(showPrix ? ["P.U. HT", "Rem.", ...(showTVA ? ["TVA"] : []), "Total HT"] : [])].map((h, i) => (
              <th key={i} style={{ padding: "8px 9px", textAlign: i <= 1 ? "left" : "right", fontSize: 9, letterSpacing: 1.1, textTransform: "uppercase", fontWeight: 700 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(doc.lignes || []).map((l, i) => {
            const { ht } = calcLigne(l);
            return (
              <tr key={l.id || i} style={{ background: i % 2 ? "#fff" : "#F7FAF6", borderBottom: "1px solid #ECF0EB" }}>
                <td style={{ padding: "8px 9px", fontSize: 10.5, color: "#98A29B", width: 26 }}>{i + 1}</td>
                <td style={{ padding: "8px 9px", fontSize: 11.5 }}>{l.designation || "—"}</td>
                <td style={{ padding: "8px 8px", textAlign: "right", fontSize: 11.5 }}>{l.quantite}</td>
                <td style={{ padding: "8px 8px", textAlign: "right", fontSize: 10.5, color: "#6B756E" }}>{l.unite}</td>
                {showPrix && <>
                  <td style={{ padding: "8px 8px", textAlign: "right", fontSize: 11.5 }}>{(+l.prixUnitaire || 0).toLocaleString("fr-DZ", { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: "8px 8px", textAlign: "right", fontSize: 11, color: l.remise > 0 ? "#B26A08" : "#C9CFC9" }}>{l.remise > 0 ? l.remise + "%" : "—"}</td>
                  {showTVA && <td style={{ padding: "8px 8px", textAlign: "right", fontSize: 11 }}>{l.tva}%</td>}
                  <td style={{ padding: "8px 9px", textAlign: "right", fontSize: 11.5, fontWeight: 700 }}>{ht.toLocaleString("fr-DZ", { minimumFractionDigits: 2 })}</td>
                </>}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── Totaux ── */}
      {showPrix && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <div style={{ minWidth: 270 }}>
            {[
              ["Sous-total HT", fmtDA(t.sous)],
              ...(doc.remiseGlobale > 0 ? [["Remise globale (" + doc.remiseGlobale + "%)", "−" + fmtDA(t.remAmt)], ["Base HT", fmtDA(t.base)]] : []),
              ...(showTVA ? [["TVA", fmtDA(t.totalTVA)]] : []),
              ...(t.timbre > 0 ? [["Total TTC", fmtDA(t.ttc)], ["Droit de timbre (espèces)", fmtDA(t.timbre)]] : []),
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #EEF1EE", fontSize: 11.5, color: "#565E59" }}>
                <span>{l}</span><span style={{ color: "#161B18" }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1C4A3D", color: "#fff", borderRadius: 8, padding: "10px 13px", marginTop: 9 }}>
              <span style={{ fontSize: 10.5, letterSpacing: 1.4, fontWeight: 700, textTransform: "uppercase" }}>Net à payer</span>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{fmtDA(t.net)}</span>
            </div>
            {acomptes && (
              <div style={{ marginTop: 8, fontSize: 11.5 }}>
                {(doc.paiements || []).map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "#565E59" }}>
                    <span>Acompte {fmtDate(p.date)}</span><span>−{fmtDA(+p.montant || 0)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, borderTop: "1px solid #E1E9E0", paddingTop: 5, color: t.solde <= 0.009 ? "#2E8B33" : "#161B18" }}>
                  <span>Solde restant</span><span>{fmtDA(Math.max(0, t.solde))}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Montant en lettres */}
      {showPrix && t.net > 0 && (
        <div style={{ marginTop: 18, background: "#F4F8F3", borderLeft: "3px solid #63BE3A", borderRadius: "0 8px 8px 0", padding: "10px 14px", fontSize: 11, fontStyle: "italic", color: "#39423C" }}>
          Arrêté le présent document à la somme de : <b style={{ fontStyle: "normal" }}>{montantEnLettres(t.net)}</b>.
        </div>
      )}

      {/* Paiement, notes, signatures */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 22, marginTop: 24, alignItems: "flex-end" }}>
        <div style={{ fontSize: 11, color: "#565E59", lineHeight: 1.8, minWidth: 0 }}>
          {showPrix && modeLabel && <div><b style={{ color: "#39423C" }}>Mode de paiement :</b> {modeLabel}</div>}
          {showPrix && doc.conditionsPaiement && <div><b style={{ color: "#39423C" }}>Conditions :</b> {doc.conditionsPaiement}</div>}
          {doc.notes && <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{doc.notes}</div>}
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 9.5, letterSpacing: 1.4, color: "#7B8880", textTransform: "uppercase", fontWeight: 700 }}>Cachet et signature</div>
          <div style={{ width: 170, height: 74, border: "1.5px dashed #C9D3C9", borderRadius: 9, marginTop: 7 }} />
        </div>
      </div>

      <div style={{ marginTop: 30, borderTop: "1px solid #ECF0EB", paddingTop: 10, textAlign: "center", fontSize: 8.5, color: "#AEB7B0", letterSpacing: 0.8 }}>
        Document généré gratuitement sur invoicedz.vercel.app
      </div>
    </div>
  );
}

/* Impression / export PDF : imprime uniquement #doc-print (voir globals.css) */
export function printDoc() {
  window.print();
}
