/* ── Category-aware specs config ── */
export interface SpecConfig {
  title: string;
  desc: string;
  weightLabel: string;
  weightPlaceholder: string;
  materialLabel: string;
  materials: string[];
  visorLabel: string;
  visorOptions: string[];
  showVisor: boolean;
  ventilationLabel: string;
  showVentilation: boolean;
  certLabel: string;
  certifications: string[];
}

const SPEC_CONFIGS: Record<string, SpecConfig> = {
  Helmets: {
    title: "Helmet Specifications",
    desc: "Safety ratings, shell & visor details",
    weightLabel: "Weight",
    weightPlaceholder: "e.g. 1.2 kg",
    materialLabel: "Shell Material",
    materials: ["ABS", "Polycarbonate", "Fiberglass", "Carbon Fiber", "Kevlar Composite", "Thermoplastic"],
    visorLabel: "Visor Type",
    visorOptions: ["Clear", "Tinted", "Smoke", "Iridium", "Pinlock Ready", "Anti-fog", "Double Visor", "None"],
    showVisor: true,
    ventilationLabel: "Ventilation",
    showVentilation: true,
    certLabel: "Certifications",
    certifications: ["ISI", "DOT", "ECE 22.05", "ECE 22.06", "SNELL", "FIM", "SHARP 5-Star"],
  },
  "Riding Gear": {
    title: "Gear Specifications",
    desc: "Material, protection & fit details",
    weightLabel: "Weight",
    weightPlaceholder: "e.g. 650g",
    materialLabel: "Material",
    materials: ["Leather", "Textile", "Mesh", "Cordura", "Polyester", "Nylon", "Kevlar", "Gore-Tex", "Drystar"],
    visorLabel: "Protection Level",
    visorOptions: ["CE Level 1", "CE Level 2", "D3O", "Knox", "SAS-TEC", "Foam", "None"],
    showVisor: true,
    ventilationLabel: "Waterproof",
    showVentilation: true,
    certLabel: "Certifications & Standards",
    certifications: ["CE", "EN 13594", "EN 13595", "EN 17092", "EN 13634"],
  },
  Oil: {
    title: "Oil Specifications",
    desc: "Grade, volume & engine compatibility",
    weightLabel: "Volume",
    weightPlaceholder: "e.g. 1L / 500ml",
    materialLabel: "Oil Type",
    materials: ["Mineral", "Semi-Synthetic", "Fully Synthetic", "Gear Oil", "Fork Oil", "Chain Lube", "Coolant"],
    visorLabel: "Viscosity Grade",
    visorOptions: ["10W-30", "10W-40", "10W-50", "15W-40", "15W-50", "20W-40", "20W-50", "5W-40", "75W-90", "80W-90", "N/A"],
    showVisor: true,
    ventilationLabel: "Suitable for 4-Stroke",
    showVentilation: true,
    certLabel: "API / JASO Standards",
    certifications: ["JASO MA", "JASO MA2", "JASO MB", "API SL", "API SN", "API SM", "API SG"],
  },
  "Spare Parts": {
    title: "Part Specifications",
    desc: "Compatibility & technical details",
    weightLabel: "Weight",
    weightPlaceholder: "e.g. 350g",
    materialLabel: "Material",
    materials: ["Steel", "Aluminium", "Rubber", "Plastic", "Carbon Fiber", "Brass", "Chrome", "Cast Iron"],
    visorLabel: "Fitment",
    visorOptions: [],
    showVisor: false,
    ventilationLabel: "OEM Compatible",
    showVentilation: true,
    certLabel: "Standards",
    certifications: ["OEM", "Aftermarket", "ISO Certified"],
  },
  "Luggage & Touring": {
    title: "Luggage Specifications",
    desc: "Capacity, mounting & weather protection",
    weightLabel: "Weight",
    weightPlaceholder: "e.g. 1.5 kg",
    materialLabel: "Material",
    materials: ["Nylon", "Polyester", "Cordura", "Semi-Hard", "Hard Case", "Aluminium", "Canvas", "PVC"],
    visorLabel: "Capacity",
    visorOptions: ["5-10L", "10-20L", "20-30L", "30-40L", "40-50L", "50L+"],
    showVisor: true,
    ventilationLabel: "Waterproof",
    showVentilation: true,
    certLabel: "Features",
    certifications: ["Reflective", "Rain Cover Included", "Quick Release", "Lockable", "Expandable"],
  },
  Electronics: {
    title: "Electronics Specifications",
    desc: "Power, connectivity & compatibility",
    weightLabel: "Weight",
    weightPlaceholder: "e.g. 200g",
    materialLabel: "Build Material",
    materials: ["Plastic", "Metal", "Rubber", "ABS", "Aluminium", "Silicone"],
    visorLabel: "Connectivity",
    visorOptions: ["Bluetooth 5.0", "Bluetooth 5.3", "USB-C", "Wired", "WiFi", "N/A"],
    showVisor: true,
    ventilationLabel: "Waterproof (IP Rating)",
    showVentilation: true,
    certLabel: "Certifications",
    certifications: ["CE", "FCC", "RoHS", "IP65", "IP67", "BIS"],
  },
  Accessories: {
    title: "Accessory Specifications",
    desc: "Details & compatibility",
    weightLabel: "Weight",
    weightPlaceholder: "e.g. 250g",
    materialLabel: "Material",
    materials: ["Plastic", "Metal", "Rubber", "Nylon", "Leather", "Silicone", "Carbon Fiber", "Neoprene"],
    visorLabel: "Type",
    visorOptions: [],
    showVisor: false,
    ventilationLabel: "Universal Fit",
    showVentilation: true,
    certLabel: "Standards",
    certifications: ["CE", "ISO", "OEM", "RoHS"],
  },
};

