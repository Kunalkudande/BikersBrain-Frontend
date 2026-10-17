import { describe, expect, it } from "vitest";
import { listingSeo, productJsonLd, serializeJsonLd, articleJsonLd } from "./seo";

describe("catalog search indexing", () => {
  it("keeps each category page and pagination page canonical", () => {
    expect(listingSeo(new URLSearchParams("category=COILS&page=2"))).toEqual({ canonical: "/products?category=COILS&page=2", noIndex: false, page: 2 });
    expect(listingSeo(new URLSearchParams("page=1&utm_source=campaign"))).toEqual({ canonical: "/products", noIndex: false, page: 1 });
    expect(listingSeo(new URLSearchParams("page=NaN"))).toMatchObject({ canonical: "/products", page: 1 });
  });
  it("excludes internal search and filter permutations", () => {
    for (const params of ["search=coil", "category=COILS&brand=Test", "sort=price:asc", "inStock=true"]) expect(listingSeo(new URLSearchParams(params)).noIndex).toBe(true);
  });
});

describe("honest product structured data", () => {
  const product = { name: "Coil", slug: "coil", description: "<p>Replacement coil</p>", brand: "Test", category: "COILS", price: 650, discountPrice: 600, stock: 0, sku: "BB-COIL", rating: 0, totalReviews: 0, images: [{ imageUrl: "/coil.jpg" }] };
  it("does not invent ratings or a discount expiration date", () => {
    const schema = productJsonLd(product);
    expect(schema).not.toHaveProperty("aggregateRating");
    expect(schema.offers).not.toHaveProperty("priceValidUntil");
    expect(schema.description).toBe("Replacement coil");
    expect(schema.image).toEqual(["https://bikersbrain.in/coil.jpg"]);
  });
  it("matches the default available variant's stock and displayed price", () => {
    const schema = productJsonLd({ ...product, variants: [{ stock: 0, additionalPrice: 10 }, { stock: 3, additionalPrice: 50 }] });
    expect(schema.offers).toMatchObject({ price: "650.00", availability: "https://schema.org/InStock" });
    expect(productJsonLd({ ...product, stock: 4, variants: [{ stock: 0, additionalPrice: 0 }] }).offers.availability).toBe("https://schema.org/OutOfStock");
  });
  it("escapes stored text so it cannot break out of JSON-LD scripts", () => {
    const serialized = serializeJsonLd({ text: "</script><script>alert(1)</script>&" });
    expect(serialized).not.toContain("</script>");
    expect(JSON.parse(serialized).text).toBe("</script><script>alert(1)</script>&");
  });
  it("uses real article modification dates", () => {
    const post = { title: "Guide", slug: "guide", excerpt: "Guide excerpt", author: "Store Team", publishedAt: "2026-10-01", updatedAt: "2026-10-10", category: "Maintenance" };
    expect(articleJsonLd(post).dateModified).toBe(post.updatedAt);
  });
});
