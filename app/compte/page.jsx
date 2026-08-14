"use client";
import { useEffect, useRef, useState } from "react";
import { T } from "../../lib/constants";
import { getUser, getProfil, saveProfil } from "../../lib/db";
import { resizeImage } from "../../lib/image";
import AppNav from "../../components/nav";
import { Btn, Card, Spinner, Input, Lbl, Toggle, Toast, useToast } from "../../components/ui";

function ImageUpload({ label, hint, value, onPick, onRemove, boxW = 150, boxH = 58 }) {
  const fileRef = useRef(null);
  const handle = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { onPick(await resizeImage(f)); }
    catch { /* image illisible, ignorée silencieusement */ }
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      {value ? (
        <span style={{ position: "relative", display: "inline-block" }}>
          <img src={value} alt={label} style={{ height: boxH, maxWidth: boxW + 60, objectFit: "contain", borderRadius: 8, border: "1px solid " + T.border, background: "#fff", padding: 4 }} />
          <button onClick={onRemove} aria-label={"Retirer : " + label}
            style={{ position: "absolute", top: -8, right: -8, background: T.danger, color: "#fff", border: "none", borderRadius: 10, width: 20, height: 20, fontSize: 12, cursor: "pointer" }}>×</button>
        </span>
      ) : (
        <button onClick={() => fileRef.current?.click()}
          style={{ width: boxW, height: boxH, border: "2px dashed " + T.border, borderRadius: 9, background: "none", cursor: "pointer", color: T.inkLight, fontSize: 13, fontFamily: "inherit" }}>
          📎 {label}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handle} style={{ display: "none" }} />
      {hint && <div style={{ fontSize: 12, color: T.inkLight, lineHeight: 1.7 }}>{hint}</div>}
    </div>
  );
}

export default function ComptePage() {
  const [user, setUser] = useState(null);
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, toast] = useToast();

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
      setProfil(await getProfil(u));
      setLoading(false);
    })();
  }, []);

  const upE = (k, v) => setProfil({ ...profil, entreprise: { ...profil.entreprise, [k]: v } });
  const upP = (k, v) => setProfil({ ...profil, prefs: { ...profil.prefs, [k]: v } });

  const save = async () => {
    setSaving(true);
    await saveProfil(user, profil);
    setSaving(false);
    toast("Compte enregistré ✓");
  };

  if (loading || !profil) return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  const ent = profil.entreprise;
  const prefs = profil.prefs || {};

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <AppNav user={user} />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "22px 18px 60px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, margin: "0 0 4px" }}>Compte</h1>
          <div style={{ color: T.inkLight, fontSize: 13.5 }}>Les informations de votre entreprise, votre signature et votre cachet.</div>
        </div>

        {/* Entreprise */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 15 }}>Votre entreprise</div>
          <div style={{ marginBottom: 15 }}>
            <ImageUpload label="Ajouter un logo" hint={<>Apparaît en haut de vos documents.<br />PNG transparent recommandé.</>}
              value={profil.logo} onPick={(v) => setProfil({ ...profil, logo: v })} onRemove={() => setProfil({ ...profil, logo: null })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            <div><Lbl>Nom</Lbl><Input value={ent.nom} onChange={(v) => upE("nom", v)} placeholder="Djimmy Prints" /></div>
            <div><Lbl>Téléphone</Lbl><Input value={ent.telephone} onChange={(v) => upE("telephone", v)} /></div>
            <div><Lbl>Email</Lbl><Input value={ent.email} onChange={(v) => upE("email", v)} /></div>
            <div><Lbl>Adresse</Lbl><Input value={ent.adresse} onChange={(v) => upE("adresse", v)} /></div>
            <div><Lbl>Ville</Lbl><Input value={ent.ville} onChange={(v) => upE("ville", v)} /></div>
            <div><Lbl>Code</Lbl><Input value={ent.code} onChange={(v) => upE("code", v)} /></div>
            <div><Lbl>Registre de commerce (RC)</Lbl><Input value={ent.rc} onChange={(v) => upE("rc", v)} /></div>
            <div><Lbl>NIF</Lbl><Input value={ent.nif} onChange={(v) => upE("nif", v)} /></div>
            <div><Lbl>Article d'imposition (AI)</Lbl><Input value={ent.ai} onChange={(v) => upE("ai", v)} /></div>
            <div><Lbl>NIS</Lbl><Input value={ent.idFiscal} onChange={(v) => upE("idFiscal", v)} /></div>
          </div>
        </Card>

        {/* Signature & cachet */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 15 }}>Signature et cachet</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Lbl>Signature</Lbl>
              <ImageUpload label="Ajouter une signature" value={profil.signature}
                onPick={(v) => setProfil({ ...profil, signature: v })} onRemove={() => setProfil({ ...profil, signature: null })} />
            </div>
            <div>
              <Lbl>Cachet</Lbl>
              <ImageUpload label="Ajouter un cachet" value={profil.cachet}
                onPick={(v) => setProfil({ ...profil, cachet: v })} onRemove={() => setProfil({ ...profil, cachet: null })} />
            </div>
          </div>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid " + T.border }}>
            <Toggle on={prefs.afficherSignature === true} onChange={(v) => upP("afficherSignature", v)} label="Afficher automatiquement la signature et le cachet sur tous mes documents" />
          </div>
        </Card>

        <div><Btn variant="primary" onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Btn></div>
      </div>
      <Toast msg={msg} />
    </div>
  );
}
