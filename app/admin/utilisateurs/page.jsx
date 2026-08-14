"use client";
import { useEffect, useMemo, useState } from "react";
import { T } from "../../../lib/constants";
import { fmtDA } from "../../../lib/facture.mjs";
import { adminFetch } from "../../../lib/adminClient";
import { downloadTextFile } from "../../../lib/partage";
import AdminGate from "../../../components/AdminGate";
import AdminNav from "../../../components/AdminNav";
import { Card, Spinner, Empty, Input, Badge, Btn } from "../../../components/ui";

const fmtDateFr = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

function esc(v) {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csvUsers(users) {
  const header = ["Email", "Entreprise", "Inscrit le", "Dernière connexion", "Documents", "CA généré (DA)", "Confirmé"];
  const rows = users.map((u) => [
    u.email, u.entreprise || "", fmtDateFr(u.created_at), fmtDateFr(u.last_sign_in_at),
    u.docs, u.ca.toFixed(2), u.confirmed ? "Oui" : "Non",
  ]);
  return [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
}

function AdminUsersContent() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try { setUsers((await adminFetch("/api/admin/users")).users); }
      catch (e) { setError(e.message); }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.email || "").toLowerCase().includes(q) || (u.entreprise || "").toLowerCase().includes(q));
  }, [users, search]);

  const exportCsv = () => {
    if (!filtered.length) return;
    downloadTextFile(`invoicedz-utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`, csvUsers(filtered));
  };

  if (error) return <div style={{ maxWidth: 1180, margin: "40px auto", padding: "0 18px", color: T.danger }}>Erreur : {error}</div>;
  if (!users) return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 18px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, margin: "0 0 4px" }}>Utilisateurs</h1>
          <div style={{ color: T.inkLight, fontSize: 13.5 }}>{users.length} compte{users.length > 1 ? "s" : ""} au total.</div>
        </div>
        <Btn size="sm" onClick={exportCsv}>⇩ Exporter CSV</Btn>
      </div>

      <div style={{ width: 280, marginBottom: 14 }}>
        <Input value={search} onChange={setSearch} placeholder="🔎 Email ou entreprise…" />
      </div>

      {filtered.length === 0 ? (
        <Empty icon="👥" text={users.length === 0 ? "Aucun utilisateur pour l'instant." : "Aucun résultat."} />
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + T.border, background: T.bg }}>
                  {["Utilisateur", "Inscrit le", "Dernière connexion", "Documents", "CA généré", ""].map((h, i) => (
                    <th key={i} style={{ color: T.inkLight, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "11px 14px", textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid " + T.border }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{u.entreprise || "—"}</div>
                      <div style={{ fontSize: 12, color: T.inkLight }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 12.5, color: T.inkMid }}>{fmtDateFr(u.created_at)}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 12.5, color: T.inkMid }}>{fmtDateFr(u.last_sign_in_at)}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontWeight: 600 }}>{u.docs}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: u.ca > 0 ? T.accent : T.inkLight }}>{u.ca > 0 ? fmtDA(u.ca) : "—"}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      {u.admin && <Badge label="Admin" color={T.leafDark} />}
                      {!u.confirmed && <span style={{ marginLeft: 6 }}><Badge label="Non confirmé" color={T.warning} /></span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGate>
      <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
        <AdminNav />
        <AdminUsersContent />
      </div>
    </AdminGate>
  );
}
