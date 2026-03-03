import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, Minus, Plus, ChevronLeft, ChevronRight, Check, MessageCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BulkOrderModal from "@/components/BulkOrderModal";
import SEO, { productJsonLd, breadcrumbJsonLd } from "@/components/SEO";
import { productsApi } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
}

interface Variant {
  id: string;
  size: string;
  color: string;
  stock: number;
  additionalPrice: number;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  isVerifiedPurchase: boolean;
  user: { fullName: string };
}

interface Specification {
  weight: string;
  material: string;
  certifications: string[];
  visorType: string;
  ventilation: boolean;
  features: string[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  sku: string;
  rating: number;
  totalReviews: number;
  images: ProductImage[];
  variants: Variant[];
  specifications: Specification | null;
  reviews: Review[];
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  discountPrice?: number;
  rating: number;
  images: ProductImage[];
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { has: isWishlisted, toggle: toggleWishlist } = useWishlist();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const zoomRef = useRef<HTMLDivElement>(null);

  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomRef.current) return;
    const rect = zoomRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const prevImage = () => {
    if (!product) return;
    setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    if (!product) return;
    setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    productsApi.getBySlug(slug).then((res) => {
      if (res.success) {
        const p = res.data as Product;
        setProduct(p);
        if (p.variants.length > 0) {
          setSelectedVariant(p.variants.find(v => v.stock > 0) || p.variants[0]);
        }
      }
    }).catch(() => {}).finally(() => setIsLoading(false));

    productsApi.getRelated(slug).then((res) => {
      if (res.success) setRelated((res.data as RelatedProduct[]) || []);
    }).catch(() => {});
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      await addItem(product.id, quantity, selectedVariant?.id, {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          price: Number(product.price),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
          stock: product.stock,
          images: product.images,
        },
        variant: selectedVariant ?? undefined,
      });
      toast({ title: "Added to cart!", description: `${product.name} x${quantity}` });
    } catch {
      toast({ title: "Failed to add", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      await addItem(product.id, quantity, selectedVariant?.id, {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          price: Number(product.price),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
          stock: product.stock,
          images: product.images,
        },
        variant: selectedVariant ?? undefined,
      });
      navigate("/checkout");
    } catch {
      toast({ title: "Failed", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleWhatsApp = () => {
    if (!product) return;
    const phone = import.meta.env.VITE_WHATSAPP_NUMBER || "";
    const variant = selectedVariant ? ` (${selectedVariant.color}, ${selectedVariant.size})` : "";
    const price = currentPrice ? `₹${currentPrice.toLocaleString("en-IN")}` : "";
    const message = `Hi! I'm interested in buying:\n*${product.name}*${variant}\nQty: ${quantity}\nPrice: ${price}\n\nhttps://${window.location.host}/products/${product.slug}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const currentPrice = product
    ? Number(product.discountPrice || product.price) + Number(selectedVariant?.additionalPrice || 0)
    : 0;
  const originalPrice = product?.discountPrice
    ? Number(product.price) + Number(selectedVariant?.additionalPrice || 0)
    : 0;
  const maxStock = selectedVariant ? selectedVariant.stock : (product?.stock || 0);
  const discount = product?.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-10">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="font-oswald text-2xl font-bold mb-4">Product Not Found</h2>
          <Link to="/products"><Button>Browse Products</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const uniqueSizes = [...new Set(product.variants.map(v => v.size))];
  const uniqueColors = [...new Set(product.variants.map(v => v.color))];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${product.name} — ${product.brand} | Buy Online`}
        description={`Buy ${product.name} by ${product.brand} at ₹${(product.discountPrice || product.price).toLocaleString("en-IN")}. ${product.description?.slice(0, 100)}… 100% genuine. Free shipping over ₹2,999.`}
        canonical={`/products/${product.slug}`}
        ogType="product"
        ogImage={product.images?.[0]?.imageUrl}
        keywords={`buy ${product.name}, ${product.brand} ${product.category.replace(/_/g, " ")}, ${product.name} price India, genuine ${product.category.replace(/_/g, " ")}`}
        jsonLd={[
          productJsonLd(product),
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Products", url: "/products" },
            { name: product.category.replace(/_/g, " "), url: `/products?category=${product.category}` },
            { name: product.name, url: `/products/${product.slug}` },
          ]),
        ]}
      />
      <Header />
      <main>
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/products" className="hover:text-primary">Products</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/products?category=${product.category}`} className="hover:text-primary">
              {product.category.replace(/_/g, " ")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground truncate">{product.name}</span>
          </nav>
        </div>

        <div className="container mx-auto px-4 pb-16">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Images + Zoom side panel */}
            <div className="relative">
              <div className="relative mb-4 group">
                <div
                  ref={zoomRef}
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                  onMouseMove={handleZoomMove}
                  className="aspect-square rounded-lg overflow-hidden bg-card border border-border cursor-crosshair"
                >
                  <motion.img
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    src={product.images[selectedImage]?.imageUrl || "https://placehold.co/800x800/1F2937/FF6B35?text=No+Image"}
                    alt={`${product.brand} ${product.name} — product image ${selectedImage + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                    width={800}
                    height={800}
                  />

                  {/* Hover lens indicator */}
                  {isZooming && (
                    <div
                      className="absolute pointer-events-none border-2 border-primary/60 bg-primary/10 rounded"
                      style={{
                        width: "40%",
                        height: "40%",
                        left: `${Math.min(Math.max(zoomPos.x - 20, 0), 60)}%`,
                        top: `${Math.min(Math.max(zoomPos.y - 20, 0), 60)}%`,
                      }}
                    />
                  )}
                </div>

                {/* Zoom side panel — appears on top of product info column */}
                {isZooming && (
                  <div
                    className="hidden md:block absolute top-0 left-[calc(100%+1rem)] z-50 w-full aspect-square rounded-lg border border-border bg-card overflow-hidden shadow-2xl"
                    style={{
                      backgroundImage: `url(${product.images[selectedImage]?.imageUrl || "https://placehold.co/800x800/1F2937/FF6B35?text=No+Image"})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: "250%",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                )}

                {/* Prev / Next arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                        i === selectedImage ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <p className="text-sm text-muted-foreground font-barlow-condensed tracking-wider uppercase mb-1">{product.brand}</p>
              <h1 className="font-oswald text-2xl md:text-3xl font-bold mb-3">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(product.rating)) ? "fill-warning text-warning" : "text-muted"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {Number(product.rating).toFixed(1)} ({product.totalReviews} review{product.totalReviews !== 1 ? "s" : ""})
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-oswald text-3xl font-bold text-primary">₹{currentPrice.toLocaleString()}</span>
                {originalPrice > 0 && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">₹{originalPrice.toLocaleString()}</span>
                    <Badge className="bg-destructive">{discount}% OFF</Badge>
                  </>
                )}
              </div>

              <Separator className="mb-6" />

              {/* Variants - Size */}
              {uniqueSizes.length > 0 && (
                <div className="mb-4">
                  <label className="text-sm font-semibold font-barlow-condensed uppercase tracking-wider mb-2 block">
                    Size: {selectedVariant?.size}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueSizes.map((size) => {
                      const v = product.variants.find(vr => vr.size === size && vr.color === (selectedVariant?.color || uniqueColors[0]));
                      const outOfStock = v ? v.stock === 0 : true;
                      return (
                        <button
                          key={size}
                          disabled={outOfStock}
                          onClick={() => {
                            const variant = product.variants.find(vr => vr.size === size && vr.color === (selectedVariant?.color || uniqueColors[0]));
                            if (variant) setSelectedVariant(variant);
                          }}
                          className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                            selectedVariant?.size === size
                              ? "border-primary bg-primary text-primary-foreground"
                              : outOfStock
                              ? "border-border text-muted-foreground opacity-50 cursor-not-allowed line-through"
                              : "border-border hover:border-primary"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Variants - Color */}
              {uniqueColors.length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-semibold font-barlow-condensed uppercase tracking-wider mb-2 block">
                    Color: {selectedVariant?.color}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          const variant = product.variants.find(vr => vr.color === color && vr.size === (selectedVariant?.size || uniqueSizes[0]));
                          if (variant) setSelectedVariant(variant);
                        }}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                          selectedVariant?.color === color
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + Add to Cart */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-border rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-secondary transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                    className="p-2 hover:bg-secondary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  size="lg"
                  className="flex-1 font-barlow-condensed font-semibold tracking-wider uppercase gap-2"
                  disabled={maxStock === 0 || isAdding}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {maxStock === 0 ? "Out of Stock" : isAdding ? "Adding..." : "Add to Cart"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className={`px-3 ${product && isWishlisted(product.id) ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                  onClick={() => {
                    if (!product) return;
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
                  <Heart className={`h-5 w-5 ${product && isWishlisted(product.id) ? "fill-current" : ""}`} />
                </Button>
              </div>

              {/* Buy Now + Buy from WhatsApp */}
              <div className="flex gap-3 mb-6">
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1 font-barlow-condensed font-semibold tracking-wider uppercase"
                  disabled={maxStock === 0 || isAdding}
                  onClick={handleBuyNow}
                >
                  Buy Now
                </Button>
                <Button
                  size="lg"
                  className="flex-1 font-barlow-condensed font-semibold tracking-wider uppercase gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0"
                  disabled={maxStock === 0}
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="h-4 w-4" />
                  Buy on WhatsApp
                </Button>
              </div>

              {/* Bulk / Wholesale Order */}
              <Button
                variant="outline"
                size="lg"
                className="w-full mb-4 font-barlow-condensed font-semibold tracking-wider uppercase gap-2 border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => setBulkModalOpen(true)}
              >
                <Package className="h-4 w-4" />
                Bulk / Wholesale Inquiry
              </Button>

              {product && (
                <BulkOrderModal
                  open={bulkModalOpen}
                  onOpenChange={setBulkModalOpen}
                  productName={product.name}
                  productSlug={product.slug}
                />
              )}

              {maxStock > 0 && maxStock <= 5 && (
                <p className="text-destructive text-sm mb-4">Only {maxStock} left in stock!</p>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs">
                  <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Free Shipping<br />Over ₹2,999</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>100% Genuine<br />Products</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <RotateCcw className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>3-Day Easy<br />Returns</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Description, Specs, Reviews */}
          <Tabs defaultValue="description" className="mt-12">
            <TabsList className="bg-secondary/50 w-full justify-center h-auto p-1">
              <TabsTrigger value="description" className="font-barlow-condensed font-semibold uppercase tracking-wider text-base md:text-lg px-6 py-3">Description</TabsTrigger>
              <TabsTrigger value="specifications" className="font-barlow-condensed font-semibold uppercase tracking-wider text-base md:text-lg px-6 py-3">Specifications</TabsTrigger>
              <TabsTrigger value="reviews" className="font-barlow-condensed font-semibold uppercase tracking-wider text-base md:text-lg px-6 py-3">
                Reviews ({product.totalReviews})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose prose-invert max-w-none" itemProp="description">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              {product.specifications ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-card rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-3">General</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between"><dt className="text-muted-foreground">Weight</dt><dd>{product.specifications.weight}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">Material</dt><dd>{product.specifications.material}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">Visor</dt><dd>{product.specifications.visorType}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">Ventilation</dt><dd>{product.specifications.ventilation ? "Yes" : "No"}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">SKU</dt><dd>{product.sku}</dd></div>
                    </dl>
                  </div>
                  <div>
                    {product.specifications.certifications.length > 0 && (
                      <div className="bg-card rounded-lg border border-border p-4 mb-4">
                        <h4 className="font-semibold mb-3">Certifications</h4>
                        <div className="flex flex-wrap gap-2">
                          {product.specifications.certifications.map(c => (
                            <Badge key={c} variant="secondary" className="gap-1"><Check className="h-3 w-3 text-success" />{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {product.specifications.features.length > 0 && (
                      <div className="bg-card rounded-lg border border-border p-4">
                        <h4 className="font-semibold mb-3">Features</h4>
                        <ul className="space-y-1.5">
                          {product.specifications.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No specifications available.</p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              {product.reviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {product.reviews.map((review) => (
                    <div key={review.id} className="bg-card rounded-lg border border-border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-warning text-warning" : "text-muted"}`} />
                          ))}
                        </div>
                        <span className="font-semibold text-sm">{review.title}</span>
                        {review.isVerifiedPurchase && <Badge variant="secondary" className="text-[10px]">Verified</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                      <p className="text-xs text-muted-foreground">
                        By {review.user.fullName} • {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Related Products */}
          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="font-oswald text-2xl font-bold uppercase mb-6">
                You May Also <span className="text-primary">Like</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.slug}`}
                    className="group bg-card rounded-lg border border-border overflow-hidden hover:border-primary/30 transition-colors"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={p.images?.[0]?.imageUrl || "https://placehold.co/400x400/1F2937/FF6B35?text=No+Image"}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">{p.brand}</p>
                      <h4 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h4>
                      <span className="font-oswald font-bold">₹{(p.discountPrice || p.price).toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
