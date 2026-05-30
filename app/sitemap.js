export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://virtusaiworld.com";

  return [
    "",
    "/pricing",
    "/privacy",
    "/terms",
    "/legal",
    "/support",
    "/login",
    "/upgrade",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
