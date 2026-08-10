"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { T } from "../../lib/constants";
import { Btn, Input, Lbl, Logo } from "../../components/ui";

/* Traduit les erreurs Supabase les plus courantes en français */
function traduireErreur(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (m.includes("user already registered") || m.includes("already registered")) return "Un compte existe déjà avec cet email. Connectez-vous plutôt.";
  if (m.includes("email not confirmed")) return "Confirmez votre email avant de vous connecter (lien envoyé à l'inscription).";
  if (m.includes("password should be at least") || m.includes("at least 6")) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "Adresse email invalide.";
  if (m.includes("rate limit") || m.includes("too many")) return "Trop de tentatives, réessayez dans quelques minutes.";
  if (m.includes("network") || m.includes("failed to fetch") || m.includes("load failed")) return "Problème de connexion réseau. Vérifiez votre connexion et réessayez.";
  return msg || "Une erreur est survenue. Réessayez.";
}

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.27-1.7V4.96H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.04l3-2.33z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.96l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
  </svg>
);

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState(initialMode); // login | signup | forgot
  const [form, setForm] = useState({ email: "", password: "", passwordConfirm: "", company: "" });
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!form.email.trim() || (mode !== "forgot" && !form.password)) {
      setError("Email et mot de passe requis.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
          redirectTo: typeof window !== "undefined" ? window.location.origin + "/auth" : undefined,
        });
        if (err) { setError(traduireErreur(err.message)); return; }
        setNotice("Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé.");
        return;
      }

      if (mode === "signup") {
        if (!form.company.trim()) { setError("Le nom de l'entreprise est requis."); return; }
        if (form.password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
        if (form.password !== form.passwordConfirm) { setError("Les mots de passe ne correspondent pas."); return; }

        const { data, error: err } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { entreprise: { nom: form.company.trim() } } },
        });
        if (err) { setError(traduireErreur(err.message)); return; }

        if (data?.session) {
          router.push("/dashboard");
        } else {
          setNotice("Compte créé ✓ Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.");
          setMode("login");
        }
        return;
      }

      // login
      const { error: err } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (err) { setError(traduireErreur(err.message)); return; }
      router.push("/dashboard");
    } catch (err) {
      setError(traduireErreur(err?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: typeof window !== "undefined" ? window.location.origin + "/dashboard" : undefined },
      });
      if (err) { setError(traduireErreur(err.message)); setGoogleLoading(false); }
      // en cas de succès, redirection gérée par Supabase (pas de reset du loading nécessaire)
    } catch (err) {
      setError(traduireErreur(err?.message));
      setGoogleLoading(false);
    }
  };

  const titre = mode === "signup" ? "Créer un compte" : mode === "forgot" ? "Mot de passe oublié" : "Se connecter";
  const sousTitre = mode === "signup"
    ? "Gratuit, illimité, sans carte bancaire."
    : mode === "forgot"
      ? "On vous envoie un lien de réinitialisation."
      : "Retrouvez vos documents, clients et produits.";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, background: T.white, borderRadius: 15, border: "1px solid " + T.border, padding: 36, boxShadow: "0 18px 50px rgba(19,37,30,.08)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}><Logo size={28} /></span>
        </div>

        <div style={{ marginBottom: 26, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.4, margin: "0 0 6px", color: T.ink }}>{titre}</h1>
          <p style={{ fontSize: 13.5, color: T.inkLight, margin: 0 }}>{sousTitre}</p>
        </div>

        {error && (
          <div style={{ background: "#FDEEEC", border: "1px solid #F5C9C4", borderRadius: 9, padding: "11px 14px", marginBottom: 18, fontSize: 13, color: T.danger }}>
            {error}
          </div>
        )}
        {notice && (
          <div style={{ background: T.leafBg, border: "1px solid #D6ECC8", borderRadius: 9, padding: "11px 14px", marginBottom: 18, fontSize: 13, color: T.leafDark }}>
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div style={{ marginBottom: 14 }}>
              <Lbl>Nom de l'entreprise</Lbl>
              <Input value={form.company} onChange={(v) => setForm((p) => ({ ...p, company: v }))} placeholder="Djimmy Prints" />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <Lbl>Email</Lbl>
            <input type="email" value={form.email} onChange={set("email")} placeholder="vous@email.dz" required autoComplete="email"
              style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 9, color: T.ink, padding: "10px 13px", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit", outline: "none" }}
              onFocus={(e) => (e.target.style.borderColor = T.leafDark)} onBlur={(e) => (e.target.style.borderColor = T.border)} />
          </div>

          {mode !== "forgot" && (
            <div style={{ marginBottom: mode === "signup" ? 14 : 8 }}>
              <Lbl>Mot de passe</Lbl>
              <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 9, color: T.ink, padding: "10px 13px", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = T.leafDark)} onBlur={(e) => (e.target.style.borderColor = T.border)} />
            </div>
          )}

          {mode === "login" && (
            <div style={{ textAlign: "right", marginBottom: 18 }}>
              <button type="button" onClick={() => { setMode("forgot"); setError(null); setNotice(null); }}
                style={{ background: "none", border: "none", color: T.leafDark, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {mode === "signup" && (
            <div style={{ marginBottom: 22 }}>
              <Lbl>Confirmer le mot de passe</Lbl>
              <input type="password" value={form.passwordConfirm} onChange={set("passwordConfirm")} placeholder="••••••••" required autoComplete="new-password"
                style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 9, color: T.ink, padding: "10px 13px", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = T.leafDark)} onBlur={(e) => (e.target.style.borderColor = T.border)} />
            </div>
          )}

          <Btn type="submit" variant="primary" size="lg" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Un instant…" : mode === "signup" ? "Créer mon compte" : mode === "forgot" ? "Envoyer le lien" : "Se connecter"}
          </Btn>
        </form>

        {mode !== "forgot" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: 12, color: T.inkLight }}>ou</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            <Btn type="button" onClick={handleGoogle} disabled={googleLoading} style={{ width: "100%" }}>
              <GoogleIcon /> {googleLoading ? "Un instant…" : "Continuer avec Google"}
            </Btn>
          </>
        )}

        <div style={{ textAlign: "center", fontSize: 13, color: T.inkLight, marginTop: 20 }}>
          {mode === "forgot" ? (
            <button type="button" onClick={() => { setMode("login"); setError(null); setNotice(null); }}
              style={{ background: "none", border: "none", color: T.leafDark, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
              ← Retour à la connexion
            </button>
          ) : (
            <>
              {mode === "signup" ? "Vous avez déjà un compte ? " : "Pas encore de compte ? "}
              <button type="button" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); setNotice(null); }}
                style={{ background: "none", border: "none", color: T.leafDark, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
                {mode === "signup" ? "Se connecter" : "Créer un compte"}
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid " + T.border }}>
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
