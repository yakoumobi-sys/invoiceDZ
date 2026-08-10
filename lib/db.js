"use client";
/* ── invoiceDZ · couche données ──────────────────────────────────────────
   Connecté  : documents → Supabase · clients/produits → Supabase si les
               tables existent, sinon repli transparent sur localStorage.
   Invité    : tout en localStorage (aucun compte requis).
   Toutes les fonctions renvoient des documents "à plat" :
   { id, created_at, type, numero, statut, date, ...contenu } */

import { supabase } from "./supabase.js";

const LS = {
  get(k, fb) {
    if (typeof window === "undefined") return fb;
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; }
  },
  set(k, v) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  },
};

export const uid = () =>
  "L" + (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now());

export const isLocalId = (id) => typeof id === "string" && id.startsWith("L");

/* ---------- session ---------- */
export async function getUser() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user || null;
  } catch { return null; }
}

/* ---------- disponibilité des tables cloud (clients / produits) ---------- */
let tableState = null;
function tables() {
  if (!tableState) tableState = LS.get("idz.tables", {});
  return tableState;
}
function markTable(name, ok) {
  tables()[name] = ok;
  LS.set("idz.tables", tables());
}
function tableKnownOff(name) { return tables()[name] === false; }
const isMissingTable = (error) =>
  error && (error.code === "42P01" || /does not exist|not find the table|schema cache/i.test(error.message || ""));

export function cloudTablesOk() {
  return tables().clients !== false && tables().produits !== false && tables().documents !== false;
}

/* ---------- normalisation documents ---------- */
const flatFromRow = (r) => ({
  ...(r.data || {}),
  id: r.id,
  created_at: r.created_at,
  type: r.type,
  numero: r.numero,
  statut: r.statut,
  date: r.date,
});

/* ---------- documents ---------- */
export async function listDocs(user) {
  const local = LS.get("idz.docs", []);
  if (!user) return local;
  try {
    const { data, error } = await supabase
      .from("documents").select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return local;
    return data.map(flatFromRow);
  } catch { return local; }
}

export async function getDoc(user, id) {
  if (!user || isLocalId(id)) {
    return LS.get("idz.docs", []).find((d) => d.id === id) || null;
  }
  try {
    const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
    if (error || !data) return null;
    return flatFromRow(data);
  } catch { return null; }
}

export async function saveDoc(user, doc) {
  const now = new Date().toISOString();
  const content = { ...doc };
  delete content.id; delete content.created_at;

  const saveLocal = () => {
    const docs = LS.get("idz.docs", []);
    if (doc.id) {
      const i = docs.findIndex((d) => d.id === doc.id);
      const merged = { ...doc };
      if (i >= 0) docs[i] = merged; else docs.unshift(merged);
      LS.set("idz.docs", docs);
      return merged;
    }
    const created = { ...doc, id: uid(), created_at: now };
    docs.unshift(created);
    LS.set("idz.docs", docs);
    return created;
  };

  if (!user || isLocalId(doc.id) || tableKnownOff("documents")) return saveLocal();

  const row = { type: doc.type, numero: doc.numero, statut: doc.statut, date: doc.date, data: content };
  try {
    if (doc.id) {
      const { data, error } = await supabase.from("documents").update(row).eq("id", doc.id).select().single();
      if (error) { if (isMissingTable(error)) { markTable("documents", false); return saveLocal(); } throw error; }
      return flatFromRow(data);
    }
    const { data, error } = await supabase.from("documents").insert({ ...row, user_id: user.id }).select().single();
    if (error) { if (isMissingTable(error)) { markTable("documents", false); return saveLocal(); } throw error; }
    markTable("documents", true);
    return flatFromRow(data);
  } catch (e) {
    if (isMissingTable(e)) { markTable("documents", false); return saveLocal(); }
    throw e;
  }
}

export async function deleteDoc(user, id) {
  if (!user || isLocalId(id)) {
    LS.set("idz.docs", LS.get("idz.docs", []).filter((d) => d.id !== id));
    return true;
  }
  const { error } = await supabase.from("documents").delete().eq("id", id);
  return !error;
}

export function countLocalDocs() { return LS.get("idz.docs", []).length; }

