/* ── invoiceDZ · admin (SERVEUR UNIQUEMENT) ──────────────────────────────
   ⚠️ Ce fichier utilise la clé service_role Supabase, qui contourne toute
   la sécurité RLS. Il ne doit JAMAIS être importé depuis un composant
   "use client" ni depuis lib/db.js / lib/supabase.js — uniquement depuis
   des Route Handlers sous app/api/admin/ (exécutés côté serveur,
   jamais envoyés au navigateur). */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cjrkqrqznjhorkgcyirt.supabase.co";

/* Admin(s) par défaut (email non secret) + liste facultative via variable
   d'environnement ADMIN_EMAILS="a@x.com,b@y.com" pour en ajouter sans redéployer. */
const DEFAULT_ADMIN_EMAILS = ["yakoumobi@gmail.com"];

export function adminEmails() {
  const fromEnv = (process.env.ADMIN_EMAILS || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return new Set([...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...fromEnv]);
}

let _admin = null;
export function supabaseAdmin() {
  if (_admin) return _admin;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante (variable d'environnement serveur, à ajouter sur Vercel).");
  _admin = createClient(SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return _admin;
}

/* Vérifie le jeton envoyé par le client (Authorization: Bearer <access_token>)
   et confirme que l'email correspond à un administrateur connu. */
export async function requireAdmin(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return { ok: false, status: 401, error: "Non authentifié" };

  let admin;
  try { admin = supabaseAdmin(); }
  catch (e) { return { ok: false, status: 500, error: e.message }; }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return { ok: false, status: 401, error: "Session invalide" };

  const email = (data.user.email || "").toLowerCase();
  if (!adminEmails().has(email)) return { ok: false, status: 403, error: "Accès refusé" };

  return { ok: true, user: data.user };
}

/* Liste tous les utilisateurs (API Admin GoTrue, paginée). */
export async function listAllUsers() {
  const admin = supabaseAdmin();
  let users = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users = users.concat(data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

/* Tous les documents, toutes tables confondues (bypass RLS). */
export async function listAllDocuments() {
  const admin = supabaseAdmin();
  const { data, error } = await admin.from("documents").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
