export default async function handler(req, res) {
  const name = new URL(req.url, "https://store.invalid").searchParams.get("name") || "sitemap.xml";
  if (!/^(?:sitemap(?:-pages|-products-[1-9]\d*|-articles-[1-9]\d*)?|merchant-feed)\.xml$/.test(name)) { res.statusCode = 404; res.end(); return; }
  try {
    const origin = process.env.SEO_API_URL || process.env.VITE_API_URL;
    if (!origin) throw new Error("Missing API origin");
    const api = new URL(origin).href.replace(/\/$/, "").replace(/\/api$/, "");
    const response = await fetch(`${api}/api/seo/${name}`, { headers: { Accept: "application/xml" }, signal: AbortSignal.timeout(20000) });
    if (response.status === 404) { res.statusCode = 404; res.end(); return; }
    if (!response.ok) throw new Error("Discovery API unavailable");
    const body = await response.text();
    if (!body.startsWith('<?xml')) throw new Error("Expected XML");
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
    res.setHeader("X-Robots-Tag", "noindex");
    res.end(body);
  } catch {
    res.statusCode = 503;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Retry-After", "60");
    res.end("Catalog discovery is temporarily unavailable");
  }
}