/* Importer les documents invités dans le compte après connexion */
export async function importLocalDocs(user) {
  const docs = LS.get("idz.docs", []);
  if (!user || docs.length === 0) return 0;
  let ok = 0;
  for (const d of docs) {
    const content = { ...d }; delete content.id; delete content.created_at;
    const { error } = await supabase.from("documents").insert({
      user_id: user.id, type: d.type, numero: d.numero, statut: d.statut, date: d.date, data: content,
    });
    if (!error) ok++;
  }
  if (ok === docs.length) LS.set("idz.docs", []);
  return ok;
}

/* ---------- entités génériques (clients / produits) ---------- */
async function listEntity(user, table, lsKey) {
  const local = LS.get(lsKey, []);
  if (!user || tableKnownOff(table)) return local;
  try {
    const { data, error } = await supabase
      .from(table).select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) { if (isMissingTable(error)) markTable(table, false); return local; }
    markTable(table, true);
    return data;
  } catch { return local; }
}

async function upsertEntity(user, table, lsKey, row) {
  const now = new Date().toISOString();
  const saveLocal = () => {
    const list = LS.get(lsKey, []);
    if (row.id) {
      const i = list.findIndex((x) => x.id === row.id);
      if (i >= 0) list[i] = { ...list[i], ...row }; else list.unshift({ ...row, created_at: now });
      LS.set(lsKey, list);
      return list.find((x) => x.id === row.id);
    }
    const created = { ...row, id: uid(), created_at: now };
    list.unshift(created);
    LS.set(lsKey, list);
    return created;
  };

  if (!user || tableKnownOff(table) || isLocalId(row.id)) return saveLocal();
  try {
    if (row.id) {
      const upd = { ...row }; delete upd.id; delete upd.created_at; delete upd.user_id;
      const { data, error } = await supabase.from(table).update(upd).eq("id", row.id).select().single();
      if (error) { if (isMissingTable(error)) markTable(table, false); return saveLocal(); }
      return data;
    }
    const ins = { ...row, user_id: user.id }; delete ins.id;
    const { data, error } = await supabase.from(table).insert(ins).select().single();
    if (error) { if (isMissingTable(error)) markTable(table, false); return saveLocal(); }
    markTable(table, true);
    return data;
  } catch { return saveLocal(); }
}

async function deleteEntity(user, table, lsKey, id) {
  if (!user || tableKnownOff(table) || isLocalId(id)) {
    LS.set(lsKey, LS.get(lsKey, []).filter((x) => x.id !== id));
    return true;
  }
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) { LS.set(lsKey, LS.get(lsKey, []).filter((x) => x.id !== id)); }
  return true;
}

export const listClients = (user) => listEntity(user, "clients", "idz.clients");
export const saveClient = (user, c) => upsertEntity(user, "clients", "idz.clients", c);
export const deleteClient = (user, id) => deleteEntity(user, "clients", "idz.clients", id);

export const listProduits = (user) => listEntity(user, "produits", "idz.produits");
export const saveProduit = (user, p) => upsertEntity(user, "produits", "idz.produits", p);
export const deleteProduit = (user, id) => deleteEntity(user, "produits", "idz.produits", id);

/* ---------- profil entreprise ---------- */
const EMPTY_ENT = { nom: "", adresse: "", ville: "", telephone: "", email: "", nif: "", rc: "", ai: "", idFiscal: "", code: "" };

export async function getProfil(user) {
  const local = LS.get("idz.profil", null);
  const meta = user?.user_metadata || {};
  if (meta.entreprise || meta.logo) {
    return {
      entreprise: { ...EMPTY_ENT, ...(meta.entreprise || {}) },
      logo: meta.logo || null,
      prefs: meta.prefs || {},
    };
  }
  if (local) return { entreprise: { ...EMPTY_ENT, ...(local.entreprise || {}) }, logo: local.logo || null, prefs: local.prefs || {} };
  return { entreprise: { ...EMPTY_ENT }, logo: null, prefs: {} };
}

export async function saveProfil(user, profil) {
  LS.set("idz.profil", profil);
  if (user) {
    try {
      await supabase.auth.updateUser({
        data: { entreprise: profil.entreprise, logo: profil.logo, prefs: profil.prefs },
      });
    } catch {}
  }
  return profil;
}
