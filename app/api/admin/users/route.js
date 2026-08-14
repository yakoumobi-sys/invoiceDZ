import { NextResponse } from "next/server";
import { requireAdmin, listAllUsers, listAllDocuments, adminEmails } from "../../../../lib/adminServer";
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

  const admins = adminEmails();
  const statsByUser = {};
  for (const row of docs) {
    const s = (statsByUser[row.user_id] ||= { count: 0, ca: 0, lastDate: null });
    s.count++;
    if (row.type === "FACTURE") s.ca += calcTotaux(row.data || {}).net;
    if (!s.lastDate || (row.date || "") > s.lastDate) s.lastDate = row.date;
  }

  const rows = users
    .map((u) => ({
      id: u.id,
      email: u.email,
      entreprise: u.user_metadata?.entreprise?.nom || null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
      confirmed: !!u.email_confirmed_at,
      docs: statsByUser[u.id]?.count || 0,
      ca: statsByUser[u.id]?.ca || 0,
      lastDoc: statsByUser[u.id]?.lastDate || null,
      admin: admins.has((u.email || "").toLowerCase()),
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return NextResponse.json({ users: rows });
}
