import { useState, useEffect, useCallback, useMemo } from "react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Plus, Pencil, Trash2, RefreshCw, Tag, Save, X,
  Eye, EyeOff, AlertTriangle, Loader2, Search,
  Copy, Package, ChevronDown, ChevronRight, ToggleLeft, ToggleRight,
} from "lucide-react";

interface Category {
  id: string;
  value: string;
  label: string;
  group: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

interface FormState {
  label: string;
  group: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
  value: string;
}

const BLANK_FORM: FormState = {
  value: "", label: "", group: "", description: "", sortOrder: "0", isActive: true,
};

const GROUP_SUGGESTIONS = ["Helmets", "Riding Gear", "Accessories & More"];

const fieldCls = (err?: string) => cn(
  "w-full px-3.5 py-2.5 bg-[#1e1e1e] border rounded-xl text-sm text-white transition-all",
  "focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/50",
  "placeholder:text-white/20",
  err ? "border-red-400/50" : "border-white/[0.08] hover:border-white/20"
);

export default function AdminCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<"add" | "edit" | "duplicate" | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategories();
      setCategories(((res as any).data || []) as Category[]);
    } catch {
      setCategories([]);
      toast({ title: "Failed to load categories", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.value.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
    );
  }, [categories, search]);

  const grouped = useMemo(() =>
    filtered.reduce<Record<string, Category[]>>((acc, cat) => {
      if (!acc[cat.group]) acc[cat.group] = [];
      acc[cat.group].push(cat);
      return acc;
    }, {}),
    [filtered]);

  const sortedGroups = useMemo(() => Object.keys(grouped).sort(), [grouped]);
  const allGroups = useMemo(() => [...new Set(categories.map((c) => c.group))].sort(), [categories]);
  const activeCount = categories.filter((c) => c.isActive).length;

  const openAdd = () => { setForm(BLANK_FORM); setErrors({}); setEditTarget(null); setModal("add"); };
  const openAddToGroup = (groupName: string) => {
    setForm({ ...BLANK_FORM, group: groupName });
    setErrors({}); setEditTarget(null); setModal("add");
  };
  const openEdit = (cat: Category) => {
    setForm({ value: cat.value, label: cat.label, group: cat.group, description: cat.description || "", sortOrder: String(cat.sortOrder), isActive: cat.isActive });
    setErrors({}); setEditTarget(cat); setModal("edit");
  };
  const openDuplicate = (cat: Category) => {
    setForm({ value: cat.value + "_COPY", label: cat.label + " (Copy)", group: cat.group, description: cat.description || "", sortOrder: String(cat.sortOrder + 1), isActive: false });
    setErrors({}); setEditTarget(cat); setModal("duplicate");
  };
  const closeModal = () => { setModal(null); setEditTarget(null); setErrors({}); };

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.label.trim()) e.label = "Label is required";
    if (!form.group.trim()) e.group = "Group is required";
    if ((modal === "add" || modal === "duplicate") && !form.value.trim()) e.value = "Value (slug) is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (modal === "add" || modal === "duplicate") {
        await adminApi.createCategory({ value: form.value, label: form.label, group: form.group, description: form.description || null, sortOrder: Number(form.sortOrder) || 0, isActive: form.isActive });
        toast({ title: modal === "duplicate" ? "Category duplicated" : "Category created", description: `"${form.label}" added` });
      } else if (editTarget) {
        await adminApi.updateCategory(editTarget.id, { label: form.label, group: form.group, description: form.description || null, sortOrder: Number(form.sortOrder) || 0, isActive: form.isActive });
        toast({ title: "Category updated", description: `"${form.label}" saved` });
      }
      closeModal(); fetchCategories();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      toast({ title: "Category deleted", description: `"${deleteTarget.label}" removed` });
      setDeleteTarget(null); fetchCategories();
    } catch (e: any) {
      toast({ title: "Cannot delete", description: e.message, variant: "destructive" });
    } finally { setDeleting(null); }
  };

  const handleToggleActive = async (cat: Category) => {
    setToggling(cat.id);
    try {
      await adminApi.updateCategory(cat.id, { isActive: !cat.isActive });
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
      toast({ title: cat.isActive ? "Category hidden" : "Category visible", description: `"${cat.label}" is now ${cat.isActive ? "hidden from" : "visible in"} the store` });
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally { setToggling(null); }
  };

  const handleToggleGroup = async (groupName: string, makeActive: boolean) => {
    const targets = (grouped[groupName] || []).filter((c) => c.isActive !== makeActive);
    if (!targets.length) return;
    try {
      await Promise.all(targets.map((c) => adminApi.updateCategory(c.id, { isActive: makeActive })));
      setCategories((prev) => prev.map((c) => c.group === groupName ? { ...c, isActive: makeActive } : c));
      toast({ title: makeActive ? "Group activated" : "Group hidden", description: `${targets.length} categories updated` });
    } catch {
      toast({ title: "Bulk update failed", variant: "destructive" });
    }
  };

  const toggleCollapse = (group: string) => {
    setCollapsed((prev) => { const next = new Set(prev); next.has(group) ? next.delete(group) : next.add(group); return next; });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-oswald tracking-wide">Categories</h1>
          <p className="text-white/40 text-sm mt-1">
            {categories.length} total &bull; {activeCount} active &bull; {Object.keys(grouped).length} groups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCategories} disabled={loading} title="Refresh" className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/50 hover:text-white hover:bg-white/8 transition">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition shadow-lg shadow-orange-500/20">
            <Plus size={15} /> Add Category
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && categories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: categories.length, color: "text-white" },
            { label: "Active", value: activeCount, color: "text-emerald-400" },
            { label: "Hidden", value: categories.length - activeCount, color: "text-amber-400" },
            { label: "Groups", value: allGroups.length, color: "text-orange-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/[0.03] rounded-xl border border-white/[0.06] px-4 py-3">
              <p className="text-xs text-white/30 mb-0.5">{label}</p>
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      {categories.length > 4 && (
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, value, or group" className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/40 transition" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition"><X size={14} /></button>}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-orange-500" /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center"><Tag size={28} className="text-white/20" /></div>
          <p className="text-white/30 mb-3">No categories yet.</p>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"><Plus size={14} /> Add your first category</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">No categories match "{search}"</div>
      ) : (
        <div className="space-y-4">
          {sortedGroups.map((group) => {
            const cats = grouped[group] ?? [];
            const isCollapsed = collapsed.has(group);
            const groupAllActive = cats.every((c) => c.isActive);
            return (
              <div key={group} className="bg-white/[0.03] rounded-2xl border border-white/[0.07] overflow-hidden">
                {/* Group header */}
                <div className="flex items-center gap-3 px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.05]">
                  <button onClick={() => toggleCollapse(group)} className="text-white/30 hover:text-white/70 transition">
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                    <Tag size={13} className="text-orange-400" />
                  </div>
                  <h2 className="font-semibold text-white/80 text-sm tracking-wide flex-1">{group}</h2>
                  <span className="text-xs text-white/25 bg-white/5 px-2 py-0.5 rounded-lg">{cats.length} {cats.length === 1 ? "category" : "categories"}</span>
                  <div className="flex items-center gap-1 border-l border-white/[0.06] pl-3 ml-1">
                    <button
                      onClick={() => openAddToGroup(group)}
                      title={`Add category to ${group}`}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 mr-1"
                    >
                      <Plus size={12} />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                    <button
                      onClick={() => handleToggleGroup(group, !groupAllActive)}
                      title={groupAllActive ? "Hide all in group" : "Show all in group"}
                      className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition font-medium", groupAllActive ? "bg-white/5 text-white/40 hover:bg-amber-500/10 hover:text-amber-400" : "bg-white/5 text-white/40 hover:bg-emerald-500/10 hover:text-emerald-400")}
                    >
                      {groupAllActive ? <EyeOff size={12} /> : <Eye size={12} />}
                      <span className="hidden sm:inline">{groupAllActive ? "Hide all" : "Show all"}</span>
                    </button>
                  </div>
                </div>

                {/* Rows */}
                {!isCollapsed && (
                  <div className="divide-y divide-white/[0.04]">
                    {cats.sort((a, b) => a.sortOrder - b.sortOrder).map((cat) => (
                      <div key={cat.id} className={cn("flex items-center gap-3 px-5 py-4 hover:bg-white/[0.025] transition", !cat.isActive && "opacity-60")}>
                        {/* Active stripe */}
                        <div className={cn("w-1 h-8 rounded-full flex-shrink-0", cat.isActive ? "bg-emerald-500" : "bg-white/10")} />
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{cat.label}</span>
                            <code className="text-[11px] text-orange-400/70 bg-orange-500/5 px-1.5 py-0.5 rounded border border-orange-500/10">{cat.value}</code>
                            {!cat.isActive && <span className="text-[10px] bg-amber-500/10 text-amber-400/70 px-2 py-0.5 rounded-md border border-amber-500/20">Hidden</span>}
                          </div>
                          {cat.description && <p className="text-xs text-white/30 mt-0.5 truncate max-w-xs">{cat.description}</p>}
                        </div>
                        {/* Product count */}
                        <div className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border", cat.productCount > 0 ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-white/[0.03] text-white/20 border-white/[0.06]")} title={`${cat.productCount} product(s)`}>
                          <Package size={11} /><span className="font-semibold">{cat.productCount}</span>
                        </div>
                        <span className="text-xs text-white/20 w-5 text-center hidden sm:block">#{cat.sortOrder}</span>
                        {/* Actions — always visible */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleActive(cat)}
                            disabled={toggling === cat.id}
                            title={cat.isActive ? "Hide from store" : "Show in store"}
                            className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border", cat.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20")}
                          >
                            {toggling === cat.id ? <Loader2 size={11} className="animate-spin" /> : cat.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                            <span className="hidden md:inline">{cat.isActive ? "Visible" : "Hidden"}</span>
                          </button>
                          <button onClick={() => openDuplicate(cat)} title="Duplicate" className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/20 transition">
                            <Copy size={13} />
                          </button>
                          <button onClick={() => openEdit(cat)} title="Edit" className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20 transition">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(cat)} title={cat.productCount > 0 ? `${cat.productCount} products use this` : "Delete"} className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isCollapsed && <div className="px-5 py-3 text-xs text-white/25">{cats.length} categories collapsed — click arrow to expand</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit / Duplicate Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-[#141414] z-10">
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", modal === "add" ? "bg-orange-500/15" : modal === "duplicate" ? "bg-purple-500/15" : "bg-blue-500/15")}>
                  {modal === "duplicate" ? <Copy size={15} className="text-purple-400" /> : <Tag size={15} className={modal === "add" ? "text-orange-500" : "text-blue-400"} />}
                </div>
                <h2 className="font-semibold text-white">
                  {modal === "add" ? "Add New Category" : modal === "duplicate" ? `Duplicate — ${editTarget?.label}` : `Edit — ${editTarget?.label}`}
                </h2>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-white/8 text-white/50 transition"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {(modal === "add" || modal === "duplicate") && (
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Value (slug) *</label>
                  <input value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "") }))} className={fieldCls(errors.value)} placeholder="e.g. FULL_FACE" />
                  {errors.value && <p className="text-red-400 text-xs mt-1">{errors.value}</p>}
                  <p className="text-white/25 text-[11px] mt-1">Auto-formatted to UPPER_SNAKE_CASE. Cannot be changed after creation.</p>
                </div>
              )}
              {modal === "edit" && (
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Value</label>
                  <div className="px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl text-sm text-orange-400/70 font-mono">{editTarget?.value}</div>
                  <p className="text-white/25 text-[11px] mt-1">Value cannot be changed — it is stored on existing products.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Display Label *</label>
                <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className={fieldCls(errors.label)} placeholder="e.g. Full Face" />
                {errors.label && <p className="text-red-400 text-xs mt-1">{errors.label}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Group *</label>
                <input value={form.group} onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))} className={fieldCls(errors.group)} placeholder="e.g. Helmets" list="group-suggestions" />
                <datalist id="group-suggestions">
                  {[...new Set([...GROUP_SUGGESTIONS, ...allGroups])].map((g) => <option key={g} value={g} />)}
                </datalist>
                {errors.group && <p className="text-red-400 text-xs mt-1">{errors.group}</p>}
                <p className="text-white/25 text-[11px] mt-1">Same group name groups categories together in the product form.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Description</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={fieldCls()} placeholder="Short description (optional)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Sort Order</label>
                  <input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} className={fieldCls()} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Status</label>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))} className={cn("w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2", form.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/[0.04] border-white/[0.08] text-white/30")}>
                    {form.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    {form.isActive ? "Active" : "Hidden"}
                  </button>
                </div>
              </div>
              {modal === "duplicate" && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-400/80">
                  Duplicate starts as <strong>Hidden</strong> so you can review before making it live.
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/8 transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className={cn("flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50", modal === "duplicate" ? "bg-purple-500 hover:bg-purple-600" : modal === "edit" ? "bg-blue-500 hover:bg-blue-600" : "bg-orange-500 hover:bg-orange-600")}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {modal === "add" ? "Create" : modal === "duplicate" ? "Duplicate" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-red-500/20 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0"><AlertTriangle size={18} className="text-red-400" /></div>
              <div>
                <h3 className="font-semibold text-white">Delete Category?</h3>
                <p className="text-sm text-white/40 mt-0.5">"{deleteTarget.label}" <code className="text-orange-400/70 text-xs">({deleteTarget.value})</code></p>
              </div>
            </div>
            {deleteTarget.productCount > 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-400/80"><strong>{deleteTarget.productCount} product(s)</strong> use this category. Reassign them before deleting.</p>
              </div>
            ) : (
              <p className="text-sm text-white/50">This will permanently remove the category. This cannot be undone.</p>
            )}
            <div className="flex items-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white/70 transition">Cancel</button>
              <button onClick={handleDelete} disabled={deleting === deleteTarget.id || deleteTarget.productCount > 0} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed">
                {deleting === deleteTarget.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleteTarget.productCount > 0 ? "Cannot Delete" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
