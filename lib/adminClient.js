"use client";
/* Petit client fetch pour les routes /api/admin/* : attache le jeton de la
   session Supabase courante (vérifié côté serveur dans lib/adminServer.js). */
import { supabase } from "./supabase.js";

export async function adminFetch(path) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("NO_SESSION");

  const res = await fetch(path, { headers: { Authorization: "Bearer " + token } });
  if (res.status === 401) throw new Error("NO_SESSION");
  if (res.status === 403) throw new Error("FORBIDDEN");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erreur serveur");
  }
  return res.json();
}
