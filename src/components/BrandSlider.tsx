const brands = [
  "Shoei", "Arai", "AGV", "Alpinestars", "Dainese", "Rev'It", "Bell",
  "HJC", "Motul", "Castrol", "NGK", "Bosch", "Akrapovic", "K&N",
  "Yoshimura", "Denso", "Exide",
];

const BrandSlider = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="font-oswald text-2xl font-bold uppercase text-center mb-8">
          Trusted <span className="text-primary">Brands</span>
        </h2>
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {brands.map((brand) => (
            <a
              key={brand}
              href="#"
              className="text-muted-foreground hover:text-primary font-oswald text-lg md:text-xl font-medium tracking-wider uppercase transition-colors"
            >
              {brand}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandSlider;
