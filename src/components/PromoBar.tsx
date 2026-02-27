import { Truck, Shield, RotateCcw, Headphones } from "lucide-react";

const features = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over ₹2,999" },
  { icon: Shield, title: "Authentic Gear", desc: "100% genuine products" },
  { icon: RotateCcw, title: "Easy Returns", desc: "5-day return policy" },
  { icon: Headphones, title: "Expert Support", desc: "Riders helping riders" },
];

const PromoBar = () => {
  return (
    <section className="py-10 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-barlow-condensed font-semibold text-sm uppercase tracking-wider">{f.title}</h4>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoBar;
