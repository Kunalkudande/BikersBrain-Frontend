import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { adminApi, productsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Save, Upload, X, Plus, Trash2, Star, ImageIcon,
  Package, Tag, Layers, Settings2, Weight, ChevronDown,
  Sparkles, Loader2, RefreshCw,
} from "lucide-react";

/* ── Constants ── */

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "FREE_SIZE"] as const;

const COMMON_COLORS = [
  "Matt Black", "Gloss Black", "White", "Red", "Blue", "Yellow",
  "Orange", "Green", "Grey", "Silver", "Fluo Yellow", "Fluo Orange",
];

/* ── Category-aware specs config ── */
interface SpecConfig {
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
function getSpecConfig(group: string, categoryValue?: string): SpecConfig {
  // 1. Direct match by category value (most precise)
  if (categoryValue) {
    const mappedKey = CATEGORY_TO_SPEC[categoryValue.toUpperCase()];
    if (mappedKey && SPEC_CONFIGS[mappedKey]) return SPEC_CONFIGS[mappedKey];
  }
  // 2. Exact match by group name
  if (SPEC_CONFIGS[group]) return SPEC_CONFIGS[group];
  // 3. Fuzzy match on group name
  const lower = group.toLowerCase();
  for (const [key, config] of Object.entries(SPEC_CONFIGS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return config;
  }
  return DEFAULT_SPEC_CONFIG;
}

/* ── Types ── */
interface VariantRow { id: string; size: string; color: string; stock: string; additionalPrice: string; }
interface SpecsState {
  weight: string; material: string; certifications: string[];
  visorType: string; ventilation: boolean; features: string[];
}
interface ImgEntry {
  id: string; file?: File; preview: string;
  uploading?: boolean; isPrimary?: boolean;
  // existing (already uploaded) images
  imageId?: string; imageUrl?: string; existing?: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const TABS = [
  { key: "basic" as const, label: "Basic Info", icon: Package },
  { key: "images" as const, label: "Images", icon: ImageIcon },
  { key: "specs" as const, label: "Specifications", icon: Settings2 },
  { key: "variants" as const, label: "Variants", icon: Layers },
];

/* ── Section accordion ── */
function Section({
  icon: Icon, title, desc, children, open: externalOpen, onToggle,
}: {
  icon: React.ElementType; title: string; desc?: string; children: React.ReactNode;
  open?: boolean; onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(true);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const toggle = onToggle || (() => setInternalOpen((v) => !v));

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.07] overflow-hidden">
      <button type="button" onClick={toggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Icon size={17} className="text-orange-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{title}</h3>
            {desc && <p className="text-xs text-white/30 mt-0.5">{desc}</p>}
          </div>
        </div>
        <ChevronDown size={18} className={cn("text-white/30 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-white/[0.05]">{children}</div>
      )}
    </div>
  );
}

/* ── Field wrappers ── */
const inputCls = (err?: boolean) => cn(
  "w-full px-3.5 py-2.5 bg-[#1e1e1e] border rounded-xl text-sm text-white transition-all",
  "focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/50",
  "placeholder:text-white/20",
  err ? "border-red-400/50 ring-1 ring-red-400/20" : "border-white/[0.08] hover:border-white/[0.15]"
);

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

/* ════════════════════════════════════════
   PAGE
   ════════════════════════════════════════ */
export default function AdminProductForm() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isEdit = Boolean(slug);
  const { toast } = useToast();

  /* ── Dynamic categories from DB ── */
  const [apiCategories, setApiCategories] = useState<{
    id: string; value: string; label: string; group: string; description: string | null;
    isActive: boolean; parentId: string | null; sortOrder: number; groupSortOrder: number;
  }[]>([]);

  useEffect(() => {
    adminApi.getCategories()
      .then((res) => setApiCategories(((res as any).data || []).filter((c: any) => c.isActive)))
      .catch(() => {});
  }, []);

  // Build grouped structure from API with nesting support
  const categoryGroups = (() => {
    if (apiCategories.length === 0) return [];
    const grouped: Record<string, typeof apiCategories> = {};
    const groupSortMap: Record<string, number> = {};
    for (const c of apiCategories) {
      if (!grouped[c.group]) { grouped[c.group] = []; groupSortMap[c.group] = c.groupSortOrder; }
      grouped[c.group].push(c);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => (groupSortMap[a] ?? 0) - (groupSortMap[b] ?? 0) || a.localeCompare(b))
      .map(([group, items]) => {
        // Build tree: top-level then children indented
        const topLevel = items.filter(c => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
        const childMap = new Map<string, typeof items>();
        for (const c of items.filter(c => c.parentId)) {
          if (!childMap.has(c.parentId!)) childMap.set(c.parentId!, []);
          childMap.get(c.parentId!)!.push(c);
        }
        const flat: { value: string; label: string; description: string | null; depth: number }[] = [];
        for (const p of topLevel) {
          flat.push({ value: p.value, label: p.label, description: p.description, depth: 0 });
          const kids = childMap.get(p.id);
          if (kids) for (const k of kids.sort((a, b) => a.sortOrder - b.sortOrder)) {
            flat.push({ value: k.value, label: k.label, description: k.description, depth: 1 });
          }
        }
        return { group, items: flat };
      });
  })();

  /* ── Load existing product for edit ── */
  const [productId, setProductId] = useState<string | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);

  /* ── Form state ── */
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");

  // Find the group for the currently selected category
  const selectedGroup = (() => {
    for (const g of categoryGroups) {
      if (g.items.some(c => c.value === category)) return g.group;
    }
    return "";
  })();

  // Get the spec config for the current category's group
  const specConfig = getSpecConfig(selectedGroup, category);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");

  const [images, setImages] = useState<ImgEntry[]>([]);
  const [specs, setSpecs] = useState<SpecsState>({
    weight: "", material: "", certifications: [],
    visorType: "", ventilation: true, features: [],
  });
  const [newFeature, setNewFeature] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([]);

  /* ── UI state ── */
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["key"]>("basic");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [autofilling, setAutofilling] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Load product on edit ── */
  useEffect(() => {
    if (!isEdit || !slug) return;
    (async () => {
      try {
        const res = await productsApi.getBySlug(slug);
        const p = (res as any).data;
        setProductId(p.id);
        setName(p.name || "");
        setBrand(p.brand || "");
        setCategory(p.category || "");
        setDescription(p.description || "");
        setPrice(p.price ? String(Number(p.price)) : "");
        setDiscountPrice(p.discountPrice ? String(Number(p.discountPrice)) : "");
        setStock(p.stock !== undefined ? String(p.stock) : "");
        setSku(p.sku || "");

        if (p.specifications) {
          setSpecs({
            weight: p.specifications.weight || "",
            material: p.specifications.material || "",
            certifications: p.specifications.certifications || [],
            visorType: p.specifications.visorType || "",
            ventilation: p.specifications.ventilation !== false,
            features: p.specifications.features || [],
          });
        }

        if (p.variants?.length) {
          setVariants(p.variants.map((v: any) => ({
            id: uid(),
            size: v.size || "M",
            color: v.color || "Matt Black",
            stock: String(v.stock ?? 0),
            additionalPrice: String(Number(v.additionalPrice) || 0),
          })));
        }

        if (p.images?.length) {
          setImages(p.images.map((img: any) => ({
            id: uid(),
            imageId: img.id,
            imageUrl: img.imageUrl,
            preview: img.imageUrl,
            isPrimary: img.isPrimary,
            existing: true,
          })));
        }
      } catch {
        toast({ title: "Failed to load product", variant: "destructive" });
        navigate("/admin/products");
      } finally {
        setLoadingProduct(false);
      }
    })();
  }, [slug, isEdit]);

  /* ── AI Autofill ── */
  const handleAutofill = async () => {
    if (!name || name.trim().length < 3) {
      setErrors((p) => ({ ...p, name: "Enter a product name first (min 3 chars)" }));
      setActiveTab("basic");
      toast({ title: "Enter product name first", variant: "destructive" });
      return;
    }
    setAutofilling(true);
    try {
      const res = await adminApi.autofill(name.trim(), category || undefined);
      const d = (res as any).data;
      setBrand(d.brand || brand);
      setCategory(d.category || category);
      setDescription(d.description || description);
      setPrice(d.price ? String(d.price) : price);
      setDiscountPrice(d.discountPrice ? String(d.discountPrice) : discountPrice);
      setStock(d.stock ? String(d.stock) : stock);
      setSku(d.sku || sku);
      if (d.specifications) {
        setSpecs({
          weight: d.specifications.weight || "",
          material: d.specifications.material || "",
          certifications: d.specifications.certifications || [],
          visorType: d.specifications.visorType || "",
          ventilation: d.specifications.ventilation !== false,
          features: d.specifications.features || [],
        });
      }
      if (d.variants?.length) {
        setVariants(d.variants.map((v: any) => ({
          id: uid(), size: v.size || "M", color: v.color || "Matt Black",
          stock: String(v.stock || 10), additionalPrice: String(v.additionalPrice || 0),
        })));
      }
      setErrors({});
      toast({ title: "✨ AI filled the details!", description: "Review and adjust as needed." });
    } catch (e: any) {
      toast({ title: "AI autofill failed", description: e.message, variant: "destructive" });
    } finally {
      setAutofilling(false);
    }
  };

  /* ── Image handling ── */
  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const incoming: ImgEntry[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 5 * 1024 * 1024) { toast({ title: `${f.name} exceeds 5 MB`, variant: "destructive" }); continue; }
      incoming.push({ id: uid(), file: f, preview: URL.createObjectURL(f),
        isPrimary: images.length === 0 && i === 0 });
    }
    setImages((prev) => {
      const combined = [...prev, ...incoming];
      // Ensure at least one primary
      if (!combined.some((img) => img.isPrimary) && combined.length > 0) combined[0].isPrimary = true;
      return combined;
    });
  }, [images.length, toast]);

  const removeImage = async (entry: ImgEntry) => {
    if (entry.existing && productId && entry.imageId) {
      try {
        await adminApi.deleteImage(productId, entry.imageId);
        toast({ title: "Image deleted" });
      } catch (e: any) {
        toast({ title: "Failed to delete image", description: e.message, variant: "destructive" });
        return;
      }
    }
    setImages((prev) => {
      const remaining = prev.filter((i) => i.id !== entry.id);
      if (remaining.length > 0 && !remaining.some((i) => i.isPrimary)) remaining[0].isPrimary = true;
      return remaining;
    });
  };

  const setPrimary = async (entry: ImgEntry) => {
    if (entry.existing && productId && entry.imageId) {
      try {
        await adminApi.setPrimaryImage(productId, entry.imageId);
      } catch { /* ignore, optimistic update */ }
    }
    setImages((prev) => prev.map((i) => ({ ...i, isPrimary: i.id === entry.id })));
  };

  /* ── Variant helpers ── */
  const addVariant = () =>
    setVariants((p) => [...p, { id: uid(), size: "M", color: "Matt Black", stock: "10", additionalPrice: "0" }]);

  const updateVariant = (id: string, field: keyof VariantRow, val: string) =>
    setVariants((p) => p.map((v) => (v.id === id ? { ...v, [field]: val } : v)));

  const addAllSizes = () => {
    const color = variants[0]?.color || "Matt Black";
    setVariants((p) => [...p, ...SIZES.map((s) => ({ id: uid(), size: s, color, stock: "10", additionalPrice: "0" }))]);
  };

  /* ── Validation ── */
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name || name.length < 3) e.name = "Min 3 characters";
    if (!brand) e.brand = "Required";
    if (!category) e.category = "Required";
    if (!description || description.length < 20) e.description = "Min 20 characters";
    if (!price || parseFloat(price) <= 0) e.price = "Enter a valid price";
    if (discountPrice && parseFloat(discountPrice) >= parseFloat(price)) e.discountPrice = "Must be less than price";
    if (stock === "" || parseInt(stock) < 0) e.stock = "Enter valid stock (≥ 0)";
    if (!sku || sku.length < 3) e.sku = "Min 3 characters";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      if (e.name || e.brand || e.category || e.description || e.price || e.discountPrice || e.stock || e.sku)
        setActiveTab("basic");
      toast({ title: "Fix the highlighted errors", variant: "destructive" });
    }
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        name, brand, category, description,
        price: parseFloat(price), stock: parseInt(stock), sku,
      };
      if (discountPrice) payload.discountPrice = parseFloat(discountPrice);

      const hasSpecs = specs.weight || specs.material || specs.visorType || specs.certifications.length;
      if (hasSpecs) {
        payload.specifications = {
          weight: specs.weight || "N/A",
          material: specs.material || "N/A",
          certifications: specs.certifications,
          visorType: specs.visorType || "N/A",
          ventilation: specs.ventilation,
          features: specs.features,
        };
      }

      if (variants.length > 0) {
        payload.variants = variants.map((v) => ({
          size: v.size, color: v.color,
          stock: parseInt(v.stock) || 0,
          additionalPrice: parseFloat(v.additionalPrice) || 0,
        }));
      }

      let pid = productId;

      if (isEdit && pid) {
        await adminApi.updateProduct(pid, payload);
        toast({ title: "Product updated" });
      } else {
        const res = await adminApi.createProduct(payload);
        pid = (res as any).data?.id;
        toast({ title: "Product created" });
      }

      // Upload new (non-existing) images
      const newImgs = images.filter((i) => !i.existing && i.file);
      if (pid && newImgs.length > 0) {
        const fd = new FormData();
        newImgs.forEach((i) => i.file && fd.append("images", i.file));
        try {
          await adminApi.uploadImages(pid, fd);
          toast({ title: `${newImgs.length} image(s) uploaded` });
        } catch (e: any) {
          toast({ title: "Images upload failed", description: "Product saved but images failed.", variant: "destructive" });
        }
      }

      navigate("/admin/products");
    } catch (e: any) {
      toast({ title: isEdit ? "Update failed" : "Create failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
        <div className="flex items-center gap-3 text-white/40">
          <Loader2 size={22} className="animate-spin" />
          <span>Loading product...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-[#0d0d0d]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-5 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/products")}
              className="p-2 rounded-lg hover:bg-white/[0.04] text-white/40 hover:text-white transition"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-oswald font-bold text-lg text-white leading-tight">
                {isEdit ? "Edit Product" : "Add Product"}
              </h1>
              {isEdit && <p className="text-xs text-white/30 leading-none mt-0.5">{name}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* AI Autofill */}
            <button
              type="button"
              disabled={autofilling}
              onClick={handleAutofill}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                "bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20",
                autofilling && "opacity-60 cursor-wait"
              )}
            >
              {autofilling ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              <span className="hidden sm:inline">{autofilling ? "AI filling..." : "AI Autofill"}</span>
            </button>

            {/* Save */}
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg",
                "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-orange-500/25",
                saving && "opacity-70 cursor-wait"
              )}
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {isEdit ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 lg:px-8 border-t border-white/[0.04] overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.key
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-white/30 hover:text-white/60"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.key === "images" && images.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center">
                  {images.length}
                </span>
              )}
              {tab.key === "variants" && variants.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center">
                  {variants.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-8 space-y-5">

        {/* ──────── BASIC INFO ──────── */}
        {activeTab === "basic" && (
          <Section icon={Package} title="Basic Information" desc="Core product details and pricing">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="sm:col-span-2">
                <Field label="Product Name *" error={errors.name}>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    className={inputCls(!!errors.name)}
                    placeholder="e.g. Product name" />
                </Field>
              </div>

              <Field label="Brand *" error={errors.brand}>
                <input value={brand} onChange={(e) => setBrand(e.target.value)}
                  className={inputCls(!!errors.brand)} placeholder="e.g. Brand name" />
              </Field>

              <Field label="SKU *" error={errors.sku}>
                <input value={sku} onChange={(e) => setSku(e.target.value)}
                  className={inputCls(!!errors.sku)} placeholder="e.g. PRD-001-BLK" />
              </Field>

              <Field label="Category *" error={errors.category}>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls(!!errors.category)}>
                  <option value="">Select a category...</option>
                  {categoryGroups.map((g) => (
                    <optgroup key={g.group} label={`── ${g.group} ──`}>
                      {g.items.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.depth > 0 ? "↳ " : ""}{c.label}{c.description ? ` — ${c.description}` : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>

              <Field label="Stock *" error={errors.stock}>
                <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)}
                  className={inputCls(!!errors.stock)} placeholder="e.g. 50" />
              </Field>

              <Field label="Price (₹) *" error={errors.price}>
                <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                  className={inputCls(!!errors.price)} placeholder="e.g. 2999" />
              </Field>

              <Field label="Discount Price (₹)" error={errors.discountPrice}>
                <input type="number" min="0" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)}
                  className={inputCls(!!errors.discountPrice)} placeholder="Leave blank if no discount" />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Description *" error={errors.description}>
                  <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
                    className={cn(inputCls(!!errors.description), "resize-none")}
                    placeholder="Detailed product description (min 20 characters)..." />
                  <p className="text-[11px] text-white/20 mt-1 text-right">{description.length} chars</p>
                </Field>
              </div>
            </div>
          </Section>
        )}

        {/* ──────── IMAGES ──────── */}
        {activeTab === "images" && (
          <Section icon={ImageIcon} title="Product Images" desc="Upload and manage product photos">
            {/* Drop zone */}
            <div
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 border-2 border-dashed border-white/[0.1] hover:border-orange-500/40 rounded-2xl p-8 text-center cursor-pointer transition-all group"
            >
              <Upload size={32} className="mx-auto text-white/20 group-hover:text-orange-500/50 transition mb-2" />
              <p className="text-sm font-medium text-white/40 group-hover:text-white/60 transition">
                Drag & drop images here, or <span className="text-orange-500">click to select</span>
              </p>
              <p className="text-xs text-white/20 mt-1">PNG, JPG, WebP · Max 5 MB each</p>
              <input ref={fileInputRef} type="file" multiple accept="image/*"
                className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </div>

            {/* Image grid */}
            {images.length > 0 && (
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden bg-white/5 aspect-square">
                    <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      {!img.isPrimary && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setPrimary(img); }}
                          className="p-1.5 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-white transition"
                          title="Set as primary"
                        >
                          <Star size={13} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(img); }}
                        className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition"
                        title="Remove"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    {/* Primary badge */}
                    {img.isPrimary && (
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 bg-amber-500 rounded-md text-[10px] font-bold text-white">
                        <Star size={9} className="fill-white" /> Primary
                      </div>
                    )}
                    {/* Existing badge */}
                    {img.existing && (
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-emerald-500/80 rounded text-[9px] font-semibold text-white">
                        Saved
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {images.length === 0 && (
              <p className="mt-3 text-center text-xs text-white/20">No images added yet</p>
            )}
          </Section>
        )}

        {/* ──────── SPECIFICATIONS ──────── */}
        {activeTab === "specs" && (
          <Section icon={Settings2} title={specConfig.title} desc={specConfig.desc}>
            {!selectedGroup && (
              <div className="mt-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
                Select a category first to see relevant specification fields.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label={specConfig.weightLabel}>
                <input value={specs.weight} onChange={(e) => setSpecs({ ...specs, weight: e.target.value })}
                  className={inputCls()} placeholder={specConfig.weightPlaceholder} />
              </Field>

              <Field label={specConfig.materialLabel}>
                {specConfig.materials.length > 0 ? (
                  <select value={specs.material} onChange={(e) => setSpecs({ ...specs, material: e.target.value })}
                    className={inputCls()}>
                    <option value="">Select {specConfig.materialLabel.toLowerCase()}...</option>
                    {specConfig.materials.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <input value={specs.material} onChange={(e) => setSpecs({ ...specs, material: e.target.value })}
                    className={inputCls()} placeholder={`Enter ${specConfig.materialLabel.toLowerCase()}`} />
                )}
              </Field>

              {specConfig.showVisor && (
                <Field label={specConfig.visorLabel}>
                  {specConfig.visorOptions.length > 0 ? (
                    <select value={specs.visorType} onChange={(e) => setSpecs({ ...specs, visorType: e.target.value })}
                      className={inputCls()}>
                      <option value="">Select...</option>
                      {specConfig.visorOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : (
                    <input value={specs.visorType} onChange={(e) => setSpecs({ ...specs, visorType: e.target.value })}
                      className={inputCls()} placeholder={`Enter ${specConfig.visorLabel.toLowerCase()}`} />
                  )}
                </Field>
              )}

              {specConfig.showVentilation && (
                <Field label={specConfig.ventilationLabel}>
                  <div className="flex items-center gap-3 h-[42px]">
                    <button
                      type="button"
                      onClick={() => setSpecs({ ...specs, ventilation: true })}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-sm font-medium border transition",
                        specs.ventilation
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : "bg-white/[0.03] border-white/[0.07] text-white/30 hover:border-white/15"
                      )}
                    >Yes</button>
                    <button
                      type="button"
                      onClick={() => setSpecs({ ...specs, ventilation: false })}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-sm font-medium border transition",
                        !specs.ventilation
                          ? "bg-red-500/15 border-red-500/30 text-red-400"
                          : "bg-white/[0.03] border-white/[0.07] text-white/30 hover:border-white/15"
                      )}
                    >No</button>
                  </div>
                </Field>
              )}

              {/* Certifications / Standards */}
              {specConfig.certifications.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                    {specConfig.certLabel}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {specConfig.certifications.map((c) => {
                      const active = specs.certifications.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSpecs((prev) => ({
                            ...prev,
                            certifications: active
                              ? prev.certifications.filter((x) => x !== c)
                              : [...prev.certifications, c],
                          }))}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition",
                            active
                              ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                              : "bg-white/[0.03] border-white/[0.07] text-white/30 hover:border-white/20 hover:text-white/50"
                          )}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Key Features
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newFeature.trim()) {
                          setSpecs((p) => ({ ...p, features: [...p.features, newFeature.trim()] }));
                          setNewFeature("");
                        }
                      }
                    }}
                    className={cn(inputCls(), "flex-1")}
                    placeholder="e.g. Add a key feature or highlight"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newFeature.trim()) {
                        setSpecs((p) => ({ ...p, features: [...p.features, newFeature.trim()] }));
                        setNewFeature("");
                      }
                    }}
                    className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-sm font-semibold text-white transition"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {specs.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {specs.features.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/[0.07] rounded-lg text-xs text-white/60">
                        {f}
                        <button
                          type="button"
                          onClick={() => setSpecs((p) => ({ ...p, features: p.features.filter((_, j) => j !== i) }))}
                          className="text-white/30 hover:text-red-400 transition"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* ──────── VARIANTS ──────── */}
        {activeTab === "variants" && (
          <Section icon={Layers} title="Size & Variants" desc="Add size and color variants with individual stock">
            <div className="mt-4 space-y-3">
              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <button type="button" onClick={addVariant}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-orange-500/20">
                  <Plus size={14} /> Add Variant
                </button>
                <button type="button" onClick={addAllSizes}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.07] text-white/60 hover:text-white rounded-xl text-sm font-medium transition">
                  <Layers size={14} /> Add All Sizes
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="py-10 text-center">
                  <Layers size={28} className="mx-auto text-white/15 mb-2" />
                  <p className="text-xs text-white/30">No variants. The base stock from Basic Info will be used.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="hidden sm:grid grid-cols-[1.5fr_2fr_1fr_1fr_40px] gap-3 px-3 py-2">
                    {["Size", "Color", "Stock", "Extra Price (₹)", ""].map((h) => (
                      <span key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</span>
                    ))}
                  </div>
                  {variants.map((v) => (
                    <div key={v.id} className="grid grid-cols-2 sm:grid-cols-[1.5fr_2fr_1fr_1fr_40px] gap-2 sm:gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                      <select value={v.size} onChange={(e) => updateVariant(v.id, "size", e.target.value)}
                        className={cn(inputCls(), "text-xs py-2")}>
                        {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>

                      <div className="relative">
                        <input list={`colors-${v.id}`} value={v.color}
                          onChange={(e) => updateVariant(v.id, "color", e.target.value)}
                          className={cn(inputCls(), "text-xs py-2")} placeholder="Color" />
                        <datalist id={`colors-${v.id}`}>
                          {COMMON_COLORS.map((c) => <option key={c} value={c} />)}
                        </datalist>
                      </div>

                      <input type="number" min="0" value={v.stock}
                        onChange={(e) => updateVariant(v.id, "stock", e.target.value)}
                        className={cn(inputCls(), "text-xs py-2")} placeholder="Stock" />

                      <input type="number" min="0" value={v.additionalPrice}
                        onChange={(e) => updateVariant(v.id, "additionalPrice", e.target.value)}
                        className={cn(inputCls(), "text-xs py-2")} placeholder="0" />

                      <button type="button" onClick={() => setVariants((p) => p.filter((x) => x.id !== v.id))}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition self-center">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Bottom save button */}
        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={() => navigate("/admin/products")}
            className="px-5 py-2.5 bg-white/[0.03] border border-white/[0.07] hover:bg-white/5 rounded-xl text-sm font-medium text-white/50 hover:text-white/70 transition">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/20 transition">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isEdit ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
