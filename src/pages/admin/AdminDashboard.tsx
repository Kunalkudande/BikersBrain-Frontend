import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Package,
  ArrowUpRight,
  TrendingUp,
  Clock,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

/* ── Helpers ── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  CONFIRMED: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  PROCESSING: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
  SHIPPED: { bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400" },
  DELIVERED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  CANCELLED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || { bg: "bg-white/5", text: "text-white/50", dot: "bg-white/50" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {status}
    </span>
  );
}

/* ── Stat Card ── */
function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  change,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  change?: string;
}) {
  return (
    <div className="relative bg-white/[0.03] rounded-2xl p-5 border border-white/[0.07] overflow-hidden hover:border-white/[0.12] transition-all group">
      <div className={cn("absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-[0.08] bg-gradient-to-br", gradient)} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg", gradient)}>
            <Icon size={20} className="text-white" />
          </div>
          {change && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
              <ArrowUpRight size={11} />
              {change}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-white font-oswald">{value}</p>
        <p className="text-sm text-white/40 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function SkeletonCard() {
  return <div className="bg-white/[0.03] rounded-2xl p-5 h-32 animate-pulse border border-white/[0.07]" />;
}

/* ════════════════════════════════════════
   PAGE
   ════════════════════════════════════════ */
export default function AdminDashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminApi.getDashboard(),
    staleTime: 1000 * 60,
  });

  const stats = (data as any)?.data;

  const statCards = [
    {
      label: "Total Revenue",
      value: fmt(stats?.totalRevenue || 0),
      icon: IndianRupee,
      gradient: "from-emerald-500 to-teal-600",
      change: undefined,
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      gradient: "from-blue-500 to-indigo-600",
      change: undefined,
    },
    {
      label: "Customers",
      value: stats?.totalCustomers ?? 0,
      icon: Users,
      gradient: "from-violet-500 to-purple-600",
      change: undefined,
    },
    {
      label: "Products",
      value: stats?.totalProducts ?? 0,
      icon: Package,
      gradient: "from-orange-500 to-red-500",
      change: undefined,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-oswald">Dashboard</h1>
          <p className="text-white/40 mt-1 text-sm">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white/70 transition"
        >
          <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white/[0.03] rounded-2xl border border-white/[0.07] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-orange-500" />
                Recent Orders
              </h2>
              <p className="text-xs text-white/30 mt-0.5">Latest customer activity</p>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-400 transition"
            >
              View all <ExternalLink size={13} />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !stats?.recentOrders?.length ? (
            <div className="p-12 text-center">
              <ShoppingBag size={36} className="mx-auto text-white/20 mb-3" />
              <p className="text-white/30 text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {stats.recentOrders.slice(0, 6).map((order: any) => (
                <div key={order.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition group">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(order.user?.fullName || "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-orange-400 transition">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {fmtDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-white">
                      {fmt(Number(order.total))}
                    </p>
                    <p className="text-xs text-white/30 truncate max-w-[120px]">{order.user?.fullName}</p>
                  </div>
                  <StatusBadge status={order.orderStatus || order.status || "PENDING"} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.07] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                Low Stock
              </h2>
              <p className="text-xs text-white/30 mt-0.5">Products needing restock</p>
            </div>
            <Link
              to="/admin/products"
              className="text-sm font-medium text-orange-500 hover:text-orange-400 transition"
            >
              Manage
            </Link>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-white/[0.03] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !stats?.lowStockProducts?.length ? (
            <div className="p-10 text-center">
              <Package size={32} className="mx-auto text-white/20 mb-2" />
              <p className="text-white/30 text-sm">All stocked up!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {stats.lowStockProducts.map((p: any) => {
                const imgUrl = p.images?.[0]?.imageUrl;
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition">
                    <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                      {imgUrl ? (
                        <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <Package size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-white/30">{p.sku}</p>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-lg",
                        p.stock === 0
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                      )}
                    >
                      {p.stock === 0 ? "Out" : `${p.stock} left`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
