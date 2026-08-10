"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { T, DOC_TYPES, STATUTS, MODES_PAIEMENT } from "../../lib/constants";
import { calcTotaux, fmtDA, nextNumero, convertDoc, CONVERSIONS, statutApresPaiement, isOverdue } from "../../lib/facture.mjs";
import { getUser, listDocs, saveDoc, deleteDoc, countLocalDocs, importLocalDocs } from "../../lib/db";
import { waLink, mailLink, messageDocument, csvDocs, downloadTextFile } from "../../lib/partage";
import AppNav from "../../components/nav";
import { Btn, Badge, Card, StatCard, Spinner, Empty, Menu, Modal, Input, Sel, Lbl, Toast, useToast } from "../../components/ui";

/* Mini graphique CA (SVG pur) */
function ChartCA({ docs }) {
  const bars = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ k: d.toISOString().slice(0, 7), l: d.toLocaleDateString("fr-FR", { month: "short" }), v: 0 });
    }
    for (const doc of docs) {
      if (doc.type !== "FACTURE") continue;
      const m = months.find((x) => (doc.date || "").startsWith(x.k));
      if (m) m.v += calcTotaux(doc).net;
    }
    return months;
  }, [docs]);
  const max = Math.max(1, ...bars.map((b) => b.v));
  const W = 560, H = 120, bw = W / bars.length;
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: T.inkLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7 }}>Chiffre d'affaires facturé · 12 mois</div>
        <div style={{ fontSize: 12, color: T.inkMid, fontWeight: 700 }}>{fmtDA(bars.reduce((s, b) => s + b.v, 0))}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Chiffre d'affaires par mois">
        {bars.map((b, i) => {
          const h = Math.round((b.v / max) * H);
          return (
            <g key={b.k}>
              <rect x={i * bw + 5} y={H - h} width={bw - 10} height={Math.max(2, h)} rx="4"
                fill={i === bars.length - 1 ? "#63BE3A" : "#1C4A3D"} opacity={b.v === 0 ? 0.16 : 0.92}>
                <title>{b.l} : {fmtDA(b.v)}</title>
              </rect>
              <text x={i * bw + bw / 2} y={H + 13} textAnchor="middle" fontSize="9.5" fill={T.inkLight}>{b.l}</text>
            </g>
          );
        })}
      </svg>
    </Card>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fType, setFType] = useState("ALL");
  const [fStatut, setFStatut] = useState("ALL");
  const [search, setSearch] = useState("");
  const [payDoc, setPayDoc] = useState(null);
  const [pay, setPay] = useState({ montant: "", date: "", mode: "ESPECES" });
  const [localCount, setLocalCount] = useState(0);
  const [msg, toast] = useToast();

  const reload = async (u) => setDocs(await listDocs(u));

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
      await reload(u);
      if (u) setLocalCount(countLocalDocs());
      setLoading(false);
    })();
  }, []);

  const filtered = docs.filter((d) => {
    if (fType !== "ALL" && d.type !== fType) return false;
    if (fStatut !== "ALL" && d.statut !== fStatut) return false;
    const q = search.toLowerCase();
    if (q && !(d.numero || "").toLowerCase().includes(q) && !(d.client?.nom || "").toLowerCase().includes(q)) return false;
    return true;
  });

  const stats = useMemo(() => {
    let ca = 0, paye = 0, attente = 0, retard = 0;
    for (const d of docs) {
      if (d.type === "FACTURE") {
        const t = calcTotaux(d);
        ca += t.net;
        paye += d.statut === "PAYE" ? t.net : Math.min(t.paye, t.net);
        if (isOverdue(d)) retard += Math.max(0, t.solde);
      }
      if (["ENVOYE", "PARTIEL", "EN_ATTENTE"].includes(d.statut) && d.type !== "BON_LIVRAISON") {
        attente += Math.max(0, calcTotaux(d).solde);
      }
    }
    return { ca, paye, attente, retard };
  }, [docs]);

  const exportCsv = () => {
    if (filtered.length === 0) { toast("Aucun document à exporter"); return; }
    downloadTextFile(`invoicedz-documents-${new Date().toISOString().slice(0, 10)}.csv`, csvDocs(filtered));
  };

  const envoyerWa = (d) => {
    const link = waLink(d.client?.telephone, messageDocument(d).body);
    if (!link) { toast("Aucun numéro de téléphone pour ce client"); return; }
    window.open(link, "_blank", "noopener,noreferrer");
  };
  const envoyerEmail = (d) => {
    const { subject, body } = messageDocument(d);
    const link = mailLink(d.client?.email, subject, body);
    if (!link) { toast("Aucun email pour ce client"); return; }
    window.location.href = link;
  };

  const duplicate = async (d) => {
    const copy = JSON.parse(JSON.stringify(d));
    delete copy.id; delete copy.created_at;
    copy.numero = nextNumero(d.type, docs);
    copy.statut = "BROUILLON";
    copy.date = new Date().toISOString().split("T")[0];
    copy.paiements = [];
    await saveDoc(user, copy);
    await reload(user);
    toast("Document dupliqué : " + copy.numero);
  };

  const convert = async (d, target) => {
    const converted = convertDoc(d, target, nextNumero(target, docs));
    delete converted.id; delete converted.created_at;
    await saveDoc(user, converted);
    await reload(user);
    toast(DOC_TYPES[target].label + " " + converted.numero + " créé(e)");
  };

  const remove = async (d) => {
    if (!confirm("Supprimer " + d.numero + " ? Cette action est définitive.")) return;
    await deleteDoc(user, d.id);
    await reload(user);
    toast("Document supprimé");
  };

  const openPay = (d) => {
    const t = calcTotaux(d);
    setPay({ montant: Math.max(0, t.solde).toFixed(2), date: new Date().toISOString().split("T")[0], mode: d.modePaiement || "ESPECES" });
    setPayDoc(d);
  };

  const savePay = async () => {
    const m = parseFloat(pay.montant);
    if (!(m > 0)) { toast("Montant invalide"); return; }
    const updated = { ...payDoc, paiements: [...(payDoc.paiements || []), { montant: m, date: pay.date, mode: pay.mode }] };
    updated.statut = statutApresPaiement(updated);
    await saveDoc(user, updated);
    setPayDoc(null);
    await reload(user);
    toast("Paiement enregistré ✓");
  };

  const doImport = async () => {
    const n = await importLocalDocs(user);
    setLocalCount(countLocalDocs());
    await reload(user);
    toast(n + " document(s) importé(s) dans votre compte");
  };

  if (loading) return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  const nom = user?.user_metadata?.entreprise?.nom || user?.user_metadata?.nom || (user?.email || "").split("@")[0];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <AppNav user={user} />

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "22px 18px 60px" }}>
        {!user && (
          <Card style={{ background: "#FFF8EC", border: "1px solid #F1DFBB", padding: "13px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13.5, color: "#7A5A10" }}><b>Mode invité :</b> vos documents sont enregistrés sur cet appareil uniquement.</div>
            <Btn size="sm" onClick={() => router.push("/auth")}>Créer un compte gratuit</Btn>
          </Card>
        )}
        {user && localCount > 0 && (
          <Card style={{ background: T.leafBg, border: "1px solid #CBE7B8", padding: "13px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13.5, color: T.leafDark }}><b>{localCount} document(s)</b> créé(s) en mode invité sur cet appareil.</div>
            <Btn size="sm" variant="leaf" onClick={doImport}>Importer dans mon compte</Btn>
          </Card>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, margin: "0 0 4px" }}>{nom ? `Bonjour, ${nom} 👋` : "Tableau de bord"}</h1>
            <div style={{ color: T.inkLight, fontSize: 13.5 }}>Documents, encaissements et suivi en un coup d'œil.</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 13, marginBottom: 14 }}>
          <StatCard label="CA facturé" value={fmtDA(stats.ca)} color={T.accent} icon="🧾" />
          <StatCard label="Encaissé" value={fmtDA(stats.paye)} color={T.success} icon="✅" />
          <StatCard label="En attente" value={fmtDA(stats.attente)} color={T.warning} icon="⏳" />
          <StatCard label="En retard" value={fmtDA(stats.retard)} color={stats.retard > 0 ? T.danger : T.inkLight} icon="⏰" />
          <StatCard label="Documents" value={docs.length} icon="📄" />
        </div>

        {docs.length > 0 && <div style={{ marginBottom: 22 }}><ChartCA docs={docs} /></div>}

        {/* Filtres */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          <div style={{ width: 210 }}><Input value={search} onChange={setSearch} placeholder="🔎 Numéro ou client…" /></div>
          <div style={{ width: 170 }}>
            <Sel value={fType} onChange={setFType} options={[{ value: "ALL", label: "Tous les types" }, ...Object.entries(DOC_TYPES).map(([k, v]) => ({ value: k, label: v.label }))]} />
          </div>
          <div style={{ width: 160 }}>
            <Sel value={fStatut} onChange={setFStatut} options={[{ value: "ALL", label: "Tous les statuts" }, ...Object.entries(STATUTS).map(([k, v]) => ({ value: k, label: v.label }))]} />
          </div>
          <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Btn size="sm" onClick={exportCsv}>⇩ Exporter CSV</Btn>
            <Btn variant="primary" size="sm" onClick={() => router.push("/nouveau")}>+ Nouveau document</Btn>
          </span>
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <Empty text={docs.length === 0 ? "Aucun document pour l'instant. Créez le premier en 60 secondes." : "Aucun résultat pour ces filtres."}
            action={docs.length === 0 && <Btn variant="primary" onClick={() => router.push("/nouveau")}>Créer mon premier document →</Btn>} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((d) => {
              const ti = DOC_TYPES[d.type] || DOC_TYPES.FACTURE;
              const si = STATUTS[d.statut] || STATUTS.BROUILLON;
              const t = calcTotaux(d);
              const showPrix = d.type !== "BON_LIVRAISON";
              const conv = CONVERSIONS[d.type] || [];
              const retard = isOverdue(d);
              return (
                <Card key={d.id} style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 13, cursor: "pointer", transition: "border-color .13s, box-shadow .13s" }}
                  onClick={() => router.push("/document/" + d.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.leafDark; e.currentTarget.style.boxShadow = "0 3px 14px rgba(19,37,30,.07)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{ti.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: ti.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{ti.label}</span>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{d.numero}</span>
                      <Badge label={si.label} color={si.color} />
                      {retard && <Badge label="⏰ En retard" color={T.danger} />}
                      {d.reference && <span style={{ fontSize: 11, color: T.inkLight }} className="hide-sm">← {d.reference}</span>}
                    </div>
                    <div style={{ color: T.inkLight, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.client?.nom || "Client non défini"} · {d.date}
                    </div>
                  </div>
                  {showPrix && (
                    <div style={{ textAlign: "right", flexShrink: 0 }} className="hide-sm">
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{fmtDA(t.net)}</div>
                      {t.paye > 0 && t.solde > 0.009 && <div style={{ color: T.warning, fontSize: 11 }}>reste {fmtDA(t.solde)}</div>}
                    </div>
                  )}
                  <span onClick={(e) => e.stopPropagation()}>
                    <Menu items={[
                      { icon: "👁", label: "Voir le document", onClick: () => router.push("/document/" + d.id) },
                      { icon: "✏️", label: "Modifier", onClick: () => router.push("/nouveau?id=" + d.id) },
                      { icon: "📑", label: "Dupliquer", onClick: () => duplicate(d) },
                      ...(showPrix && d.statut !== "PAYE" ? [{ icon: "💰", label: "Enregistrer un paiement", onClick: () => openPay(d) }] : []),
                      ...(conv.length ? ["—", ...conv.map((c) => ({ icon: "🔄", label: "→ " + DOC_TYPES[c].label, onClick: () => convert(d, c) }))] : []),
                      "—",
                      { icon: "💬", label: "Envoyer par WhatsApp", onClick: () => envoyerWa(d) },
                      { icon: "✉️", label: "Envoyer par email", onClick: () => envoyerEmail(d) },
                      "—",
                      { icon: "🗑", label: "Supprimer", danger: true, onClick: () => remove(d) },
                    ]} />
                  </span>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale paiement */}
      <Modal open={!!payDoc} onClose={() => setPayDoc(null)} title={"Paiement · " + (payDoc?.numero || "")} width={420}>
        {payDoc && (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ fontSize: 13, color: T.inkMid }}>
              Net à payer : <b>{fmtDA(calcTotaux(payDoc).net)}</b> · Solde restant : <b style={{ color: T.warning }}>{fmtDA(Math.max(0, calcTotaux(payDoc).solde))}</b>
            </div>
            <div><Lbl>Montant reçu (DA)</Lbl><Input type="number" min="0" step="any" value={pay.montant} onChange={(v) => setPay({ ...pay, montant: v })} /></div>
            <div className="grid-2">
              <div><Lbl>Date</Lbl><Input type="date" value={pay.date} onChange={(v) => setPay({ ...pay, date: v })} /></div>
              <div><Lbl>Mode</Lbl><Sel value={pay.mode} onChange={(v) => setPay({ ...pay, mode: v })} options={MODES_PAIEMENT} /></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
              <Btn onClick={() => setPayDoc(null)}>Annuler</Btn>
              <Btn variant="primary" onClick={savePay}>Enregistrer le paiement</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Toast msg={msg} />
    </div>
  );
}
