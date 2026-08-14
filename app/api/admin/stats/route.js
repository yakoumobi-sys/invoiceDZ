import { NextResponse } from "next/server";
import { requireAdmin, listAllUsers, listAllDocuments } from "../../../../lib/adminServer";
import { calcTotaux } from "../../../../lib/facture.mjs";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let users, docs;
  try {
    [users, docs] = await Promise.all([listAllUsers(), listAllDocuments()]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  let caTotal = 0, caMois = 0, docsThisMonth = 0;
  const byType = {};
  for (const row of docs) {
    byType[row.type] = (byType[row.type] || 0) + 1;
    if ((row.date || "").startsWith(monthKey)) docsThisMonth++;
    if (row.type === "FACTURE") {
      const t = calcTotaux(row.data || {});
      caTotal += t.net;
      if ((row.date || "").startsWith(monthKey)) caMois += t.net;
    }
  }

  const newUsersWeek = users.filter((u) => new Date(u.created_at) >= weekAgo).length;
  const newUsersMonth = users.filter((u) => (u.created_at || "").startsWith(monthKey)).length;

  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ k: d.toISOString().slice(0, 7), l: d.toLocaleDateString("fr-FR", { month: "short" }), v: 0 });
  }
  for (const u of users) {
    const m = months.find((x) => x.k === (u.created_at || "").slice(0, 7));
    if (m) m.v++;
  }

  const sortedUsers = [...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const sortedDocs = [...docs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return NextResponse.json({
    totalUsers: users.length,
    newUsersWeek,
    newUsersMonth,
    totalDocs: docs.length,
    docsThisMonth,
    caTotal,
    caMois,
    byType,
    signupsByMonth: months,
    recentUsers: sortedUsers.slice(0, 8).map((u) => ({
      id: u.id, email: u.email, created_at: u.created_at,
      entreprise: u.user_metadata?.entreprise?.nom || null,
    })),
    recentDocs: sortedDocs.slice(0, 8).map((r) => ({
      id: r.id, numero: r.numero, type: r.type, statut: r.statut, date: r.date,
      client: r.data?.client?.nom || null,
      net: r.type === "FACTURE" ? calcTotaux(r.data || {}).net : null,
    })),
  });
}
