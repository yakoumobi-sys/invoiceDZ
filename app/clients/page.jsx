"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { T, DOC_TYPES, STATUTS } from "../../lib/constants";
import { calcTotaux, fmtDA } from "../../lib/facture.mjs";
import { getUser, listClients, saveClient, deleteClient, listDocs } from "../../lib/db";
import { waLink, csvClients, downloadTextFile } from "../../lib/partage";
import AppNav from "../../components/nav";
import { Btn, Badge, Card, Spinner, Empty, Input, Textarea, Lbl, Modal, Menu, Toast, useToast } from "../../components/ui";

const VIDE = { nom: "", telephone: "", email: "", adresse: "", ville: "", nif: "", rc: "", notes: "" };

export default function ClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(null);      /* objet client en cours d'édition */
  const [detail, setDetail] = useState(null);  /* client affiché en détail */
  const [msg, toast] = useToast();

  const reload = async (u) => {
    const [cs, ds] = await Promise.all([listClients(u), listDocs(u)]);
    setClients(cs); setDocs(ds);
  };

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
      await reload(u);
      setLoading(false);
    })();
  }, []);

  /* Statistiques par client : rattache par id de client OU par nom exact */
  const statsFor = useMemo(() => {
    const map = {};
    for (const c of clients) map[c.id] = { docs: [], ca: 0, impaye: 0 };
    for (const d of docs) {
      const c = clients.find((x) => (d.client?.id && String(d.client.id) === String(x.id)) || (d.client?.nom && d.client.nom.trim() === (x.nom || "").trim()));
      if (!c) continue;
      const t = calcTotaux(d);
      map[c.id].docs.push(d);
      if (d.type === "FACTURE") {
        map[c.id].ca += t.net;
        if (d.statut !== "PAYE") map[c.id].impaye += Math.max(0, t.solde);
      }
    }
    return map;
  }, [clients, docs]);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return !q || (c.nom || "").toLowerCase().includes(q) || (c.ville || "").toLowerCase().includes(q) || (c.telephone || "").includes(q);
  });

  const save = async () => {
    if (!(edit.nom || "").trim()) { toast("Le nom est obligatoire"); return; }
    await saveClient(user, edit);
    setEdit(null);
    await reload(user);
    toast(edit.id ? "Client mis à jour ✓" : "Client ajouté ✓");
  };

  const remove = async (c) => {
    if (!confirm("Supprimer le client « " + c.nom + " » ? Ses documents existants seront conservés.")) return;
    await deleteClient(user, c.id);
    if (detail?.id === c.id) setDetail(null);
    await reload(user);
    toast("Client supprimé");
  };

  const exportCsv = () => {
    if (clients.length === 0) { toast("Aucun client à exporter"); return; }
    downloadTextFile(`invoicedz-clients-${new Date().toISOString().slice(0, 10)}.csv`, csvClients(clients));
  };

  const contacterWa = (c) => {
    const link = waLink(c.telephone, `Bonjour ${c.nom || ""},`);
    if (!link) { toast("Aucun numéro de téléphone pour ce client"); return; }
    window.open(link, "_blank", "noopener,noreferrer");
  };

  if (loading) return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  const dStats = detail ? statsFor[detail.id] || { docs: [], ca: 0, impaye: 0 } : null;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <AppNav user={user} />
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "22px 18px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, margin: "0 0 4px" }}>Clients</h1>
            <div style={{ color: T.inkLight, fontSize: 13.5 }}>Votre répertoire : coordonnées, historique et impayés par client.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" onClick={exportCsv}>⇩ Exporter CSV</Btn>
            <Btn variant="primary" size="sm" onClick={() => setEdit({ ...VIDE })}>+ Ajouter un client</Btn>
          </div>
        </div>

        <div style={{ width: 260, marginBottom: 14 }}>
          <Input value={search} onChange={setSearch} placeholder="🔎 Nom, ville ou téléphone…" />
        </div>

        {filtered.length === 0 ? (
          <Empty icon="👥" text={clients.length === 0 ? "Aucun client pour l'instant. Ajoutez-en un, ou cochez « Ajouter au répertoire » en créant un document." : "Aucun résultat."}
            action={clients.length === 0 && <Btn variant="primary" onClick={() => setEdit({ ...VIDE })}>Ajouter mon premier client</Btn>} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: detail ? "minmax(0,1fr) minmax(300px,380px)" : "1fr", gap: 16, alignItems: "start" }} className={detail ? "" : ""}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((c) => {
                const s = statsFor[c.id] || { docs: [], ca: 0, impaye: 0 };
                const active = detail?.id === c.id;
                return (
                  <Card key={c.id} style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 13, cursor: "pointer", borderColor: active ? T.leafDark : T.border }}
                    onClick={() => setDetail(active ? null : c)}>
                    <span style={{ width: 38, height: 38, borderRadius: 19, background: T.accentBg, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                      {(c.nom || "?").trim().charAt(0).toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nom}</div>
                      <div style={{ color: T.inkLight, fontSize: 12 }}>{[c.ville, c.telephone].filter(Boolean).join(" · ") || "—"}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }} className="hide-sm">
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{fmtDA(s.ca)}</div>
                      <div style={{ fontSize: 11, color: s.impaye > 0 ? T.warning : T.inkLight }}>
                        {s.impaye > 0 ? "impayé " + fmtDA(s.impaye) : s.docs.length + " doc" + (s.docs.length > 1 ? "s" : "")}
                      </div>
                    </div>
                    <span onClick={(e) => e.stopPropagation()}>
                      <Menu items={[
                        { icon: "🧾", label: "Nouveau document", onClick: () => router.push("/nouveau") },
                        { icon: "💬", label: "Contacter par WhatsApp", onClick: () => contacterWa(c) },
                        { icon: "✏️", label: "Modifier", onClick: () => setEdit({ ...VIDE, ...c }) },
                        "—",
                        { icon: "🗑", label: "Supprimer", danger: true, onClick: () => remove(c) },
                      ]} />
                    </span>
                  </Card>
                );
              })}
            </div>

            {detail && (
              <Card style={{ position: "sticky", top: 74 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: -0.3 }}>{detail.nom}</div>
                    <div style={{ color: T.inkLight, fontSize: 12.5, marginTop: 3, lineHeight: 1.7 }}>
                      {detail.adresse && <div>{detail.adresse}{detail.ville ? ", " + detail.ville : ""}</div>}
                      {!detail.adresse && detail.ville && <div>{detail.ville}</div>}
                      {detail.telephone && <div>{detail.telephone}</div>}
                      {detail.email && <div>{detail.email}</div>}
                      {detail.nif && <div>NIF : {detail.nif}</div>}
                    </div>
                  </div>
                  <Btn size="sm" onClick={() => setEdit({ ...VIDE, ...detail })}>Modifier</Btn>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div style={{ background: T.accentBg, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: T.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6 }}>CA facturé</div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: T.accent }}>{fmtDA(dStats.ca)}</div>
                  </div>
                  <div style={{ background: dStats.impaye > 0 ? "#FDF3E3" : "#EFF6EF", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: dStats.impaye > 0 ? T.warning : T.success, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6 }}>Impayé</div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: dStats.impaye > 0 ? T.warning : T.success }}>{fmtDA(dStats.impaye)}</div>
                  </div>
                </div>
                {detail.notes && <div style={{ fontSize: 12.5, color: T.inkMid, background: T.bg, borderRadius: 9, padding: "9px 12px", marginBottom: 14, whiteSpace: "pre-wrap" }}>{detail.notes}</div>}
                <div style={{ fontSize: 11, fontWeight: 800, color: T.inkLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Historique ({dStats.docs.length})</div>
                {dStats.docs.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: T.inkLight }}>Aucun document pour ce client.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
                    {dStats.docs.map((d) => {
                      const ti = DOC_TYPES[d.type] || DOC_TYPES.FACTURE;
                      const si = STATUTS[d.statut] || STATUTS.BROUILLON;
                      return (
                        <button key={d.id} onClick={() => router.push("/document/" + d.id)}
                          style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg, border: "1px solid " + T.border, borderRadius: 9, padding: "8px 10px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                          <span>{ti.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: 12.5, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.numero}</span>
                          <Badge label={si.label} color={si.color} />
                          {d.type !== "BON_LIVRAISON" && <span style={{ fontSize: 12, fontWeight: 700 }}>{fmtDA(calcTotaux(d).net)}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Modale ajout / édition */}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Modifier le client" : "Ajouter un client"} width={560}>
        {edit && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><Lbl>Nom / Entreprise *</Lbl><Input value={edit.nom} onChange={(v) => setEdit({ ...edit, nom: v })} placeholder="SARL Exemple" /></div>
            <div className="grid-2">
              <div><Lbl>Téléphone</Lbl><Input value={edit.telephone} onChange={(v) => setEdit({ ...edit, telephone: v })} /></div>
              <div><Lbl>Email</Lbl><Input value={edit.email} onChange={(v) => setEdit({ ...edit, email: v })} /></div>
              <div><Lbl>Adresse</Lbl><Input value={edit.adresse} onChange={(v) => setEdit({ ...edit, adresse: v })} /></div>
              <div><Lbl>Ville</Lbl><Input value={edit.ville} onChange={(v) => setEdit({ ...edit, ville: v })} /></div>
              <div><Lbl>NIF</Lbl><Input value={edit.nif} onChange={(v) => setEdit({ ...edit, nif: v })} /></div>
              <div><Lbl>RC</Lbl><Input value={edit.rc} onChange={(v) => setEdit({ ...edit, rc: v })} /></div>
            </div>
            <div><Lbl>Notes internes</Lbl><Textarea value={edit.notes} onChange={(v) => setEdit({ ...edit, notes: v })} placeholder="Remises habituelles, contact, particularités…" /></div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Btn onClick={() => setEdit(null)}>Annuler</Btn>
              <Btn variant="primary" onClick={save}>{edit.id ? "Enregistrer" : "Ajouter"}</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Toast msg={msg} />
    </div>
  );
}
