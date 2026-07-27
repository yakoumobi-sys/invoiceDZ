"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { T, DOC_TYPES, STATUTS, STATUTS_PAR_TYPE, MODES_PAIEMENT, UNITES, newDoc, emptyLigne } from "../../lib/constants";
import { calcLigne, calcTotaux, fmtDA, nextNumero } from "../../lib/facture.mjs";
import { getUser, getProfil, listDocs, listClients, listProduits, saveDoc, saveClient, getDoc } from "../../lib/db";
import { Btn, Input, Sel, Lbl, Card, Badge, Logo, Spinner, Toggle, Toast, useToast } from "../../components/ui";
import DocPreview, { printDoc } from "../../components/DocPreview";

const resizeImage = (file, maxW = 420) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, maxW / img.width);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/png"));
      };
      img.onerror = rej; img.src = r.result;
    };
    r.onerror = rej; r.readAsDataURL(file);
  });

/* ── Étape 1 : type ── */
function Step1({ onChoix }) {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "44px 20px" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.leafDark, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Étape 1 / 3</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, margin: 0 }}>Quel document voulez-vous créer ?</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 }}>
        {Object.entries(DOC_TYPES).map(([k, ti]) => (
          <button key={k} onClick={() => onChoix(k)}
            style={{ background: T.white, border: "2px solid " + T.border, borderRadius: 13, padding: "20px 16px", textAlign: "left", cursor: "pointer", fontFamily: "inherit", transition: "all .14s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ti.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "none"; }}>
            <div style={{ fontSize: 27, marginBottom: 10 }}>{ti.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 4 }}>{ti.label}</div>
            <div style={{ fontSize: 12, color: T.inkLight, lineHeight: 1.5 }}>{ti.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Étape 2 : saisie ── */
function Step2({ doc, onChange, onNext, onBack, clients, produits, addToCrm, setAddToCrm, editMode }) {
  const up = (path, val) => {
    const parts = path.split(".");
    const next = { ...doc }; let o = next;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] = { ...o[parts[i]] };
    o[parts[parts.length - 1]] = val;
    onChange(next);
  };
  const upL = (id, f, v) =>
    onChange({ ...doc, lignes: doc.lignes.map((l) => (l.id === id ? { ...l, [f]: ["designation", "unite"].includes(f) ? v : (v === "" ? "" : parseFloat(v) || 0) } : l)) });

  const pickProduit = (id, val) => {
    const p = produits.find((x) => x.designation === val);
    if (p) onChange({ ...doc, lignes: doc.lignes.map((l) => (l.id === id ? { ...l, designation: p.designation, unite: p.unite || l.unite, prixUnitaire: +p.prixUnitaire || 0, tva: p.tva != null ? +p.tva : l.tva } : l)) });
    else upL(id, "designation", val);
  };

  const pickClient = (id) => {
    if (id === "new") { onChange({ ...doc, client: { id: null, nom: "", adresse: "", ville: "", email: "", telephone: "", nif: "", rc: "" } }); return; }
    const c = clients.find((x) => String(x.id) === id);
    if (c) onChange({ ...doc, client: { id: c.id, nom: c.nom || "", adresse: c.adresse || "", ville: c.ville || "", email: c.email || "", telephone: c.telephone || "", nif: c.nif || "", rc: c.rc || "" } });
  };

  const addL = () => onChange({ ...doc, lignes: [...doc.lignes, emptyLigne()] });
  const delL = (id) => doc.lignes.length > 1 && onChange({ ...doc, lignes: doc.lignes.filter((l) => l.id !== id) });

  const showPrix = doc.type !== "BON_LIVRAISON";
  const showTVA = doc.tvaActive && showPrix;
  const t = calcTotaux(doc);
  const ti = DOC_TYPES[doc.type];
  const nouveauClient = !doc.client?.id;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.leafDark, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Étape 2 / 3</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{ti.icon}</span>
            <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.4, margin: 0 }}>{editMode ? "Modifier " : ""}{ti.label}</h2>
            <Badge label={doc.numero || "…"} color={ti.color} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!editMode && <Btn size="sm" onClick={onBack}>← Type</Btn>}
          <Btn variant="primary" size="sm" onClick={onNext}>Aperçu →</Btn>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {/* Document */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 15 }}>Document</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 13 }}>
            <div><Lbl>Numéro</Lbl><Input value={doc.numero} onChange={(v) => up("numero", v)} /></div>
            <div><Lbl>Statut</Lbl><Sel value={doc.statut} onChange={(v) => up("statut", v)} options={STATUTS_PAR_TYPE[doc.type].map((s) => ({ value: s, label: STATUTS[s].label }))} /></div>
            <div><Lbl>Date</Lbl><Input type="date" value={doc.date} onChange={(v) => up("date", v)} /></div>
            {showPrix && <div><Lbl>Échéance</Lbl><Input type="date" value={doc.dateEcheance} onChange={(v) => up("dateEcheance", v)} /></div>}
          </div>
        </Card>

        {/* Client (CRM) */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 15 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1.5, textTransform: "uppercase" }}>
              {doc.type === "BON_COMMANDE" ? "Fournisseur" : "Client"}
            </div>
            {clients.length > 0 && (
              <div style={{ minWidth: 230 }}>
                <Sel value={doc.client?.id ? String(doc.client.id) : "new"} onChange={pickClient}
                  options={[{ value: "new", label: "＋ Nouveau client" }, ...clients.map((c) => ({ value: String(c.id), label: c.nom }))]} />
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            <div><Lbl>Nom / Entreprise</Lbl><Input value={doc.client?.nom || ""} onChange={(v) => up("client.nom", v)} placeholder="SARL Exemple" /></div>
            <div><Lbl>Téléphone</Lbl><Input value={doc.client?.telephone || ""} onChange={(v) => up("client.telephone", v)} placeholder="05XX XX XX XX" /></div>
            <div><Lbl>Email</Lbl><Input value={doc.client?.email || ""} onChange={(v) => up("client.email", v)} placeholder="client@email.dz" /></div>
            <div><Lbl>Adresse</Lbl><Input value={doc.client?.adresse || ""} onChange={(v) => up("client.adresse", v)} /></div>
            <div><Lbl>Ville</Lbl><Input value={doc.client?.ville || ""} onChange={(v) => up("client.ville", v)} placeholder="Alger" /></div>
            <div><Lbl>NIF</Lbl><Input value={doc.client?.nif || ""} onChange={(v) => up("client.nif", v)} /></div>
          </div>
          {nouveauClient && (doc.client?.nom || "").trim() && (
            <div style={{ marginTop: 13 }}>
              <Toggle on={addToCrm} onChange={setAddToCrm} label="Ajouter ce client à mon répertoire" />
            </div>
          )}
        </Card>

        {/* Lignes */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1.5, textTransform: "uppercase" }}>Lignes</div>
            {showPrix && <Toggle on={doc.tvaActive} onChange={(v) => up("tvaActive", v)} label="TVA" />}
          </div>
          {produits.length > 0 && (
            <div style={{ fontSize: 12, color: T.inkLight, marginBottom: 10 }}>💡 Tapez une désignation de votre catalogue : prix, unité et TVA se remplissent seuls.</div>
          )}
          <datalist id="dl-produits">{produits.map((p) => <option key={p.id} value={p.designation} />)}</datalist>
          <datalist id="dl-unites">{UNITES.map((u) => <option key={u} value={u} />)}</datalist>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: showPrix ? 660 : 380 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + T.border }}>
                  {["Désignation", "Qté", "Unité", ...(showPrix ? ["P.U. HT", "Rem %", ...(showTVA ? ["TVA %"] : []), "Total HT"] : []), ""].map((h, i) => (
                    <th key={i} style={{ color: T.inkLight, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "0 6px 9px", textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doc.lignes.map((l) => {
                  const { ht } = calcLigne(l);
                  return (
                    <tr key={l.id} style={{ borderBottom: "1px solid " + T.border }}>
                      <td style={{ padding: "7px 6px", minWidth: 170 }}><Input list="dl-produits" value={l.designation} onChange={(v) => pickProduit(l.id, v)} placeholder="Produit ou service…" /></td>
                      <td style={{ padding: "7px 4px", width: 62 }}><Input value={l.quantite} onChange={(v) => upL(l.id, "quantite", v)} type="number" min="0" step="any" style={{ textAlign: "right" }} /></td>
                      <td style={{ padding: "7px 4px", width: 84 }}><Input list="dl-unites" value={l.unite} onChange={(v) => upL(l.id, "unite", v)} /></td>
                      {showPrix && <>
                        <td style={{ padding: "7px 4px", width: 96 }}><Input value={l.prixUnitaire} onChange={(v) => upL(l.id, "prixUnitaire", v)} type="number" min="0" step="any" style={{ textAlign: "right" }} /></td>
                        <td style={{ padding: "7px 4px", width: 58 }}><Input value={l.remise} onChange={(v) => upL(l.id, "remise", v)} type="number" min="0" style={{ textAlign: "right" }} /></td>
                        {showTVA && <td style={{ padding: "7px 4px", width: 58 }}><Input value={l.tva} onChange={(v) => upL(l.id, "tva", v)} type="number" min="0" style={{ textAlign: "right" }} /></td>}
                        <td style={{ padding: "7px 6px", width: 104, textAlign: "right", fontSize: 13, fontWeight: 700, color: T.inkMid }}>{ht.toLocaleString("fr-DZ", { minimumFractionDigits: 2 })}</td>
                      </>}
                      <td style={{ padding: "7px 2px", width: 26, textAlign: "center" }}>
                        <button onClick={() => delL(l.id)} aria-label="Supprimer la ligne"
                          style={{ background: "none", border: "none", color: "#C6CEC6", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}
                          onMouseEnter={(e) => (e.target.style.color = T.danger)} onMouseLeave={(e) => (e.target.style.color = "#C6CEC6")}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Btn size="sm" onClick={addL} style={{ marginTop: 12 }}>+ Ajouter une ligne</Btn>

          {showPrix && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginTop: 18, gap: 7 }}>
              <div style={{ display: "flex", gap: 26, fontSize: 13 }}><span style={{ color: T.inkLight }}>Sous-total HT</span><span style={{ fontWeight: 600 }}>{fmtDA(t.sous)}</span></div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: T.inkLight }}>Remise globale</span>
                <Input value={doc.remiseGlobale} onChange={(v) => up("remiseGlobale", parseFloat(v) || 0)} type="number" min="0" style={{ width: 62, textAlign: "right" }} />
                <span style={{ fontSize: 13, color: T.inkLight }}>%</span>
              </div>
              {showTVA && <div style={{ display: "flex", gap: 26, fontSize: 13 }}><span style={{ color: T.inkLight }}>TVA</span><span style={{ fontWeight: 600 }}>{fmtDA(t.totalTVA)}</span></div>}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: T.inkLight }}>Mode de paiement</span>
                <div style={{ width: 210 }}><Sel value={doc.modePaiement || "VIREMENT"} onChange={(v) => up("modePaiement", v)} options={MODES_PAIEMENT} /></div>
              </div>
              {t.timbre > 0 && <div style={{ display: "flex", gap: 26, fontSize: 13 }}><span style={{ color: T.warning }}>Droit de timbre (espèces)</span><span style={{ fontWeight: 600, color: T.warning }}>{fmtDA(t.timbre)}</span></div>}
              <div style={{ display: "flex", gap: 26, fontSize: 17, fontWeight: 800, color: T.accent, borderTop: "2px solid " + T.ink, paddingTop: 10 }}>
                <span>NET À PAYER</span><span>{fmtDA(t.net)}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Conditions & notes */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 15 }}>Conditions & notes</div>
          <div className="grid-2">
            {showPrix && <div><Lbl>Conditions de paiement</Lbl><Input value={doc.conditionsPaiement || ""} onChange={(v) => up("conditionsPaiement", v)} /></div>}
            <div><Lbl>Notes</Lbl><Input value={doc.notes || ""} onChange={(v) => up("notes", v)} placeholder="Visible en bas du document" /></div>
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
        <Btn variant="primary" size="lg" onClick={onNext}>Aperçu & export →</Btn>
      </div>
    </div>
  );
}

