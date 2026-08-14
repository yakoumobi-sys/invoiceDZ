import { NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../../../../../lib/adminServer";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = supabaseAdmin();
  const { data, error } = await admin.from("documents").select("*").eq("id", params.id).single();
  if (error || !data) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  return NextResponse.json({
    doc: { ...(data.data || {}), id: data.id, created_at: data.created_at, type: data.type, numero: data.numero, statut: data.statut, date: data.date },
    ownerId: data.user_id,
  });
}
