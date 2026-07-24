"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const COLORS = {
  bg: "#FAFBFC",
  white: "#FFFFFF",
  primary: "#0066FF",
  primaryLight: "#EFF6FF",
  text: "#1A1F2E",
  textMid: "#6B7280",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  error: "#EF4444",
  success: "#10B981",
};

// Composant interne qui utilise useSearchParams
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    company: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation
      if (!formData.email || !formData.password) {
        setError("Email et mot de passe requis");
        return;
      }

      if (isSignup) {
        if (!formData.company) {
          setError("Nom de l'entreprise requis");
          return;
        }
        if (formData.password !== formData.passwordConfirm) {
          setError("Les mots de passe ne correspondent pas");
          return;
        }
        // Signup logic here
        console.log("Signup:", formData);
      } else {
        // Login logic here
        console.log("Login:", formData.email, formData.password);
      }

      // Simulé - remplace avec ton auth véritable
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: COLORS.bg,
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: COLORS.white,
          borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          padding: 40,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 8,
              color: COLORS.text,
            }}
          >
            {isSignup ? "Créer un compte" : "Se connecter"}
          </h1>
          <p style={{ fontSize: 14, color: COLORS.textMid }}>
            {isSignup
              ? "Rejoignez nos 500+ utilisateurs"
              : "Bienvenue à nouveau"}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              background: "#FEE2E2",
              border: `1px solid ${COLORS.error}22`,
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: "#991B1B",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: COLORS.text,
                }}
              >
                Nom de l'entreprise
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Caractère Store"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 14,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  transition: "border-color .2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: COLORS.text,
              }}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="toi@example.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color .2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
              onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
            />
          </div>

          <div style={{ marginBottom: isSignup ? 16 : 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: COLORS.text,
              }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color .2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
              onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
            />
          </div>

          {isSignup && (
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: COLORS.text,
                }}
              >
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 14,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  transition: "border-color .2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: COLORS.primary,
              color: COLORS.white,
              border: "none",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background .2s",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) =>
              !loading && (e.target.style.background = "#0052CC")
            }
            onMouseLeave={(e) =>
              !loading && (e.target.style.background = COLORS.primary)
            }
          >
            {loading
              ? "Chargement..."
              : isSignup
              ? "Créer un compte"
              : "Se connecter"}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "24px 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          <span style={{ fontSize: 12, color: COLORS.textLight }}>ou</span>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        {/* Social login (placeholder) */}
        <button
          type="button"
          style={{
            width: "100%",
            background: COLORS.white,
            color: COLORS.text,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background .2s",
            marginBottom: 16,
          }}
          onMouseEnter={(e) => (e.target.style.background = COLORS.bg)}
          onMouseLeave={(e) => (e.target.style.background = COLORS.white)}
        >
          Continuer avec Google
        </button>

        {/* Toggle signup/login */}
        <div style={{ textAlign: "center", fontSize: 13, color: COLORS.textMid }}>
          {isSignup ? "Tu as un compte ? " : "Pas de compte ? "}
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            style={{
              background: "none",
              border: "none",
              color: COLORS.primary,
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "underline",
              fontSize: 13,
            }}
          >
            {isSignup ? "Se connecter" : "Créer un compte"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Page wrapper avec Suspense boundary
export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: COLORS.bg,
          }}
        >
          <div style={{ fontSize: 14, color: COLORS.textLight }}>
            Chargement...
          </div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
