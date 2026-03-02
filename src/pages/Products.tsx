import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Filter, SlidersHorizontal, Heart, Star, ShoppingCart, ChevronDown, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { productsApi } from "@/lib/api";
import { useWishlist } from "@/hooks/useWishlist";

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest First" },
  { value: "price:asc", label: "Price: Low → High" },
  { value: "price:desc", label: "Price: High → Low" },
  { value: "rating:desc", label: "Top Rated" },
  { value: "name:asc", label: "A → Z" },
];

interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  rating: number;
  totalReviews: number;
  images: { imageUrl: string; isPrimary: boolean }[];
  variants: { id: string; size: string; color: string; stock: number }[];
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string; parentId?: string | null; id?: string; sortOrder?: number }[]>([]);
  const { has: isWishlisted, toggle: toggleWishlist } = useWishlist();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "createdAt:desc";
  const inStock = searchParams.get("inStock") || "";

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const [sortBy, sortOrder] = sort.split(":");
        const params: Record<string, string> = {
          page: String(page),
          limit: "12",
          sortBy,
          sortOrder,
        };
        if (category) params.category = category;
        if (brand) params.brand = brand;
        if (search) params.search = search;
        if (inStock) params.inStock = "true";

        const res = await productsApi.list(params);
        if (res.success) {
          const d = res.data as any;
          setProducts(d.items || []);
          setTotal(d.total || 0);
          setTotalPages(d.totalPages || 0);
        }
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [page, category, brand, search, sort, inStock]);

  useEffect(() => {
    productsApi.getBrands().then((res) => {
      if (res.success) setBrands((res.data as string[]) || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    productsApi.getCategories().then((res) => {
      if (res.success) setCategories((res.data as { value: string; label: string; parentId?: string | null; id?: string; sortOrder?: number }[]) || []);
    }).catch(() => {});
  }, []);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.set("page", "1");
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = category || brand || search || inStock;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Page Header */}
        <section className="bg-secondary/30 border-b border-border py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="font-oswald text-3xl md:text-4xl font-bold uppercase">
                  {category ? categories.find(c => c.value === category)?.label || "Products" : search ? `Results for "${search}"` : "All Products"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {total} product{total !== 1 ? "s" : ""} found
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={sort} onValueChange={(v) => updateParams("sort", v)}>
                  <SelectTrigger className="w-[200px] bg-card">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="md:hidden" onClick={() => setFiltersOpen(!filtersOpen)}>
                  <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <aside className={`${filtersOpen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : "hidden"} md:block md:relative md:inset-auto md:z-auto md:bg-transparent md:p-0 w-full md:w-64 flex-shrink-0`}>
              <div className="flex items-center justify-between mb-6 md:mb-4">
                <h3 className="font-oswald text-lg font-bold uppercase flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filters
                </h3>
                <div className="flex gap-2">
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                      Clear All
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setFiltersOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="text-sm font-semibold font-barlow-condensed uppercase tracking-wider mb-2 block">Search</label>
                <div className="relative">
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => updateParams("search", e.target.value)}
                    className="bg-card pr-8"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="text-sm font-semibold font-barlow-condensed uppercase tracking-wider mb-3 block">Category</label>
                <div className="space-y-1">
                  {(() => {
                    // Build tree: top-level first, then children indented
                    const topLevel = categories.filter(c => !c.parentId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                    const childMap = new Map<string, typeof categories>();
                    for (const c of categories.filter(c => c.parentId)) {
                      if (!childMap.has(c.parentId!)) childMap.set(c.parentId!, []);
                      childMap.get(c.parentId!)!.push(c);
                    }
                    const items: { cat: typeof categories[0]; depth: number }[] = [];
                    for (const p of topLevel) {
                      items.push({ cat: p, depth: 0 });
                      const kids = childMap.get(p.id || "");
                      if (kids) {
                        kids.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                        for (const kid of kids) items.push({ cat: kid, depth: 1 });
                      }
                    }
                    // Also add orphan children (parent not in list)
                    const shownIds = new Set(items.map(i => i.cat.value));
                    for (const c of categories.filter(c => c.parentId && !shownIds.has(c.value))) {
                      items.push({ cat: c, depth: 1 });
                    }
                    return items.map(({ cat, depth }) => (
                      <button
                        key={cat.value}
                        onClick={() => updateParams("category", category === cat.value ? "" : cat.value)}
                        className={`block w-full text-left rounded-md text-sm transition-colors ${
                          category === cat.value
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-secondary text-muted-foreground"
                        } ${depth === 0 ? "px-3 py-2 font-medium" : "pl-7 pr-3 py-1.5 text-xs"}`}
                      >
                        {depth > 0 && <span className="text-muted-foreground/50 mr-1">›</span>}
                        {cat.label}
                      </button>
                    ));
                  })()}
                </div>
              </div>

              {/* Brand */}
              {brands.length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-semibold font-barlow-condensed uppercase tracking-wider mb-3 block">Brand</label>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {brands.map((b) => (
                      <button
                        key={b}
                        onClick={() => updateParams("brand", brand === b ? "" : b)}
                        className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                          brand === b
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-secondary text-muted-foreground"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* In Stock */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={inStock === "true"}
                    onCheckedChange={(checked) => updateParams("inStock", checked ? "true" : "")}
                  />
                  <span className="text-sm">In Stock Only</span>
                </label>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              {/* Active Filters */}
              {hasFilters && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {category && (
                    <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateParams("category", "")}>
                      {categories.find(c => c.value === category)?.label || category} <X className="h-3 w-3" />
                    </Badge>
                  )}
                  {brand && (
                    <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateParams("brand", "")}>
                      {brand} <X className="h-3 w-3" />
                    </Badge>
                  )}
                  {search && (
                    <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateParams("search", "")}>
                      "{search}" <X className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              )}

              {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border border-border overflow-hidden">
                      <Skeleton className="aspect-square" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-oswald text-xl font-bold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms</p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {products.map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link
                          to={`/products/${product.slug}`}
                          className="group block bg-card rounded-lg border border-border overflow-hidden hover:border-primary/30 transition-colors"
                        >
                          <div className="relative aspect-square overflow-hidden">
                            <img
                              src={product.images?.[0]?.imageUrl || "https://placehold.co/400x400/1F2937/FF6B35?text=No+Image"}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                            {product.discountPrice && (
                              <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                                {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                              </Badge>
                            )}
                            {product.stock === 0 && (
                              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                <Badge variant="secondary">Out of Stock</Badge>
                              </div>
                            )}
                            <button
                              className={`absolute top-3 right-3 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-all ${
                                isWishlisted(product.id)
                                  ? "bg-primary text-primary-foreground opacity-100"
                                  : "bg-background/80 opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground"
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                toggleWishlist(product.id, {
                                  id: product.id,
                                  name: product.name,
                                  slug: product.slug,
                                  brand: product.brand,
                                  price: Number(product.price),
                                  discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
                                  rating: Number(product.rating ?? 0),
                                  stock: product.stock,
                                  images: product.images,
                                });
                              }}
                            >
                              <Heart className={`h-4 w-4 ${isWishlisted(product.id) ? "fill-current" : ""}`} />
                            </button>
                          </div>
                          <div className="p-4">
                            <p className="text-xs text-muted-foreground font-barlow-condensed tracking-wider uppercase mb-1">
                              {product.brand}
                            </p>
                            <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              <span className="text-xs text-muted-foreground">
                                {Number(product.rating).toFixed(1)} ({product.totalReviews})
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-oswald font-bold text-lg">
                                  ₹{(product.discountPrice || product.price).toLocaleString()}
                                </span>
                                {product.discountPrice && (
                                  <span className="text-muted-foreground text-xs line-through">
                                    ₹{product.price.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary hover:text-primary-foreground">
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                      <Button
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => updateParams("page", String(page - 1))}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const p = page <= 3 ? i + 1 : page + i - 2;
                        if (p < 1 || p > totalPages) return null;
                        return (
                          <Button
                            key={p}
                            variant={p === page ? "default" : "outline"}
                            onClick={() => updateParams("page", String(p))}
                            className="w-10"
                          >
                            {p}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => updateParams("page", String(page + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
