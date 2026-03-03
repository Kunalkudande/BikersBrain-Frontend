import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Star, ShoppingCart, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productsApi } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";

/* ── Types ────────────────────────────────────────────────────────── */

interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  images: { imageUrl: string; isPrimary?: boolean }[];
  rating: number;
  totalReviews: number;
}

interface Category {
  value: string;
  label: string;
  group: string;
  groupSortOrder?: number;
}

const PLACEHOLDER =
  "https://placehold.co/400x400/1F2937/FF6B35?text=No+Image";

/* ── Component ────────────────────────────────────────────────────── */

const FeaturedGear = () => {
  const { addItem, isGuest } = useCart();
  const { has: isWishlisted, toggle: toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const { toast } = useToast();
  const phone = import.meta.env.VITE_WHATSAPP_NUMBER || "";

  /* ── Data fetching ── */
  const { data: catData } = useQuery({
    queryKey: ["categories-public"],
    queryFn: () => productsApi.getCategories(),
    staleTime: 1000 * 60 * 30,
  });

  const { data: prodData, isLoading } = useQuery({
    queryKey: ["products", "featured-gear"],
    queryFn: () =>
      productsApi.getAll({ limit: 100, sortBy: "createdAt", order: "desc" }),
    staleTime: 1000 * 60 * 5,
  });

  const categories: Category[] = (catData?.data as Category[]) ?? [];
  const allProducts: Product[] =
    (prodData?.data as { items?: Product[] })?.items ?? [];

  /* ── Group products by category group (respecting admin sort order) ── */
  const groupToCatValues: Record<string, string[]> = {};
  const groupSortOrderMap: Record<string, number> = {};
  for (const c of categories) {
    (groupToCatValues[c.group] ??= []).push(c.value);
    if (groupSortOrderMap[c.group] === undefined) {
      groupSortOrderMap[c.group] = c.groupSortOrder ?? 0;
    }
  }

  // Sort groups by groupSortOrder, then alphabetically
  const sortedGroupNames = Object.keys(groupToCatValues).sort((a, b) => {
    const aO = groupSortOrderMap[a] ?? 0;
    const bO = groupSortOrderMap[b] ?? 0;
    return aO - bO || a.localeCompare(b);
  });

  const groupedProducts: { group: string; products: Product[] }[] = [];
  for (const group of sortedGroupNames) {
    const catValues = groupToCatValues[group];
    if (!catValues?.length) continue;
    const products = allProducts.filter((p) => catValues.includes(p.category));
    if (products.length === 0) continue;
    groupedProducts.push({ group, products });
  }

  /* ── Handlers ── */
  const handleAddToCart = async (product: Product) => {
    if (isGuest) {
      await addItem(product.id, 1, undefined, {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          price: Number(product.price),
          discountPrice: product.discountPrice
            ? Number(product.discountPrice)
            : undefined,
          stock: product.stock,
          images: product.images,
        },
      });
    } else {
      await addItem(product.id, 1);
    }
    toast({
      title: "Added to cart!",
      description: product.name,
    });
  };

  const handleBuyNow = async (product: Product) => {
    if (isGuest) {
      await addItem(product.id, 1, undefined, {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          price: Number(product.price),
          discountPrice: product.discountPrice
            ? Number(product.discountPrice)
            : undefined,
          stock: product.stock,
          images: product.images,
        },
      });
    } else {
      await addItem(product.id, 1);
    }
    navigate("/checkout");
  };

  const handleWhatsApp = (product: Product) => {
    const price = `₹${Number(
      product.discountPrice ?? product.price
    ).toLocaleString("en-IN")}`;
    const msg = `Hi! I'm interested in buying:\n*${product.name}*\nPrice: ${price}\n\nhttps://${window.location.host}/products/${product.slug}`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  /* ── Skeleton while loading ── */
  const SkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-lg border border-border overflow-hidden animate-pulse"
        >
          <div className="aspect-square bg-secondary" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-16 bg-secondary rounded" />
            <div className="h-4 w-full bg-secondary rounded" />
            <div className="h-3 w-24 bg-secondary rounded" />
            <div className="h-5 w-20 bg-secondary rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* ── Section header ── */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-oswald text-3xl md:text-4xl font-bold uppercase">
              Featured <span className="text-primary">Gear</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Hand-picked by our experts
            </p>
          </div>
          <Link
            to="/products"
            className="hidden md:inline-flex items-center gap-1 text-primary font-barlow-condensed font-semibold tracking-wider uppercase text-sm hover:underline"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* ── Loading state ── */}
        {isLoading && groupedProducts.length === 0 && (
          <div className="space-y-14">
            {[1, 2].map((i) => (
              <div key={i}>
                <div className="h-7 w-40 bg-secondary rounded mb-6 animate-pulse" />
                <SkeletonGrid />
              </div>
            ))}
          </div>
        )}

        {/* ── Category groups ── */}
        <div className="space-y-16">
          {groupedProducts.map(({ group, products }) => (
            <div key={group}>
              {/* Group header with divider */}
              <div className="flex items-center gap-4 mb-8">
                <h3 className="font-oswald text-xl md:text-2xl font-bold uppercase tracking-wide whitespace-nowrap">
                  {group}
                </h3>
                <div className="flex-1 h-px bg-border" />
                <Link
                  to={`/products?category=${encodeURIComponent(
                    (groupToCatValues[group] ?? [])[0] ?? ""
                  )}`}
                  className="text-xs font-barlow-condensed font-semibold tracking-wider uppercase text-primary hover:underline whitespace-nowrap"
                >
                  View All →
                </Link>
              </div>

              {/* Product grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
                {products.slice(0, 12).map((product, i) => {
                  const image =
                    product.images?.[0]?.imageUrl || PLACEHOLDER;
                  const isOnSale =
                    product.discountPrice &&
                    product.discountPrice < product.price;
                  const discount = isOnSale
                    ? Math.round(
                        ((product.price - product.discountPrice!) /
                          product.price) *
                          100
                      )
                    : 0;

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(i * 0.05, 0.3) }}
                      className="group bg-card rounded-lg border border-border overflow-hidden hover:border-primary/30 transition-colors"
                    >
                      {/* Image */}
                      <Link
                        to={`/products/${product.slug}`}
                        className="block relative aspect-square overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={`${product.brand} ${product.name} — Buy online at BikersBrain`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          width={400}
                          height={400}
                        />

                        {discount > 0 && (
                          <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-[10px]">
                            {discount}% OFF
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
                      </Link>

                      {/* Info */}
                      <div className="p-3 md:p-4">
                        <p className="text-[10px] text-muted-foreground font-barlow-condensed tracking-wider uppercase mb-1">
                          {product.brand}
                        </p>
                        <Link to={`/products/${product.slug}`}>
                          <h4 className="font-semibold text-xs md:text-sm leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                        </Link>

                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          <span className="text-[10px] text-muted-foreground">
                            {Number(product.rating ?? 0).toFixed(1)} (
                            {product.totalReviews ?? 0})
                          </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-oswald font-bold text-sm md:text-base">
                            ₹
                            {(
                              product.discountPrice ?? product.price
                            ).toLocaleString()}
                          </span>
                          {isOnSale && (
                            <span className="text-muted-foreground text-[10px] line-through">
                              ₹{product.price.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-1.5">
                          {/* Add to Cart */}
                          <Button
                            size="sm"
                            className="w-full text-[11px] font-barlow-condensed font-semibold tracking-wider uppercase gap-1.5 h-8"
                            disabled={product.stock === 0}
                            onClick={() => handleAddToCart(product)}
                          >
                            <ShoppingCart className="h-3 w-3" />
                            {product.stock === 0
                              ? "Out of Stock"
                              : "Add to Cart"}
                          </Button>

                          {/* Buy Now + WhatsApp */}
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="flex-1 text-[11px] font-barlow-condensed font-semibold tracking-wider uppercase h-8"
                              disabled={product.stock === 0}
                              onClick={() => handleBuyNow(product)}
                            >
                              Buy Now
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 w-8 p-0 bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0"
                              disabled={product.stock === 0}
                              onClick={() => handleWhatsApp(product)}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-10 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link
              to="/products"
              className="font-barlow-condensed font-semibold tracking-wider uppercase"
            >
              View All Products
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedGear;
