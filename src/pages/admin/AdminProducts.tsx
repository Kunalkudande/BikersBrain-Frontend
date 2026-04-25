import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  Package,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const CATEGORY_LABELS: Record<string, string> = {
  // Helmets
  FULL_FACE: "Full Face",
  HALF_FACE: "Half Face",
  OPEN_FACE: "Open Face",
  MODULAR: "Modular",
  OFF_ROAD: "Off Road",
  KIDS: "Kids",
  LADIES: "Ladies",
  // Riding Gear
  JACKETS: "Jackets",
  GLOVES: "Gloves",
  BOOTS: "Boots",
  RIDING_PANTS: "Riding Pants",
  // Accessories & More
  ACCESSORIES: "Accessories",
  PARTS: "Parts",
  LUGGAGE: "Luggage",
  ELECTRONICS: "Electronics",
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const firstRender = useRef(true);
  const pageMounted = useRef(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchProducts = useCallback(async (pg = page, q = search) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { page: pg, limit: 15 };
      if (q) params.search = q;
      const res = await adminApi.getProducts(params);
      const d = (res as any).data;
      setProducts(d.items || []);
      setPagination({
        total: d.total,
        totalPages: d.totalPages,
        hasNext: d.hasNext,
        hasPrev: d.hasPrev,
      });
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(1, "");
  }, []);

  // Debounced search
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchProducts(1, search);
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // Re-fetch when page changes (skip the initial mount)
  useEffect(() => {
    if (!pageMounted.current) { pageMounted.current = true; return; }
    fetchProducts(page, search);
  }, [page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteProduct(deleteTarget.id);
      toast({ title: "Product deleted", description: deleteTarget.name });
      setDeleteTarget(null);
      fetchProducts(page, search);
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (product: any) => {
    setTogglingId(product.id);
    try {
      await adminApi.updateProduct(product.id, { isActive: !product.isActive });
      toast({
        title: product.isActive ? "Product deactivated" : "Product activated",
        description: product.name,
      });
      fetchProducts(page, search);
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const getImage = (p: any) => {
    if (!p.images?.length) return null;
    const primary = p.images.find((img: any) => img.isPrimary);
    const img = primary || p.images[0];
    return typeof img === "string" ? img : img?.imageUrl || null;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-oswald">Products</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {pagination?.total ?? 0} products in catalog
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/products/new")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200 text-sm"
        >
          <Plus size={17} />
          Add Product
        </button>
      </div>

      {/* Search + Refresh */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition"
          />
        </div>
        <button
          onClick={() => fetchProducts(page, search)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white/60 transition"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.07] overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center text-white/30">
            <RefreshCw size={28} className="animate-spin mb-3" />
            <p className="text-sm">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <Package size={30} className="text-white/20" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No products found</h3>
            <p className="text-white/30 text-sm mb-5">
              {search ? "Try a different search term" : "Add your first product to get started"}
            </p>
            {!search && (
              <button
                onClick={() => navigate("/admin/products/new")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition"
              >
                <Plus size={16} /> Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.07]">
                  {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider",
                        i === 0 ? "pl-5 pr-4 text-left" : i === 5 ? "pr-5 pl-4 text-right" : "px-4 text-left"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {products.map((p) => {
                  const imgUrl = getImage(p);
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition group">
                      {/* Product */}
                      <td className="pl-5 pr-4 py-3.5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden flex-shrink-0">
                            {imgUrl ? (
                              <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/15">
                                <Package size={20} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-white truncate max-w-[180px] group-hover:text-orange-400 transition">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-white/30 mt-0.5">{p.brand}</p>
                          </div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/[0.05] text-xs font-medium text-white/50">
                            {CATEGORY_LABELS[p.category] || p.category}
                          </span>
                          {p.images?.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-white/25">
                              <ImageIcon size={10} /> {p.images.length}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Price */}
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {p.discountPrice ? fmt(Number(p.discountPrice)) : fmt(Number(p.price))}
                          </p>
                          {p.discountPrice && (
                            <p className="text-xs text-white/25 line-through">{fmt(Number(p.price))}</p>
                          )}
                        </div>
                      </td>
                      {/* Stock */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg",
                            p.stock === 0
                              ? "bg-red-500/10 text-red-400"
                              : p.stock <= 5
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-emerald-500/10 text-emerald-400"
                          )}
                        >
                          {p.stock === 0 && <AlertTriangle size={10} />}
                          {p.stock === 0 ? "Out of stock" : `${p.stock} units`}
                        </span>
                      </td>
                      {/* Status toggle */}
                      <td className="px-4 py-3.5">
                        <button
                          disabled={togglingId === p.id}
                          onClick={() => toggleActive(p)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition",
                            p.isActive
                              ? "bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400"
                              : "bg-red-500/10 text-red-400 hover:bg-emerald-500/10 hover:text-emerald-400",
                            togglingId === p.id && "opacity-50 cursor-wait"
                          )}
                        >
                          {p.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                          {p.isActive ? "Active" : "Hidden"}
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="pr-5 pl-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/products/${p.slug}/edit`)}
                            className="p-2 rounded-lg bg-white/[0.03] hover:bg-blue-500/10 text-white/30 hover:text-blue-400 transition"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                            className="p-2 rounded-lg bg-white/[0.03] hover:bg-red-500/10 text-white/30 hover:text-red-400 transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/30">
            Page {page} of {pagination.totalPages} · {pagination.total} total
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={!pagination.hasPrev}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.07] text-white/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={!pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.07] text-white/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-1">Delete Product?</h3>
            <p className="text-sm text-white/40 text-center mb-6">
              <span className="text-white/70 font-medium">"{deleteTarget.name}"</span> will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white/70 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
