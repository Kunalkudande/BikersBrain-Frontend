import { Link } from "react-router-dom";
import { ChevronLeft, RotateCcw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ReturnPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-6 transition-colors">
            <ChevronLeft size={16} /> Back to Home
          </Link>

          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-8 md:p-12">
            <h1 className="text-3xl font-bold text-foreground mb-6">Return &amp; Refund Policy</h1>

            <div className="space-y-6 text-muted-foreground text-sm">
              <p className="text-xs text-muted-foreground/70">Last updated: February 2026</p>

              {/* 7-day banner */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                <RotateCcw className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-green-400">7-Day Easy Returns</p>
                  <p className="text-sm text-green-400/70">We offer hassle-free returns within 7 days of delivery. No questions asked.</p>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-foreground">1. Return Eligibility</h2>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Product must be unused and in original packaging</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Return request must be raised within 7 days of delivery</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <span>All tags and labels must be intact</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Used or damaged products are not eligible for return</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Products purchased during clearance sales are final</span>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-foreground">2. How to Return</h2>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Go to your Orders page and select the order</li>
                <li>Click "Request Return" and provide a reason</li>
                <li>Our team will arrange a pickup within 2 business days</li>
                <li>Refund will be processed within 5–7 business days after we receive the item</li>
              </ol>

              <h2 className="text-lg font-semibold text-foreground">3. Refund Methods</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Online payments: Refunded to original payment method</li>
                <li>COD orders: Refunded via bank transfer (NEFT/IMPS)</li>
              </ul>

              <h2 className="text-lg font-semibold text-foreground">4. Exchanges</h2>
              <p>If you need a different size or variant, you can request an exchange. Subject to stock availability. Exchange shipping is free.</p>

              {/* Help banner */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-amber-400">Need Help?</p>
                  <p className="text-sm text-amber-400/70">
                    Contact us at{" "}
                    <a href="mailto:support@bikersbrain.in" className="underline">
                      support@bikersbrain.in
                    </a>{" "}
                    or visit our{" "}
                    <Link to="/contact" className="underline">
                      Contact page
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
