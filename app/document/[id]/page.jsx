"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { T, DOC_TYPES, STATUTS, STATUTS_PAR_TYPE, MODES_PAIEMENT } from "../../../lib/constants";
import { calcTotaux, fmtDA, nextNumero, convertDoc, CONVERSIONS, statutApresPaiement } from "../../../lib/facture.mjs";
import { getUser, getDoc, listDocs, saveDoc, deleteDoc } from "../../../lib/db";
import { Btn, Badge, Logo, Spinner, Menu, Modal, Input, Sel, Lbl, Toast, useToast } from "../../../components/ui";
import DocPreview, { printDoc } from "../../../components/DocPreview";

export default function DocumentPage() {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({ montant: "", date: "", mode: "ESPECES" });
  const [msg, toast] = useToast();

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
      setDoc(await getDoc(u, id));
      setLoading(false);
    })();
  }, [id]);

  const changeStatut = async (s) => {
    const updated = { ...doc, statut: s };
    await saveDoc(user, updated);
    setDoc(updated);
    toast("Statut : " + (STATUTS[s]?.label || s));
  };

  const duplicate = async () => {
    const docs = await listDocs(user);
    const copy = JSON.parse(JSON.stringify(doc));
    delete copy.id; delete copy.created_at;
    copy.numero = nextNumero(doc.type, docs);
    copy.statut = "BROUILLON";
    copy.date = new Date().toISOString().split("T")[0];
    copy.paiements = [];
    const saved = await saveDoc(user, copy);
    router.push("/document/" + saved.id);
    toast("Document dupliqué");
  };

  const convert = async (target) => {
    const docs = await listDocs(user);
    const converted = convertDoc(doc, target, nextNumero(target, docs));
    delete converted.id; delete converted.created_at;
    const saved = await saveDoc(user, converted);
    router.push("/document/" + saved.id);
    toast(DOC_TYPES[target].label + " créé(e)");
  };

  const remove = async () => {
    if (!confirm("Supprimer " + doc.numero + " ? Cette action est définitive.")) return;
    await deleteDoc(user, doc.id);
    router.push("/dashboard");
  };

  const openPay = () => {
    const t = calcTotaux(doc);
    setPay({ montant: Math.max(0, t.solde).toFixed(2), date: new Date().toISOString().split("T")[0], mode: doc.modePaiement || "ESPECES" });
    setPayOpen(true);
  };

  const savePay = async () => {
    const m = parseFloat(pay.montant);
    if (!(m > 0)) { toast("Montant invalide"); return; }
    const updated = { ...doc, paiements: [...(doc.paiements || []), { montant: m, date: pay.date, mode: pay.mode }] };
    updated.statut = statutApresPaiement(updated);
    await saveDoc(user, updated);
    setDoc(updated);
    setPayOpen(false);
    toast("Paiement enregistré ✓");
  };

  if (loading) return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  if (!doc) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: T.inkLight }}>
      Document introuvable.
      <Btn onClick={() => router.push("/dashboard")}>← Retour au tableau de bord</Btn>
    </div>
  );

  const ti = DOC_TYPES[doc.type] || DOC_TYPES.FACTURE;
  const si = STATUTS[doc.statut] || STATUTS.BROUILLON;
  const t = calcTotaux(doc);
  const showPrix = doc.type !== "BON_LIVRAISON";
  const conv = CONVERSIONS[doc.type] || [];

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <div style={{ background: T.white, borderBottom: "1px solid " + T.border, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 18px", height: 58, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => router.push("/dashboard")}><Logo size={24} /></span>
          <span style={{ color: T.border }}>›</span>
          <span style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.numero}</span>
          <Badge label={si.label} color={si.color} />
          <div style={{ marginLeft: "auto", display: "flex", gap: 7, alignItems: "center" }}>
            <Btn size="sm" variant="success" onClick={printDoc}>⬇ PDF</Btn>
            <Btn size="sm" onClick={() => router.push("/nouveau?id=" + doc.id)}>✏️ Modifier</Btn>
            <Menu items={[
              ...(showPrix && doc.statut !== "PAYE" ? [{ icon: "💰", label: "Enregistrer un paiement", onClick: openPay }] : []),
              { icon: "📑", label: "Dupliquer", onClick: duplicate },
              ...(conv.length ? conv.map((c) => ({ icon: "🔄", label: "→ " + DOC_TYPES[c].label, onClick: () => convert(c) })) : []),
              "—",
              ...STATUTS_PAR_TYPE[doc.type].filter((s) => s !== doc.statut).map((s) => ({ icon: "🏷", label: "Statut : " + STATUTS[s].label, onClick: () => changeStatut(s) })),
              "—",
              { icon: "🗑", label: "Supprimer", danger: true, onClick: remove },
            ]} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "26px 18px 60px" }}>
        {showPrix && t.solde > 0.009 && t.paye > 0 && (
          <div style={{ background: "#FDF3E3", border: "1px solid #F1DFBB", borderRadius: 11, padding: "11px 16px", marginBottom: 14, fontSize: 13.5, color: "#7A5A10", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>Encaissé {fmtDA(t.paye)} · <b>reste {fmtDA(t.solde)}</b></span>
            <Btn size="sm" onClick={openPay}>+ Paiement</Btn>
          </div>
        )}
        <DocPreview doc={doc} />
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <Btn variant="success" onClick={printDoc}>⬇ Télécharger en PDF</Btn>
          <Btn onClick={() => router.push("/nouveau?id=" + doc.id)}>✏️ Modifier</Btn>
          <Btn variant="ghost" onClick={() => router.push("/dashboard")}>← Tableau de bord</Btn>
        </div>
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title={"Paiement · " + doc.numero} width={420}>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div style={{ fontSize: 13, color: T.inkMid }}>
            Net à payer : <b>{fmtDA(t.net)}</b> · Solde : <b style={{ color: T.warning }}>{fmtDA(Math.max(0, t.solde))}</b>
          </div>
          <div><Lbl>Montant reçu (DA)</Lbl><Input type="number" min="0" step="any" value={pay.montant} onChange={(v) => setPay({ ...pay, montant: v })} /></div>
          <div className="grid-2">
            <div><Lbl>Date</Lbl><Input type="date" value={pay.date} onChange={(v) => setPay({ ...pay, date: v })} /></div>
            <div><Lbl>Mode</Lbl><Sel value={pay.mode} onChange={(v) => setPay({ ...pay, mode: v })} options={MODES_PAIEMENT} /></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Btn onClick={() => setPayOpen(false)}>Annuler</Btn>
            <Btn variant="primary" onClick={savePay}>Enregistrer</Btn>
          </div>
        </div>
      </Modal>

      <Toast msg={msg} />
    </div>
  );
}
