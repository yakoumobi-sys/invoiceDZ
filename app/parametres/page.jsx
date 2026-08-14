"use client";
import { useEffect, useState } from "react";
import { T, MODES_PAIEMENT } from "../../lib/constants";
import { getUser, getProfil, saveProfil, cloudTablesOk, countLocalDocs, importLocalDocs } from "../../lib/db";
import AppNav from "../../components/nav";
import { Btn, Card, Spinner, Input, Sel, Lbl, Toggle, Toast, useToast } from "../../components/ui";

const SQL = `create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  type text not null,
  numero text, statut text, date date,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.documents enable row level security;
drop policy if exists "documents_own" on public.documents;
create policy "documents_own" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.clients (
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
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);`;

export default function ParametresPage() {
  const [user, setUser] = useState(null);
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localCount, setLocalCount] = useState(0);
  const [cloudOk, setCloudOk] = useState(true);
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

  const upP = (k, v) => setProfil({ ...profil, prefs: { ...profil.prefs, [k]: v } });

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

  const prefs = profil.prefs || {};

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <AppNav user={user} />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "22px 18px 60px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, margin: "0 0 4px" }}>Paramètres</h1>
          <div style={{ color: T.inkLight, fontSize: 13.5 }}>Valeurs par défaut de vos documents et gestion de votre compte.</div>
        </div>

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

        {/* Synchronisation cloud documents/clients/produits */}
        {user && !cloudOk && (
          <Card style={{ borderColor: "#F1DFBB", background: "#FFFDF6" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.warning, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Synchronisation cloud</div>
            <div style={{ fontSize: 13.5, color: T.inkMid, lineHeight: 1.7, marginBottom: 12 }}>
              Vos <b>documents, clients et produits</b> sont pour l'instant enregistrés sur cet appareil et ne se retrouvent pas sur vos autres appareils. Pour activer la synchronisation dans le cloud :
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
