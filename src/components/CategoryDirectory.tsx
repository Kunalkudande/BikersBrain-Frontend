import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";

/** Visible crawlable links to the real catalog, including categories without featured products. */
export default function CategoryDirectory() {
  const { data } = useQuery({ queryKey: ["categories-public"], queryFn: () => productsApi.getCategories(), staleTime: 30 * 60 * 1000 });
  const categories = (data?.data || []) as { value: string; label: string; group: string }[];
  if (!categories.length) return null;
  return (
    <section className="container mx-auto px-4 py-10 border-t border-border" aria-labelledby="category-directory-title">
      <h2 id="category-directory-title" className="font-oswald text-2xl font-bold uppercase mb-3">Shop two-wheeler parts & accessories by category</h2>
      <p className="text-muted-foreground mb-5 max-w-3xl">Browse spare parts, electrical components, engine oils, helmets and accessories for motorcycles and scooters. Check each product’s compatibility before ordering, or <Link to="/contact" className="text-primary underline">ask our Pune store for help choosing the right part</Link>.</p>
      <nav aria-label="All product categories" className="flex flex-wrap gap-x-6 gap-y-3">
        {categories.map(category => <Link key={category.value} to={`/products?category=${encodeURIComponent(category.value)}`} className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4">{category.label}</Link>)}
      </nav>
    </section>
  );
}
