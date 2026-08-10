"use client";
import { useRouter } from "next/navigation";
import { T } from "../lib/constants";
import { Btn, Logo } from "../components/ui";

export default function NotFound() {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", gap: 18 }}>
      <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}><Logo size={28} /></span>
      <div style={{ fontSize: 72, fontWeight: 900, color: T.leafDark, letterSpacing: -2, lineHeight: 1 }}>404</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 6 }}>Cette page n'existe pas.</div>
        <div style={{ color: T.inkLight, fontSize: 14 }}>Elle a peut-être été déplacée, ou l'adresse est incorrecte.</div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Btn variant="primary" onClick={() => router.push("/")}>← Retour à l'accueil</Btn>
        <Btn onClick={() => router.push("/nouveau")}>Créer un document</Btn>
      </div>
    </div>
  );
}
