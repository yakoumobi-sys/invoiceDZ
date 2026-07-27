"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "../lib/constants";
import { Btn, Logo } from "../components/ui";

/* ── Compteur animé ── */
function CountUp({ to, duration = 1100, delay = 0, format }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const t = setTimeout(() => { raf = requestAnimationFrame(tick); }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [to, duration, delay]);
  return <>{format ? format(v) : Math.round(v)}</>;
}

/* ── Signature : la facture qui se remplit toute seule ── */
function LiveInvoice() {
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    const it = setInterval(() => setCycle((c) => c + 1), 8200);
    return () => clearInterval(it);
  }, []);
  const lignes = [
    ["Tenues de travail brodées", "12", "2 400,00", "28 800,00"],
    ["Impression logo 2 couleurs", "12", "350,00", "4 200,00"],
    ["Livraison Alger", "1", "1 500,00", "1 500,00"],
  ];
  const row = (d) => ({ animation: `lineIn .45s ease ${d}s both` });
  return (
    <div key={cycle} aria-hidden="true" style={{ position: "relative", background: "#fff", borderRadius: 16, boxShadow: "0 24px 70px rgba(19,37,30,.18)", border: "1px solid " + T.border, padding: "26px 28px", width: "100%", maxWidth: 430, fontSize: 12, transform: "rotate(.6deg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <img src="/logo.jpg" alt="" style={{ height: 30, borderRadius: 6, display: "block", marginBottom: 8 }} />
          <div style={{ fontWeight: 800, fontSize: 13 }}>Djimmy Prints</div>
          <div style={{ color: T.inkLight, fontSize: 10 }}>Aïn Bénian, Alger</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ background: T.accent, color: "#fff", fontSize: 9.5, fontWeight: 800, letterSpacing: 1.4, padding: "5px 12px", borderRadius: 6 }}>FACTURE</span>
          <div style={{ fontWeight: 800, marginTop: 7, fontSize: 13 }}>FAC-2026-0042</div>
        </div>
      </div>

      <div style={{ marginTop: 16, borderTop: "2px solid " + T.ink, paddingTop: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 30px 66px 74px", gap: 6, fontSize: 8.5, letterSpacing: 1, textTransform: "uppercase", color: T.inkLight, fontWeight: 700, paddingBottom: 6 }}>
          <span>Désignation</span><span style={{ textAlign: "right" }}>Qté</span><span style={{ textAlign: "right" }}>P.U.</span><span style={{ textAlign: "right" }}>Total HT</span>
        </div>
        {lignes.map((l, i) => (
          <div key={i} style={{ ...row(0.5 + i * 0.55), display: "grid", gridTemplateColumns: "1fr 30px 66px 74px", gap: 6, padding: "6px 0", borderTop: "1px solid #F0F3EF", fontSize: 11 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l[0]}</span>
            <span style={{ textAlign: "right" }}>{l[1]}</span>
            <span style={{ textAlign: "right", color: T.inkMid }}>{l[2]}</span>
            <span style={{ textAlign: "right", fontWeight: 700 }}>{l[3]}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <div style={{ minWidth: 190, animation: "fadeUp .4s ease 2.2s both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.inkMid, padding: "3px 0" }}>
            <span>TVA 19%</span><span><CountUp to={6555} delay={2300} format={(v) => v.toLocaleString("fr-DZ", { maximumFractionDigits: 0 })} /> DA</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.accent, color: "#fff", borderRadius: 8, padding: "8px 11px", marginTop: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.2 }}>NET À PAYER</span>
            <span style={{ fontWeight: 800, fontSize: 14 }}><CountUp to={41055} delay={2300} format={(v) => v.toLocaleString("fr-DZ", { maximumFractionDigits: 0 })} /> DA</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 9.5, fontStyle: "italic", color: T.inkMid, animation: "fadeUp .4s ease 3.4s both" }}>
        Arrêtée la présente facture à la somme de : <b style={{ fontStyle: "normal" }}>quarante et un mille cinquante-cinq dinars algériens</b>.
      </div>

      <div style={{ position: "absolute", right: 22, bottom: 58, border: "3px solid " + T.leafDark, color: T.leafDark, fontWeight: 900, fontSize: 21, letterSpacing: 3, padding: "5px 16px", borderRadius: 8, animation: "stampIn .5s cubic-bezier(.2,1.4,.4,1) 4.3s both", background: "#fff" }}>
        PAYÉ
      </div>

      <div style={{ position: "absolute", top: -17, right: -13, width: 44, height: 44, background: T.leaf, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(99,190,58,.45)", animation: "zapFloat 3.4s ease-in-out infinite" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="#fff" /></svg>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: "🧾", titre: "5 documents conformes", texte: "Factures, proformas, devis, bons de commande et bons de livraison — avec vos identifiants RC, NIF, AI et NIS." },
  { icon: "🇩🇿", titre: "Fiscalité algérienne intégrée", texte: "TVA, remises, droit de timbre calculé automatiquement pour les paiements en espèces (barème loi de finances 2025) et montant en toutes lettres." },
  { icon: "👥", titre: "CRM clients", texte: "Répertoire de clients avec historique des documents, chiffre d'affaires et impayés par client. Sélection en un clic à la création." },
  { icon: "📦", titre: "Catalogue produits", texte: "Enregistrez vos produits et services une fois : désignation, prix, unité et TVA se remplissent tout seuls dans vos lignes." },
  { icon: "🔄", titre: "Suivi et conversions", texte: "Numérotation automatique, statuts, encaissements et solde restant. Transformez un devis accepté en facture en un clic." },
  { icon: "⬇️", titre: "PDF immédiat", texte: "Aperçu fidèle A4 et export PDF en un clic — commencez même sans créer de compte, vos données restent sur votre appareil." },
];

const ETAPES = [
  ["Choisissez le document", "Facture, devis, proforma, bon de commande ou bon de livraison."],
  ["Remplissez en 60 secondes", "Client depuis votre répertoire, lignes depuis votre catalogue, totaux et timbre calculés en direct."],
  ["Téléchargez et suivez", "PDF prêt à envoyer, statuts, encaissements et relances depuis votre tableau de bord."],
];

const FAQS = [
  ["Est-ce vraiment gratuit ?", "Oui, entièrement. Tous les documents, le CRM, le catalogue et l'export PDF sont gratuits et illimités, sans carte bancaire ni période d'essai."],
  ["Dois-je créer un compte ?", "Non. Vous pouvez créer et télécharger vos documents sans inscription : ils restent alors enregistrés sur votre appareil. Un compte gratuit permet en plus de les retrouver partout."],
  ["Le droit de timbre est-il géré ?", "Oui. Pour un paiement en espèces, le timbre est calculé selon le barème en vigueur (1 %, 1,5 % ou 2 % selon le montant, minimum 5 DA) et ajouté au net à payer."],
  ["Le montant en lettres est-il écrit automatiquement ?", "Oui, chaque document chiffré se termine par la mention « Arrêté à la somme de… » rédigée automatiquement en toutes lettres."],
  ["Mes données sont-elles en sécurité ?", "Avec un compte, vos documents sont stockés sur votre espace privé et ne sont visibles que par vous. Sans compte, ils ne quittent jamais votre appareil."],
];

export default function Landing() {
  const router = useRouter();
  const [faq, setFaq] = useState(null);
  const go = (p) => () => router.push(p);

  return (
    <div style={{ background: T.bg, color: T.ink, minHeight: "100vh" }}>
      {/* ── Nav ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(244,247,243,.88)", backdropFilter: "blur(10px)", borderBottom: "1px solid " + T.border }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 20px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Logo size={28} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="hide-sm"><Btn variant="ghost" size="sm" onClick={go("/auth")}>Se connecter</Btn></span>
            <Btn variant="primary" size="sm" onClick={go("/nouveau")}>Créer une facture</Btn>
          </div>
        </div>
      </nav>

      {/* ── Héros ── */}
      <header style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 20px 70px", display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,.95fr)", gap: 48, alignItems: "center" }} className="hero-grid">
        <div className="anim-fadeUp">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.leafBg, border: "1px solid #D6ECC8", color: T.leafDark, fontSize: 12.5, fontWeight: 700, padding: "6px 14px", borderRadius: 20, marginBottom: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: 4, background: T.leaf, display: "inline-block" }} />
            100 % gratuit · pensé pour l'Algérie
          </div>
          <h1 style={{ fontSize: "clamp(34px, 5.2vw, 54px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.06, margin: "0 0 18px" }}>
            Vos factures,<br />réglées en <span style={{ color: T.leafDark }}>60 secondes</span>.
          </h1>
          <p style={{ fontSize: 17, color: T.inkMid, lineHeight: 1.65, maxWidth: 480, margin: "0 0 26px" }}>
            Factures, devis et bons conformes — TVA, droit de timbre et montant en lettres calculés pour vous. Avec un CRM clients et un catalogue produits. Sans limite, sans carte bancaire.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn variant="primary" size="lg" onClick={go("/nouveau")}>Créer un document — sans inscription</Btn>
            <Btn size="lg" onClick={go("/auth")}>Créer un compte gratuit</Btn>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 22, fontSize: 12.5, color: T.inkLight, flexWrap: "wrap" }}>
            {["Illimité", "Sans carte bancaire", "PDF en 1 clic"].map((s) => (
              <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M3 9l4 4 8-8" stroke={T.leafDark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{s}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }} className="anim-fadeUp">
          <LiveInvoice />
        </div>
      </header>

      {/* ── Bande repères ── */}
      <div style={{ background: T.accent, color: "#EAF3EC" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "22px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 18, textAlign: "center" }}>
          {[["5", "types de documents"], ["0 DA", "aujourd'hui et pour toujours"], ["19 %", "TVA gérée, timbre inclus"], ["1 clic", "du devis à la facture"]].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>{v}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fonctionnalités ── */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "70px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2.5, color: T.leafDark, textTransform: "uppercase", marginBottom: 10 }}>Fonctionnalités</div>
          <h2 style={{ fontSize: "clamp(26px,3.6vw,36px)", fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>Tout ce qu'offrent les grands logiciels.<br />Sans la facture à la fin.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.titre} style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 14, padding: 24, transition: "transform .15s, box-shadow .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(19,37,30,.09)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: T.leafBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 15.5, marginBottom: 7 }}>{f.titre}</div>
              <div style={{ fontSize: 13.5, color: T.inkMid, lineHeight: 1.65 }}>{f.texte}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section style={{ background: T.white, borderTop: "1px solid " + T.border, borderBottom: "1px solid " + T.border }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2.5, color: T.leafDark, textTransform: "uppercase", marginBottom: 10 }}>Comment ça marche</div>
            <h2 style={{ fontSize: "clamp(24px,3.2vw,32px)", fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>Trois étapes, zéro paperasse</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 22 }}>
            {ETAPES.map(([t2, s], i) => (
              <div key={t2} style={{ position: "relative", padding: "22px 22px 22px 24px", borderLeft: "3px solid " + (i === 2 ? T.leaf : T.border), background: T.bg, borderRadius: "0 12px 12px 0" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.leafDark, marginBottom: 8 }}>Étape {i + 1}</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 7 }}>{t2}</div>
                <div style={{ fontSize: 13.5, color: T.inkMid, lineHeight: 1.6 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "70px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2.5, color: T.leafDark, textTransform: "uppercase", marginBottom: 10 }}>Questions fréquentes</div>
          <h2 style={{ fontSize: "clamp(24px,3.2vw,32px)", fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>On vous répond franchement</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQS.map(([q, a], i) => (
            <div key={q} style={{ background: T.white, border: "1px solid " + (faq === i ? T.leafDark : T.border), borderRadius: 12, overflow: "hidden", transition: "border-color .15s" }}>
              <button onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i}
                style={{ width: "100%", background: "none", border: "none", padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{q}</span>
                <span style={{ color: T.leafDark, fontSize: 18, fontWeight: 800, transform: faq === i ? "rotate(45deg)" : "none", transition: "transform .18s" }}>+</span>
              </button>
              {faq === i && <div style={{ padding: "0 18px 16px", fontSize: 13.5, color: T.inkMid, lineHeight: 1.7 }}>{a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "0 20px 80px" }}>
        <div style={{ background: T.accent, borderRadius: 20, padding: "52px 28px", textAlign: "center", color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -30, opacity: 0.12 }}>
            <svg width="220" height="220" viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="#fff" /></svg>
          </div>
          <h2 style={{ fontSize: "clamp(24px,3.4vw,34px)", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Votre première facture est à 60 secondes.</h2>
          <p style={{ fontSize: 15, opacity: 0.85, margin: "0 0 26px" }}>Gratuit, illimité, sans inscription obligatoire.</p>
          <Btn variant="leaf" size="lg" onClick={go("/nouveau")}>Commencer maintenant</Btn>
        </div>
      </section>

      {/* ── Pied de page ── */}
      <footer style={{ background: "#0F2A21", color: "#B8CBBF" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "34px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ background: "#fff", borderRadius: 9, padding: "5px 10px", display: "inline-flex" }}><Logo size={22} /></span>
          <div style={{ fontSize: 12.5 }}>
            Fait en Algérie 🇩🇿 · Gratuit pour toujours · <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={go("/auth")}>Se connecter</span>
          </div>
        </div>
      </footer>

      <style>{`@media (max-width: 900px){ .hero-grid { grid-template-columns: 1fr !important; padding-top: 40px !important; } }`}</style>
    </div>
  );
}
