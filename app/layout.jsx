import "./globals.css";

export const metadata = {
  title: "invoicedz — Factures, devis et bons en ligne · 100% gratuit",
  description:
    "Créez des factures, devis, proformas, bons de commande et bons de livraison conformes (TVA, droit de timbre, montant en lettres). CRM clients et catalogue produits inclus. Gratuit, sans limite.",
  icons: { icon: "/icon.png" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1C4A3D",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
