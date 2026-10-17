# BikersBrain search visibility

The canonical website is **https://bikersbrain.in**. This implementation keeps the current storefront and admin features.

## What the code provides

- Public pages render the existing React components on the server. Product names, images, descriptions, prices, category links, titles, canonical URLs and structured data appear in the initial HTML for every visitor, including crawlers and social previews. No user-agent detection or bot-only pages are used.
- Product and category pagination uses crawlable links and a separate canonical per page. Internal search, sorting and compound filters are `noindex, follow`. Account, checkout, authentication, orders and admin routes are excluded from search indexing.
- Missing URLs return HTTP 404. Temporary catalog failures return HTTP 503 with Retry-After, so an API outage cannot silently deindex all products as “not found.”
- Product markup uses actual price and inventory, including the default available variant. It does not invent ratings, GTINs, part numbers or offer expiration dates. Full variant ProductGroup markup is intentionally not emitted: each selectable variant would first need a stable address that preselects it.
- `/sitemap.xml` is a live sitemap index. `/sitemap-pages.xml` includes public pages and populated active categories; product and article sitemaps are partitioned in batches of 1,000. Only active products and published articles are included. Product image URLs and real modification timestamps are included. Static pages do not get fabricated last-modified dates.
- `/merchant-feed.xml` supplies a Google Merchant Center feed from active products. Products without a real image are excluded. Product identifiers, shipping, taxes, returns and any apparel attributes must still be reviewed in Merchant Center before approval. SKU is not passed off as a GTIN or manufacturer's part number.
- Public HTML is cached for 60 seconds at the CDN, with up to 5 minutes of stale content during revalidation. Sitemap/feed cache is 5 minutes. Final stock and checkout prices remain validated by the existing API. Private pages are never CDN cached.

## Deploy both applications

1. Deploy the backend changes first. Confirm `GET /api/seo/sitemap.xml` and `/api/seo/merchant-feed.xml` return XML.
2. Set backend `SITE_URL=https://bikersbrain.in` (this is also the default).
3. On the frontend's Vercel project, keep `VITE_API_URL` pointed at the publicly reachable backend origin, without `/api`. Set `SEO_API_URL` if the server must use a different backend origin. A localhost address must not be used in production. No database credentials belong in frontend environment variables.
4. Keep `VITE_SITE_URL=https://bikersbrain.in`. Run the default `npm run build`; it builds the client and server bundles and moves the HTML template to `dist/app-shell.html`. Do not change the build to plain `vite build`, since that bypasses SSR. `vercel.json` includes the server bundle and routes requests through the public renderer.
5. Deploy the frontend on Vercel. These functions require Node.js 20 or newer. For another hosting provider, adapt the same functions to that provider before publishing; serving `dist/` alone will not provide SSR.

The app-shell filename is deliberate: a static root `index.html` would take precedence over Vercel's homepage rewrite. JavaScript, CSS, favicons, social images and robots.txt stay static. The public renderer ignores cookies and never loads account/cart data.

## Verify after deployment

- Open the source of a real product page. Confirm it includes the product name, one canonical tag, one description and Product JSON-LD without needing JavaScript.
- Confirm an invented product slug responds with HTTP 404, not 200. Confirm `/account` has `X-Robots-Tag: noindex, follow` and `Cache-Control: private, no-store`.
- Open `/sitemap.xml`, then the child sitemaps it names. Confirm they contain the canonical domain and current products. Open `/merchant-feed.xml` and check prices, images and stock against product pages.
- Use Google's [Rich Results Test](https://search.google.com/test/rich-results) on a real product and article. Test mobile performance with [PageSpeed Insights](https://pagespeed.web.dev/).
- Existing Google Tag Manager and the existing Search Console verification token are retained. Nothing has been submitted or changed in your Google accounts by this code update.

## Account actions still required

1. In [Google Search Console](https://search.google.com/search-console), verify ownership of bikersbrain.in if it is not already verified, then submit `https://bikersbrain.in/sitemap.xml`. Inspect the homepage, one category and one product. Track indexing, impressions, clicks and search queries over time.
2. In [Google Merchant Center](https://merchants.google.com/), claim the same website and add `https://bikersbrain.in/merchant-feed.xml` as a scheduled source for India/INR. Configure accurate shipping, returns and tax settings. Supply real GTIN/MPN identifiers and required variant attributes where available; resolve diagnostics before relying on free listings.
3. Keep the Google Business Profile for Shree Om Automobiles accurate: address, telephone, opening hours, website, store photos and product range. Do not create a duplicate profile for the same shop.

## Ongoing catalog/content work

- Use descriptive product names with the real brand, part type and model/size when confirmed. Include fitment, model years, dimensions, connector type or part number in Extra Details where relevant. Do not claim universal compatibility without evidence.
- Write useful original descriptions and add clear product photographs. Populate category descriptions in admin rather than repeating keywords or copying manufacturers' pages wholesale.
- Publish helpful maintenance and buying guides based on actual products and link them to the relevant categories. The existing blog meta title/description fields now control the article's search metadata.
- Request genuine customer reviews. Never add invented reviews, customer counts, certifications or business facts. Store-history and policy copy should be checked by the business owner.
- Review Search Console and Merchant Center regularly. SEO implementation makes pages eligible and easier to understand; rankings, rich results and traffic depend on competition, content quality, stock, reputation and Google's systems.

## Local checks

```text
npm run build
npm test
npm run test:seo
npx tsc --noEmit -p tsconfig.app.json
npm run preview
```

`npm run preview` serves the SSR storefront at http://localhost:4173. It reads the production-mode API URL, or falls back to localhost:5000. Run the backend as well. Local development at port 3000 remains the normal Vite workflow.

Backend verification: `npm run build` and `npx ts-node tests/seo.validation.ts`.

## Search logo and brand previews

The existing brain logo is packaged into square, opaque dark icons (#121212) to match the website header. `favicon.ico` is a real ICO container; `favicon.png` is 96×96, with 192×192 and 512×512 versions and a 180×180 Apple touch icon. The organization logo is `brand-logo.png` on white; the default social preview is 1200×630. Regenerate these from the existing source logo with `npm run assets:brand`.

After deploying, use Search Console URL Inspection to request indexing for `https://bikersbrain.in/`. Keep favicon URLs stable. Google may take days or weeks to refresh a favicon or site name and chooses the final search appearance. The website cannot change Google's dark-mode page background. See [Google's favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search) and [site-name guidance](https://developers.google.com/search/docs/appearance/site-names).

## References

- [Google: JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: ecommerce URLs](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites)
- [Google: pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)
- [Google: merchant listing structured data](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing)
- [Google: sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Vercel: Vite](https://vercel.com/docs/frameworks/frontend/vite)
