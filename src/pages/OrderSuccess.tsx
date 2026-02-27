import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Package, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const orderNumber = params.get("orderNumber") || "–";
  const total = params.get("total") ? Number(params.get("total")) : null;
  const email = params.get("email") || "";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 flex flex-col items-center text-center max-w-lg">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative inline-flex">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
            <CheckCircle2 className="h-24 w-24 text-primary relative" strokeWidth={1.5} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h1 className="font-oswald text-3xl md:text-4xl font-bold uppercase">
            Order <span className="text-primary">Confirmed!</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Thank you for your purchase. We&apos;re getting it ready for you.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full mt-8 bg-card border border-border rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary shrink-0" />
            <div className="text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Order Number</p>
              <p className="font-oswald font-bold text-lg">{orderNumber}</p>
            </div>
          </div>

          {total !== null && (
            <>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Total</span>
                <span className="font-bold text-primary">₹{total.toLocaleString()}</span>
              </div>
            </>
          )}

          {email && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground text-left">
                A confirmation email has been sent to{" "}
                <span className="text-foreground font-medium">{email}</span>
              </p>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full mt-6 space-y-3"
        >
          {isAuthenticated ? (
            <Link to="/account?tab=orders" className="w-full block">
              <Button
                className="w-full font-barlow-condensed font-semibold uppercase tracking-wider gap-2"
                size="lg"
              >
                View My Orders <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <div className="bg-secondary/40 border border-border rounded-lg p-4 text-sm text-left space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Create an account to track your order
                </p>
                <p className="text-muted-foreground text-xs">
                  Save your details, track shipments, and get exclusive deals — it only takes a minute.
                </p>
              </div>
              <Link to="/register" className="w-full block">
                <Button
                  className="w-full font-barlow-condensed font-semibold uppercase tracking-wider gap-2"
                  size="lg"
                >
                  Create Account <UserPlus className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}

          <Link to="/products" className="w-full block">
            <Button
              variant="outline"
              className="w-full font-barlow-condensed font-semibold uppercase tracking-wider"
              size="lg"
            >
              Continue Shopping
            </Button>
          </Link>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
