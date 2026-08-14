"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { T, DOC_TYPES } from "../../lib/constants";
import { fmtDA } from "../../lib/facture.mjs";
import { adminFetch } from "../../lib/adminClient";
import AdminGate from "../../components/AdminGate";
import AdminNav from "../../components/AdminNav";
import { Card, StatCard, Spinner, Badge } from "../../components/ui";

const fmtDateFr = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

/* Mini graphique inscriptions (SVG pur, même style que le dashboard client) */
function SignupsChart({ months }) {
  const max = Math.max(1, ...months.map((m) => m.v));
  const W = 560, H = 110, bw = W / months.length;
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div style={{ fontSize: 11, color: T.inkLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>Inscriptions · 12 mois</div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Inscriptions par mois">
        {months.map((m, i) => {
          const h = Math.round((m.v / max) * H);
          return (
            <g key={m.k}>
              <rect x={i * bw + 5} y={H - h} width={bw - 10} height={Math.max(2, h)} rx="4"
                fill={i === months.length - 1 ? "#63BE3A" : "#1C4A3D"} opacity={m.v === 0 ? 0.16 : 0.92}>
                <title>{m.l} : {m.v}</title>
              </rect>
              <text x={i * bw + bw / 2} y={H + 13} textAnchor="middle" fontSize="9.5" fill={T.inkLight}>{m.l}</text>
            </g>
          );
        })}
      </svg>
    </Card>
  );
}

function TypeBreakdown({ byType }) {
  const total = Object.values(byType).reduce((s, v) => s + v, 0) || 1;
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div style={{ fontSize: 11, color: T.inkLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>Répartition par type</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Object.entries(DOC_TYPES).map(([k, ti]) => {
          const n = byType[k] || 0;
          const pct = Math.round((n / total) * 100);
          return (
            <div key={k}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span>{ti.icon} {ti.label}</span>
                <span style={{ fontWeight: 700 }}>{n}</span>
              </div>
              <div style={{ height: 6, background: T.bg, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: pct + "%", background: ti.color, borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AdminOverview() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try { setStats(await adminFetch("/api/admin/stats")); }
      catch (e) { setError(e.message); }
    })();
  }, []);

  if (error) {
    return <div style={{ maxWidth: 1180, margin: "40px auto", padding: "0 18px", color: T.danger }}>Erreur : {error}</div>;
  }
  if (!stats) {
    return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;
  }

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 18px 60px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, margin: "0 0 4px" }}>Vue d'ensemble</h1>
        <div style={{ color: T.inkLight, fontSize: 13.5 }}>État de la plateforme, tous comptes confondus.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 13, marginBottom: 14 }}>
        <StatCard label="Utilisateurs" value={stats.totalUsers} sub={`+${stats.newUsersWeek} sur 7 jours`} color={T.accent} icon="👥" />
        <StatCard label="Documents" value={stats.totalDocs} sub={`${stats.docsThisMonth} ce mois-ci`} icon="🧾" />
        <StatCard label="CA plateforme" value={fmtDA(stats.caTotal)} sub={`${fmtDA(stats.caMois)} ce mois-ci`} color={T.success} icon="💰" />
        <StatCard label="Nouveaux ce mois" value={stats.newUsersMonth} color={T.leafDark} icon="✨" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", gap: 14, marginBottom: 14 }} className="admin-grid">
        <SignupsChart months={stats.signupsByMonth} />
        <TypeBreakdown byType={stats.byType} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="admin-grid">
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: T.inkLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7 }}>Derniers inscrits</div>
            <button onClick={() => router.push("/admin/utilisateurs")} style={{ background: "none", border: "none", color: T.leafDark, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Tout voir →</button>
          </div>
          {stats.recentUsers.length === 0 ? <div style={{ color: T.inkLight, fontSize: 13 }}>Aucun utilisateur pour l'instant.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.recentUsers.map((u) => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid " + T.border }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.entreprise || u.email}</div>
                    {u.entreprise && <div style={{ fontSize: 11.5, color: T.inkLight }}>{u.email}</div>}
                  </div>
                  <span style={{ fontSize: 11.5, color: T.inkLight, flexShrink: 0 }}>{fmtDateFr(u.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: T.inkLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7 }}>Derniers documents</div>
            <button onClick={() => router.push("/admin/documents")} style={{ background: "none", border: "none", color: T.leafDark, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Tout voir →</button>
          </div>
          {stats.recentDocs.length === 0 ? <div style={{ color: T.inkLight, fontSize: 13 }}>Aucun document pour l'instant.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.recentDocs.map((d) => {
                const ti = DOC_TYPES[d.type] || DOC_TYPES.FACTURE;
                return (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid " + T.border }}>
                    <span>{ti.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{d.numero}</div>
                      <div style={{ fontSize: 11.5, color: T.inkLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.client || "—"}</div>
                    </div>
                    {d.net != null && <span style={{ fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>{fmtDA(d.net)}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <style>{`@media (max-width: 800px) { .admin-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGate>
      <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
        <AdminNav />
        <AdminOverview />
      </div>
    </AdminGate>
  );
}
