import { Link } from "react-router-dom";
import { ChevronLeft, Truck, Package, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-6 transition-colors">
            <ChevronLeft size={16} /> Back to Home
          </Link>

          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-8 md:p-12">
            <h1 className="text-3xl font-bold text-foreground mb-6">Shipping Policy</h1>

            <div className="space-y-6 text-muted-foreground text-sm">
              <p className="text-xs text-muted-foreground/70">Last updated: February 2026</p>

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose">
                <div className="bg-primary/10 rounded-xl p-4 text-center border border-primary/20">
                  <Truck className="mx-auto text-primary mb-2" size={24} />
                  <p className="text-sm font-semibold text-foreground">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">Orders above ₹999</p>
                </div>
                <div className="bg-primary/10 rounded-xl p-4 text-center border border-primary/20">
                  <Package className="mx-auto text-primary mb-2" size={24} />
                  <p className="text-sm font-semibold text-foreground">Pan-India</p>
                  <p className="text-xs text-muted-foreground">We deliver everywhere</p>
                </div>
                <div className="bg-primary/10 rounded-xl p-4 text-center border border-primary/20">
                  <Clock className="mx-auto text-primary mb-2" size={24} />
                  <p className="text-sm font-semibold text-foreground">3-7 Days</p>
                  <p className="text-xs text-muted-foreground">Standard delivery</p>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-foreground">1. Shipping Charges</h2>
              <p>Orders above ₹999 qualify for free shipping. For orders below ₹999, a flat shipping fee of ₹99 is charged.</p>

              <h2 className="text-lg font-semibold text-foreground">2. Delivery Timeframes</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Metro cities: 3–5 business days</li>
                <li>Tier 2 cities: 4–6 business days</li>
                <li>Other locations: 5–7 business days</li>
              </ul>

              <h2 className="text-lg font-semibold text-foreground">3. Order Tracking</h2>
              <p>Once your order is shipped, you will receive a tracking number via email and SMS. You can track your order from the Orders section of your account.</p>

              <h2 className="text-lg font-semibold text-foreground">4. Shipping Partners</h2>
              <p>We work with trusted logistics partners including Delhivery, Blue Dart, and DTDC to ensure safe and timely delivery of your products.</p>

              <h2 className="text-lg font-semibold text-foreground">5. Damaged in Transit</h2>
              <p>If your order arrives damaged, please contact us within 24 hours with photos. We will arrange a free replacement or full refund.</p>

              <p>
                For shipping-related queries, visit our{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  Contact page
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
