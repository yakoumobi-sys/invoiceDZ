"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { T, UNITES } from "../../lib/constants";
import { fmtDA } from "../../lib/facture.mjs";
import { getUser, listProduits, saveProduit, deleteProduit, listDocs } from "../../lib/db";
import { csvProduits, downloadTextFile } from "../../lib/partage";
import AppNav from "../../components/nav";
import { Btn, Card, Spinner, Empty, Input, Sel, Lbl, Modal, Menu, Toast, useToast } from "../../components/ui";

const VIDE = { designation: "", unite: "Unité", prixUnitaire: 0, tva: 19 };

export default function ProduitsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [produits, setProduits] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(null);
  const [msg, toast] = useToast();

  const reload = async (u) => {
    const [ps, ds] = await Promise.all([listProduits(u), listDocs(u)]);
    setProduits(ps); setDocs(ds);
  };

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
      await reload(u);
      setLoading(false);
    })();
  }, []);

  /* Statistiques d'usage : nb de fois vendu + quantité + CA généré (factures uniquement) */
  const statsFor = useMemo(() => {
    const map = {};
    for (const p of produits) map[p.id] = { fois: 0, quantite: 0, ca: 0 };
    for (const d of docs) {
      if (d.type !== "FACTURE") continue;
      for (const l of d.lignes || []) {
        const p = produits.find((x) => (x.designation || "").trim().toLowerCase() === (l.designation || "").trim().toLowerCase());
        if (!p) continue;
        const q = +l.quantite || 0, pu = +l.prixUnitaire || 0, rem = +l.remise || 0;
        map[p.id].fois += 1;
        map[p.id].quantite += q;
        map[p.id].ca += q * pu * (1 - rem / 100);
      }
    }
    return map;
  }, [produits, docs]);

  const filtered = produits.filter((p) => {
    const q = search.toLowerCase();
    return !q || (p.designation || "").toLowerCase().includes(q);
  });

  const save = async () => {
    if (!(edit.designation || "").trim()) { toast("La désignation est obligatoire"); return; }
    await saveProduit(user, { ...edit, prixUnitaire: +edit.prixUnitaire || 0, tva: edit.tva === "" ? 0 : +edit.tva || 0 });
    setEdit(null);
    await reload(user);
    toast(edit.id ? "Produit mis à jour ✓" : "Produit ajouté ✓");
  };

  const remove = async (p) => {
    if (!confirm("Supprimer « " + p.designation + " » du catalogue ? Les documents existants ne sont pas modifiés.")) return;
    await deleteProduit(user, p.id);
    await reload(user);
    toast("Produit supprimé");
  };

  const exportCsv = () => {
    if (produits.length === 0) { toast("Aucun produit à exporter"); return; }
    downloadTextFile(`invoicedz-produits-${new Date().toISOString().slice(0, 10)}.csv`, csvProduits(produits));
  };

  if (loading) return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <AppNav user={user} />
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "22px 18px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, margin: "0 0 4px" }}>Produits & services</h1>
            <div style={{ color: T.inkLight, fontSize: 13.5 }}>Votre catalogue : désignation, prix, unité et TVA se remplissent seuls dans vos documents.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" onClick={exportCsv}>⇩ Exporter CSV</Btn>
            <Btn variant="primary" size="sm" onClick={() => setEdit({ ...VIDE })}>+ Ajouter un produit</Btn>
          </div>
        </div>

        <div style={{ width: 260, marginBottom: 14 }}>
          <Input value={search} onChange={setSearch} placeholder="🔎 Rechercher un produit…" />
        </div>

        {filtered.length === 0 ? (
          <Empty icon="📦" text={produits.length === 0 ? "Aucun produit pour l'instant. Ajoutez-en un, il apparaîtra ensuite en suggestion à la création de vos documents." : "Aucun résultat."}
            action={produits.length === 0 && <Btn variant="primary" onClick={() => setEdit({ ...VIDE })}>Ajouter mon premier produit</Btn>} />
        ) : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid " + T.border, background: T.bg }}>
                    {["Désignation", "Unité", "Prix unitaire HT", "TVA", "Vendu", "CA généré", ""].map((h, i) => (
                      <th key={i} style={{ color: T.inkLight, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "11px 14px", textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const s = statsFor[p.id] || { fois: 0, quantite: 0, ca: 0 };
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid " + T.border }}>
                        <td style={{ padding: "12px 14px", fontWeight: 700, fontSize: 13.5 }}>{p.designation}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, color: T.inkMid }}>{p.unite || "Unité"}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontWeight: 600 }}>{fmtDA(p.prixUnitaire)}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, color: T.inkMid }}>{p.tva ?? 19}%</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, color: T.inkLight }}>{s.fois > 0 ? s.fois + "×" : "—"}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: s.ca > 0 ? T.accent : T.inkLight }}>{s.ca > 0 ? fmtDA(s.ca) : "—"}</td>
                        <td style={{ padding: "12px 10px", textAlign: "right" }}>
                          <Menu items={[
                            { icon: "🧾", label: "Utiliser dans un document", onClick: () => router.push("/nouveau") },
                            { icon: "✏️", label: "Modifier", onClick: () => setEdit({ ...VIDE, ...p }) },
                            "—",
                            { icon: "🗑", label: "Supprimer", danger: true, onClick: () => remove(p) },
                          ]} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Modale ajout / édition */}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Modifier le produit" : "Ajouter un produit"} width={480}>
        {edit && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><Lbl>Désignation *</Lbl><Input value={edit.designation} onChange={(v) => setEdit({ ...edit, designation: v })} placeholder="Broderie logo 2 couleurs" /></div>
            <div className="grid-2">
              <div><Lbl>Unité</Lbl><Input list="dl-unites-produits" value={edit.unite} onChange={(v) => setEdit({ ...edit, unite: v })} /></div>
              <div><Lbl>Prix unitaire HT (DA)</Lbl><Input type="number" min="0" step="any" value={edit.prixUnitaire} onChange={(v) => setEdit({ ...edit, prixUnitaire: v })} /></div>
              <div><Lbl>TVA (%)</Lbl><Input type="number" min="0" value={edit.tva} onChange={(v) => setEdit({ ...edit, tva: v })} /></div>
            </div>
            <datalist id="dl-unites-produits">{UNITES.map((u) => <option key={u} value={u} />)}</datalist>
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
