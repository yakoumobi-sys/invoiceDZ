"use client";
import { useEffect, useRef, useState } from "react";
import { T, MODES_PAIEMENT } from "../../lib/constants";
import { getUser, getProfil, saveProfil, cloudTablesOk, countLocalDocs, importLocalDocs } from "../../lib/db";
import AppNav from "../../components/nav";
import { Btn, Card, Spinner, Input, Sel, Lbl, Toggle, Toast, useToast } from "../../components/ui";

const SQL = `create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  nom text not null,
  telephone text, email text, adresse text, ville text, nif text, rc text, notes text,
  created_at timestamptz not null default now()
);
alter table public.clients enable row level security;
drop policy if exists "clients_own" on public.clients;
create policy "clients_own" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.produits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  designation text not null,
  unite text default 'Unité',
  "prixUnitaire" numeric default 0,
  tva numeric default 19,
  created_at timestamptz not null default now()
);
alter table public.produits enable row level security;
drop policy if exists "produits_own" on public.produits;
create policy "produits_own" on public.produits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.documents enable row level security;
drop policy if exists "documents_own" on public.documents;
create policy "documents_own" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);`;

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

export default function ParametresPage() {
  const [user, setUser] = useState(null);
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localCount, setLocalCount] = useState(0);
  const [cloudOk, setCloudOk] = useState(true);
  const fileRef = useRef(null);
  const [msg, toast] = useToast();

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
      setProfil(await getProfil(u));
      setLocalCount(countLocalDocs());
      setCloudOk(cloudTablesOk());
      setLoading(false);
    })();
  }, []);

  const upE = (k, v) => setProfil({ ...profil, entreprise: { ...profil.entreprise, [k]: v } });
  const upP = (k, v) => setProfil({ ...profil, prefs: { ...profil.prefs, [k]: v } });

  const handleLogo = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { setProfil({ ...profil, logo: await resizeImage(f) }); }
    catch { toast("Image illisible"); }
  };

  const save = async () => {
    setSaving(true);
    await saveProfil(user, profil);
    setSaving(false);
    toast("Paramètres enregistrés ✓");
  };

  const copySql = async () => {
    try { await navigator.clipboard.writeText(SQL); toast("Script SQL copié ✓"); }
    catch { toast("Copie impossible — sélectionnez le texte manuellement"); }
  };

  const retryCloud = () => {
    try { localStorage.removeItem("idz.tables"); } catch {}
    location.reload();
  };

  const doImport = async () => {
    const n = await importLocalDocs(user);
    setLocalCount(countLocalDocs());
    toast(n + " document(s) importé(s) ✓");
  };

  if (loading || !profil) return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  const ent = profil.entreprise;
  const prefs = profil.prefs || {};

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <AppNav user={user} />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "22px 18px 60px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, margin: "0 0 4px" }}>Paramètres</h1>
          <div style={{ color: T.inkLight, fontSize: 13.5 }}>Renseignez votre entreprise une fois : tout se pré-remplit ensuite.</div>
        </div>

        {/* Entreprise */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 15 }}>Votre entreprise</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 15 }}>
            {profil.logo ? (
              <span style={{ position: "relative", display: "inline-block" }}>
                <img src={profil.logo} alt="logo" style={{ height: 56, maxWidth: 160, objectFit: "contain", borderRadius: 8, border: "1px solid " + T.border, background: "#fff", padding: 4 }} />
                <button onClick={() => setProfil({ ...profil, logo: null })} aria-label="Retirer le logo"
                  style={{ position: "absolute", top: -8, right: -8, background: T.danger, color: "#fff", border: "none", borderRadius: 10, width: 20, height: 20, fontSize: 12, cursor: "pointer" }}>×</button>
              </span>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                style={{ width: 150, height: 58, border: "2px dashed " + T.border, borderRadius: 9, background: "none", cursor: "pointer", color: T.inkLight, fontSize: 13, fontFamily: "inherit" }}>
                📎 Ajouter un logo
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: "none" }} />
            <div style={{ fontSize: 12, color: T.inkLight, lineHeight: 1.7 }}>Apparaît en haut de vos documents.<br />PNG transparent recommandé.</div>
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

        {/* Valeurs par défaut */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 15 }}>Valeurs par défaut des documents</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, alignItems: "end" }}>
            <div><Lbl>Conditions de paiement</Lbl><Input value={prefs.conditionsPaiement || "Paiement à réception"} onChange={(v) => upP("conditionsPaiement", v)} /></div>
            <div><Lbl>Mode de paiement</Lbl><Sel value={prefs.modePaiement || "VIREMENT"} onChange={(v) => upP("modePaiement", v)} options={MODES_PAIEMENT} /></div>
            <div style={{ paddingBottom: 8 }}><Toggle on={prefs.tvaActive !== false} onChange={(v) => upP("tvaActive", v)} label="TVA activée par défaut" /></div>
          </div>
          <div style={{ fontSize: 12, color: T.inkLight, marginTop: 12 }}>
            💡 En mode « Espèces », le droit de timbre est calculé automatiquement (barème loi de finances 2025) et le montant en lettres est ajouté sur chaque document chiffré.
          </div>
        </Card>

        <div><Btn variant="primary" onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer les paramètres"}</Btn></div>

        {/* Compte / données */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Compte & données</div>
          {!user ? (
            <div style={{ fontSize: 13.5, color: T.inkMid, lineHeight: 1.7 }}>
              Vous êtes en <b>mode invité</b> : documents, clients et produits sont enregistrés sur cet appareil uniquement.
              Créez un compte gratuit pour les retrouver partout — vous pourrez importer vos documents locaux en un clic.
            </div>
          ) : (
            <div style={{ fontSize: 13.5, color: T.inkMid, lineHeight: 1.7 }}>
              Connecté : <b>{user.email}</b>. Vos documents sont enregistrés dans votre espace privé.
              {localCount > 0 && (
                <div style={{ marginTop: 10 }}>
                  <Btn size="sm" variant="leaf" onClick={doImport}>Importer {localCount} document(s) créé(s) en mode invité</Btn>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Synchronisation cloud clients/produits */}
        {user && !cloudOk && (
          <Card style={{ borderColor: "#F1DFBB", background: "#FFFDF6" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.warning, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Synchronisation cloud (facultatif)</div>
            <div style={{ fontSize: 13.5, color: T.inkMid, lineHeight: 1.7, marginBottom: 12 }}>
              Vos <b>clients et produits</b> sont pour l'instant enregistrés sur cet appareil. Pour les synchroniser dans le cloud :
              ouvrez <b>Supabase → SQL Editor</b>, collez ce script, cliquez <b>Run</b>, puis revenez ici et cliquez « Réessayer ».
            </div>
            <pre style={{ background: "#12362B", color: "#CFE8D2", borderRadius: 10, padding: 14, fontSize: 10.5, lineHeight: 1.55, overflowX: "auto", maxHeight: 220 }}>{SQL}</pre>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Btn size="sm" onClick={copySql}>📋 Copier le script</Btn>
              <Btn size="sm" variant="leaf" onClick={retryCloud}>Réessayer</Btn>
            </div>
          </Card>
        )}
      </div>
      <Toast msg={msg} />
    </div>
  );
}
