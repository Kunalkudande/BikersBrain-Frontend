import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Wallet, MapPin, Plus, Tag, ArrowLeft, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { ordersApi, userApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { openRazorpayCheckout } from "@/lib/razorpay";

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

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, refreshCart, clearCart, isGuest } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Auth user address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "",
  });

  // Guest contact + address
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [guestAddress, setGuestAddress] = useState({
    addressLine1: "", addressLine2: "", city: "", state: "", pincode: "",
  });

  // Shared
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Constants ─────────────────────────────────────────────────────────
  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
  ];

  // ── Validation regexes ────────────────────────────────────────────────
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[6-9]\d{9}$/;
  const PINCODE_RE = /^\d{6}$/;
  const NAME_RE = /^[a-zA-Z\s]+$/;

  // Validate a single field on blur and update errors
  const validateField = (key: string, value: string) => {
    let msg = "";
    switch (key) {
      case "contactName":
        if (value.trim().length < 2) msg = "Name must be at least 2 characters";
        else if (!NAME_RE.test(value.trim())) msg = "Name can only contain letters";
        break;
      case "contactEmail":
        if (!EMAIL_RE.test(value.trim())) msg = "Enter a valid email address";
        break;
      case "contactPhone":
        if (!PHONE_RE.test(value.trim())) msg = "Enter a valid 10-digit mobile number (starts 6–9)";
        break;
      case "addressLine1":
        if (value.trim().length < 5) msg = "Enter a complete address (min 5 characters)";
        break;
      case "city":
        if (value.trim().length < 2) msg = "City is required";
        break;
      case "state":
        if (!value) msg = "Please select a state";
        break;
      case "pincode":
        if (!PINCODE_RE.test(value.trim())) msg = "Enter a valid 6-digit PIN code";
        break;
    }
    setErrors((p) => ({ ...p, [key]: msg }));
  };

  const validateGuestForm = (): boolean => {
    const errs: Record<string, string> = {};
    const name = contact.name.trim();
    if (name.length < 2) errs.contactName = "Name must be at least 2 characters";
    else if (!NAME_RE.test(name)) errs.contactName = "Name can only contain letters";

    if (!EMAIL_RE.test(contact.email.trim())) errs.contactEmail = "Enter a valid email address";

    if (!PHONE_RE.test(contact.phone.trim()))
      errs.contactPhone = "Enter a valid 10-digit Indian mobile number (starts with 6–9)";

    if (guestAddress.addressLine1.trim().length < 5)
      errs.addressLine1 = "Enter a complete address (min 5 characters)";
    if (guestAddress.city.trim().length < 2) errs.city = "City is required";
    if (!guestAddress.state) errs.state = "Please select a state";
    if (!PINCODE_RE.test(guestAddress.pincode.trim())) errs.pincode = "Enter a valid 6-digit PIN code";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(() => {
    if (!cart || cart.items.length === 0) { navigate("/cart"); return; }
    if (isAuthenticated) {
      userApi.getAddresses().then((res) => {
        if (res.success && res.data) {
          setAddresses(res.data as Address[]);
          const def = (res.data as Address[]).find((a) => a.isDefault);
          if (def) setSelectedAddress(def.id);
        }
      }).catch(() => {});
    }
  }, [cart, isAuthenticated, navigate]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum: number, item: any) =>
    sum + Number(item.product.discountPrice || item.product.price) * item.quantity, 0);
  const shipping = subtotal >= 2999 ? 0 : 99;
  const couponDiscount = couponApplied?.discount || 0;
  const total = subtotal + shipping - couponDiscount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await ordersApi.applyCoupon(couponCode.trim(), subtotal);
      if (res.success) {
        setCouponApplied({ code: couponCode.trim().toUpperCase(), discount: (res.data as { discount: number }).discount });
        toast({ title: "Coupon applied!" });
      }
    } catch {
      toast({ title: "Invalid coupon", variant: "destructive" });
    }
  };

  const handleAddAddress = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await userApi.addAddress(newAddress);
      if (res.success && res.data) {
        const created = res.data as Address;
        setAddresses((prev) => [...prev, created]);
        setSelectedAddress(created.id);
        setShowAddressForm(false);
        setNewAddress({ fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "" });
        toast({ title: "Address added!" });
      }
    } catch {
      toast({ title: "Failed to add address", variant: "destructive" });
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    try {
      if (isGuest) {
        if (!validateGuestForm()) {
          toast({ title: "Please fix the highlighted errors before continuing", variant: "destructive" });
          setIsPlacing(false); return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderItems = items.map((item: any) => ({
          productId: item.product.id,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
        }));
        const res = await ordersApi.createGuest({
          contact,
          address: guestAddress,
          items: orderItems,
          paymentMethod,
          couponCode: couponApplied?.code || undefined,
        });
        if (res.success && res.data) {
          const { order, razorpayOrder } = res.data as {
            order: { id: string; orderNumber: string; total: number };
            razorpayOrder: { id: string; amount: number; currency: string } | null;
          };
          if (paymentMethod === "RAZORPAY" && razorpayOrder) {
            openRazorpayCheckout({
              orderId: razorpayOrder.id,
              amount: razorpayOrder.amount,
              prefill: { name: contact.name, email: contact.email, contact: contact.phone },
              onSuccess: async (response) => {
                try {
                  await ordersApi.verifyGuestPayment({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                  });
                  clearCart();
                  navigate(
                    `/order-success?orderNumber=${order.orderNumber}&total=${order.total}&email=${encodeURIComponent(contact.email)}`,
                    { replace: true }
                  );
                } catch {
                  toast({ title: "Payment verification failed. Contact support.", variant: "destructive" });
                } finally { setIsPlacing(false); }
              },
              onFailure: (error) => {
                const reason =
                  (error as { description?: string })?.description ||
                  (error as { reason?: string })?.reason ||
                  (error as { message?: string })?.message ||
                  "Payment failed";
                if (!reason.toLowerCase().includes("cancel")) {
                  toast({ title: `Payment failed: ${reason}`, variant: "destructive" });
                }
                setIsPlacing(false);
              },
            });
            return;
          } else {
            clearCart();
            navigate(
              `/order-success?orderNumber=${order.orderNumber}&total=${order.total}&email=${encodeURIComponent(contact.email)}`,
              { replace: true }
            );
          }
        }
      } else {
        if (!selectedAddress) {
          toast({ title: "Select a delivery address", variant: "destructive" });
          setIsPlacing(false); return;
        }
        const res = await ordersApi.create({
          addressId: selectedAddress,
          paymentMethod,
          couponCode: couponApplied?.code || undefined,
        });
        if (res.success && res.data) {
          const { order, razorpayOrder } = res.data as {
            order: { id: string; orderNumber: string; total: number };
            razorpayOrder: { id: string; amount: number; currency: string } | null;
          };
          if (paymentMethod === "RAZORPAY" && razorpayOrder) {
            openRazorpayCheckout({
              orderId: razorpayOrder.id,
              amount: razorpayOrder.amount,
              prefill: { name: user?.fullName || "", email: user?.email || "", contact: user?.phone || "" },
              onSuccess: async (response) => {
                try {
                  await ordersApi.verifyPayment({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                  });
                  await refreshCart();
                  navigate(
                    `/order-success?orderNumber=${order.orderNumber}&total=${order.total}&email=${encodeURIComponent(user?.email || "")}`,
                    { replace: true }
                  );
                } catch {
                  toast({ title: "Payment verification failed. Contact support.", variant: "destructive" });
                } finally { setIsPlacing(false); }
              },
              onFailure: (error) => {
                const reason =
                  (error as { description?: string })?.description ||
                  (error as { reason?: string })?.reason ||
                  (error as { message?: string })?.message ||
                  "Payment failed";
                if (!reason.toLowerCase().includes("cancel")) {
                  toast({ title: `Payment failed: ${reason}`, variant: "destructive" });
                }
                setIsPlacing(false);
              },
            });
            return;
          } else {
            await refreshCart();
            navigate(
              `/order-success?orderNumber=${order.orderNumber}&total=${order.total}&email=${encodeURIComponent(user?.email || "")}`,
              { replace: true }
            );
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to place order";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-oswald text-2xl md:text-3xl font-bold uppercase mb-8">
          Check<span className="text-primary">out</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* Payment Method — always shown first */}
            <section>
              <h2 className="font-oswald text-lg font-bold uppercase flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary" /> Payment Method
              </h2>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as "RAZORPAY" | "COD")}
                className="space-y-3"
              >
                <label
                  className={`flex items-center gap-3 bg-card rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === "RAZORPAY" ? "border-primary" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="RAZORPAY" />
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Pay Online</p>
                    <p className="text-xs text-muted-foreground">UPI, QR Code, Cards, Net Banking, Wallets</p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-3 bg-card rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === "COD" ? "border-primary" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="COD" />
                  <Wallet className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay when you receive</p>
                  </div>
                </label>
              </RadioGroup>
            </section>

            {/* GUEST: Contact Details */}
            {isGuest && (
              <section>
                <h2 className="font-oswald text-lg font-bold uppercase flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" /> Contact Details
                </h2>
                <div className="bg-card rounded-lg border border-border p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Full Name *</Label>
                      <Input
                        value={contact.name}
                        onChange={(e) => {
                          // Only allow letters and spaces
                          const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                          setContact((p) => ({ ...p, name: val }));
                          if (errors.contactName) setErrors((p) => ({ ...p, contactName: "" }));
                        }}
                        onBlur={() => validateField("contactName", contact.name)}
                        placeholder="Your full name"
                        maxLength={100}
                        className={errors.contactName ? "border-destructive" : ""}
                      />
                      {errors.contactName && <p className="text-xs text-destructive mt-1">{errors.contactName}</p>}
                    </div>
                    <div>
                      <Label className="text-xs">Phone *</Label>
                      <Input
                        value={contact.phone}
                        onChange={(e) => {
                          setContact((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }));
                          if (errors.contactPhone) setErrors((p) => ({ ...p, contactPhone: "" }));
                        }}
                        onBlur={() => validateField("contactPhone", contact.phone)}
                        placeholder="10-digit mobile"
                        maxLength={10}
                        inputMode="numeric"
                        className={errors.contactPhone ? "border-destructive" : ""}
                      />
                      {errors.contactPhone && <p className="text-xs text-destructive mt-1">{errors.contactPhone}</p>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Email *</Label>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => {
                        setContact((p) => ({ ...p, email: e.target.value }));
                        if (errors.contactEmail) setErrors((p) => ({ ...p, contactEmail: "" }));
                      }}
                      onBlur={() => validateField("contactEmail", contact.email)}
                      placeholder="Order confirmation will be sent here"
                      maxLength={150}
                      className={errors.contactEmail ? "border-destructive" : ""}
                    />
                    {errors.contactEmail && <p className="text-xs text-destructive mt-1">{errors.contactEmail}</p>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      className="text-primary underline"
                      onClick={() => navigate("/login", { state: { from: "/checkout" } })}
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </section>
            )}

            {/* GUEST: Delivery Address */}
            {isGuest && (
              <section>
                <h2 className="font-oswald text-lg font-bold uppercase flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" /> Delivery Address
                </h2>
                <div className="bg-card rounded-lg border border-border p-4 space-y-3">
                  <div>
                    <Label className="text-xs">Address Line 1 *</Label>
                    <Input
                      value={guestAddress.addressLine1}
                      onChange={(e) => {
                        setGuestAddress((p) => ({ ...p, addressLine1: e.target.value }));
                        if (errors.addressLine1) setErrors((p) => ({ ...p, addressLine1: "" }));
                      }}
                      onBlur={() => validateField("addressLine1", guestAddress.addressLine1)}
                      placeholder="House / Flat / Building"
                      maxLength={200}
                      className={errors.addressLine1 ? "border-destructive" : ""}
                    />
                    {errors.addressLine1 && <p className="text-xs text-destructive mt-1">{errors.addressLine1}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Address Line 2</Label>
                    <Input
                      value={guestAddress.addressLine2}
                      onChange={(e) => setGuestAddress((p) => ({ ...p, addressLine2: e.target.value }))}
                      placeholder="Street / Area (optional)"
                      maxLength={200}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">City *</Label>
                      <Input
                        value={guestAddress.city}
                        onChange={(e) => {
                          setGuestAddress((p) => ({ ...p, city: e.target.value.replace(/[^a-zA-Z\s]/g, "") }));
                          if (errors.city) setErrors((p) => ({ ...p, city: "" }));
                        }}
                        onBlur={() => validateField("city", guestAddress.city)}
                        placeholder="City"
                        maxLength={100}
                        className={errors.city ? "border-destructive" : ""}
                      />
                      {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <Label className="text-xs">State *</Label>
                      <Select
                        value={guestAddress.state}
                        onValueChange={(val) => {
                          setGuestAddress((p) => ({ ...p, state: val }));
                          setErrors((p) => ({ ...p, state: "" }));
                        }}
                      >
                        <SelectTrigger className={errors.state ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.state && <p className="text-xs text-destructive mt-1">{errors.state}</p>}
                    </div>
                    <div>
                      <Label className="text-xs">Pincode *</Label>
                      <Input
                        value={guestAddress.pincode}
                        onChange={(e) => {
                          setGuestAddress((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }));
                          if (errors.pincode) setErrors((p) => ({ ...p, pincode: "" }));
                        }}
                        onBlur={() => validateField("pincode", guestAddress.pincode)}
                        placeholder="6 digits"
                        maxLength={6}
                        inputMode="numeric"
                        className={errors.pincode ? "border-destructive" : ""}
                      />
                      {errors.pincode && <p className="text-xs text-destructive mt-1">{errors.pincode}</p>}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* AUTH: Delivery Address */}
            {!isGuest && (
              <section>
                <h2 className="font-oswald text-lg font-bold uppercase flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" /> Delivery Address
                </h2>
                {addresses.length > 0 && (
                      <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress} className="space-y-3">
                        {addresses.map((a) => (
                          <label
                            key={a.id}
                            className={`flex items-start gap-3 bg-card rounded-lg border p-4 cursor-pointer transition-colors ${
                              selectedAddress === a.id ? "border-primary" : "border-border"
                            }`}
                          >
                            <RadioGroupItem value={a.id} className="mt-1" />
                            <div className="text-sm">
                              <p className="font-semibold">
                                {a.fullName} <span className="text-muted-foreground font-normal">({a.phone})</span>
                              </p>
                              <p className="text-muted-foreground">
                                {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}
                              </p>
                              <p className="text-muted-foreground">
                                {a.city}, {a.state} — {a.pincode}
                              </p>
                              {a.isDefault && (
                                <Badge variant="secondary" className="mt-1 text-[10px]">Default</Badge>
                              )}
                            </div>
                          </label>
                        ))}
                      </RadioGroup>
                    )}
                    {!showAddressForm ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-1"
                        onClick={() => setShowAddressForm(true)}
                      >
                        <Plus className="h-4 w-4" /> Add New Address
                      </Button>
                    ) : (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        onSubmit={handleAddAddress}
                        className="mt-4 bg-card rounded-lg border border-border p-4 space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Full Name *</Label>
                            <Input
                              value={newAddress.fullName}
                              onChange={(e) => setNewAddress((p) => ({ ...p, fullName: e.target.value.replace(/[^a-zA-Z\s]/g, "") }))}
                              placeholder="Full name"
                              maxLength={100}
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Phone *</Label>
                            <Input
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                              placeholder="10-digit mobile"
                              maxLength={10}
                              inputMode="numeric"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Address Line 1 *</Label>
                          <Input
                            value={newAddress.addressLine1}
                            onChange={(e) => setNewAddress((p) => ({ ...p, addressLine1: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Address Line 2</Label>
                          <Input
                            value={newAddress.addressLine2}
                            onChange={(e) => setNewAddress((p) => ({ ...p, addressLine2: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">City *</Label>
                            <Input
                              value={newAddress.city}
                              onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value.replace(/[^a-zA-Z\s]/g, "") }))}
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs">State *</Label>
                            <Select
                              value={newAddress.state}
                              onValueChange={(val) => setNewAddress((p) => ({ ...p, state: val }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent>
                                {INDIAN_STATES.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Pincode *</Label>
                            <Input
                              value={newAddress.pincode}
                              onChange={(e) => setNewAddress((p) => ({ ...p, pincode: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm">Save Address</Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAddressForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.form>
                    )}
              </section>
            )}
          </div>

          {/* Order Summary sidebar */}
          <div>
            <div className="bg-card rounded-lg border border-border p-6 sticky top-4 space-y-4">
              <h3 className="font-oswald text-lg font-bold uppercase">Order Summary</h3>
              <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground truncate mr-2">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span>
                      ₹{((item.product.discountPrice || item.product.price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
              {/* Coupon */}
              <div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="h-9 text-sm"
                    disabled={!!couponApplied}
                  />
                  {couponApplied ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setCouponApplied(null); setCouponCode(""); }}
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleApplyCoupon} className="gap-1">
                      <Tag className="h-3 w-3" /> Apply
                    </Button>
                  )}
                </div>
                {couponApplied && (
                  <p className="text-xs text-green-500 mt-1">
                    &quot;{couponApplied.code}&quot; — ₹{couponApplied.discount} off
                  </p>
                )}
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={shipping === 0 ? "text-green-500" : ""}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST</span>
                  <span className="text-green-500">Included</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Coupon discount</span>
                    <span>-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toLocaleString()}</span>
                </div>
              </div>
              <Button
                className="w-full font-barlow-condensed font-semibold uppercase tracking-wider gap-2"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={isPlacing}
              >
                {isPlacing ? (
                  "Processing..."
                ) : paymentMethod === "RAZORPAY" ? (
                  <><CreditCard className="h-4 w-4" /> Continue to Pay ₹{total.toLocaleString()}</>
                ) : (
                  <><Wallet className="h-4 w-4" /> Place Order (COD)</>
                )}
              </Button>
              <p className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
                <ShieldCheck className="h-3 w-3" /> Secure checkout
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
