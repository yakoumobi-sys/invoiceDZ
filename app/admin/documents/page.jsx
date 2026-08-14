"use client";
import { useEffect, useMemo, useState } from "react";
import { T, DOC_TYPES, STATUTS } from "../../../lib/constants";
import { fmtDA } from "../../../lib/facture.mjs";
import { adminFetch } from "../../../lib/adminClient";
import { downloadTextFile } from "../../../lib/partage";
import AdminGate from "../../../components/AdminGate";
import AdminNav from "../../../components/AdminNav";
import { Card, Spinner, Empty, Input, Sel, Badge, Btn, Modal } from "../../../components/ui";
import DocPreview from "../../../components/DocPreview";

const fmtDateFr = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

function esc(v) {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csvAllDocs(docs) {
  const header = ["Numéro", "Type", "Statut", "Client", "Propriétaire", "Date", "Net à payer (DA)"];
  const rows = docs.map((d) => [
    d.numero || "", (DOC_TYPES[d.type] || {}).label || d.type, (STATUTS[d.statut] || {}).label || d.statut,
    d.client || "", d.email || "", fmtDateFr(d.date), d.net != null ? d.net.toFixed(2) : "",
  ]);
  return [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
}

function AdminDocumentsContent() {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("ALL");
  const [preview, setPreview] = useState(null); // { loading | doc }
  const [previewErr, setPreviewErr] = useState(null);

  useEffect(() => {
    (async () => {
      try { setDocs((await adminFetch("/api/admin/documents")).documents); }
      catch (e) { setError(e.message); }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!docs) return [];
    const q = search.toLowerCase();
    return docs.filter((d) => {
      if (fType !== "ALL" && d.type !== fType) return false;
      if (q && !(d.numero || "").toLowerCase().includes(q) && !(d.client || "").toLowerCase().includes(q) && !(d.email || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [docs, search, fType]);

  const exportCsv = () => {
    if (!filtered.length) return;
    downloadTextFile(`invoicedz-documents-tous-${new Date().toISOString().slice(0, 10)}.csv`, csvAllDocs(filtered));
  };

  const openPreview = async (id) => {
    setPreview("loading");
    setPreviewErr(null);
    try {
      const { doc } = await adminFetch(`/api/admin/documents/${id}`);
      setPreview(doc);
    } catch (e) {
      setPreview(null);
      setPreviewErr(e.message);
    }
  };

  if (error) return <div style={{ maxWidth: 1180, margin: "40px auto", padding: "0 18px", color: T.danger }}>Erreur : {error}</div>;
  if (!docs) return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 18px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, margin: "0 0 4px" }}>Documents</h1>
          <div style={{ color: T.inkLight, fontSize: 13.5 }}>{docs.length} document{docs.length > 1 ? "s" : ""}, tous comptes confondus.</div>
        </div>
        <Btn size="sm" onClick={exportCsv}>⇩ Exporter CSV</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ width: 260 }}><Input value={search} onChange={setSearch} placeholder="🔎 Numéro, client ou email…" /></div>
        <div style={{ width: 190 }}>
          <Sel value={fType} onChange={setFType} options={[{ value: "ALL", label: "Tous les types" }, ...Object.entries(DOC_TYPES).map(([k, v]) => ({ value: k, label: v.label }))]} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon="🧾" text={docs.length === 0 ? "Aucun document pour l'instant." : "Aucun résultat pour ces filtres."} />
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + T.border, background: T.bg }}>
                  {["Document", "Client", "Propriétaire", "Date", "Montant", ""].map((h, i) => (
                    <th key={i} style={{ color: T.inkLight, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "11px 14px", textAlign: i >= 4 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const ti = DOC_TYPES[d.type] || DOC_TYPES.FACTURE;
                  const si = STATUTS[d.statut] || STATUTS.BROUILLON;
                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid " + T.border, cursor: "pointer" }}
                      onClick={() => openPreview(d.id)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{ti.icon}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{d.numero}</div>
                            <Badge label={si.label} color={si.color} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: T.inkMid }}>{d.client || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12.5, color: T.inkLight }}>{d.email}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12.5, color: T.inkMid, textAlign: "right" }}>{fmtDateFr(d.date)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, textAlign: "right" }}>{d.net != null ? fmtDA(d.net) : "—"}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, color: T.leafDark, fontWeight: 700 }}>Voir →</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={!!preview} onClose={() => { setPreview(null); setPreviewErr(null); }} title="Aperçu du document" width={860}>
        {preview === "loading" && <div style={{ padding: 30, textAlign: "center" }}><Spinner /></div>}
        {previewErr && <div style={{ color: T.danger, fontSize: 13.5 }}>Erreur : {previewErr}</div>}
        {preview && preview !== "loading" && <DocPreview doc={preview} />}
      </Modal>
    </div>
  );
}

export default function AdminDocumentsPage() {
  return (
    <AdminGate>
      <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
        <AdminNav />
        <AdminDocumentsContent />
      </div>
    </AdminGate>
  );
}
