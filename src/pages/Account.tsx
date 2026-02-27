import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User, Package, MapPin, Heart, Shield, LogOut, Edit2, Save, X,
  Trash2, ShoppingBag, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { userApi, ordersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderStatus?: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  items: { id?: string; productName: string; quantity: number; subtotal?: number; total?: number }[];
}

type ActiveView = "overview" | "orders" | "profile" | "addresses" | "security";

const statusColorMap: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400",
  CONFIRMED: "bg-blue-500/10 text-blue-400",
  PROCESSING: "bg-blue-500/10 text-blue-400",
  SHIPPED: "bg-purple-500/10 text-purple-400",
  DELIVERED: "bg-green-500/10 text-green-400",
  CANCELLED: "bg-red-500/10 text-red-400",
  RETURNED: "bg-orange-500/10 text-orange-400",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(n: number) {
  return `\u20b9${Number(n).toLocaleString("en-IN")}`;
}

// --- Orders View ---

function OrdersView({ orders, loading }: { orders: Order[]; loading: boolean }) {
  if (loading)
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white/[0.03] border border-white/10 animate-pulse" />
        ))}
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="text-center py-16 bg-white/[0.03] rounded-2xl border border-white/10">
        <Package size={48} className="mx-auto text-zinc-600 mb-4" />
        <h2 className="text-lg font-semibold text-white">No orders yet</h2>
        <p className="text-zinc-500 mt-1">You haven`t placed any orders yet</p>
        <Link to="/products" className="inline-block mt-4 text-orange-400 font-medium hover:underline">
          Start Shopping
        </Link>
      </div>
    );

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const st = order.orderStatus || order.status;
        const statusColor = statusColorMap[st] || "bg-white/5 text-zinc-400";
        return (
          <div
            key={order.id}
            className="block bg-white/[0.03] rounded-xl border border-white/10 hover:border-orange-500/20 transition overflow-hidden"
          >
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <span className="text-sm font-semibold text-white">#{order.orderNumber}</span>
                  <span className="text-xs text-zinc-500 ml-2">{formatDate(order.createdAt)}</span>
                </div>
                <span className={cn("text-xs px-3 py-1 rounded-full font-medium", statusColor)}>
                  {st?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-2">
                {order.items?.slice(0, 3).map((item, idx) => (
                  <div key={item.id ?? idx} className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 bg-white/5 rounded flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-zinc-300">{item.productName || "Product"}</p>
                      <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                    </div>
                    {(item.subtotal || item.total) != null && (
                      <span className="font-medium text-white">{formatPrice(item.subtotal ?? item.total ?? 0)}</span>
                    )}
                  </div>
                ))}
                {order.items?.length > 3 && (
                  <p className="text-xs text-zinc-500">+{order.items.length - 3} more items</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <div>
                  <span className="text-xs text-zinc-500">Payment: </span>
                  <span className="text-xs font-medium text-zinc-300">{order.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500">Total: </span>
                  <span className="font-bold text-white">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Profile View ---

function ProfileView({
  user, editing, profileForm, setProfileForm, setEditing, onSave,
}: {
  user: any;
  editing: boolean;
  profileForm: { fullName: string; phone: string };
  setProfileForm: (v: any) => void;
  setEditing: (v: boolean) => void;
  onSave: () => void;
}) {
  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Personal Information</h2>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300 transition">
            <Edit2 size={14} /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={onSave} className="flex items-center gap-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition">
              <Save size={14} /> Save
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="space-y-5">
        <div>
          <Label className="text-xs text-zinc-500">Full Name</Label>
          {editing ? (
            <Input value={profileForm.fullName} onChange={(e) => setProfileForm((p: any) => ({ ...p, fullName: e.target.value }))} className="mt-1 bg-white/5 border-white/10 text-white" />
          ) : (
            <p className="font-semibold text-white mt-0.5">{user.fullName}</p>
          )}
        </div>
        <div>
          <Label className="text-xs text-zinc-500">Email</Label>
          <p className="font-semibold text-white mt-0.5">{user.email}</p>
        </div>
        <div>
          <Label className="text-xs text-zinc-500">Phone</Label>
          {editing ? (
            <Input value={profileForm.phone} onChange={(e) => setProfileForm((p: any) => ({ ...p, phone: e.target.value }))} className="mt-1 bg-white/5 border-white/10 text-white" />
          ) : (
            <p className="font-semibold text-white mt-0.5">{user.phone || "N/A"}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Addresses View ---

function AddressesView({ addresses, onDelete }: { addresses: Address[]; onDelete: (id: string) => void }) {
  if (addresses.length === 0)
    return (
      <div className="text-center py-16 bg-white/[0.03] rounded-2xl border border-white/10">
        <MapPin size={40} className="mx-auto text-zinc-600 mb-3" />
        <p className="text-zinc-500">No saved addresses</p>
      </div>
    );
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {addresses.map((a) => (
        <div key={a.id} className="bg-white/[0.03] rounded-xl border border-white/10 p-4 relative">
          {a.isDefault && (
            <span className="absolute top-2 right-2 text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">Default</span>
          )}
          <p className="font-semibold text-sm text-white">{a.fullName}</p>
          <p className="text-sm text-zinc-400">{a.phone}</p>
          <p className="text-sm text-zinc-400 mt-1">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}</p>
          <p className="text-sm text-zinc-400">{a.city}, {a.state} — {a.pincode}</p>
          <button onClick={() => onDelete(a.id)} className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm mt-3 transition">
            <Trash2 size={13} /> Remove
          </button>
        </div>
      ))}
    </div>
  );
}

// --- Security View ---

function SecurityView() {
  const { toast } = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword.length < 8) { toast({ title: "Password must be at least 8 characters", variant: "destructive" }); return; }
    if (form.newPassword !== form.confirmPassword) { toast({ title: "Passwords don`t match", variant: "destructive" }); return; }
    setLoading(true);
    try {
      await userApi.changePassword(form.currentPassword, form.newPassword);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Password changed!" });
    } catch {
      toast({ title: "Failed to change password", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 max-w-lg">
      <h2 className="text-lg font-semibold text-white mb-5">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) => (
          <div key={field}>
            <Label className="text-xs text-zinc-500">{field === "currentPassword" ? "Current Password" : field === "newPassword" ? "New Password" : "Confirm New Password"}</Label>
            <Input type="password" value={form[field]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} required className="mt-1 bg-white/5 border-white/10 text-white" />
          </div>
        ))}
        <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}

