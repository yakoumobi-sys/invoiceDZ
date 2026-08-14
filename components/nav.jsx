"use client";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { T } from "../lib/constants";
import { Btn, Logo, Badge, Menu } from "./ui";

export default function AppNav({ user }) {
  const router = useRouter();
  const path = usePathname();

  const logout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    router.push("/");
  };

  const menuItems = [
    { icon: "👤", label: "Compte", onClick: () => router.push("/compte") },
    { icon: "📊", label: "Tableau de bord", onClick: () => router.push("/dashboard") },
    { icon: "👥", label: "CRM", onClick: () => router.push("/clients") },
    { icon: "📦", label: "Produits", onClick: () => router.push("/produits") },
    { icon: "⚙️", label: "Paramètres", onClick: () => router.push("/parametres") },
    "—",
    user
      ? { icon: "🚪", label: "Déconnexion", danger: true, onClick: logout }
      : { icon: "🔑", label: "Se connecter", onClick: () => router.push("/auth") },
  ];

  return (
    <div style={{ background: T.white, borderBottom: "1px solid " + T.border, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 18px", height: 58, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => router.push("/dashboard")}><Logo size={26} /></span>
        <span style={{ marginLeft: "auto" }} />
        {!user && <span className="hide-sm"><Badge label="Mode invité" color={T.warning} /></span>}
        <Btn variant="primary" size="sm" onClick={() => router.push("/nouveau")}>+ Nouveau</Btn>
        <Menu items={menuItems} label="☰" ariaLabel="Menu" />
      </div>
    </div>
  );
}
