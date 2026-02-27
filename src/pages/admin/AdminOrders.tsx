import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  RefreshCw, Search, Package, ChevronLeft, ChevronRight,
  X, Clock, MapPin, Mail, Phone, Loader2, Filter,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  { value: "CONFIRMED", label: "Confirmed", bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  { value: "PROCESSING", label: "Processing", bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
  { value: "SHIPPED", label: "Shipped", bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400" },
  { value: "DELIVERED", label: "Delivered", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  { value: "CANCELLED", label: "Cancelled", bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
];

const getStyle = (status: string) =>
  STATUS_OPTIONS.find((s) => s.value === status) ||
  { bg: "bg-white/5", text: "text-white/50", dot: "bg-white/30", label: status };

function StatusBadge({ status }: { status: string }) {
  const s = getStyle(status);
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export default function AdminOrders() {
  const { toast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");

  const fetch = useCallback(async (pg = page, sf = statusFilter, sq = search) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { page: pg, limit: 15 };
      if (sf) params.status = sf;
      if (sq) params.search = sq;
      const res = await adminApi.getOrders(params);
      const d = (res as any).data;
      setOrders(d.items || d.orders || []);
      setPagination({ total: d.total, totalPages: d.totalPages, hasNext: d.hasNext, hasPrev: d.hasPrev });
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Single effect — fires on mount (initial load) and whenever page/statusFilter changes
  useEffect(() => { fetch(page, statusFilter, search); }, [page, statusFilter]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await adminApi.updateOrderStatus(orderId, newStatus, trackingInput || undefined);
      toast({ title: "Status updated", description: `Order → ${newStatus}` });
      if (selected?.id === orderId) setSelected({ ...selected, orderStatus: newStatus });
      fetch(page, statusFilter, search);
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  let searchTimer: ReturnType<typeof setTimeout>;
  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { setPage(1); fetch(1, statusFilter, val); }, 450);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-oswald font-bold text-white">Orders</h1>
          <p className="text-white/40 text-sm mt-0.5">{pagination?.total ?? 0} total orders</p>
        </div>
        <button
          onClick={() => fetch(page, statusFilter, search)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white/60 transition"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            placeholder="Order #, customer..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/40 transition"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-white/25 flex-shrink-0" />
          <button
            onClick={() => { setStatusFilter(""); setPage(1); }}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition",
              !statusFilter ? "bg-orange-500 text-white" : "bg-white/[0.03] border border-white/[0.07] text-white/40 hover:bg-white/5")}
          >
            All
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setPage(1); }}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                statusFilter === s.value
                  ? cn(s.bg, s.text, "ring-1 ring-white/10")
                  : "bg-white/[0.03] border border-white/[0.07] text-white/40 hover:bg-white/5")}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.07] overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center text-white/30">
            <RefreshCw size={26} className="animate-spin mb-3" />
            <p className="text-sm">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <Package size={32} className="mx-auto text-white/15 mb-3" />
            <p className="text-sm text-white/30">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.07]">
                  {["Order", "Customer", "Items", "Total", "Status", "Payment", "Update"].map((h, i) => (
                    <th key={h} className={cn(
                      "py-3.5 text-[11px] font-semibold text-white/25 uppercase tracking-wider",
                      i === 0 ? "pl-5 pr-4 text-left" : i === 6 ? "pr-5 pl-4 text-right" : "px-4 text-left"
                    )}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {orders.map((order) => {
                  const status = order.orderStatus || order.status || "PENDING";
                  const s = getStyle(status);
                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition group">
                      <td className="pl-5 pr-4 py-3.5">
                        <button onClick={() => { setSelected(order); setTrackingInput(order.trackingNumber || ""); }}
                          className="text-left group">
                          <p className="text-sm font-semibold text-white group-hover:text-orange-400 transition">
                            #{order.orderNumber}
                          </p>
                          <p className="text-[11px] text-white/25 flex items-center gap-1 mt-0.5">
                            <Clock size={9} /> {fmtDate(order.createdAt)}
                          </p>
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(order.user?.fullName || order.guestName || "G").charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate max-w-[120px]">
                              {order.user?.fullName || order.guestName || "Guest"}
                            </p>
                            <p className="text-[10px] text-white/25 truncate max-w-[120px]">
                              {order.user?.email || order.guestEmail || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-xs font-semibold text-white/50">
                          {order.items?.length ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-white">{fmt(Number(order.total))}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-semibold",
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : order.paymentStatus === "FAILED"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        )}>
                          {order.paymentStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="pr-5 pl-4 py-3.5 text-right">
                        <select
                          defaultValue={status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="bg-[#1e1e1e] border border-white/[0.07] text-white/70 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-orange-500/40 transition cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
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
          <p className="text-sm text-white/30">Page {page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button disabled={!pagination.hasPrev} onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.07] text-white/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ChevronLeft size={16} />
            </button>
            <button disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.07] text-white/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
              <div>
                <h2 className="font-oswald font-bold text-lg text-white">
                  Order #{selected.orderNumber}
                </h2>
                <p className="text-xs text-white/30 mt-0.5">{fmtDate(selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Customer */}
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">
                  Customer {!selected.user && <span className="normal-case text-amber-400/60 ml-1">(Guest)</span>}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                    {(selected.user?.fullName || selected.guestName || "G").charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {selected.user?.fullName || selected.guestName || "Guest"}
                    </p>
                    <p className="text-xs text-white/30 flex items-center gap-1">
                      <Mail size={10} /> {selected.user?.email || selected.guestEmail || "—"}
                    </p>
                    {(selected.user?.phone || selected.guestPhone) && (
                      <p className="text-xs text-white/30 flex items-center gap-1">
                        <Phone size={10} /> {selected.user?.phone || selected.guestPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              {(selected.address || selected.guestAddressLine1) && (
                <div>
                  <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">
                    Shipping Address
                  </p>
                  <div className="flex items-start gap-2 bg-white/[0.03] rounded-xl p-3">
                    <MapPin size={14} className="text-white/30 flex-shrink-0 mt-0.5" />
                    {selected.address ? (
                      <p className="text-xs text-white/50">
                        {selected.address.fullName}, {selected.address.addressLine1}
                        {selected.address.addressLine2 && `, ${selected.address.addressLine2}`},{" "}
                        {selected.address.city}, {selected.address.state} — {selected.address.pinCode}
                      </p>
                    ) : (
                      <p className="text-xs text-white/50">
                        {selected.guestName}, {selected.guestAddressLine1}
                        {selected.guestAddressLine2 && `, ${selected.guestAddressLine2}`},{" "}
                        {selected.guestCity}, {selected.guestState} — {selected.guestPincode}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">
                  Items ({selected.items?.length ?? 0})
                </p>
                <div className="space-y-2">
                  {selected.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                      <div>
                        <p className="text-sm text-white font-medium">{item.productName || "Product"}</p>
                        <p className="text-[11px] text-white/30">
                          {item.variant ? `${item.variant.size} / ${item.variant.color} · ` : ""}
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-white">{fmt(Number(item.price) * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-white/[0.03] rounded-xl p-4 space-y-1.5">
                {[
                  { label: "Subtotal", val: Number(selected.subtotal) },
                  { label: "Shipping", val: Number(selected.shippingCharge) },
                  { label: "Tax", val: Number(selected.tax) },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-white/40">{label}</span>
                    <span className="text-white/60">{fmt(val)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/[0.07] mt-2">
                  <span className="text-white">Total</span>
                  <span className="text-orange-400">{fmt(Number(selected.total))}</span>
                </div>
              </div>

              {/* Status update */}
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-3">Update Status</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      disabled={updating}
                      onClick={() => updateStatus(selected.id, s.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition",
                        (selected.orderStatus || selected.status) === s.value
                          ? cn(s.bg, s.text, "border-current/30 ring-1 ring-white/10")
                          : "bg-white/[0.02] border-white/[0.07] text-white/40 hover:bg-white/5",
                        updating && "opacity-50 cursor-wait"
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full", s.dot)} />
                      {s.label}
                      {updating && (selected.orderStatus || selected.status) !== s.value && null}
                    </button>
                  ))}
                </div>
                {/* Tracking number (for SHIPPED) */}
                <div className="flex gap-2">
                  <input
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Tracking number (for Shipped)"
                    className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
