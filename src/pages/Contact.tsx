import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { contactApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await contactApi.submit(form);
      toast({ title: "Message sent!", description: "We'll get back to you soon." });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-oswald text-3xl md:text-4xl font-bold uppercase mb-3"
              >
                Get In <span className="text-primary">Touch</span>
              </motion.h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Have a question about a product, need help with your order, or want to partner with us? We'd love to hear from you.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Contact Info */}
              <div className="space-y-6">
                <div className="bg-card rounded-lg border border-border p-5">
                  <Mail className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Email Us</h3>
                  <a href="mailto:bikersbrain.official@gmail.com" className="text-sm text-muted-foreground hover:text-primary">
                    bikersbrain.official@gmail.com
                  </a>
                </div>
                <div className="bg-card rounded-lg border border-border p-5">
                  <Phone className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Call Us</h3>
                  <a href="tel:+919762163742" className="text-sm text-muted-foreground hover:text-primary">
                    +91 97621 63742
                  </a>
                </div>
                <div className="bg-card rounded-lg border border-border p-5">
                  <MapPin className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Visit Us</h3>
                  <a
                    href="https://maps.app.goo.gl/BBhXSCq7Gr4uBQuFA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Shop No. 7, Highway Chowk, NDA Rd, Warje, Pune, Maharashtra 411058
                  </a>
                </div>
                <div className="bg-card rounded-lg border border-border p-5">
                  <Clock className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Working Hours</h3>
                  <p className="text-sm text-muted-foreground">All Days: 09:00 AM – 09:00 PM</p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="md:col-span-2">
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onSubmit={handleSubmit}
                  className="bg-card rounded-lg border border-border p-6 space-y-5"
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="font-barlow-condensed uppercase tracking-wider text-xs">Your Name *</Label>
                      <Input id="name" placeholder="John Rider" value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-1" required />
                    </div>
                    <div>
                      <Label htmlFor="email" className="font-barlow-condensed uppercase tracking-wider text-xs">Email Address *</Label>
                      <Input id="email" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-1" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subject" className="font-barlow-condensed uppercase tracking-wider text-xs">Subject *</Label>
                    <Input id="subject" placeholder="How can we help?" value={form.subject} onChange={(e) => update("subject", e.target.value)} className="mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="message" className="font-barlow-condensed uppercase tracking-wider text-xs">Message *</Label>
                    <Textarea id="message" placeholder="Tell us more..." rows={5} value={form.message} onChange={(e) => update("message", e.target.value)} className="mt-1 resize-none" required />
                  </div>
                  <Button type="submit" className="w-full sm:w-auto font-barlow-condensed font-semibold tracking-wider uppercase gap-2" size="lg" disabled={loading}>
                    <Send className="h-4 w-4" />
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </motion.form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
