import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-6 transition-colors">
            <ChevronLeft size={16} /> Back to Home
          </Link>

          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-8 md:p-12">
            <h1 className="text-3xl font-bold text-foreground mb-6">Terms &amp; Conditions</h1>

            <div className="space-y-6 text-muted-foreground text-sm">
              <p className="text-xs text-muted-foreground/70">Last updated: February 2026</p>

              <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Bikers Brain, you agree to be bound by these Terms and Conditions. If you do
                not agree, please do not use our website.
              </p>

              <h2 className="text-lg font-semibold text-foreground">2. Products &amp; Pricing</h2>
              <p>
                All products listed are subject to availability. Prices are in Indian Rupees (₹) and include
                applicable taxes unless stated otherwise. We reserve the right to modify prices without prior notice.
              </p>

              <h2 className="text-lg font-semibold text-foreground">3. Orders &amp; Payment</h2>
              <p>
                By placing an order, you confirm that all details provided are accurate. We accept payments via
                Razorpay (UPI, cards, net banking) and Cash on Delivery for eligible orders.
              </p>

              <h2 className="text-lg font-semibold text-foreground">4. Shipping</h2>
              <p>
                We ship across India. Free shipping is available on orders above ₹2,999. Delivery times may vary based
                on your location. Standard delivery takes 3–7 business days.
              </p>

              <h2 className="text-lg font-semibold text-foreground">5. Account Responsibility</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. Any activity
                under your account is your responsibility.
              </p>

              <h2 className="text-lg font-semibold text-foreground">6. Intellectual Property</h2>
              <p>
                All content on this website, including text, images, and logos, is the property of Bikers Brain and
                is protected by copyright laws.
              </p>

              <h2 className="text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
              <p>
                Bikers Brain shall not be liable for any indirect, incidental, or consequential damages arising from
                the use of our products or services.
              </p>

              <h2 className="text-lg font-semibold text-foreground">8. Contact</h2>
              <p>
                For questions about these terms, visit our{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  Contact page
                </Link>{" "}
                or email{" "}
                <a href="mailto:bikersbrain.official@gmail.com" className="text-primary hover:underline">
                  bikersbrain.official@gmail.com
                </a>
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
