import { motion } from "framer-motion";
import { Shield, Award, Truck, Users, Wrench, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const values = [
  { icon: Shield, title: "100% Genuine", desc: "Every product is sourced directly from authorized distributors and brands." },
  { icon: Award, title: "ISI & DOT Certified", desc: "We only stock helmets and gear meeting international safety standards." },
  { icon: Truck, title: "Fast Delivery", desc: "Pan-India delivery within 3-7 business days with real-time tracking." },
  { icon: Users, title: "25,000+ Riders", desc: "A growing community of bikers trusting us with their safety gear." },
  { icon: Wrench, title: "Expert Support", desc: "Our team of riders helps you pick the right gear for your ride." },
  { icon: Star, title: "Easy Returns", desc: "30-day hassle-free return and exchange policy on all products." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
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
              Born from a passion for motorcycles, BikersBrain is India's premium destination for riding gear. We believe every rider deserves top-quality equipment — without compromise.
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
                  It started with a simple frustration — finding genuine, high-quality motorcycle gear in India was harder than it should be. Counterfeit products, inconsistent sizing, and unreliable sellers made every purchase a gamble.
                </p>
                <p>
                  In 2024, a group of avid motorcyclists decided to change that. BikersBrain was created to be the one-stop shop for everything a rider needs: from ISI-certified helmets and CE-rated jackets to premium gloves, boots, and accessories.
                </p>
                <p>
                  We work directly with trusted brands — both Indian and international — to bring you authentic gear at competitive prices, backed by genuine warranty and hassle-free service.
                </p>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border overflow-hidden aspect-video">
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop"
                alt="Motorcycle rider"
                className="w-full h-full object-cover"
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
            Ride Safe. <span className="text-primary">Ride Smart.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Whether you're commuting daily or touring cross-country, we've got the gear to keep you protected and stylish on every ride.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
