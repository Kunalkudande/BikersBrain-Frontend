import { useState, useEffect, useCallback, useMemo } from "react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Plus, Pencil, Trash2, RefreshCw, Tag, Save, X,
  Eye, EyeOff, AlertTriangle, Loader2, Search,
  Copy, Package, ChevronDown, ChevronRight, ToggleLeft, ToggleRight,
  ArrowUp, ArrowDown, FolderPlus,
} from "lucide-react";

/* types */

interface Category {
  id: string;
  value: string;
  label: string;
  group: string;
  description: string | null;
  sortOrder: number;
  groupSortOrder: number;
  isActive: boolean;
  productCount: number;
  parentId: string | null;
  createdAt: string;
}

interface TreeNode extends Category {
  children: TreeNode[];
  depth: number;
}

interface FormState {
  label: string;
  group: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
  value: string;
  parentId: string;
}

const BLANK_FORM: FormState = {
  value: "", label: "", group: "", description: "", sortOrder: "0", isActive: true, parentId: "",
};

const GROUP_SUGGESTIONS = ["Helmets", "Riding Gear", "Accessories & More"];

const fieldCls = (err?: string) => cn(
  "w-full px-3.5 py-2.5 bg-[#1e1e1e] border rounded-xl text-sm text-white transition-all",
  "focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/50",
  "placeholder:text-white/20",
  err ? "border-red-400/50" : "border-white/[0.08] hover:border-white/20"
);

/* build tree from flat list */

function buildTree(categories: Category[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  for (const c of categories) map.set(c.id, { ...c, children: [], depth: 0 });
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) map.get(node.parentId)!.children.push(node);
    else roots.push(node);
  }
  const sortNodes = (nodes: TreeNode[], depth: number) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const n of nodes) { n.depth = depth; sortNodes(n.children, depth + 1); }
  };
  sortNodes(roots, 0);
  return roots;
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  const walk = (list: TreeNode[]) => { for (const n of list) { result.push(n); walk(n.children); } };
  walk(nodes);
  return result;
}

/* COMPONENT */

