"use client";
import { useRouter, usePathname } from "next/navigation";
import { Logo } from "./ui";

const LINKS = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/marketing", label: "Marketing" },
];

export default function AdminNav() {
  const router = useRouter();
  const path = usePathname();

  return (
    <div style={{ background: "#0F2A21", borderBottom: "1px solid #1C4A3D", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 18px", height: 56, display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }} onClick={() => router.push("/admin")}>
          <span style={{ background: "#fff", borderRadius: 7, padding: "3px 6px", display: "inline-flex" }}><Logo size={18} /></span>
          <span style={{ background: "#63BE3A22", color: "#8FE05C", fontSize: 10, fontWeight: 800, letterSpacing: 1, padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>Admin</span>
        </span>
        <nav style={{ display: "flex", gap: 4, flex: 1, overflowX: "auto" }} aria-label="Navigation admin">
          {LINKS.map((l) => {
            const on = path === l.href;
            return (
              <button key={l.href} onClick={() => router.push(l.href)}
                style={{ background: on ? "#1C4A3D" : "none", color: on ? "#fff" : "#B8CBBF", border: "none", borderRadius: 8, padding: "8px 13px", fontSize: 13, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                {l.label}
              </button>
            );
          })}
        </nav>
        <button onClick={() => router.push("/dashboard")}
          style={{ background: "none", border: "1px solid #2C4A3D", color: "#B8CBBF", borderRadius: 8, padding: "7px 13px", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
          ← Quitter l'admin
        </button>
      </div>
    </div>
  );
}
