import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/adminServer";
import { emailConfigured, smsConfigured, whatsappConfigured } from "../../../../../lib/marketing";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  return NextResponse.json({
    email: emailConfigured(),
    sms: smsConfigured(),
    whatsapp: whatsappConfigured(),
  });
}
