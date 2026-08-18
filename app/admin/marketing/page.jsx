"use client";
import { useEffect, useMemo, useState } from "react";
import { T } from "../../../lib/constants";
import { adminFetch } from "../../../lib/adminClient";
import AdminGate from "../../../components/AdminGate";
import AdminNav from "../../../components/AdminNav";
import { Card, Spinner, Empty, Input, Sel, Btn, Textarea, Lbl, Badge } from "../../../components/ui";

const CHANNELS = [
  { value: "email", label: "✉️ Email", needs: "email" },
  { value: "sms", label: "💬 SMS", needs: "telephone" },
  { value: "whatsapp", label: "🟢 WhatsApp", needs: "telephone" },
];

const CONFIG_HINT = {
  email: "Ajoutez BREVO_API_KEY et BREVO_SENDER_EMAIL en variable d'environnement (Vercel → Settings → Environment Variables) pour activer l'envoi d'emails.",
  sms: "Ajoutez BREVO_API_KEY pour activer l'envoi de SMS.",
  whatsapp: "Ajoutez TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_WHATSAPP_FROM pour activer WhatsApp.",
};

function AdminMarketingContent() {
  const [users, setUsers] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [secteurFilter, setSecteurFilter] = useState("ALL");
  const [selected, setSelected] = useState(new Set());
  const [channel, setChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [u, c] = await Promise.all([adminFetch("/api/admin/users"), adminFetch("/api/admin/marketing/config")]);
        setUsers(u.users);
        setConfig(c);
      } catch (e) { setError(e.message); }
    })();
  }, []);

  const secteurs = useMemo(() => {
    if (!users) return [];
    return [...new Set(users.map((u) => u.secteur).filter(Boolean))].sort();
  }, [users]);

  const chanDef = CHANNELS.find((c) => c.value === channel);
  const eligible = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => chanDef.needs === "email" ? !!u.email : !!u.telephone);
  }, [users, chanDef]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return eligible.filter((u) => {
      if (secteurFilter !== "ALL" && u.secteur !== secteurFilter) return false;
      if (!q) return true;
      return (u.email || "").toLowerCase().includes(q) || (u.entreprise || "").toLowerCase().includes(q) || (u.prenom || "").toLowerCase().includes(q) || (u.nom || "").toLowerCase().includes(q);
    });
  }, [eligible, search, secteurFilter]);

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => {
    const allSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.id));
    setSelected(allSelected ? new Set() : new Set(filtered.map((u) => u.id)));
  };

  const configured = config?.[channel];

  const send = async () => {
    if (selected.size === 0) { setResult({ error: "Sélectionnez au moins un destinataire." }); return; }
    if (!body.trim()) { setResult({ error: "Le message est vide." }); return; }
    if (!confirm(`Envoyer ce message par ${chanDef.label} à ${selected.size} destinataire(s) ?`)) return;

    setSending(true);
    setResult(null);
    try {
      const json = await adminFetch("/api/admin/marketing/send", {
        method: "POST",
        body: { channel, recipientIds: [...selected], subject, body },
      });
      setResult(json);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setSending(false);
    }
  };

  if (error) return <div style={{ maxWidth: 1180, margin: "40px auto", padding: "0 18px", color: T.danger }}>Erreur : {error}</div>;
  if (!users || !config) return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  const allChecked = filtered.length > 0 && filtered.every((u) => selected.has(u.id));

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 18px 60px" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, margin: "0 0 4px" }}>Marketing</h1>
        <div style={{ color: T.inkLight, fontSize: 13.5 }}>Envoyez un message groupé par email, SMS ou WhatsApp à vos utilisateurs.</div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {CHANNELS.map((c) => (
          <button key={c.value} onClick={() => { setChannel(c.value); setResult(null); }}
            style={{ background: channel === c.value ? T.accent : T.white, color: channel === c.value ? "#fff" : T.ink, border: "1px solid " + (channel === c.value ? T.accent : T.border), borderRadius: 9, padding: "9px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {c.label}
          </button>
        ))}
        <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center" }}>
          {configured ? <Badge label="Configuré" color={T.success} /> : <Badge label="Non configuré" color={T.warning} />}
        </span>
      </div>

      {!configured && (
        <Card style={{ borderColor: "#F1DFBB", background: "#FFFDF6", marginBottom: 16, padding: "13px 16px" }}>
          <div style={{ fontSize: 13.5, color: "#7A5A10" }}>⚠️ {CONFIG_HINT[channel]}</div>
        </Card>
      )}
      {channel === "whatsapp" && (
        <Card style={{ borderColor: "#F1DFBB", background: "#FFFDF6", marginBottom: 16, padding: "13px 16px" }}>
          <div style={{ fontSize: 13.5, color: "#7A5A10" }}>
            ⚠️ WhatsApp Business impose des règles strictes : passé 24h depuis le dernier message d'un contact, seuls des modèles pré-approuvés par Meta peuvent être envoyés — un message libre sera refusé (ou peut faire suspendre le numéro). Vérifiez ces règles avant tout envoi.
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 16 }} className="admin-grid">
        {/* Liste des destinataires */}
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ width: 220 }}><Input value={search} onChange={setSearch} placeholder="🔎 Nom, entreprise, email…" /></div>
            {secteurs.length > 0 && (
              <div style={{ width: 200 }}>
                <Sel value={secteurFilter} onChange={setSecteurFilter} options={[{ value: "ALL", label: "Tous secteurs" }, ...secteurs.map((s) => ({ value: s, label: s }))]} />
              </div>
            )}
            <Btn size="sm" onClick={toggleAll}>{allChecked ? "Tout désélectionner" : "Tout sélectionner"}</Btn>
          </div>

          {filtered.length === 0 ? (
            <Empty icon="👥" text={`Aucun utilisateur avec ${chanDef.needs === "email" ? "un email" : "un téléphone"} pour ce filtre.`} />
          ) : (
            <Card style={{ padding: 0, maxHeight: 480, overflowY: "auto" }}>
              {filtered.map((u) => (
                <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid " + T.border, cursor: "pointer" }}>
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{[u.prenom, u.nom].filter(Boolean).join(" ") || u.entreprise || "—"}</div>
                    <div style={{ fontSize: 11.5, color: T.inkLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {chanDef.needs === "email" ? u.email : u.telephone}{u.secteur ? " · " + u.secteur : ""}
                    </div>
                  </div>
                </label>
              ))}
            </Card>
          )}
        </div>

        {/* Composeur */}
        <div>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
              Message · {selected.size} destinataire{selected.size !== 1 ? "s" : ""} sélectionné{selected.size !== 1 ? "s" : ""}
            </div>
            {channel === "email" && (
              <div style={{ marginBottom: 12 }}><Lbl>Sujet</Lbl><Input value={subject} onChange={setSubject} placeholder="Une nouveauté sur invoicedz" /></div>
            )}
            <div style={{ marginBottom: 8 }}>
              <Lbl>Message</Lbl>
              <Textarea value={body} onChange={setBody} rows={channel === "email" ? 8 : 5} placeholder="Bonjour {prenom}, …" />
            </div>
            <div style={{ fontSize: 11.5, color: T.inkLight, marginBottom: 14 }}>
              Personnalisez avec <code>{"{prenom}"}</code>, <code>{"{nom}"}</code>, <code>{"{entreprise}"}</code>.
              {channel === "sms" && <> · {body.length} caractères ({Math.ceil(body.length / 160) || 1} SMS)</>}
            </div>

            {result?.error && <div style={{ background: "#FDEEEC", border: "1px solid #F5C9C4", borderRadius: 9, padding: "10px 13px", marginBottom: 12, fontSize: 13, color: T.danger }}>{result.error}</div>}
            {result && !result.error && (
              <div style={{ background: result.failed > 0 ? "#FDEEEC" : T.leafBg, border: "1px solid " + (result.failed > 0 ? "#F5C9C4" : "#D6ECC8"), borderRadius: 9, padding: "10px 13px", marginBottom: 12, fontSize: 13, color: result.failed > 0 ? T.danger : T.leafDark }}>
                {result.sent} envoyé(s){result.skippedNotConfigured > 0 ? `, ${result.skippedNotConfigured} non envoyé(s) (fournisseur non configuré)` : ""}{result.skippedNoContact > 0 ? `, ${result.skippedNoContact} sans coordonnée` : ""}{result.failed > 0 ? `, ${result.failed} échec(s)` : ""}.
                {result.errors?.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>{result.errors.join(" · ")}</div>
                )}
              </div>
            )}

            <Btn variant="primary" style={{ width: "100%" }} disabled={sending} onClick={send}>
              {sending ? "Envoi…" : `Envoyer à ${selected.size} destinataire${selected.size !== 1 ? "s" : ""}`}
            </Btn>
          </Card>
        </div>
      </div>

      <style>{`@media (max-width: 900px) { .admin-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

export default function AdminMarketingPage() {
  return (
    <AdminGate>
      <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
        <AdminNav />
        <AdminMarketingContent />
      </div>
    </AdminGate>
  );
}
