import { Helmet } from "react-helmet-async";

const SITE_NAME = "BikersBrain";
const SITE_URL = "https://bikersbrain.in";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  "India's #1 online store for two-wheeler spare parts, motorcycle helmets, riding gear, engine oils & bike accessories. 100% genuine products. Free shipping over ₹2,999.";

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
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

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
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@BikersBrain" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {jsonLdArray.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}

/* ─── Reusable JSON-LD Generators ─── */

export const SITE_URL_CONST = SITE_URL;

/** Organization schema — use on homepage */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BikersBrain",
    alternateName: "Shree Om Automobiles",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    description: DEFAULT_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Shop No. 7, Highway Chowk, NDA Rd, Warje",
      addressLocality: "Pune",
      addressRegion: "Maharashtra",
      postalCode: "411058",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-97621-63742",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi", "Marathi"],
    },
    sameAs: [
      "https://www.instagram.com/shree_om_automobiles",
      "https://www.youtube.com/channel/UCsXWMuXV_458D_J3I_UUOJw",
      "https://www.facebook.com/shreeomauto",
    ],
  };
}

/** LocalBusiness schema — use on homepage & contact */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    name: "BikersBrain — Shree Om Automobiles",
    image: `${SITE_URL}/og-image.png`,
    url: SITE_URL,
    telephone: "+91-97621-63742",
    email: "bikersbrain.official@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Shop No. 7, Highway Chowk, NDA Rd, Warje",
      addressLocality: "Pune",
      addressRegion: "Maharashtra",
      postalCode: "411058",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 18.4825,
      longitude: 73.8070,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday",
      ],
      opens: "09:00",
      closes: "21:00",
    },
    priceRange: "₹₹",
  };
}

/** WebSite schema with SearchAction for sitelinks search box */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BikersBrain",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** BreadcrumbList schema */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/** Product schema for PDP */
export function productJsonLd(product: {
  name: string;
  slug: string;
  description: string;
  brand: string;
  category: string;
  price: number;
  discountPrice?: number;
  sku: string;
  rating: number;
  totalReviews: number;
  stock: number;
  images: { imageUrl: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((img) => img.imageUrl),
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.category.replace(/_/g, " "),
    url: `${SITE_URL}/products/${product.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.discountPrice || product.price,
      ...(product.discountPrice && {
        priceValidUntil: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString().split("T")[0],
      }),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "BikersBrain",
      },
      itemCondition: "https://schema.org/NewCondition",
      url: `${SITE_URL}/products/${product.slug}`,
    },
    ...(product.totalReviews > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(product.rating).toFixed(1),
        reviewCount: product.totalReviews,
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };
}

/** Article schema for blog posts */
export function articleJsonLd(post: {
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  coverImage?: string;
  category: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || DEFAULT_OG_IMAGE,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "BikersBrain",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    articleSection: post.category,
  };
}

/** FAQ schema */
export function faqJsonLd(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** CollectionPage / ItemList for product listing pages */
export function itemListJsonLd(
  products: {
    name: string;
    slug: string;
    price: number;
    discountPrice?: number;
    images: { imageUrl: string }[];
  }[],
  listName: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 12).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/products/${p.slug}`,
      name: p.name,
      image: p.images?.[0]?.imageUrl,
    })),
  };
}
