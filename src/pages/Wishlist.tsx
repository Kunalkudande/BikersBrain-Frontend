import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";

export default function Wishlist() {
  const { addItem, isGuest: cartIsGuest } = useCart();
  const { items, isLoading: loading, remove } = useWishlist();
  const { toast } = useToast();

  const handleRemove = async (productId: string) => {
    try {
      await remove(productId);
      toast({ title: "Removed from wishlist" });
    } catch {
      toast({ title: "Failed to remove", variant: "destructive" });
    }
  };

  const handleMoveToCart = async (item: typeof items[number]) => {
    try {
      if (cartIsGuest) {
        await addItem(item.product.id, 1, undefined, {
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            brand: item.product.brand,
            price: Number(item.product.price),
            discountPrice: item.product.discountPrice ? Number(item.product.discountPrice) : undefined,
            stock: item.product.stock,
            images: item.product.images,
          },
        });
      } else {
        await addItem(item.product.id, 1);
      }
      await remove(item.product.id);
      toast({ title: "Moved to cart!", description: item.product.name });
    } catch {
      toast({ title: "Failed to move to cart", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="font-oswald text-2xl md:text-3xl font-bold uppercase mb-8">
          My <span className="text-primary">Wishlist</span>
          {items.length > 0 && <span className="text-base text-muted-foreground ml-2 font-barlow normal-case">({items.length} item{items.length !== 1 ? "s" : ""})</span>}
        </h1>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border animate-pulse">
                <div className="aspect-square bg-secondary" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-5 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-oswald text-xl font-bold mb-2">Nothing here yet</h2>
            <p className="text-muted-foreground mb-6">Save products you love and come back to them anytime.</p>
            <Link to="/products">
              <Button className="font-barlow-condensed font-semibold uppercase tracking-wider">Explore Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item, i) => {
              const p = item.product;
              const discount = p.discountPrice
                ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
                : 0;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-card rounded-lg border border-border overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <div className="relative">
                    <Link to={`/products/${p.slug}`}>
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={p.images?.[0]?.imageUrl || "https://placehold.co/400x400/1F2937/FF6B35?text=Product"}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </Link>
                    {discount > 0 && (
                      <Badge className="absolute top-2 left-2 bg-destructive">{discount}% OFF</Badge>
                    )}
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-destructive hover:text-white transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">{p.brand}</p>
                    <Link to={`/products/${p.slug}`}>
                      <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h3>
                    </Link>
                    <div className="flex items-center gap-1 my-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className={`h-3 w-3 ${idx < Math.round(Number(p.rating)) ? "fill-warning text-warning" : "text-muted"}`} />
                      ))}
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-oswald font-bold">₹{(p.discountPrice || p.price).toLocaleString()}</span>
                      {p.discountPrice && <span className="text-xs text-muted-foreground line-through">₹{p.price.toLocaleString()}</span>}
                    </div>
                    <Button
                      size="sm"
                      className="w-full font-barlow-condensed text-xs uppercase tracking-wider gap-1"
                      disabled={p.stock === 0}
                      onClick={() => handleMoveToCart(item)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {p.stock === 0 ? "Out of Stock" : "Move to Cart"}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
