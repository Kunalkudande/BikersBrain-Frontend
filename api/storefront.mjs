import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadCatalog, documentHtml } from "../server/catalog.mjs";

let templatePromise;
export default async function handler(req, res) {
  const request = new URL(req.url, "https://store.invalid");
  const path = request.searchParams.get("path") || "/";
  request.searchParams.delete("path");
  if (!path.startsWith("/") || path.startsWith("//")) { res.statusCode = 400; res.end("Invalid path"); return; }
  const url = path + (request.searchParams.toString() ? `?${request.searchParams}` : "");
  try {
    const data = await loadCatalog(url, process.env.SEO_API_URL || process.env.VITE_API_URL);
    templatePromise ||= readFile(join(process.cwd(), "dist/app-shell.html"), "utf8");
    const [{ render }, template] = await Promise.all([import("../dist-ssr/entry-server.js"), templatePromise]);
    res.statusCode = data.status;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // Never cache a cookie-dependent cart or account page. The public renderer uses no cookies.
    const privateRoute = /^\/(admin|login|register|forgot-password|reset-password|cart|checkout|account|wishlist|order-success|track-order)(\/|$)/.test(path);
    res.setHeader("Cache-Control", privateRoute ? "private, no-store" : "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
    if (privateRoute || data.status === 404) res.setHeader("X-Robots-Tag", "noindex, follow");
    res.end(documentHtml(template, render(data)));
  } catch {
    // A temporary API outage must not turn valid product URLs into permanent 404s.
    res.statusCode = 503;
    res.setHeader("Retry-After", "60");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end('<!doctype html><html lang="en"><title>Temporarily unavailable | BikersBrain</title><h1>Our store is temporarily unavailable</h1><p>Please try again shortly. For product help call +91 97621 63742.</p></html>');
  }
}
