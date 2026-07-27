"use client";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { T } from "../lib/constants";
import { Btn, Logo, Badge } from "./ui";

const LINKS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/clients", label: "Clients" },
  { href: "/produits", label: "Produits" },
  { href: "/parametres", label: "Paramètres" },
];

export default function AppNav({ user }) {
  const router = useRouter();
  const path = usePathname();

  const logout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    router.push("/");
  };

  return (
    <div style={{ background: T.white, borderBottom: "1px solid " + T.border, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 18px", height: 58, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => router.push("/dashboard")}><Logo size={26} /></span>
        <nav style={{ display: "flex", gap: 2, marginLeft: 14, overflowX: "auto", flex: 1, minWidth: 0 }} aria-label="Navigation">
          {LINKS.map((l) => {
            const on = path === l.href;
            return (
              <button key={l.href} onClick={() => router.push(l.href)}
                style={{ background: on ? T.accentBg : "none", color: on ? T.accent : T.inkMid, border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 13.5, fontWeight: on ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                {l.label}
              </button>
            );
          })}
        </nav>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {!user && <span className="hide-sm"><Badge label="Mode invité" color={T.warning} /></span>}
          <Btn variant="primary" size="sm" onClick={() => router.push("/nouveau")}>+ Nouveau</Btn>
          {user
            ? <Btn variant="ghost" size="sm" onClick={logout}>Déconnexion</Btn>
            : <Btn variant="ghost" size="sm" onClick={() => router.push("/auth")}>Se connecter</Btn>}
        </div>
      </div>
    </div>
  );
}
