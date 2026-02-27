import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Calendar, Percent, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  code: "",
  description: "",
  discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
  discountValue: "",
  minPurchase: "",
  maxDiscount: "",
  usageLimit: "",
  validFrom: "",
  validUntil: "",
};

const inputCls =
  "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500 focus:ring-orange-500/20";

export default function AdminCoupons() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchCoupons = async () => {
    try {
      const res = await adminApi.getCoupons();
      setCoupons((res.data as Coupon[]) || []);
    } catch {
      toast({ title: "Failed to load coupons", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.description || !form.discountValue || !form.minPurchase || !form.usageLimit || !form.validFrom || !form.validUntil) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await adminApi.createCoupon({
        code: form.code.toUpperCase(),
        description: form.description,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minPurchase: Number(form.minPurchase),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: Number(form.usageLimit),
        validFrom: form.validFrom,
        validUntil: form.validUntil,
      });
      toast({ title: "Coupon created!" });
      setForm(emptyForm);
      setShowForm(false);
      fetchCoupons();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create coupon";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await adminApi.toggleCoupon(id);
      fetchCoupons();
    } catch {
      toast({ title: "Failed to toggle coupon", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await adminApi.deleteCoupon(id);
      toast({ title: "Coupon deleted" });
      fetchCoupons();
    } catch {
      toast({ title: "Failed to delete coupon", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Coupons</h1>
          <p className="text-sm text-white/40 mt-1">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "New Coupon"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Tag size={18} className="text-orange-500" /> Create Coupon
          </h2>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER20"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Description *</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Summer sale 20% off"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Discount Type *</Label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value as "PERCENTAGE" | "FIXED" })}
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="PERCENTAGE" className="bg-[#1a1a1a]">Percentage (%)</option>
                  <option value="FIXED" className="bg-[#1a1a1a]">Fixed Amount (₹)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">
                  Value * {form.discountType === "PERCENTAGE" ? "(%)" : "(₹)"}
                </Label>
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  placeholder={form.discountType === "PERCENTAGE" ? "20" : "500"}
                  min="0"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Min Purchase (₹) *</Label>
                <Input
                  type="number"
                  value={form.minPurchase}
                  onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                  placeholder="1000"
                  min="0"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Max Discount Cap (₹)</Label>
                <Input
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                  placeholder="Optional"
                  min="0"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Usage Limit *</Label>
                <Input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="100"
                  min="1"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Valid From *</Label>
                <Input
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Valid Until *</Label>
                <Input
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={creating} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Create Coupon
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        {coupons.length === 0 ? (
          <div className="text-center py-16">
            <Tag size={48} className="mx-auto text-white/20 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No coupons yet</h3>
            <p className="text-sm text-white/40 mb-6">Create your first coupon to offer discounts</p>
            <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Plus size={16} /> Create Coupon
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Discount</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">Min Purchase</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Usage</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Valid Period</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {coupons.map((coupon) => {
                  const isExpired = new Date(coupon.validUntil) < new Date();
                  const isUsedUp = coupon.usedCount >= coupon.usageLimit;
                  return (
                    <tr key={coupon.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 font-mono font-bold text-sm">
                          {coupon.code}
                        </span>
                        <p className="text-xs text-white/40 mt-1">{coupon.description}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-white font-semibold">
                          {coupon.discountType === "PERCENTAGE" ? (
                            <><Percent size={14} className="text-green-400" /><span>{Number(coupon.discountValue)}%</span></>
                          ) : (
                            <span>₹{Number(coupon.discountValue).toLocaleString("en-IN")}</span>
                          )}
                        </div>
                        {coupon.maxDiscount && (
                          <p className="text-xs text-white/40 mt-0.5">Max: ₹{Number(coupon.maxDiscount).toLocaleString("en-IN")}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-sm text-white/60">₹{Number(coupon.minPurchase).toLocaleString("en-IN")}</span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-sm text-white/60">{coupon.usedCount} / {coupon.usageLimit}</span>
                        <div className="w-16 h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="text-xs text-white/40 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{new Date(coupon.validFrom).toLocaleDateString("en-IN")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>→</span>
                            <span>{new Date(coupon.validUntil).toLocaleDateString("en-IN")}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {isExpired ? (
                          <Badge className="bg-red-500/10 text-red-400 border-0">Expired</Badge>
                        ) : isUsedUp ? (
                          <Badge className="bg-yellow-500/10 text-yellow-400 border-0">Used Up</Badge>
                        ) : coupon.isActive ? (
                          <Badge className="bg-green-500/10 text-green-400 border-0">Active</Badge>
                        ) : (
                          <Badge className="bg-white/5 text-white/40 border-0">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggle(coupon.id)}
                            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition"
                            title={coupon.isActive ? "Deactivate" : "Activate"}
                          >
                            {coupon.isActive
                              ? <ToggleRight size={18} className="text-green-400" />
                              : <ToggleLeft size={18} />
                            }
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
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
    </div>
  );
}
