import { NextResponse } from "next/server";
import { requireAdmin, listAllUsers } from "../../../../../lib/adminServer";
import { sendBulk, channelConfigured } from "../../../../../lib/marketing";

export const dynamic = "force-dynamic";

const CHANNELS = ["email", "sms", "whatsapp"];

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let payload;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const { channel, recipientIds, subject, body } = payload || {};
  if (!CHANNELS.includes(channel)) return NextResponse.json({ error: "Canal invalide" }, { status: 400 });
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return NextResponse.json({ error: "Aucun destinataire sélectionné" }, { status: 400 });
  if (!(body || "").trim()) return NextResponse.json({ error: "Message vide" }, { status: 400 });

  if (!channelConfigured(channel)) {
    return NextResponse.json({
      error: `Fournisseur non configuré pour ce canal (${channel}). Ajoutez les identifiants du fournisseur en variable d'environnement puis réessayez.`,
      configured: false,
    }, { status: 400 });
  }

  let users;
  try { users = await listAllUsers(); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }

  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  const recipients = recipientIds
    .map((id) => byId[id])
    .filter(Boolean)
    .map((u) => ({
      id: u.id,
      email: u.email,
      telephone: u.user_metadata?.entreprise?.telephone || "",
      prenom: u.user_metadata?.contact?.prenom || "",
      nom: u.user_metadata?.contact?.nom || "",
      entreprise: u.user_metadata?.entreprise?.nom || "",
    }));

  const results = await sendBulk(channel, recipients, { subject, body });
  return NextResponse.json(results);
}
