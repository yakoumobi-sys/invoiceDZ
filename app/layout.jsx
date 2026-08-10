import "./globals.css";

const SITE_URL = "https://invoice-dz.vercel.app";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "invoicedz — Factures, devis et bons en ligne · 100% gratuit",
    template: "%s · invoicedz",
  },
  description:
    "Créez des factures, devis, proformas, bons de commande et bons de livraison conformes (TVA, droit de timbre, montant en lettres). CRM clients et catalogue produits inclus. Gratuit, sans limite.",
  keywords: [
    "facture Algérie", "logiciel de facturation Algérie", "devis en ligne", "facture proforma",
    "bon de livraison", "bon de commande", "droit de timbre Algérie", "TVA Algérie", "facturation gratuite",
  ],
  applicationName: "invoicedz",
  authors: [{ name: "invoicedz" }],
  generator: "Next.js",
  referrer: "strict-origin-when-cross-origin",
  alternates: { canonical: "/" },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    url: SITE_URL,
    siteName: "invoicedz",
    title: "invoicedz — Vos factures, réglées en 60 secondes",
    description:
      "Factures, devis, proformas et bons conformes — TVA, droit de timbre et montant en lettres calculés pour vous. CRM clients et catalogue produits. 100% gratuit et illimité.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "invoicedz — logiciel de facturation gratuit pour l'Algérie" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "invoicedz — Vos factures, réglées en 60 secondes",
    description: "Factures, devis, proformas et bons conformes pour l'Algérie. 100% gratuit et illimité.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1C4A3D",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "invoicedz",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Créez des factures, devis, proformas, bons de commande et bons de livraison conformes pour l'Algérie (TVA, droit de timbre, montant en lettres). CRM clients et catalogue produits inclus.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "DZD" },
  areaServed: "DZ",
  inLanguage: "fr",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