/* Map individual category values to spec config keys */
const CATEGORY_TO_SPEC: Record<string, string> = {
  // Helmets
  FULL_FACE: "Helmets", HALF_FACE: "Helmets", OPEN_FACE: "Helmets",
  MODULAR: "Helmets", OFF_ROAD: "Helmets", KIDS: "Helmets", LADIES: "Helmets",
  // Riding Gear
  JACKETS: "Riding Gear", GLOVES: "Riding Gear", BOOTS: "Riding Gear", RIDING_PANTS: "Riding Gear",
  // Individual categories
  PARTS: "Spare Parts", SPARE_PARTS: "Spare Parts",
  LUGGAGE: "Luggage & Touring",
  ELECTRONICS: "Electronics",
  ACCESSORIES: "Accessories",
  OIL: "Oil", OILS: "Oil", ENGINE_OIL: "Oil",
};

const DEFAULT_SPEC_CONFIG: SpecConfig = {
  title: "Product Specifications",
  desc: "Technical details & features",
  weightLabel: "Weight / Dimensions",
  weightPlaceholder: "e.g. 500g / 20x10x5 cm",
  materialLabel: "Material",
  materials: ["Plastic", "Metal", "Rubber", "Leather", "Nylon", "Silicon", "Glass", "Carbon Fiber"],
  visorLabel: "Type / Variant",
  visorOptions: [],
  showVisor: false,
  ventilationLabel: "Premium Quality",
  showVentilation: true,
  certLabel: "Certifications",
  certifications: ["CE", "ISO", "OEM", "RoHS"],
};

