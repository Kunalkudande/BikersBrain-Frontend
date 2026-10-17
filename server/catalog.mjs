const publicPages = new Set(["/", "/products", "/blog", "/about", "/contact", "/return-policy", "/shipping-policy", "/privacy-policy", "/terms"]);
const privatePage = /^(?:\/admin(?:\/|$)|\/(?:login|register|forgot-password|reset-password|cart|checkout|account|wishlist|order-success|track-order)\/?$)/;

export class CatalogError extends Error {
  constructor(status) { super(`Catalog request failed (${status})`); this.status = status; }
}

/** Only use the configured API origin, never a URL supplied by a visitor. */
export async function loadCatalog(url, apiOrigin, fetcher = fetch) {
  const current = new URL(url, "https://store.invalid");
  const pathname = current.pathname;
  const validPage = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? String(Number(value)) : "1";
  const data = { url: pathname + current.search, status: 200 };
  if (privatePage.test(pathname)) return data;
  const product = /^\/products\/([^/]+)$/.exec(pathname);
  const article = /^\/blog\/([^/]+)$/.exec(pathname);
  if (!publicPages.has(pathname) && !product && !article) return { ...data, status: 404 };
  if (!["/", "/products", "/blog"].includes(pathname) && !product && !article) return data;
  if (!apiOrigin) throw new CatalogError(503);
  const origin = new URL(apiOrigin);
  const api = origin.href.replace(/\/$/, "").replace(/\/api$/, "") + "/api";
  async function get(path) {
    const response = await fetcher(api + path, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new CatalogError(response.status === 404 ? 404 : 503);
    const result = await response.json();
    if (!result.success) throw new CatalogError(503);
    return result;
  }
  try {
    if (product) {
      const [result, categories] = await Promise.all([get(`/products/${encodeURIComponent(decodeURIComponent(product[1]))}`), get("/products/categories")]);
      data.product = result.data;
      data.categories = categories.data;
    }
    else if (article) data.post = (await get(`/blog/${encodeURIComponent(decodeURIComponent(article[1]))}`)).data;
    else if (pathname === "/blog") {
      const params = new URLSearchParams({ page: validPage(current.searchParams.get("page")), limit: "9" });
      if (current.searchParams.has("category")) params.set("category", current.searchParams.get("category"));
      const result = await get(`/blog?${params}`);
      data.posts = result.data;
      data.blogPagination = result.pagination;
      if (Number(params.get("page")) > 1 && !data.posts.length) data.status = 404;
    } else {
      const params = new URLSearchParams({ page: "1", limit: pathname === "/" ? "100" : "12", sortBy: "createdAt", sortOrder: "desc" });
      for (const key of ["page", "category", "brand", "search", "inStock"]) {
        if (pathname !== "/" && current.searchParams.has(key)) params.set(key, key === "page" ? validPage(current.searchParams.get(key)) : current.searchParams.get(key));
      }
      const [sortBy, sortOrder] = (current.searchParams.get("sort") || "createdAt:desc").split(":");
      if (pathname !== "/") { params.set("sortBy", sortBy); params.set("sortOrder", sortOrder || "desc"); }
      const [products, categories] = await Promise.all([get(`/products?${params}`), get("/products/categories")]);
      data.products = products.data;
      data.categories = categories.data;
      if (pathname === "/products" && Number(params.get("page")) > 1 && !data.products.items.length) data.status = 404;
    }
    return data;
  } catch (error) {
    if (error instanceof CatalogError && error.status === 404) return { ...data, status: 404 };
    throw error;
  }
}

/** Replace only managed head tags; retain verification, GTM, fonts and built assets. */
export function documentHtml(template, rendered) {
  return template
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\b[^>]*(?:name=["'](?:description|keywords|robots|twitter:[^"']+)["']|property=["']og:[^"']+["'])[^>]*>/gi, "")
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "")
    .replace("</head>", `${rendered.head}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root">${rendered.html}</div>${rendered.dataScript}`);
}
