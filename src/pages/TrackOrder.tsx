import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Clock,
  XCircle,
  RotateCcw,
  ShoppingBag,
  CreditCard,
  Box,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ordersApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface TrackingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
}

interface TrackedOrder {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  total: number;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: TrackingAddress | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  guestAddressLine1: string | null;
  guestAddressLine2: string | null;
  guestCity: string | null;
  guestState: string | null;
  guestPincode: string | null;
}

// ─── Status configuration ─────────────────────────────────────────────────────

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

const STATUS_META: Record<string, { label: string; color: string; badgeCls: string; icon: React.ElementType }> = {
  PENDING:    { label: "Pending",    color: "text-yellow-400",   badgeCls: "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",   icon: Clock },
  CONFIRMED:  { label: "Confirmed",  color: "text-blue-400",     badgeCls: "bg-blue-400/15 text-blue-400 border-blue-400/30",         icon: CheckCircle2 },
  PROCESSING: { label: "Processing", color: "text-purple-400",   badgeCls: "bg-purple-400/15 text-purple-400 border-purple-400/30",   icon: Box },
  SHIPPED:    { label: "Shipped",    color: "text-primary",      badgeCls: "bg-primary/15 text-primary border-primary/30",            icon: Truck },
  DELIVERED:  { label: "Delivered",  color: "text-green-400",    badgeCls: "bg-green-400/15 text-green-400 border-green-400/30",      icon: CheckCircle2 },
  CANCELLED:  { label: "Cancelled",  color: "text-red-400",      badgeCls: "bg-red-400/15 text-red-400 border-red-400/30",            icon: XCircle },
  RETURNED:   { label: "Returned",   color: "text-orange-400",   badgeCls: "bg-orange-400/15 text-orange-400 border-orange-400/30",   icon: RotateCcw },
};

