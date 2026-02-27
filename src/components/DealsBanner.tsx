import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const DealsBanner = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-primary/10 via-background to-primary/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-barlow-condensed font-semibold tracking-widest uppercase rounded mb-4">
            Limited Time
          </span>
          <h2 className="font-oswald text-4xl md:text-6xl font-bold uppercase mb-3">
            Up to <span className="text-primary">50% Off</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
            Massive clearance on last season's top gear. Don't miss out.
          </p>
          <Button size="lg" className="font-barlow-condensed font-semibold tracking-wider uppercase" asChild>
            <Link to="/products?sale=true">Shop Deals</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default DealsBanner;
