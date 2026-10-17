import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { loadCatalog, documentHtml, CatalogError } from "../server/catalog.mjs";
import { render } from "../dist-ssr/entry-server.js";
import handler from "../api/storefront.mjs";

const product = { id: "coil", name: "Ignition Coil <Replacement>", slug: "ignition-coil", description: "A replacement ignition coil for the specified motorcycle model.", category: "COILS", brand: "Test", sku: "TEST-COIL", price: 650, discountPrice: null, stock: 3, images: [{ id: "img", imageUrl: "https://example.com/coil.jpg", isPrimary: true }], variants: [], reviews: [], rating: 0, totalReviews: 0, specifications: { details: [{ label: "Compatible bike models", value: "Test model only" }], features: [] } };
const categories = [{ id: "coils", value: "COILS", label: "Ignition Coils", group: "Electricals", parentId: null, groupSortOrder: 1, sortOrder: 1 }];
const response = (data, status = 200, extra = {}) => new Response(JSON.stringify({ success: true, data, ...extra }), { status, headers: { "Content-Type": "application/json" } });
const fixtureFetch = async url => url.includes("/products/categories") ? response(categories) : response(product);

test("product HTML contains the actual product, image, canonical and JSON-LD without executing JavaScript", async () => {
  const data = await loadCatalog("/products/ignition-coil", "https://catalog.example", fixtureFetch);
  const template = await readFile(new URL("../dist/app-shell.html", import.meta.url), "utf8");
  const html = documentHtml(template, render(data));
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelectorAll('link[rel="canonical"]').length, 1);
  assert.equal(doc.querySelector('link[rel="canonical"]').href, "https://bikersbrain.in/products/ignition-coil");
  assert.equal(doc.querySelectorAll('meta[name="description"]').length, 1);
  assert.equal(doc.querySelector('h1').textContent, product.name);
  assert.ok(doc.body.textContent.includes("Test model only"), "Specifications must be available without clicking a tab");
  const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(script => JSON.parse(script.textContent));
  assert.equal(schemas.find(schema => schema["@type"] === "Product").offers.price, "650.00");
  assert.ok(doc.querySelector('meta[name="google-site-verification"]'));
  assert.ok(doc.querySelector('script[type="module"]'));
  assert.ok(doc.querySelector('img[src="https://example.com/coil.jpg"]'));
  assert.ok(!doc.querySelector('meta[name="robots"]').content.includes("noindex"));
});

test("catalog and blog pagination have real href links and distinct canonical URLs", () => {
  const data = { url: "/products?category=COILS&page=2", status: 200, categories, products: { items: [product], total: 25, totalPages: 3 } };
  const result = render(data);
  const doc = new JSDOM(result.head + result.html).window.document;
  assert.equal(doc.querySelector('link[rel="canonical"]').href, "https://bikersbrain.in/products?category=COILS&page=2");
  assert.equal(doc.querySelector('a[rel="next"]').getAttribute("href"), "/products?category=COILS&page=3");
  assert.equal(doc.querySelector('a[rel="prev"]').getAttribute("href"), "/products?category=COILS");
  const blog = render({ url: "/blog?page=2", status: 200, posts: [{ id: "p", slug: "oil-guide", title: "Oil Guide", excerpt: "Choosing oil", author: "Store Team", publishedAt: "2026-10-01", tags: [] }], blogPagination: { totalPages: 3 } });
  const blogDoc = new JSDOM(blog.head + blog.html).window.document;
  assert.equal(blogDoc.querySelector('link[rel="canonical"]').href, "https://bikersbrain.in/blog?page=2");
  assert.equal(blogDoc.querySelector('a[aria-label="Page 3"]').getAttribute("href"), "/blog?page=3");
});

test("home renders catalog links, product content and all real category links", () => {
  const result = render({ url: "/", status: 200, categories, products: { items: [product], total: 1, totalPages: 1 } });
  const doc = new JSDOM(result.html).window.document;
  assert.ok(doc.querySelector('nav[aria-label="All product categories"] a[href="/products?category=COILS"]'));
  assert.ok(doc.querySelector('a[href="/products/ignition-coil"]'));
});

test("unknown URLs and missing products return 404 data rather than indexable empty content", async () => {
  assert.equal((await loadCatalog("/does-not-exist", "", fixtureFetch)).status, 404);
  const data = await loadCatalog("/products/missing", "https://catalog.example", async () => response(null, 404));
  assert.equal(data.status, 404);
  assert.match(render(data).head, /noindex/);
  assert.doesNotMatch(render(data).head, /"@type":"Product"/);
});

test("temporary API failures remain retryable errors rather than permanent not-found pages", async () => {
  await assert.rejects(loadCatalog("/products/ignition-coil", "https://catalog.example", async () => response(null, 500)), error => error instanceof CatalogError && error.status === 503);
});

test("private pages do not fetch or serialize catalog/account data and are noindex", async () => {
  const data = await loadCatalog("/account", "", () => { throw new Error("Must not fetch"); });
  assert.deepEqual(Object.keys(data).sort(), ["status", "url"]);
  assert.match(render(data).head, /noindex/);
});

test("storefront handler sets real HTTP statuses and never caches account pages", async () => {
  const previousFetch = globalThis.fetch;
  const previousApi = process.env.SEO_API_URL;
  process.env.SEO_API_URL = "https://catalog.example";
  const call = async url => {
    const res = { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = body; } };
    await handler({ url }, res); return res;
  };
  try {
    globalThis.fetch = fixtureFetch;
    const success = await call("/api/storefront?path=/products/ignition-coil");
    assert.equal(success.statusCode, 200);
    const missing = await call("/api/storefront?path=/not-a-page");
    assert.equal(missing.statusCode, 404);
    assert.match(missing.headers["X-Robots-Tag"], /noindex/);
    const account = await call("/api/storefront?path=/account");
    assert.equal(account.headers["Cache-Control"], "private, no-store");
    globalThis.fetch = async () => response(null, 500);
    const outage = await call("/api/storefront?path=/products/ignition-coil");
    assert.equal(outage.statusCode, 503);
    assert.equal(outage.headers["Retry-After"], "60");
  } finally { globalThis.fetch = previousFetch; if (previousApi === undefined) delete process.env.SEO_API_URL; else process.env.SEO_API_URL = previousApi; }
});