/** Find the best spec config — checks category value first, then group name */
export function getSpecConfig(group: string, categoryValue?: string): SpecConfig {
  // 1. Direct match by category value (most precise)
  if (categoryValue) {
    const mappedKey = CATEGORY_TO_SPEC[categoryValue.toUpperCase()];
    if (mappedKey && SPEC_CONFIGS[mappedKey]) return SPEC_CONFIGS[mappedKey];
  }
  // 2. Exact match by group name
  if (SPEC_CONFIGS[group]) return SPEC_CONFIGS[group];
  // 3. Fuzzy match on group name
  const lower = group.toLowerCase();
  if (!lower) return DEFAULT_SPEC_CONFIG;
  for (const [key, config] of Object.entries(SPEC_CONFIGS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return config;
  }
  return DEFAULT_SPEC_CONFIG;
}


export interface ProductDetail { label: string; value: string; custom?: boolean; }
export interface DetailField { label: string; options?: string[]; placeholder?: string; }
const yesNo = ["Yes", "No"];

export function getDetailFields(group: string, category: string): DetailField[] {
  const config = getSpecConfig(group, category);
  const field = (label: string, options?: string[]): DetailField => ({ label, options: options?.length ? options : undefined });
  if (config === DEFAULT_SPEC_CONFIG) return [field("Weight"), field("Material"), field("Dimensions"), field("Compatibility")];
  const base = [field(config.weightLabel), field(config.materialLabel, config.materials)];
  if (config.showVisor) base.push(field(config.visorLabel, config.visorOptions));
  if (config.showVentilation && config !== SPEC_CONFIGS.Oil) base.push(field(config.ventilationLabel, config.ventilationLabel.includes("IP Rating") ? ["IP65", "IP67", "IP68", "Not rated"] : yesNo));
  base.push(field(config.certLabel));
  const key = Object.entries(SPEC_CONFIGS).find(([, entry]) => entry === config)?.[0] || group;
  const extras: Record<string, DetailField[]> = {
    Helmets: [field("Sun Visor", yesNo), field("Pinlock Compatible", yesNo), field("Closure Type", ["Double D-ring", "Micrometric", "Quick release"]), field("Removable Lining", yesNo)],
    "Riding Gear": [field("Armour Locations"), field("Removable Liner", yesNo), field("Fit", ["Regular", "Slim", "Touring"])],
    Oil: [field("Engine Compatibility", ["2-Stroke", "4-Stroke", "Both"])],
    "Spare Parts": [field("Part Number"), field("Compatible Bike Models"), field("Compatible Model Years"), field("Dimensions")],
    "Luggage & Touring": [field("Dimensions"), field("Mounting Method"), field("Rain Cover Included", yesNo)],
    Electronics: [field("Battery Life"), field("Charging Port", ["USB-C", "Micro USB", "Proprietary", "Not applicable"]), field("Compatibility")],
    Accessories: [field("Dimensions"), field("Compatibility")],
  };
  if (category.toUpperCase() === "GLOVES") return [field("Material", config.materials), field("Knuckle Protection"), field("Palm Sliders", yesNo), field("Touchscreen Support", yesNo), field("Waterproof", yesNo), field("Certifications")];
  if (category.toUpperCase() === "BOOTS") return [field("Material", config.materials), field("Ankle Protection"), field("Waterproof", yesNo), field("Closure Type"), field("Certifications")];
  return [...base, ...(extras[key] || [field("Dimensions"), field("Compatibility")])];
}

interface StoredSpecifications {
  details?: ProductDetail[] | null;
  weight?: string; material?: string; visorType?: string;
  ventilation?: boolean; certifications?: string[];
}

// Null/missing details means an older product; [] means deliberately cleared.
export function readProductDetails(specs: StoredSpecifications | null | undefined, group: string, category: string): ProductDetail[] {
  if (!specs) return [];
  if (Array.isArray(specs.details)) return specs.details.map(detail => ({ ...detail }));
  const config = getSpecConfig(group, category);
  const rows: ProductDetail[] = [];
  const add = (label: string, value?: string) => {
    if (value?.trim() && !["n/a", "unknown"].includes(value.trim().toLowerCase())) rows.push({ label, value });
  };
  add(config.weightLabel, specs.weight);
  add(config.materialLabel, specs.material);
  if (config.showVisor) add(config.visorLabel, specs.visorType);
  if (config.showVentilation && typeof specs.ventilation === "boolean") {
    // A historical boolean cannot express an IP rating.
    if (!config.ventilationLabel.includes("IP Rating")) add(config.ventilationLabel, specs.ventilation ? "Yes" : "No");
  }
  add(config.certLabel, specs.certifications?.join(", "));
  return rows;
}