/* ── Étape 3 : aperçu ── */
function Step3({ doc, onBack, onSave, saving }) {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.leafDark, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Étape 3 / 3</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.4, margin: 0 }}>Aperçu & export</h2>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn size="sm" onClick={onBack}>← Modifier</Btn>
          <Btn size="sm" variant="success" onClick={printDoc}>⬇ Télécharger PDF</Btn>
          <Btn variant="primary" size="sm" onClick={onSave} disabled={saving}>{saving ? "Enregistrement…" : "✓ Enregistrer"}</Btn>
        </div>
      </div>
      <DocPreview doc={doc} />
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
        <Btn variant="success" onClick={printDoc}>⬇ Télécharger en PDF</Btn>
        <Btn variant="primary" onClick={onSave} disabled={saving}>{saving ? "Enregistrement…" : "✓ Enregistrer au tableau de bord"}</Btn>
      </div>
    </div>
  );
}

/* ── Page ── */
function NouveauContent() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");

  const [step, setStep] = useState(editId ? 0 : 1);
  const [doc, setDoc] = useState(null);
  const [user, setUser] = useState(null);
  const [docs, setDocs] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [profil, setProfil] = useState(null);
  const [addToCrm, setAddToCrm] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, toast] = useToast();

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
      const [p, ds, cs, ps] = await Promise.all([getProfil(u), listDocs(u), listClients(u), listProduits(u)]);
      setProfil(p); setDocs(ds); setClients(cs); setProduits(ps);
      if (editId) {
        const d = await getDoc(u, editId);
        if (d) { setDoc({ ...newDoc(d.type, p.entreprise, p.logo, p.prefs), ...d }); setStep(2); }
        else { toast("Document introuvable"); setStep(1); }
      }
    })();
  }, [editId]);

  const handleChoix = (type) => {
    const d = newDoc(type, profil?.entreprise, profil?.logo, profil?.prefs);
    d.numero = nextNumero(type, docs);
    setDoc(d);
    setStep(2);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (addToCrm && !doc.client?.id && (doc.client?.nom || "").trim()) {
        const c = await saveClient(user, {
          nom: doc.client.nom.trim(), adresse: doc.client.adresse || "", ville: doc.client.ville || "",
          email: doc.client.email || "", telephone: doc.client.telephone || "", nif: doc.client.nif || "", rc: doc.client.rc || "", notes: "",
        });
        if (c?.id) doc.client.id = c.id;
      }
      await saveDoc(user, doc);
      router.push("/dashboard");
    } catch (e) {
      toast("Erreur : " + (e.message || "enregistrement impossible"));
      setSaving(false);
    }
  };

  if (step === 0 || (editId && !doc && step !== 1)) {
    return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;
  }

  return (
    <>
      <div style={{ background: T.white, borderBottom: "1px solid " + T.border, height: 56, display: "flex", alignItems: "center", padding: "0 18px", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/dashboard")}><Logo size={24} /></span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }} className="hide-sm">
          {[{ n: 1, l: "Type" }, { n: 2, l: "Saisie" }, { n: 3, l: "Export" }].map((s, i) => (
            <span key={s.n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 23, height: 23, borderRadius: 12, background: step >= s.n ? T.accent : T.border, color: step >= s.n ? "#fff" : T.inkLight, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{s.n}</span>
              <span style={{ fontSize: 12, color: step === s.n ? T.ink : T.inkLight, fontWeight: step === s.n ? 700 : 400 }}>{s.l}</span>
              {i < 2 && <span style={{ color: T.border, fontSize: 14 }}>›</span>}
            </span>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {!user && <Badge label="Mode invité" color={T.warning} />}
          <Btn variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>Tableau de bord</Btn>
        </div>
      </div>

      {step === 1 && <Step1 onChoix={handleChoix} />}
      {step === 2 && doc && <Step2 doc={doc} onChange={setDoc} onNext={() => setStep(3)} onBack={() => setStep(1)} clients={clients} produits={produits} addToCrm={addToCrm} setAddToCrm={setAddToCrm} editMode={!!editId} />}
      {step === 3 && doc && <Step3 doc={doc} onBack={() => setStep(2)} onSave={handleSave} saving={saving} />}
      <Toast msg={msg} />
    </>
  );
}

export default function NouveauPage() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <Suspense fallback={<div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>}>
        <NouveauContent />
      </Suspense>
    </div>
  );
}
