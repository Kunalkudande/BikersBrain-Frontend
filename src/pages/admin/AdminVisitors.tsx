import { useState, useEffect } from "react";
import {
  Eye, Users, Monitor, Smartphone, Tablet,
  Clock, BarChart3, Chrome, Layout, Globe, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VisitorStats {
  overview: {
    totalVisitors: number;
    uniqueIPs: number;
  };
  today: {
    visitors: number;
    uniqueIPs: number;
  };
  topPages: { page: string; count: number }[];
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  recentVisitors: {
    ip: string;
    page: string;
    device: string;
    browser: string;
    os: string;
    referrer: string | null;
    createdAt: string;
  }[];
  dailyVisits: { date: string; visitors: number; uniqueIPs: number }[];
  period: string;
}

const deviceIcons: Record<string, React.ElementType> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/products": "All Products",
  "/cart": "Cart",
  "/checkout": "Checkout",
  "/login": "Login",
  "/register": "Register",
  "/about": "About",
  "/contact": "Contact",
  "/blog": "Blog",
  "/wishlist": "Wishlist",
};

function getPageLabel(page: string): string {
  if (PAGE_LABELS[page]) return PAGE_LABELS[page];
  if (page.startsWith("/products/")) return `Product: ${decodeURIComponent(page.split("/").pop() || "")}`;
  if (page.startsWith("/blog/")) return `Blog: ${decodeURIComponent(page.split("/").pop() || "")}`;
  return page;
}

export default function AdminVisitors() {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    adminApi.getVisitorStats(days)
      .then((res) => setStats(res.data as VisitorStats))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!stats) {
    return <p className="p-8 text-white/40">Failed to load visitor data.</p>;
  }

  const maxDaily = Math.max(...(stats.dailyVisits?.map((d) => d.visitors) || [1]), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-oswald text-2xl font-bold uppercase">
            Visitor <span className="text-primary">Analytics</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Who's visiting your store</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                days === d
                  ? "bg-primary text-black"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/10"
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Visits", value: stats.overview.totalVisitors, sub: `${stats.today.visitors} today`, icon: Eye, gradient: "from-blue-500 to-indigo-600" },
          { label: "Unique Visitors", value: stats.overview.uniqueIPs, sub: `${stats.today.uniqueIPs} today`, icon: Users, gradient: "from-emerald-500 to-teal-600" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative bg-card rounded-xl p-5 border border-border overflow-hidden"
          >
            <div className={cn("absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10 bg-gradient-to-br", card.gradient)} />
            <div className="relative">
              <div className={cn("inline-flex p-2 rounded-lg mb-3 bg-gradient-to-br", card.gradient)}>
                <card.icon size={16} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
              <p className="text-xs text-primary mt-1">{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Chart */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={18} className="text-primary" />
            <h2 className="font-semibold text-white">Daily Visitors</h2>
          </div>
          <div className="flex items-end gap-[3px] h-36">
            {stats.dailyVisits?.map((day, i) => (
              <div key={i} className="flex-1 group relative">
                <div
                  className="w-full bg-primary/70 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"
                  style={{ height: `${(day.visitors / maxDaily) * 100}%`, minHeight: "2px" }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                    <p className="font-medium text-white">
                      {new Date(day.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                    <p className="text-muted-foreground">{day.visitors} visits · {day.uniqueIPs} unique</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(stats.dailyVisits?.length ?? 0) > 0 && (
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>{new Date(stats.dailyVisits[0]?.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              <span>{new Date(stats.dailyVisits[stats.dailyVisits.length - 1]?.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </div>
          )}
        </div>

        {/* Top Pages */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-5">
            <Layout size={18} className="text-primary" />
            <h2 className="font-semibold text-white">Top Landing Pages</h2>
          </div>
          <div className="space-y-3">
            {stats.topPages.map((p, i) => {
              const maxCount = stats.topPages[0]?.count || 1;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/60 truncate max-w-[200px]" title={p.page}>
                      {getPageLabel(p.page)}
                    </span>
                    <span className="text-xs font-medium text-white">{p.count}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full"
                      style={{ width: `${(p.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {stats.topPages.length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </div>
        </div>

        {/* Devices */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-5">
            <Monitor size={18} className="text-primary" />
            <h2 className="font-semibold text-white">Devices</h2>
          </div>
          <div className="space-y-4">
            {stats.devices.map((d, i) => {
              const total = stats.devices.reduce((s, v) => s + v.count, 0) || 1;
              const pct = Math.round((d.count / total) * 100);
              const Icon = deviceIcons[d.device] || Globe;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white capitalize">{d.device}</span>
                      <span className="text-xs text-muted-foreground">{pct}% · {d.count}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Browsers */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-5">
            <Chrome size={18} className="text-primary" />
            <h2 className="font-semibold text-white">Browsers</h2>
          </div>
          <div className="space-y-4">
            {stats.browsers.map((b, i) => {
              const total = stats.browsers.reduce((s, v) => s + v.count, 0) || 1;
              const pct = Math.round((b.count / total) * 100);
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Globe size={18} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">{b.browser}</span>
                      <span className="text-xs text-muted-foreground">{pct}% · {b.count}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Visitors Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          <h2 className="font-semibold text-white">Recent Visitors</h2>
          <span className="text-xs text-muted-foreground ml-2">Last 50</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">IP</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Landing Page</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Device</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Browser</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">OS</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recentVisitors.map((v, i) => {
                const DeviceIcon = deviceIcons[v.device] || Globe;
                return (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {v.ip === "::1" || v.ip === "127.0.0.1" ? "localhost" : v.ip}
                    </td>
                    <td className="px-5 py-3 text-white max-w-[200px] truncate" title={v.page}>
                      {getPageLabel(v.page)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 text-muted-foreground capitalize">
                        <DeviceIcon size={14} /> {v.device}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{v.browser}</td>
                    <td className="px-5 py-3 text-muted-foreground">{v.os}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(v.createdAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
              {stats.recentVisitors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    No visitors yet. Data will appear as people visit your store.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
