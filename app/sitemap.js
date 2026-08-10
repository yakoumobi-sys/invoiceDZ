export default function sitemap() {
  const base = "https://invoice-dz.vercel.app";
  const now = new Date();
  return [
    { url: base + "/", lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: base + "/auth", lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: base + "/nouveau", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
