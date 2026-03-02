import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-6 transition-colors">
            <ChevronLeft size={16} /> Back to Home
          </Link>

          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-8 md:p-12">
            <h1 className="text-3xl font-bold text-foreground mb-6">Privacy Policy</h1>

            <div className="space-y-6 text-muted-foreground text-sm">
              <p className="text-xs text-muted-foreground/70">Last updated: February 2026</p>

              <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
              <p>
                When you create an account, place an order, or interact with our website, we may collect personal
                information such as your name, email address, phone number, shipping address, and payment details.
              </p>

              <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
              <p>
                We use the information we collect to process orders, communicate with you about your purchases,
                improve our services, and send promotional offers (with your consent).
              </p>

              <h2 className="text-lg font-semibold text-foreground">3. Data Security</h2>
              <p>
                We implement industry-standard security measures including encryption, secure servers, and regular
                security audits to protect your personal information.
              </p>

              <h2 className="text-lg font-semibold text-foreground">4. Cookies</h2>
              <p>
                Our website uses cookies to enhance your browsing experience. You can control cookie preferences
                through your browser settings.
              </p>

              <h2 className="text-lg font-semibold text-foreground">5. Third-Party Services</h2>
              <p>
                We may share your information with trusted third-party services for payment processing (Razorpay),
                shipping, and analytics. These partners are bound by their own privacy policies.
              </p>

              <h2 className="text-lg font-semibold text-foreground">6. Your Rights</h2>
              <p>
                You have the right to access, update, or delete your personal data at any time through your account
                settings or by contacting us.
              </p>

              <h2 className="text-lg font-semibold text-foreground">7. Contact Us</h2>
              <p>
                For any privacy-related questions, reach us via our{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  Contact page
                </Link>{" "}
                or email{" "}
                <a href="mailto:bikersbrain.official@gmail.com" className="text-primary hover:underline">
                  support@bikersbrain.in
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