const PAY_STATUS_META: Record<string, { label: string; badgeCls: string }> = {
  PENDING:  { label: "Pending",  badgeCls: "bg-yellow-400/15 text-yellow-400 border-yellow-400/30" },
  PAID:     { label: "Paid",     badgeCls: "bg-green-400/15 text-green-400 border-green-400/30" },
  FAILED:   { label: "Failed",   badgeCls: "bg-red-400/15 text-red-400 border-red-400/30" },
  REFUNDED: { label: "Refunded", badgeCls: "bg-blue-400/15 text-blue-400 border-blue-400/30" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function currentStepIndex(status: string) {
  const idx = STATUS_STEPS.indexOf(status as any);
  return idx === -1 ? 0 : idx;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get("order") ?? "");
  const [emailValue, setEmailValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function doSearch(num: string, email: string) {
    const trimmed = num.trim().toUpperCase();
    const trimmedEmail = email.trim();
    if (!trimmed) {
      toast.error("Please enter your order number");
      return;
    }
    if (!trimmedEmail) {
      toast.error("Please enter the email used at checkout");
      return;
    }
    setLoading(true);
    setNotFound(false);
    setOrder(null);
    try {
      const res = await ordersApi.track(trimmed, trimmedEmail);
      if (res.success && res.data) {
        setOrder(res.data as TrackedOrder);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(inputValue, emailValue);
  };

  const isCancelledOrReturned = order && (order.orderStatus === "CANCELLED" || order.orderStatus === "RETURNED");
  const activeStep = order ? currentStepIndex(order.orderStatus) : 0;

  // Resolve shipping address (auth address takes priority, fallback to guest fields)
  const shippingName     = order?.address?.fullName  ?? order?.guestName     ?? "—";
  const shippingLine1    = order?.address?.addressLine1 ?? order?.guestAddressLine1 ?? "—";
  const shippingLine2    = order?.address?.addressLine2 ?? order?.guestAddressLine2 ?? "";
  const shippingCity     = order?.address?.city      ?? order?.guestCity      ?? "";
  const shippingState    = order?.address?.state     ?? order?.guestState     ?? "";
  const shippingPincode  = order?.address?.pinCode   ?? order?.guestPincode   ?? "";
  const shippingPhone    = order?.address?.phone     ?? order?.guestPhone     ?? "";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* ── Page heading ── */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Package className="text-primary" size={28} />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Track Your Order</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter your order number and the email address used at checkout.
            </p>
          </div>

          {/* ── Search form ── */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              placeholder="Order number (e.g. HLM-20260227-ABCD)"
              className="font-mono text-sm"
              maxLength={40}
              autoFocus
            />
            <Input
              type="email"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              placeholder="Email address used at checkout"
              className="text-sm"
            />
            <Button type="submit" disabled={loading} className="w-full gap-2">
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search size={16} />
              )}
              {loading ? "Searching…" : "Track Order"}
            </Button>
          </form>

          {/* ── Not found ── */}
          {notFound && !loading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <XCircle className="mx-auto text-red-400 mb-3" size={36} />
              <p className="font-semibold text-red-400">Order not found</p>
              <p className="text-sm text-muted-foreground mt-1">
                No order matched that combination. Check your order number and the email used at checkout, then try again.
              </p>
            </div>
          )}

          {/* ── Results ── */}
          {order && (
            <div className="space-y-6">

              {/* ── Header card ── */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Order Number</p>
                    <p className="text-lg font-mono font-bold text-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Placed on {fmtDate(order.createdAt)} &bull; Last updated {fmtDateTime(order.updatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold border ${STATUS_META[order.orderStatus]?.badgeCls ?? ""}`}
                    >
                      {STATUS_META[order.orderStatus]?.label ?? order.orderStatus}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold border ${PAY_STATUS_META[order.paymentStatus]?.badgeCls ?? ""}`}
                    >
                      Payment: {PAY_STATUS_META[order.paymentStatus]?.label ?? order.paymentStatus}
                    </Badge>
                  </div>
                </div>

                {/* Tracking number */}
                {order.trackingNumber && (
                  <div className="mt-4 flex items-center gap-2 text-sm bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                    <Truck size={16} className="text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">Tracking No:</span>
                    <span className="font-mono font-semibold text-primary">{order.trackingNumber}</span>
                  </div>
                )}
              </div>

              {/* ── Status timeline ── */}
              {!isCancelledOrReturned && (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-foreground mb-6">Order Progress</h2>
                  <div className="flex items-start justify-between relative">
                    {/* Connecting line */}
                    <div className="absolute top-5 left-0 right-0 h-px bg-white/10 z-0" />
                    <div
                      className="absolute top-5 left-0 h-px bg-primary z-0 transition-all duration-700"
                      style={{ width: `${(activeStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                    />

                    {STATUS_STEPS.map((step, idx) => {
                      const done = idx < activeStep;
                      const active = idx === activeStep;
                      const StepIcon = STATUS_META[step].icon;
                      return (
                        <div key={step} className="flex flex-col items-center gap-2 z-10 flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                              ${done || active
                                ? "bg-primary border-primary text-white"
                                : "bg-background border-white/20 text-muted-foreground"
                              }`}
                          >
                            <StepIcon size={18} />
                          </div>
                          <p
                            className={`text-xs text-center font-medium leading-tight max-w-[60px]
                              ${done || active ? "text-foreground" : "text-muted-foreground/60"}`}
                          >
                            {STATUS_META[step].label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cancelled / Returned state */}
              {isCancelledOrReturned && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center gap-4">
                  {order.orderStatus === "CANCELLED"
                    ? <XCircle className="text-red-400 flex-shrink-0" size={28} />
                    : <RotateCcw className="text-orange-400 flex-shrink-0" size={28} />
                  }
                  <div>
                    <p className="font-semibold text-foreground">
                      Order {order.orderStatus === "CANCELLED" ? "Cancelled" : "Returned"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.orderStatus === "CANCELLED"
                        ? "This order has been cancelled. If payment was made, a refund will be processed within 5–7 business days."
                        : "This order has been returned. Refund will be processed within 5–7 business days."}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Order items ── */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-primary" />
                  Items ({order.items.length})
                </h2>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm line-clamp-2">{item.productName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Size: {item.size} &bull; Color: {item.color} &bull; Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-foreground text-sm">{fmt(item.subtotal)}</p>
                        <p className="text-xs text-muted-foreground">{fmt(item.price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Shipping address & Price breakdown – side by side on md+ ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Shipping address */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    Shipping Address
                  </h2>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">{shippingName}</p>
                    <p>{shippingLine1}</p>
                    {shippingLine2 && <p>{shippingLine2}</p>}
                    <p>{[shippingCity, shippingState, shippingPincode].filter(Boolean).join(", ")}</p>
                    {shippingPhone && (
                      <p className="mt-2 text-xs">📞 {shippingPhone}</p>
                    )}
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CreditCard size={16} className="text-primary" />
                    Payment Summary
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{fmt(order.subtotal)}</span>
                    </div>
                    {Number(order.discount) > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount</span>
                        <span>−{fmt(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span>{Number(order.shippingCharge) === 0 ? "Free" : fmt(order.shippingCharge)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax</span>
                      <span>Included</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-foreground text-base">
                      <span>Total</span>
                      <span>{fmt(order.total)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Paid via&nbsp;
                      <span className="font-medium text-foreground">
                        {order.paymentMethod === "COD" ? "Cash on Delivery" : "Razorpay"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Guest email hint ── */}
              {order.guestEmail && (
                <p className="text-xs text-muted-foreground text-center">
                  Order confirmation was sent to <span className="text-primary">{order.guestEmail}</span>
                </p>
              )}

            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
