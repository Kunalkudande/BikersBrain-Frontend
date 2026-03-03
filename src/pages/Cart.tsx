import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useCart } from "@/hooks/useCart";

export default function Cart() {
  const { cart, itemCount, updateItem, removeItem, clearCart } = useCart();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Your Shopping Cart" noIndex />
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-oswald text-2xl font-bold mb-2">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-6">Explore our collection and gear up!</p>
          <Link to="/products">
            <Button className="font-barlow-condensed font-semibold uppercase tracking-wider">Shop Now</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const shipping = subtotal > 2999 ? 0 : 149;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Your Shopping Cart" noIndex />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-oswald text-2xl md:text-3xl font-bold uppercase">
            Shopping <span className="text-primary">Cart</span>
            <span className="text-base text-muted-foreground ml-2 font-barlow normal-case">({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
          </h1>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={clearCart}>
            Clear Cart
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 bg-card rounded-lg border border-border p-4"
              >
                <Link to={`/products/${item.product.slug}`} className="flex-shrink-0">
                  <img
                    src={item.product.images?.[0]?.imageUrl || "https://placehold.co/120x120/1F2937/FF6B35?text=Product"}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product.slug}`} className="hover:text-primary transition-colors">
                    <h3 className="font-semibold truncate">{item.product.name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-1">{item.product.brand}</p>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground">
                      {item.variant.size} / {item.variant.color}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-border rounded-md">
                      <button
                        onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1.5 hover:bg-secondary transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-secondary transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-oswald font-bold">
                        ₹{((item.product.discountPrice || item.product.price) * item.quantity).toLocaleString()}
                      </span>
                      <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-card rounded-lg border border-border p-6 sticky top-4">
              <h3 className="font-oswald text-lg font-bold uppercase mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={shipping === 0 ? "text-success" : ""}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Free shipping on orders above ₹2,999
                  </p>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="font-oswald text-primary">₹{total.toLocaleString()}</span>
                </div>
              </div>
              <Link to="/checkout">
                <Button className="w-full mt-6 font-barlow-condensed font-semibold tracking-wider uppercase gap-2" size="lg">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/products" className="block text-center text-sm text-muted-foreground hover:text-primary mt-3">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