// --- Main Account Page ---

export default function Account() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const { itemCount: cartItems } = useCart();
  const { toast } = useToast();

  const tabParam = searchParams.get("tab") as ActiveView | null;
  const [activeView, setActiveView] = useState<ActiveView>(tabParam || "overview");

  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "" });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login", { state: { from: "/account" } }); return; }
    if (user) setProfileForm({ fullName: user.fullName || "", phone: user.phone || "" });
  }, [isAuthenticated, navigate, user]);

  const loadAddresses = () =>
    userApi.getAddresses().then((res) => { if (res.success) setAddresses(res.data as Address[]); }).catch(() => {});

  const loadOrders = () => {
    setLoadingOrders(true);
    ordersApi.getAll()
      .then((res) => { if (res.success) { const d = res.data as any; setOrders(d.orders || d.items || []); } })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  };

  useEffect(() => {
    if (isAuthenticated) { loadAddresses(); loadOrders(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (tabParam && tabParam !== activeView) setActiveView(tabParam);
  }, [tabParam]);

  const handleSaveProfile = async () => {
    try { await userApi.updateProfile(profileForm); await refreshUser(); setEditing(false); toast({ title: "Profile updated!" }); }
    catch { toast({ title: "Failed to update profile", variant: "destructive" }); }
  };

  const handleDeleteAddress = async (id: string) => {
    try { await userApi.deleteAddress(id); setAddresses((p) => p.filter((a) => a.id !== id)); toast({ title: "Address removed" }); }
    catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const handleLogout = async () => { await logout(); navigate("/"); };

  if (!user) return null;

  const recentOrders = orders.slice(0, 3);

  const menuItems = [
    { view: "orders" as ActiveView, label: "My Orders", icon: Package, desc: "View and track your orders" },
    { view: "profile" as ActiveView, label: "Profile", icon: User, desc: "Manage your personal info" },
    { view: "addresses" as ActiveView, label: "Addresses", icon: MapPin, desc: "Your saved delivery addresses" },
    { view: "security" as ActiveView, label: "Security", icon: Shield, desc: "Change your password" },
  ];

  const stats = [
    { label: "Orders", value: orders.length, icon: Package, color: "bg-blue-500/10 text-blue-400" },
    { label: "Cart Items", value: cartItems, icon: ShoppingBag, color: "bg-orange-500/10 text-orange-400" },
    { label: "Addresses", value: addresses.length, icon: MapPin, color: "bg-green-500/10 text-green-400" },
    { label: "Wishlist", value: 0, icon: Heart, color: "bg-red-500/10 text-red-400" },
  ];

  return (
    <div className="min-h-screen bg-[hsl(0,0%,5%)]">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header card */}
        <div className="bg-white/[0.03] rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 text-2xl font-bold select-none">
                {user.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Hi, {user.fullName}</h1>
                <p className="text-sm text-zinc-500">{user.email}</p>
              </div>
            </div>
            {activeView !== "overview" && (
              <button onClick={() => setActiveView("overview")} className="text-sm text-zinc-500 hover:text-orange-400 transition">
                Back to Overview
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] rounded-xl p-4 border border-white/10">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Content */}
        {activeView === "overview" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu */}
            <div className="space-y-3">
              {menuItems.map((item) => (
                <button key={item.view} onClick={() => setActiveView(item.view)}
                  className="w-full flex items-center gap-4 bg-white/[0.03] rounded-xl p-4 border border-white/10 hover:border-orange-500/30 transition group text-left">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:bg-orange-500/20 transition">
                    <item.icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-xs text-zinc-500">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:text-orange-500 transition" />
                </button>
              ))}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-4 bg-white/[0.03] rounded-xl p-4 border border-white/10 hover:border-red-500/30 transition text-left">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                  <LogOut size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-red-400">Logout</p>
                  <p className="text-xs text-zinc-500">Sign out of your account</p>
                </div>
              </button>
            </div>

            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-white">Recent Orders</h2>
                  <button onClick={() => setActiveView("orders")} className="text-sm text-orange-400 hover:underline">View All</button>
                </div>
                {loadingOrders ? (
                  <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-white/[0.02] animate-pulse" />)}</div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package size={40} className="mx-auto text-zinc-600 mb-3" />
                    <p className="text-zinc-500">No orders yet</p>
                    <Link to="/products" className="text-orange-400 text-sm hover:underline">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => {
                      const st = order.orderStatus || order.status;
                      const sc = statusColorMap[st] || "bg-white/5 text-zinc-400";
                      return (
                        <div key={order.id} className="flex items-center gap-4 p-3 rounded-lg border border-white/5 hover:border-orange-500/20 hover:bg-orange-500/5 transition">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">#{order.orderNumber}</p>
                            <p className="text-xs text-zinc-500">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">{formatPrice(order.total)}</p>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full", sc)}>{st?.replace(/_/g, " ")}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <motion.div key={activeView} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            {activeView === "orders" && <OrdersView orders={orders} loading={loadingOrders} />}
            {activeView === "profile" && (
              <ProfileView user={user} editing={editing} profileForm={profileForm} setProfileForm={setProfileForm} setEditing={setEditing} onSave={handleSaveProfile} />
            )}
            {activeView === "addresses" && <AddressesView addresses={addresses} onDelete={handleDeleteAddress} />}
            {activeView === "security" && <SecurityView />}
          </motion.div>
        )}

      </main>
      <Footer />
    </div>
  );
}
