import { Helmet } from "react-helmet-async";

import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE, DEFAULT_DESCRIPTION, absoluteUrl, serializeJsonLd } from "@/lib/seo";
export { SITE_URL_CONST, organizationJsonLd, localBusinessJsonLd, websiteJsonLd, breadcrumbJsonLd, productJsonLd, articleJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";

export interface SEOProps {
  /** Page title — will be appended with " | BikersBrain" unless noSuffix */
  title: string;
  /** Meta description (140-160 chars ideal) */
  description?: string;
  /** Canonical URL path e.g. "/products" — full URL built automatically */
  canonical?: string;
  /** Open Graph image URL */
  ogImage?: string;
  /** OG type — defaults to "website" */
  ogType?: "website" | "article" | "product";
  /** Don't append site name suffix */
  noSuffix?: boolean;
  /** noindex this page */
  noIndex?: boolean;
  /** JSON-LD structured data objects */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Additional keywords for meta keywords tag */
  keywords?: string;
}

/**
 * Reusable SEO head component — injects title, meta, canonical, OG, Twitter, and JSON-LD.
 * Usage: <SEO title="All Products" description="..." canonical="/products" />
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noSuffix = false,
  noIndex = false,
  jsonLd,
  keywords,
}: SEOProps) {
  const fullTitle = noSuffix ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical ? absoluteUrl(canonical) : undefined;

  // Normalize JSON-LD to array
  const jsonLdArray = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noIndex ? "noindex, follow" : "index, follow, max-image-preview:large"} />

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={absoluteUrl(ogImage)} />
      {ogImage === DEFAULT_OG_IMAGE && <meta property="og:image:width" content="1200" />}
      {ogImage === DEFAULT_OG_IMAGE && <meta property="og:image:height" content="630" />}
      <meta property="og:image:alt" content={ogImage === DEFAULT_OG_IMAGE ? "BikersBrain — Spare and Accessories, Shree Om Automobiles, Pune" : title} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteUrl(ogImage)} />

      {/* JSON-LD Structured Data */}
      {jsonLdArray.map((data, i) => (
        <script key={i} type="application/ld+json">
          {serializeJsonLd(data)}
        </script>
      ))}
    </Helmet>
  );
}
