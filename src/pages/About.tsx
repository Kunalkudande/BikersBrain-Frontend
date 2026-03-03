import { motion } from "framer-motion";
import { Shield, Award, Truck, Users, Wrench, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO, { breadcrumbJsonLd } from "@/components/SEO";

const values = [
  { icon: Shield, title: "100% Genuine", desc: "Every product is sourced directly from authorized distributors and trusted brands." },
  { icon: Award, title: "Quality Assured", desc: "We stock only products that meet strict quality and safety standards." },
  { icon: Truck, title: "Fast Delivery", desc: "Pan-India delivery within 3-7 business days with real-time tracking." },
  { icon: Users, title: "25,000+ Customers", desc: "A growing community of two-wheeler enthusiasts trusting us for their needs." },
  { icon: Wrench, title: "Expert Support", desc: "Our team helps you find the right part or accessory for your ride." },
  { icon: Star, title: "Easy Returns", desc: "3-day hassle-free return and exchange policy on all products." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About BikersBrain — India's Trusted Two-Wheeler Parts Store"
        description="BikersBrain by Shree Om Automobiles — India's go-to destination for genuine two-wheeler spare parts, riding gear & accessories. Learn our story, values & mission."
        canonical="/about"
        keywords="about BikersBrain, Shree Om Automobiles Pune, bike parts store India, genuine two wheeler parts"
        jsonLd={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "About Us", url: "/about" },
        ])}
      />
      <Header />
      <main>
        {/* Hero */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
          <div className="container mx-auto px-4 relative text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-oswald text-4xl md:text-5xl font-bold uppercase mb-4"
            >
              About <span className="text-primary">BikersBrain</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground max-w-2xl mx-auto text-lg"
            >
              Born from a passion for motorcycles, BikersBrain is India's trusted online destination for genuine two-wheeler spare parts, riding gear &amp; accessories. We believe every rider deserves authentic, top-quality products — without compromise.
            </motion.p>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-oswald text-2xl md:text-3xl font-bold uppercase mb-4">
                Our <span className="text-primary">Story</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  It started with a simple frustration — finding genuine two-wheeler spare parts and accessories online in India was harder than it should be. Counterfeit products, unreliable sellers, and poor after-sales support made every purchase a gamble.
                </p>
                <p>
                  In 2024, a group of passionate riders decided to change that. BikersBrain was created to be the one-stop online shop for everything a two-wheeler needs: from motorcycle helmets and riding gear to engine oils, brake pads, chain sprocket kits, and every spare part in between.
                </p>
                <p>
                  Operating through Shree Om Automobiles from our Pune store, we work directly with authorized brands — both Indian and international — to bring you authentic products at competitive prices, backed by genuine warranty and hassle-free 3-day returns.
                </p>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <img
                src="/store-image.png"
                alt="Shree Om Automobiles — BikersBrain Store"
                className="w-full h-auto object-contain block"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="font-oswald text-2xl md:text-3xl font-bold uppercase text-center mb-10">
              Why Choose <span className="text-primary">Us</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-lg border border-border p-6 text-center"
                >
                  <v.icon className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="font-oswald font-bold text-lg mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 container mx-auto px-4 text-center">
          <h2 className="font-oswald text-2xl md:text-3xl font-bold uppercase mb-4">
            Why Riders Choose <span className="text-primary">BikersBrain</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Whether you're commuting daily or touring cross-country, BikersBrain has everything — from genuine spare parts and engine oils to premium helmets and riding gear — to keep you and your bike in top shape. Shop now and ride with confidence.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
