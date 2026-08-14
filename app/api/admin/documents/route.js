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

  const emailById = Object.fromEntries(users.map((u) => [u.id, u.email]));

  const rows = docs.map((r) => ({
    id: r.id,
    numero: r.numero,
    type: r.type,
    statut: r.statut,
    date: r.date,
    created_at: r.created_at,
    user_id: r.user_id,
    email: emailById[r.user_id] || "—",
    client: r.data?.client?.nom || "",
    net: r.type !== "BON_LIVRAISON" ? calcTotaux(r.data || {}).net : null,
  }));

  return NextResponse.json({ documents: rows });
}
