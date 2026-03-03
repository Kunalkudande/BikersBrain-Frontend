import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bike-gear.jpg";

const HeroSection = () => {
  return (
    <section className="relative h-[560px] md:h-[680px] overflow-hidden">
      {/* Hero image — eagerly loaded for LCP */}
      <img
        src={heroBg}
        alt="Two-wheeler spare parts and riding gear from BikersBrain"
        className="absolute inset-0 w-full h-full object-cover object-center"
        fetchPriority="high"
        loading="eager"
        decoding="async"
        width={1920}
        height={680}
      />
      {/* Dark overlay — heavier on left for text legibility, fades right to reveal biker */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

      <div className="relative container mx-auto px-4 h-full flex items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-lg"
        >
          <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-barlow-condensed font-semibold tracking-widest uppercase rounded mb-4">
            New Arrivals 2026
          </span>
          <h1 className="font-oswald text-4xl md:text-6xl font-bold leading-tight mb-4">
            RIDE WITH
            <br />
            <span className="text-primary">CONFIDENCE</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-md">
            Buy genuine two-wheeler spare parts, motorcycle helmets, riding gear, engine oils &amp; accessories online — at unbeatable prices with free shipping over ₹2,999.
          </p>
          <div className="flex gap-3">
            <Button size="lg" className="font-barlow-condensed font-semibold tracking-wider uppercase gap-2" asChild>
              <Link to="/products">Shop Now <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="font-barlow-condensed font-semibold tracking-wider uppercase border-foreground/20 hover:border-primary" asChild>
              <Link to="/products?sort=newest">New Arrivals</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
