export const SITE_NAME = "BikersBrain";
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://bikersbrain.in").replace(/\/$/, "");
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const DEFAULT_DESCRIPTION = "Shop two-wheeler spare parts, ignition coils, clutch plates, engine oils, helmets and accessories at BikersBrain by Shree Om Automobiles, Pune.";

export function absoluteUrl(path: string): string {
  const url = new URL(path, SITE_URL);
  if (!["https:", "http:"].includes(url.protocol)) return SITE_URL;
  return url.href;
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function pageNumber(value: string | null): number {
  const n = Number(value || 1);
  return Number.isSafeInteger(n) && n > 0 ? n : 1;
}

/** Keep category and pagination indexable; search and compound filters are not landing pages. */
export function listingSeo(params: URLSearchParams, base = "/products") {
  const canonical = new URLSearchParams();
  const category = params.get("category");
  if (category) canonical.set("category", category);
  const page = pageNumber(params.get("page"));
  if (page > 1) canonical.set("page", String(page));
  const noIndex = [...params.keys()].some(key => !["category", "page"].includes(key) && !key.startsWith("utm_") && !["gclid", "fbclid"].includes(key));
  return { canonical: base + (canonical.toString() ? `?${canonical}` : ""), noIndex, page };
}

/* ─── Reusable JSON-LD Generators ─── */

export const SITE_URL_CONST = SITE_URL;

/** Organization schema — use on homepage */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "BikersBrain",
    alternateName: ["Bikers Brain", "Shree Om Automobiles"],
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/brand-logo.png`, width: 512, height: 512 },
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
    "@id": `${SITE_URL}/#store`,
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

/** Explicit site identity helps Google distinguish the store from generic riding topics. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: ["Bikers Brain", "bikersbrain.in"],
    url: `${SITE_URL}/`,
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE_URL}/#organization` },
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
      item: absoluteUrl(item.url),
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
  discountPrice?: number | null;
  sku: string;
  rating: number;
  totalReviews: number;
  stock: number;
  images: { imageUrl: string }[];
  variants?: { stock: number; additionalPrice?: number | string }[];
  specifications?: { details?: { label: string; value: string }[] | null } | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/products/${product.slug}#product`,
    name: product.name,
    description: product.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    image: product.images.map((img) => absoluteUrl(img.imageUrl)),
    sku: product.sku,
    ...(product.specifications?.details?.length && {
      additionalProperty: product.specifications.details.map(detail => ({ "@type": "PropertyValue", name: detail.label, value: detail.value })),
    }),
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.category.replace(/_/g, " "),
    url: `${SITE_URL}/products/${product.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (Number(product.discountPrice || product.price) + Number((product.variants?.find(variant => variant.stock > 0) || product.variants?.[0])?.additionalPrice || 0)).toFixed(2),
      availability:
        (product.variants?.length ? product.variants.some(variant => variant.stock > 0) : product.stock > 0)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "BikersBrain",
      },
      itemCondition: "https://schema.org/NewCondition",
      url: `${SITE_URL}/products/${product.slug}`,
    },
    ...(product.totalReviews > 0 && Number(product.rating) >= 1 && Number(product.rating) <= 5 && {
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
  updatedAt?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || DEFAULT_OG_IMAGE,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    ...(post.updatedAt && { dateModified: post.updatedAt }),
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "BikersBrain",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand-logo.png`,
        width: 512,
        height: 512,
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
    discountPrice?: number | null;
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
