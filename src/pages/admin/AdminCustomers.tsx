import { useState, useEffect, useRef } from "react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Search, RefreshCw, Users, ChevronLeft, ChevronRight,
  ShoppingBag, CheckCircle, XCircle, Mail, Phone, Calendar,
} from "lucide-react";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const firstRender = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const fetchCustomers = async (pg = page, q = search) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { page: pg, limit: 20 };
      if (q) params.search = q;
      const res = await adminApi.getCustomers(params);
      const d = (res as any).data;
      setCustomers(d.items || d.customers || []);
      setPagination({ total: d.total, totalPages: d.totalPages, hasNext: d.hasNext, hasPrev: d.hasPrev });
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(1, ""); }, []);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); fetchCustomers(1, search); }, 400);
    return () => clearTimeout(timer.current);
  }, [search]);

  useEffect(() => {
    if (!firstRender.current) fetchCustomers(page, search);
  }, [page]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-oswald font-bold text-white">Customers</h1>
          <p className="text-white/40 text-sm mt-0.5">{pagination?.total ?? 0} registered customers</p>
        </div>
        <button
          onClick={() => fetchCustomers(page, search)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white/60 transition"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/40 transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.07] overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center text-white/30">
            <RefreshCw size={26} className="animate-spin mb-3" />
            <p className="text-sm">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center">
            <Users size={32} className="mx-auto text-white/15 mb-3" />
            <p className="text-sm text-white/30">
              {search ? "No customers match your search" : "No customers yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.07]">
                  {["Customer", "Contact", "Orders", "Total Spent", "Verified", "Joined"].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "py-3.5 text-[11px] font-semibold text-white/25 uppercase tracking-wider",
                        i === 0 ? "pl-5 pr-4 text-left" : "px-4 text-left"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition group">
                    {/* Name + avatar */}
                    <td className="pl-5 pr-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg shadow-violet-500/20">
                          {(c.fullName || c.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate max-w-[160px] group-hover:text-orange-400 transition">
                            {c.fullName || "—"}
                          </p>
                          <p className="text-[11px] text-white/30 truncate max-w-[160px]">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <p className="text-xs text-white/40 flex items-center gap-1.5">
                          <Mail size={10} className="text-white/25" />
                          <span className="truncate max-w-[150px]">{c.email}</span>
                        </p>
                        {c.phone && (
                          <p className="text-xs text-white/40 flex items-center gap-1.5">
                            <Phone size={10} className="text-white/25" />
                            {c.phone}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Order count */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag size={13} className="text-white/25" />
                        <span className="text-sm font-semibold text-white">{c._count?.orders ?? c.orderCount ?? 0}</span>
                      </div>
                    </td>

                    {/* Total spent */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-white">
                        {fmt(Number(c.totalSpent ?? 0))}
                      </span>
                    </td>

                    {/* Verified */}
                    <td className="px-4 py-3.5">
                      {c.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">
                          <CheckCircle size={11} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-semibold">
                          <XCircle size={11} /> Pending
                        </span>
                      )}
                    </td>

                    {/* Joined date */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-white/35 flex items-center gap-1">
                        <Calendar size={10} />
                        {fmtDate(c.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/30">
            Page {page} of {pagination.totalPages} · {pagination.total} customers
          </p>
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
    </div>
  );
}
