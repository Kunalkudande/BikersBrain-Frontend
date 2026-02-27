import { useState } from "react";
import { Outlet, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import logo from "@/assets/bikersbrain_logo.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home,
  Ticket,
  FileText,
  Eye,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",  href: "/admin",            icon: LayoutDashboard, exact: true },
  { label: "Products",   href: "/admin/products",   icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Orders",     href: "/admin/orders",     icon: ShoppingBag },
  { label: "Customers",  href: "/admin/customers",  icon: Users },
  { label: "Coupons",    href: "/admin/coupons",    icon: Ticket },
  { label: "Blog",       href: "/admin/blog",        icon: FileText },
  { label: "Visitors",   href: "/admin/visitors",   icon: Eye },
];

export default function AdminLayout() {
  const { user, isLoading, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d0d]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 h-screen flex-shrink-0 flex flex-col",
          "bg-gradient-to-b from-[#111] via-[#111] to-[#0d0d0d] border-r border-white/[0.06]",
          "transform transition-transform duration-300 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <Link to="/admin" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <img src={logo} alt="BikersBrain" className="h-10 w-auto object-contain" />
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-semibold">Admin</p>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-white/50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em]">
            Main Menu
          </p>
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-orange-500/15 text-white border border-orange-500/20"
                    : "text-white/40 hover:bg-white/5 hover:text-white/80"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200",
                    active
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40"
                      : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/60"
                  )}
                >
                  <item.icon size={15} />
                </div>
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={14} className="text-orange-500/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/[0.06] space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white/80 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Home size={15} />
            </div>
            <span>Back to Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <LogOut size={15} />
            </div>
            <span>Sign Out</span>
          </button>

          {/* User badge */}
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(user.fullName || "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/70 truncate">{user.fullName}</p>
              <p className="text-[10px] text-white/30 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#111] border-b border-white/[0.06]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <Menu size={18} />
          </button>
          <img src={logo} alt="BikersBrain" className="h-9 w-auto object-contain" />
        </div>

        <main className="flex-1 overflow-y-auto text-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
