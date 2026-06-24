export const metadata = {
  title: "InvoiceDZ — Facturation en ligne pour l'Algérie",
  description: "Créez vos factures, devis, bons de commande et de livraison en quelques secondes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin:0, padding:0, fontFamily:"system-ui,-apple-system,sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
