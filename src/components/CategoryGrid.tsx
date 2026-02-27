import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import catHelmets from "@/assets/cat-helmets.jpg";
import catJackets from "@/assets/cat-jackets.jpg";
import catGloves from "@/assets/cat-gloves.jpg";
import catBoots from "@/assets/cat-boots.jpg";
import catParts from "@/assets/cat-parts.jpg";
import catLuggage from "@/assets/cat-luggage.jpg";

const categories = [
  { name: "Helmets",       image: catHelmets, count: "250+ Products", href: "/products" },
  { name: "Jackets",       image: catJackets, count: "180+ Products", href: "/products?category=JACKETS" },
  { name: "Gloves",        image: catGloves,  count: "120+ Products", href: "/products?category=GLOVES" },
  { name: "Boots",         image: catBoots,   count: "90+ Products",  href: "/products?category=BOOTS" },
  { name: "Parts",         image: catParts,   count: "500+ Products", href: "/products?category=PARTS" },
  { name: "Luggage",       image: catLuggage, count: "75+ Products",  href: "/products?category=LUGGAGE" },
];

const CategoryGrid = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-oswald text-3xl md:text-4xl font-bold uppercase">
            Shop by <span className="text-primary">Category</span>
          </h2>
          <p className="text-muted-foreground mt-2">Find exactly what you need for your ride</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-square overflow-hidden rounded-lg"
            >
              <Link to={cat.href} className="block w-full h-full">
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 md:p-6">
                <h3 className="font-oswald text-xl md:text-2xl font-bold uppercase group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="text-muted-foreground text-sm">{cat.count}</p>
              </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