export default function AdminCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(c =>
      c.label.toLowerCase().includes(q) || c.value.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q)
    );
  }, [categories, search]);

  const grouped = useMemo(() =>
    filtered.reduce<Record<string, Category[]>>((acc, cat) => {
      if (!acc[cat.group]) acc[cat.group] = [];
      acc[cat.group].push(cat);
      return acc;
    }, {}), [filtered]);

  const sortedGroups = useMemo(() =>
    Object.keys(grouped).sort((a, b) => {
      const aO = grouped[a]?.[0]?.groupSortOrder ?? 0;
      const bO = grouped[b]?.[0]?.groupSortOrder ?? 0;
      return aO - bO || a.localeCompare(b);
    }), [grouped]);

  const allGroups = useMemo(() => [...new Set(categories.map(c => c.group))].sort(), [categories]);
  const activeCount = categories.filter(c => c.isActive).length;

  const treesPerGroup = useMemo(() => {
    const r: Record<string, TreeNode[]> = {};
    for (const [g, cats] of Object.entries(grouped)) r[g] = buildTree(cats);
    return r;
  }, [grouped]);

  /* modal helpers */
  const openAdd = () => { setForm(BLANK_FORM); setErrors({}); setEditTarget(null); setModal("add"); };
  const openAddToGroup = (groupName: string) => {
    setForm({ ...BLANK_FORM, group: groupName }); setErrors({}); setEditTarget(null); setModal("add");
  };
  const openAddChild = (parent: Category) => {
    setForm({ ...BLANK_FORM, group: parent.group, parentId: parent.id }); setErrors({}); setEditTarget(null); setModal("add");
  };
  const openEdit = (cat: Category) => {
    setForm({ value: cat.value, label: cat.label, group: cat.group, description: cat.description || "",
      sortOrder: String(cat.sortOrder), isActive: cat.isActive, parentId: cat.parentId || "" });
    setErrors({}); setEditTarget(cat); setModal("edit");
  };
  const openDuplicate = (cat: Category) => {
    setForm({ value: cat.value + "_COPY", label: cat.label + " (Copy)", group: cat.group,
      description: cat.description || "", sortOrder: String(cat.sortOrder + 1), isActive: false, parentId: cat.parentId || "" });
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
        await adminApi.createCategory({ value: form.value, label: form.label, group: form.group,
          description: form.description || null, sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive, parentId: form.parentId || null });
        toast({ title: modal === "duplicate" ? "Category duplicated" : "Category created", description: `"${form.label}" added` });
      } else if (editTarget) {
        await adminApi.updateCategory(editTarget.id, { label: form.label, group: form.group,
          description: form.description || null, sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive, parentId: form.parentId || null });
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
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
      toast({ title: cat.isActive ? "Category hidden" : "Category visible" });
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally { setToggling(null); }
  };

  const handleToggleGroup = async (groupName: string, makeActive: boolean) => {
    const targets = (grouped[groupName] || []).filter(c => c.isActive !== makeActive);
    if (!targets.length) return;
    try {
      await Promise.all(targets.map(c => adminApi.updateCategory(c.id, { isActive: makeActive })));
      setCategories(prev => prev.map(c => c.group === groupName ? { ...c, isActive: makeActive } : c));
      toast({ title: makeActive ? "Group activated" : "Group hidden", description: `${targets.length} categories updated` });
    } catch { toast({ title: "Bulk update failed", variant: "destructive" }); }
  };

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  };

  /* reorder category within siblings */
  const moveCategoryInList = async (cat: Category, direction: "up" | "down") => {
    const siblings = categories.filter(c => c.group === cat.group && c.parentId === cat.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
    const idx = siblings.findIndex(s => s.id === cat.id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    // Build new order by swapping positions
    const newOrder = [...siblings];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    // Assign sequential sortOrder values
    const items = newOrder.map((s, i) => ({ id: s.id, sortOrder: i }));
    setReordering(true);
    try {
      await adminApi.reorderCategories(items);
      setCategories(prev => prev.map(c => { const m = items.find(i => i.id === c.id); return m ? { ...c, sortOrder: m.sortOrder! } : c; }));
    } catch { toast({ title: "Reorder failed", variant: "destructive" }); }
    finally { setReordering(false); }
  };

  /* reorder group */
  const moveGroupInList = async (groupName: string, direction: "up" | "down") => {
    const idx = sortedGroups.indexOf(groupName);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sortedGroups.length) return;
    // Build new group order by swapping positions
    const newOrder = [...sortedGroups];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    // Assign sequential groupSortOrder to ALL categories in each group
    const items: { id: string; groupSortOrder: number }[] = [];
    for (let i = 0; i < newOrder.length; i++) {
      for (const c of categories.filter(c => c.group === newOrder[i])) {
        items.push({ id: c.id, groupSortOrder: i });
      }
    }
    setReordering(true);
    try {
      await adminApi.reorderCategories(items);
      setCategories(prev => prev.map(c => { const m = items.find(i => i.id === c.id); return m ? { ...c, groupSortOrder: m.groupSortOrder! } : c; }));
    } catch { toast({ title: "Reorder failed", variant: "destructive" }); }
    finally { setReordering(false); }
  };

  /* parent options for modal */
  const parentOptions = useMemo(() => {
    const excludeIds = new Set<string>();
    if (editTarget) {
      const collect = (id: string) => { excludeIds.add(id); categories.filter(c => c.parentId === id).forEach(c => collect(c.id)); };
      collect(editTarget.id);
    }
    const result: { id: string; label: string; depth: number }[] = [];
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        if (!excludeIds.has(n.id)) result.push({ id: n.id, label: n.label, depth: n.depth });
        walk(n.children.filter(c => !excludeIds.has(c.id)));
      }
    };
    walk(buildTree(categories));
    return result;
  }, [categories, editTarget]);

  /* render tree node */
  const renderTreeNode = (node: TreeNode, isFirst: boolean, isLast: boolean) => {
    const hasKids = node.children.length > 0;
    const isNodeCollapsed = collapsed.has(node.id);
    return (
      <div key={node.id}>
        <div
          className={cn("flex items-center gap-2 px-5 py-3 hover:bg-white/[0.025] transition border-b border-white/[0.04]", !node.isActive && "opacity-50")}
          style={{ paddingLeft: `${20 + node.depth * 28}px` }}
        >
          <button
            onClick={() => hasKids && toggleCollapse(node.id)}
            className={cn("w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/60 transition flex-shrink-0", !hasKids && "invisible")}
          >
            {hasKids && (isNodeCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />)}
          </button>
          {node.depth > 0 && <span className="text-[10px] text-white/15 font-mono mr-1">{"".repeat(Math.min(node.depth, 3))}</span>}
          <div className={cn("w-1 h-7 rounded-full flex-shrink-0", node.isActive ? "bg-emerald-500" : "bg-white/10")} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm">{node.label}</span>
              <code className="text-[11px] text-orange-400/70 bg-orange-500/5 px-1.5 py-0.5 rounded border border-orange-500/10">{node.value}</code>
              {!node.isActive && <span className="text-[10px] bg-amber-500/10 text-amber-400/70 px-2 py-0.5 rounded-md border border-amber-500/20">Hidden</span>}
              {node.depth > 0 && <span className="text-[10px] bg-blue-500/10 text-blue-400/60 px-2 py-0.5 rounded-md border border-blue-500/20">child</span>}
            </div>
            {node.description && <p className="text-xs text-white/30 mt-0.5 truncate max-w-xs">{node.description}</p>}
          </div>
          <div className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border", node.productCount > 0 ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-white/[0.03] text-white/20 border-white/[0.06]")} title={`${node.productCount} product(s)`}>
            <Package size={11} /><span className="font-semibold">{node.productCount}</span>
          </div>
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <button onClick={() => moveCategoryInList(node, "up")} disabled={isFirst || reordering} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition" title="Move up"><ArrowUp size={12} /></button>
            <button onClick={() => moveCategoryInList(node, "down")} disabled={isLast || reordering} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition" title="Move down"><ArrowDown size={12} /></button>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => openAddChild(node)} title="Add child category" className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/20 transition"><FolderPlus size={13} /></button>
            <button onClick={() => handleToggleActive(node)} disabled={toggling === node.id} title={node.isActive ? "Hide" : "Show"} className={cn("p-1.5 rounded-lg border transition", node.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20")}>
              {toggling === node.id ? <Loader2 size={13} className="animate-spin" /> : node.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            </button>
            <button onClick={() => openDuplicate(node)} title="Duplicate" className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/20 transition"><Copy size={13} /></button>
            <button onClick={() => openEdit(node)} title="Edit" className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20 transition"><Pencil size={13} /></button>
            <button onClick={() => setDeleteTarget(node)} title={node.productCount > 0 ? `${node.productCount} products` : "Delete"} className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition"><Trash2 size={13} /></button>
          </div>
        </div>
        {hasKids && !isNodeCollapsed && <div>{node.children.map((child, i) => renderTreeNode(child, i === 0, i === node.children.length - 1))}</div>}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-oswald tracking-wide">Categories</h1>
          <p className="text-white/40 text-sm mt-1">{categories.length} total &bull; {activeCount} active &bull; {Object.keys(grouped).length} groups</p>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, value, or group" className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/40 transition" />
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
        <div className="text-center py-16 text-white/30">No categories match &quot;{search}&quot;</div>
      ) : (
        <div className="space-y-4">
          {sortedGroups.map((group, groupIdx) => {
            const tree = treesPerGroup[group] ?? [];
            const flat = flattenTree(tree);
            const isColl = collapsed.has(`group:${group}`);
            const groupAllActive = flat.every(c => c.isActive);
            return (
              <div key={group} className="bg-white/[0.03] rounded-2xl border border-white/[0.07] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.05]">
                  <button onClick={() => toggleCollapse(`group:${group}`)} className="text-white/30 hover:text-white/70 transition">
                    {isColl ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0"><Tag size={13} className="text-orange-400" /></div>
                  <h2 className="font-semibold text-white/80 text-sm tracking-wide flex-1">{group}</h2>
                  <span className="text-xs text-white/25 bg-white/5 px-2 py-0.5 rounded-lg">{flat.length} {flat.length === 1 ? "category" : "categories"}</span>
                  <div className="flex items-center gap-0.5 border-l border-white/[0.06] pl-2 ml-1">
                    <button onClick={() => moveGroupInList(group, "up")} disabled={groupIdx === 0 || reordering} className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition" title="Move group up"><ArrowUp size={12} /></button>
                    <button onClick={() => moveGroupInList(group, "down")} disabled={groupIdx === sortedGroups.length - 1 || reordering} className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition" title="Move group down"><ArrowDown size={12} /></button>
                  </div>
                  <div className="flex items-center gap-1 border-l border-white/[0.06] pl-3 ml-1">
                    <button onClick={() => openAddToGroup(group)} title={`Add to ${group}`} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 mr-1"><Plus size={12} /><span className="hidden sm:inline">Add</span></button>
                    <button onClick={() => handleToggleGroup(group, !groupAllActive)} title={groupAllActive ? "Hide all" : "Show all"} className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition font-medium", groupAllActive ? "bg-white/5 text-white/40 hover:bg-amber-500/10 hover:text-amber-400" : "bg-white/5 text-white/40 hover:bg-emerald-500/10 hover:text-emerald-400")}>
                      {groupAllActive ? <EyeOff size={12} /> : <Eye size={12} />}<span className="hidden sm:inline">{groupAllActive ? "Hide all" : "Show all"}</span>
                    </button>
                  </div>
                </div>
                {!isColl && <div>{tree.map((node, i) => renderTreeNode(node, i === 0, i === tree.length - 1))}</div>}
                {isColl && <div className="px-5 py-3 text-xs text-white/25">{flat.length} categories collapsed</div>}
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
                  {modal === "add" ? "Add New Category" : modal === "duplicate" ? `Duplicate \u2014 ${editTarget?.label}` : `Edit \u2014 ${editTarget?.label}`}
                </h2>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-white/8 text-white/50 transition"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {(modal === "add" || modal === "duplicate") && (
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Value (slug) *</label>
                  <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "") }))} className={fieldCls(errors.value)} placeholder="e.g. FULL_FACE" />
                  {errors.value && <p className="text-red-400 text-xs mt-1">{errors.value}</p>}
                  <p className="text-white/25 text-[11px] mt-1">Auto-formatted to UPPER_SNAKE_CASE.</p>
                </div>
              )}
              {modal === "edit" && (
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Value</label>
                  <div className="px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl text-sm text-orange-400/70 font-mono">{editTarget?.value}</div>
                  <p className="text-white/25 text-[11px] mt-1">Value cannot be changed.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Display Label *</label>
                <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className={fieldCls(errors.label)} placeholder="e.g. Full Face" />
                {errors.label && <p className="text-red-400 text-xs mt-1">{errors.label}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Group *</label>
                <input value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} className={fieldCls(errors.group)} placeholder="e.g. Helmets" list="group-suggestions" />
                <datalist id="group-suggestions">{[...new Set([...GROUP_SUGGESTIONS, ...allGroups])].map(g => <option key={g} value={g} />)}</datalist>
                {errors.group && <p className="text-red-400 text-xs mt-1">{errors.group}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Parent Category</label>
                <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))} className={cn(fieldCls(), "appearance-none")}>
                  <option value="">{"\u2014"} None (top-level) {"\u2014"}</option>
                  {parentOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{"\u2014".repeat(opt.depth)} {opt.label}</option>
                  ))}
                </select>
                <p className="text-white/25 text-[11px] mt-1">Nest under a parent to create sub-categories (unlimited depth).</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={fieldCls()} placeholder="Short description (optional)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Sort Order</label>
                  <input type="number" min="0" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} className={fieldCls()} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Status</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} className={cn("w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2", form.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/[0.04] border-white/[0.08] text-white/30")}>
                    {form.isActive ? <Eye size={14} /> : <EyeOff size={14} />} {form.isActive ? "Active" : "Hidden"}
                  </button>
                </div>
              </div>
              {modal === "duplicate" && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-400/80">Duplicate starts as <strong>Hidden</strong>.</div>
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
                <p className="text-sm text-white/40 mt-0.5">&quot;{deleteTarget.label}&quot; <code className="text-orange-400/70 text-xs">({deleteTarget.value})</code></p>
              </div>
            </div>
            {deleteTarget.productCount > 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-400/80"><strong>{deleteTarget.productCount} product(s)</strong> use this category. Reassign first.</p>
              </div>
            ) : (
              <p className="text-sm text-white/50">This action cannot be undone.</p>
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
