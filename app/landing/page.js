"use client";
import { useState } from "react";

// SVG Icons inline - no dependencies
const ArrowRight = (props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronDown = (props) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Check = (props) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M3 9L7 13L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Zap = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const TrendingUp = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M3 21L9 15M15 9L21 3M21 3H12M21 3V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Lock = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 1C7 1 3 5 3 10V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V10C21 5 17 1 12 1ZM12 13C10.9 13 10 12.1 10 11C10 9.9 10.9 9 12 9C13.1 9 14 9.9 14 11C14 12.1 13.1 13 12 13Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

const COLORS = {
  bg: "#FAFBFC",
  white: "#FFFFFF",
  primary: "#0066FF",
  primaryLight: "#EFF6FF",
  text: "#1A1F2E",
  textMid: "#6B7280",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  success: "#10B981",
};

export default function B2BLanding() {
  const [faqOpen, setFaqOpen] = useState(null);
  const [pricingSelected, setPricingSelected] = useState("pro");

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, minHeight: "100vh" }}>
      {/* NAVIGATION */}
      <nav
        style={{
          background: COLORS.white,
          borderBottom: `1px solid ${COLORS.border}`,
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(8px)",
          background: "rgba(255,255,255,.9)",
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            padding: "0 32px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>
            ProductName
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
            {["Fonctionnalités", "Tarifs", "Blog"].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  color: COLORS.textMid,
                  textDecoration: "none",
                  transition: "color .2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = COLORS.primary)}
                onMouseLeave={(e) => (e.target.style.color = COLORS.textMid)}
              >
                {link}
              </a>
            ))}
          </div>
          <button
            style={{
              background: COLORS.primary,
              color: COLORS.white,
              border: "none",
              borderRadius: 8,
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background .2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#0052CC")}
            onMouseLeave={(e) => (e.target.style.background = COLORS.primary)}
          >
            Demander une démo
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "80px 32px 60px",
          textAlign: "center",
        }}
      >
        {/* Accent badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: COLORS.primaryLight,
            border: `1px solid ${COLORS.primary}22`,
            borderRadius: 24,
            padding: "6px 16px",
            fontSize: 12,
            color: COLORS.primary,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: COLORS.primary,
            }}
          />
          Utilisé par +500 entreprises
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontSize: "clamp(42px, 6vw, 64px)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -1.5,
            marginBottom: 20,
            fontFamily: "Geist, -apple-system, sans-serif",
          }}
        >
          Réduisez votre{" "}
          <span style={{ color: COLORS.primary }}>coût d'opération</span> de
          40% en 6 mois.
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: 17,
            color: COLORS.textMid,
            maxWidth: 620,
            margin: "0 auto 12px",
            lineHeight: 1.65,
            fontFamily: '"Inter", -apple-system, sans-serif',
          }}
        >
          La plateforme d'automatisation la plus simple pour les équipes
          opérationnelles. Configurée en 2 jours, rentabilisée en 8 semaines.
        </p>

        {/* Social proof under subheadline */}
        <div
          style={{
            fontSize: 12,
            color: COLORS.textLight,
            marginBottom: 40,
          }}
        >
          ⭐ 4.9/5 sur G2 · 98% de retention · 0 downtime depuis 3 ans
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 72 }}>
          <button
            style={{
              background: COLORS.primary,
              color: COLORS.white,
              border: "none",
              borderRadius: 8,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "background .2s, transform .2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#0052CC";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = COLORS.primary;
              e.target.style.transform = "none";
            }}
          >
            Demander une démo <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
          <button
            style={{
              background: COLORS.white,
              color: COLORS.primary,
              border: `1.5px solid ${COLORS.primary}`,
              borderRadius: 8,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background .2s, color .2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = COLORS.primaryLight;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = COLORS.white;
            }}
          >
            Voir la documentation
          </button>
        </div>

        {/* Hero visual: Stats boxes */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            maxWidth: 800,
            margin: "0 auto",
            paddingTop: 40,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          {[
            { value: "98%", label: "d'automation atteint" },
            { value: "6.2x", label: "ROI moyen" },
            { value: "2 jours", label: "setup time" },
          ].map((stat) => (
            <div key={stat.value}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: COLORS.primary,
                  marginBottom: 4,
                  fontFamily: "Monaco, monospace",
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textLight }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CLIENTS / SOCIAL PROOF */}
      <section
        style={{
          background: COLORS.white,
          borderTop: `1px solid ${COLORS.border}`,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "48px 32px",
        }}
      >
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 11,
              color: COLORS.textLight,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            De confiance par
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 20,
              alignItems: "center",
            }}
          >
            {["CompanyA", "CompanyB", "CompanyC", "CompanyD", "CompanyE", "CompanyF"].map(
              (co) => (
                <div
                  key={co}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.textLight,
                    padding: "20px",
                    textAlign: "center",
                    borderRadius: 8,
                    background: COLORS.bg,
                  }}
                >
                  {co}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* PROBLEM → SOLUTION */}
      <section
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "80px 32px",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 800,
            textAlign: "center",
            marginBottom: 64,
            letterSpacing: -1,
            fontFamily: "Geist, -apple-system, sans-serif",
          }}
        >
          De l'chaos opérationnel à l'excellence scalable.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          {/* Before */}
          <div
            style={{
              background: "#FEF2F2",
              borderRadius: 12,
              padding: 32,
              border: `1px solid #FED2D2`,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#991B1B",
                marginBottom: 20,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Avant
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                "15+ outils différents",
                "100h/mois en data entry",
                "Erreurs manuelles (8% du volume)",
                "Zéro visibilité temps réel",
                "Audit compliance tous les 6 mois",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    gap: 12,
                    fontSize: 14,
                    color: COLORS.text,
                  }}
                >
                  <span style={{ color: "#EF4444", fontWeight: 700 }}>✕</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div
            style={{
              background: "#F0FDF4",
              borderRadius: 12,
              padding: 32,
              border: `1px solid #DCFCE7`,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#15803D",
                marginBottom: 20,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Après
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                "1 plateforme unifiée",
                "40h/mois sauvées",
                "99.7% d'accuracy",
                "Dashboard live",
                "Audit en 2h (auto)",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    gap: 12,
                    fontSize: 14,
                    color: COLORS.text,
                  }}
                >
                  <Check
                    style={{ color: COLORS.success, flexShrink: 0, width: 18, height: 18 }}
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES AS CAPABILITIES */}
      <section
        style={{
          background: COLORS.white,
          borderTop: `1px solid ${COLORS.border}`,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "80px 32px",
        }}
      >
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 800,
              textAlign: "center",
              marginBottom: 64,
              letterSpacing: -1,
              fontFamily: "Geist, -apple-system, sans-serif",
            }}
          >
            Construits pour votre croissance.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 32,
            }}
          >
            {[
              {
                icon: Zap,
                title: "Intégration en 48h",
                desc: "Pas de développement. Connectez vos systèmes via nos APIs pré-construites ou notre plateforme no-code.",
              },
              {
                icon: TrendingUp,
                title: "Visibilité totale",
                desc: "Dashboards temps réel, alertes intelligentes, rapports auto-générés. Contrôlez votre opération.",
              },
              {
                icon: Lock,
                title: "Securité enterprise",
                desc: "SOC 2 Type II, GDPR, encryptage end-to-end. Vos données, vos règles.",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      background: COLORS.primaryLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                      color: COLORS.primary,
                    }}
                  >
                    <Icon style={{ width: 24, height: 24 }} />
                  </div>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: COLORS.textMid,
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "80px 32px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 800,
              marginBottom: 16,
              letterSpacing: -1,
              fontFamily: "Geist, -apple-system, sans-serif",
            }}
          >
            Tarification flexible.
          </h2>
          <p
            style={{
              fontSize: 16,
              color: COLORS.textMid,
              maxWidth: 500,
              margin: "0 auto",
            }}
          >
            Payez uniquement ce que vous utilisez. Pas de frais cachés. Support inclus à tous les niveaux.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            maxWidth: 1000,
            margin: "0 auto",
          }}
        >
          {[
            {
              tier: "Starter",
              price: "2 490",
              period: "/mois",
              desc: "Pour les équipes 5-50",
              cta: "Commencer",
              features: [
                "Jusqu'à 50 utilisateurs",
                "Intégrations de base (5)",
                "Support email",
                "Uptime 99.5%",
              ],
              highlighted: false,
            },
            {
              tier: "Professional",
              price: "6 990",
              period: "/mois",
              desc: "Pour les équipes 50-500",
              cta: "Essayer",
              features: [
                "Utilisateurs illimités",
                "Toutes les intégrations",
                "Support prioritaire 24/7",
                "Uptime 99.99%",
                "Custom workflows",
                "Audit compliance",
              ],
              highlighted: true,
            },
            {
              tier: "Enterprise",
              price: "Sur mesure",
              period: "",
              desc: "Pour les grandes orgs",
              cta: "Contacter",
              features: [
                "SLA 100% uptime",
                "Account manager dédié",
                "Infrastructure privée",
                "Intégrations custom",
                "Formation & onboarding",
              ],
              highlighted: false,
            },
          ].map((plan) => (
            <div
              key={plan.tier}
              style={{
                background: plan.highlighted ? COLORS.primary : COLORS.white,
                color: plan.highlighted ? COLORS.white : COLORS.text,
                border: `1px solid ${
                  plan.highlighted ? COLORS.primary : COLORS.border
                }`,
                borderRadius: 12,
                padding: 32,
                position: "relative",
                transition: "transform .2s, box-shadow .2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 48px rgba(0,102,255,.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {plan.highlighted && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: COLORS.text,
                    color: COLORS.white,
                    padding: "4px 16px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  LE PLUS POPULAIRE
                </div>
              )}
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {plan.tier}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: plan.highlighted
                    ? "rgba(255,255,255,.7)"
                    : COLORS.textMid,
                  marginBottom: 20,
                }}
              >
                {plan.desc}
              </p>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 28, fontWeight: 900 }}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span
                    style={{
                      color: plan.highlighted
                        ? "rgba(255,255,255,.6)"
                        : COLORS.textMid,
                      fontSize: 14,
                    }}
                  >
                    {plan.period}
                  </span>
                )}
              </div>
              <button
                style={{
                  width: "100%",
                  background: plan.highlighted ? COLORS.white : COLORS.primary,
                  color: plan.highlighted ? COLORS.primary : COLORS.white,
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: 24,
                  transition: "opacity .2s",
                }}
                onMouseEnter={(e) => (e.target.style.opacity = 0.9)}
                onMouseLeave={(e) => (e.target.style.opacity = 1)}
              >
                {plan.cta}
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map((f) => (
                  <div
                    key={f}
                    style={{
                      display: "flex",
                      gap: 8,
                      fontSize: 13,
                      color: plan.highlighted
                        ? "rgba(255,255,255,.8)"
                        : COLORS.textMid,
                    }}
                  >
                    <Check style={{ flexShrink: 0, marginTop: 2, width: 16, height: 16 }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section
        style={{
          background: COLORS.white,
          borderTop: `1px solid ${COLORS.border}`,
          padding: "80px 32px",
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 800,
              textAlign: "center",
              marginBottom: 12,
              letterSpacing: -1,
              fontFamily: "Geist, -apple-system, sans-serif",
            }}
          >
            Questions courantes.
          </h2>
          <p
            style={{
              textAlign: "center",
              color: COLORS.textMid,
              marginBottom: 48,
              fontSize: 15,
            }}
          >
            Tout ce que vous avez besoin de savoir sur ProductName.
          </p>

          {[
            {
              q: "Quel est le temps d'implémentation typique ?",
              a: "Notre processus d'onboarding est conçu pour être rapide. La plupart de nos clients sont opérationnels en 48h. Nous fournissons un account manager dédié qui pilote l'intégration.",
            },
            {
              q: "Pouvez-vous intégrer nos systèmes existants ?",
              a: "Oui. Nous supportons +200 intégrations natives (Salesforce, HubSpot, NetSuite, etc.). Pour les systèmes legacy, nous pouvons construire un connecteur custom.",
            },
            {
              q: "Comment gérez-vous la sécurité de nos données ?",
              a: "Nous sommes SOC 2 Type II certifiés, GDPR/CCPA compliant, et utilisons AES-256 encryption. Audit de sécurité annuel par tiers indépendant.",
            },
            {
              q: "Avez-vous un contrat d'engagement minimum ?",
              a: "Non. Tous nos plans sont mois par mois, annulables à tout moment. Pas de pénalité d'annulation.",
            },
          ].map((faq, i) => (
            <div
              key={i}
              style={{
                borderBottom: `1px solid ${COLORS.border}`,
                paddingTop: 20,
                paddingBottom: 20,
              }}
            >
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 15,
                  fontWeight: 600,
                  color: COLORS.text,
                  textAlign: "left",
                }}
              >
                {faq.q}
                <ChevronDown
                  style={{
                    color: COLORS.textLight,
                    flexShrink: 0,
                    transition: "transform .2s",
                    transform: faqOpen === i ? "rotate(180deg)" : "none",
                    marginLeft: 12,
                    marginTop: 2,
                    width: 20,
                    height: 20,
                  }}
                />
              </button>
              {faqOpen === i && (
                <div
                  style={{
                    paddingTop: 12,
                    fontSize: 14,
                    color: COLORS.textMid,
                    lineHeight: 1.7,
                    animation: "fadeIn .2s",
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        style={{
          background: COLORS.primary,
          padding: "80px 32px",
          textAlign: "center",
          color: COLORS.white,
        }}
      >
        <h2
          style={{
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 800,
            marginBottom: 16,
            letterSpacing: -1,
            fontFamily: "Geist, -apple-system, sans-serif",
          }}
        >
          Prêt à transformer votre opération ?
        </h2>
        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,.8)",
            marginBottom: 32,
            maxWidth: 500,
            margin: "0 auto 32px",
          }}
        >
          Rejoignez les 500+ entreprises qui font confiance à ProductName.
        </p>
        <button
          style={{
            background: COLORS.white,
            color: COLORS.primary,
            border: "none",
            borderRadius: 8,
            padding: "14px 32px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            transition: "transform .2s, box-shadow .2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 8px 24px rgba(0,0,0,.15)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "none";
            e.target.style.boxShadow = "none";
          }}
        >
          Demander une démo gratuite
        </button>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: COLORS.text,
          color: COLORS.white,
          padding: "48px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 40,
            marginBottom: 40,
          }}
        >
          {[
            {
              title: "Produit",
              links: ["Fonctionnalités", "Tarifs", "Sécurité", "Status"],
            },
            {
              title: "Ressources",
              links: ["Documentation", "API Docs", "Blog", "Community"],
            },
            {
              title: "Légal",
              links: ["Confidentialité", "Conditions", "Cookies", "Compliance"],
            },
            {
              title: "Nous",
              links: ["À propos", "Carrières", "Contact", "Press"],
            },
          ].map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "rgba(255,255,255,.6)",
                  marginBottom: 16,
                }}
              >
                {col.title}
              </div>
              {col.links.map((link) => (
                <a
                  key={link}
                  href="#"
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: "rgba(255,255,255,.7)",
                    textDecoration: "none",
                    marginBottom: 8,
                    transition: "color .2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.color = "rgba(255,255,255,1)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.color = "rgba(255,255,255,.7)")
                  }
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: `1px solid rgba(255,255,255,.1)`,
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "rgba(255,255,255,.5)",
          }}
        >
          <div>© 2025 ProductName. Tous droits réservés.</div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Twitter", "LinkedIn", "GitHub"].map((social) => (
              <a
                key={social}
                href="#"
                style={{
                  color: "rgba(255,255,255,.5)",
                  textDecoration: "none",
                  transition: "color .2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.color = "rgba(255,255,255,1)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.color = "rgba(255,255,255,.5)")
                }
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
