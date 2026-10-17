import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { loadEnv } from "vite";
import storefront from "../api/storefront.mjs";
import discovery from "../api/discovery.mjs";

const env = loadEnv("production", process.cwd(), "");
process.env.SEO_API_URL ||= env.SEO_API_URL || env.VITE_API_URL || "http://localhost:5000";
const root = resolve("dist");
const mime = { ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".ico": "image/x-icon", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".txt": "text/plain" };
createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (/^\/(?:sitemap.*|merchant-feed)\.xml$/.test(url.pathname)) {
    req.url = `/api/discovery?name=${encodeURIComponent(url.pathname.slice(1))}`;
    await discovery(req, res); return;
  }
  if (/^\/(?:assets\/|favicon(?:-\d+)?\.|apple-touch-icon\.|brand-logo\.|og-image\.|store-image\.|placeholder\.|robots\.txt$)/.test(url.pathname)) {
    const target = resolve(root, "." + decodeURIComponent(url.pathname));
    if (!target.startsWith(root + sep)) { res.statusCode = 404; res.end(); return; }
    try { res.setHeader("Content-Type", mime[extname(target)] || "application/octet-stream"); res.end(await readFile(target)); }
    catch { res.statusCode = 404; res.end(); }
    return;
  }
  // Match the Vercel routing contract while preserving real search/filter parameters.
  url.searchParams.set("path", url.pathname);
  req.url = `/api/storefront?${url.searchParams}`;
  await storefront(req, res);
}).listen(4173, "127.0.0.1", () => console.log("SSR preview: http://localhost:4173"));
