"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "../lib/constants";
import { Spinner, Btn } from "./ui";
import { adminFetch } from "../lib/adminClient";

/* Protège une page /admin/* : redirige vers /auth si pas de session,
   affiche "Accès refusé" si connecté mais pas administrateur. La vraie
   barrière de sécurité est côté serveur (lib/adminServer.js) — ce garde
   n'est que l'expérience visuelle côté client. */
export default function AdminGate({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | ok | denied

  useEffect(() => {
    (async () => {
      try {
        await adminFetch("/api/admin/me");
        setStatus("ok");
      } catch (e) {
        if (e.message === "NO_SESSION") router.push("/auth?next=/admin");
        else setStatus("denied");
      }
    })();
  }, [router]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner />
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Accès refusé</div>
        <div style={{ color: T.inkLight, fontSize: 13.5, maxWidth: 360 }}>Cette section est réservée à l'administrateur du site.</div>
        <Btn variant="primary" onClick={() => router.push("/dashboard")}>← Retour au tableau de bord</Btn>
      </div>
    );
  }

  return children;
}
