import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productsApi } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import catHelmets from "@/assets/cat-helmets.jpg";

interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  discountPrice?: number | null;
  images: { url: string; alt?: string }[];
  rating: number;
  totalReviews: number;
  isNew?: boolean;
}

const FeaturedProducts = () => {
  const { addItem, isGuest } = useCart();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => productsApi.getAll({ limit: 4, sortBy: "createdAt", order: "desc" }),
    staleTime: 1000 * 60 * 5,
  });

  const products: Product[] = (data?.data as { items?: Product[] })?.items ?? [];

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-oswald text-3xl md:text-4xl font-bold uppercase">
              Featured <span className="text-primary">Gear</span>
            </h2>
            <p className="text-muted-foreground mt-2">Hand-picked by our experts</p>
          </div>
          <Link
            to="/products"
            className="hidden md:inline-flex text-primary font-barlow-condensed font-semibold tracking-wider uppercase text-sm hover:underline"
          >
            View All →
          </Link>
        </div>

        {products.length === 0 ? (
          // Skeleton placeholders while loading
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border overflow-hidden animate-pulse">
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
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, i) => {
              const image = product.images?.[0]?.url ?? catHelmets;
              const isOnSale = product.discountPrice && product.discountPrice < product.price;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-card rounded-lg border border-border overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <Link to={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden">
                    <img
                      src={image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).src = catHelmets; }}
                    />
                    {isOnSale && (
                      <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                        Sale
                      </Badge>
                    )}
                    {i === 0 && !isOnSale && (
                      <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                        Best Seller
                      </Badge>
                    )}
                    <button
                      className="absolute top-3 right-3 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
                      onClick={(e) => { e.preventDefault(); }}
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </Link>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground font-barlow-condensed tracking-wider uppercase mb-1">
                      {product.brand}
                    </p>
                    <Link to={`/products/${product.slug}`}>
                      <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span className="text-xs text-muted-foreground">
                        {Number(product.rating ?? 0).toFixed(1)} ({product.totalReviews ?? 0})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-oswald font-bold text-lg">
                          ₹{(product.discountPrice ?? product.price).toLocaleString()}
                        </span>
                        {isOnSale && (
                          <span className="text-muted-foreground text-xs line-through">
                            ₹{product.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-primary hover:text-primary-foreground"
                        onClick={() => isGuest ? navigate(`/products/${product.slug}`) : addItem(product.id, 1)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/products" className="font-barlow-condensed font-semibold tracking-wider uppercase">
              View All Products
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
