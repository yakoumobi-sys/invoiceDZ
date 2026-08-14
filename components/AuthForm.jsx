"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { T, SECTEURS, EFFECTIFS } from "../lib/constants";
import { Btn, Input, Lbl, Logo, Sel } from "./ui";

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

const FIELD_STYLE = { background: T.white, border: "1px solid " + T.border, borderRadius: 9, color: T.ink, padding: "10px 13px", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit", outline: "none" };
const VIDE = { email: "", password: "", passwordConfirm: "", prenom: "", nom: "", telephone: "", company: "", secteur: "", adresse: "", effectif: "" };

/* Formulaire de connexion / inscription, réutilisable :
   - app/auth/page.jsx : page dédiée
   - composant "gate" dans /nouveau : inscription en cours de création de document
   onSuccess(user) est appelé après connexion ou inscription avec session immédiate. */
export default function AuthForm({ defaultMode = "login", onSuccess, title, subtitle }) {
  const router = useRouter();
  const [mode, setMode] = useState(defaultMode); // login | signup | forgot
  const [form, setForm] = useState({ ...VIDE });
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: typeof v === "string" ? v : v.target.value }));
  const resetMsgs = () => { setError(null); setNotice(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMsgs();

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
        const requis = [
          [form.prenom.trim(), "Le prénom est requis."],
          [form.nom.trim(), "Le nom est requis."],
          [form.telephone.trim(), "Le numéro de téléphone est requis."],
          [form.company.trim(), "Le nom de l'entreprise est requis."],
          [form.secteur, "Le secteur d'activité est requis."],
          [form.adresse.trim(), "L'adresse de l'entreprise est requise."],
          [form.effectif, "Le nombre de salariés est requis."],
        ];
        for (const [v, msg] of requis) if (!v) { setError(msg); return; }
        if (form.password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
        if (form.password !== form.passwordConfirm) { setError("Les mots de passe ne correspondent pas."); return; }

        const { data, error: err } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              contact: { prenom: form.prenom.trim(), nom: form.nom.trim() },
              entreprise: {
                nom: form.company.trim(),
                telephone: form.telephone.trim(),
                adresse: form.adresse.trim(),
                secteur: form.secteur,
                effectif: form.effectif,
              },
            },
          },
        });
        if (err) { setError(traduireErreur(err.message)); return; }

        if (data?.session) {
          onSuccess ? onSuccess(data.session.user) : router.push("/dashboard");
        } else {
          setNotice("Compte créé ✓ Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.");
          setMode("login");
        }
        return;
      }

      // login
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (err) { setError(traduireErreur(err.message)); return; }
      onSuccess ? onSuccess(data.user) : router.push("/dashboard");
    } catch (err) {
      setError(traduireErreur(err?.message));
    } finally {
      setLoading(false);
    }
  };

  const titre = title || (mode === "signup" ? "Créer un compte" : mode === "forgot" ? "Mot de passe oublié" : "Se connecter");
  const sousTitre = subtitle || (mode === "signup"
    ? "Gratuit, illimité, sans carte bancaire."
    : mode === "forgot"
      ? "On vous envoie un lien de réinitialisation."
      : "Retrouvez vos documents, clients et produits.");

  return (
    <div style={{ width: "100%", maxWidth: mode === "signup" ? 560 : 420, background: T.white, borderRadius: 15, border: "1px solid " + T.border, padding: 36, boxShadow: "0 18px 50px rgba(19,37,30,.08)" }}>
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
          <>
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div><Lbl>Prénom</Lbl><Input value={form.prenom} onChange={set("prenom")} placeholder="Karim" /></div>
              <div><Lbl>Nom</Lbl><Input value={form.nom} onChange={set("nom")} placeholder="Benali" /></div>
            </div>
          </>
        )}

        <div style={{ marginBottom: 14 }}>
          <Lbl>Email</Lbl>
          <input type="email" value={form.email} onChange={set("email")} placeholder="vous@email.dz" required autoComplete="email"
            style={FIELD_STYLE}
            onFocus={(e) => (e.target.style.borderColor = T.leafDark)} onBlur={(e) => (e.target.style.borderColor = T.border)} />
        </div>

        {mode === "signup" && (
          <div style={{ marginBottom: 14 }}><Lbl>Numéro de téléphone</Lbl><Input value={form.telephone} onChange={set("telephone")} placeholder="05XX XX XX XX" /></div>
        )}

        {mode !== "forgot" && (
          <div style={{ marginBottom: mode === "signup" ? 14 : 8 }}>
            <Lbl>Mot de passe</Lbl>
            <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              style={FIELD_STYLE}
              onFocus={(e) => (e.target.style.borderColor = T.leafDark)} onBlur={(e) => (e.target.style.borderColor = T.border)} />
          </div>
        )}

        {mode === "login" && (
          <div style={{ textAlign: "right", marginBottom: 18 }}>
            <button type="button" onClick={() => { setMode("forgot"); resetMsgs(); }}
              style={{ background: "none", border: "none", color: T.leafDark, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
              Mot de passe oublié ?
            </button>
          </div>
        )}

        {mode === "signup" && (
          <>
            <div style={{ marginBottom: 14 }}>
              <Lbl>Confirmer le mot de passe</Lbl>
              <input type="password" value={form.passwordConfirm} onChange={set("passwordConfirm")} placeholder="••••••••" required autoComplete="new-password"
                style={FIELD_STYLE}
                onFocus={(e) => (e.target.style.borderColor = T.leafDark)} onBlur={(e) => (e.target.style.borderColor = T.border)} />
            </div>

            <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1.2, textTransform: "uppercase", margin: "18px 0 12px" }}>Votre entreprise</div>
            <div style={{ marginBottom: 14 }}><Lbl>Nom de l'entreprise</Lbl><Input value={form.company} onChange={set("company")} placeholder="Djimmy Prints" /></div>
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div><Lbl>Secteur d'activité</Lbl><Sel value={form.secteur} onChange={set("secteur")} options={[{ value: "", label: "Sélectionnez…" }, ...SECTEURS.map((s) => ({ value: s, label: s }))]} /></div>
              <div><Lbl>Nombre de salariés</Lbl><Sel value={form.effectif} onChange={set("effectif")} options={[{ value: "", label: "Sélectionnez…" }, ...EFFECTIFS]} /></div>
            </div>
            <div style={{ marginBottom: 22 }}><Lbl>Adresse de l'entreprise</Lbl><Input value={form.adresse} onChange={set("adresse")} placeholder="Rue, ville" /></div>
          </>
        )}

        <Btn type="submit" variant="primary" size="lg" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Un instant…" : mode === "signup" ? "Créer mon compte" : mode === "forgot" ? "Envoyer le lien" : "Se connecter"}
        </Btn>
      </form>

      <div style={{ textAlign: "center", fontSize: 13, color: T.inkLight, marginTop: 20 }}>
        {mode === "forgot" ? (
          <button type="button" onClick={() => { setMode("login"); resetMsgs(); }}
            style={{ background: "none", border: "none", color: T.leafDark, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
            ← Retour à la connexion
          </button>
        ) : (
          <>
            {mode === "signup" ? "Vous avez déjà un compte ? " : "Pas encore de compte ? "}
            <button type="button" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); resetMsgs(); }}
              style={{ background: "none", border: "none", color: T.leafDark, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
              {mode === "signup" ? "Se connecter" : "Créer un compte"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
