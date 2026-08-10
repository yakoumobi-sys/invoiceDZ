export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/clients", "/produits", "/parametres", "/document/", "/nouveau"] }],
    sitemap: "https://invoice-dz.vercel.app/sitemap.xml",
  };
}
