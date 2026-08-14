"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { T } from "../../lib/constants";
import AuthForm from "../../components/AuthForm";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const next = searchParams.get("next") || "/dashboard";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, padding: 24 }}>
      <div>
        <AuthForm defaultMode={initialMode} onSuccess={() => router.push(next)} />
        <div style={{ textAlign: "center", marginTop: 22 }}>
          <span style={{ fontSize: 12.5, color: T.inkLight, cursor: "pointer" }} onClick={() => router.push("/nouveau")}>
            Ou <span style={{ color: T.leafDark, fontWeight: 700, textDecoration: "underline" }}>continuer sans compte</span> — vos documents restent sur cet appareil
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, color: T.inkLight, fontSize: 14 }}>Chargement…</div>}>
      <AuthContent />
    </Suspense>
  );
}
