import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { contactApi } from "@/lib/api";
import { Package, Loader2, CheckCircle2 } from "lucide-react";

interface BulkOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productSlug: string;
}

export default function BulkOrderModal({
  open,
  onOpenChange,
  productName,
  productSlug,
}: BulkOrderModalProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    quantity: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter a valid 10-digit phone number";
    if (!form.quantity.trim() || isNaN(Number(form.quantity)) || Number(form.quantity) < 1)
      e.quantity = "Enter quantity (minimum 1)";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSending(true);
    try {
      await contactApi.submitBulkInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        businessName: form.businessName.trim(),
        quantity: Number(form.quantity),
        message: form.message.trim(),
        productName,
        productSlug,
        productUrl: `${window.location.origin}/products/${productSlug}`,
      });

      setSent(true);
      toast({ title: "Inquiry sent!", description: "We'll get back to you within 24 hours." });
    } catch (err: any) {
      toast({
        title: "Failed to send",
        description: err?.message || "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset form on close
      setTimeout(() => {
        setSent(false);
        setForm({ name: "", email: "", phone: "", businessName: "", quantity: "", message: "" });
        setErrors({});
      }, 200);
    }
    onOpenChange(open);
  };

  const inputCls = (err?: string) =>
    `h-10 ${err ? "border-red-500 focus-visible:ring-red-500" : ""}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        {sent ? (
          /* ── Success View ── */
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Inquiry Submitted!</h3>
            <p className="text-muted-foreground mb-1">
              We've received your bulk order inquiry for <strong>{productName}</strong>.
            </p>
            <p className="text-muted-foreground text-sm">
              Our team will contact you within 24 hours on your phone &amp; email.
            </p>
            <Button onClick={() => handleClose(false)} className="mt-6">
              Close
            </Button>
          </div>
        ) : (
          /* ── Form View ── */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                Bulk / Wholesale Inquiry
              </DialogTitle>
              <DialogDescription>
                Interested in buying <strong>{productName}</strong> in bulk? Fill in your details
                and we'll get back to you with the best wholesale pricing.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="bulk-name">Full Name *</Label>
                <Input
                  id="bulk-name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls(errors.name)}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Email + Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-email">Email *</Label>
                  <Input
                    id="bulk-email"
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputCls(errors.email)}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-phone">Phone *</Label>
                  <Input
                    id="bulk-phone"
                    type="tel"
                    placeholder="98XXXXXXXX"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                    className={inputCls(errors.phone)}
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>

              {/* Business Name + Quantity row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-business">Business / Shop Name</Label>
                  <Input
                    id="bulk-business"
                    placeholder="Optional"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-qty">Quantity Required *</Label>
                  <Input
                    id="bulk-qty"
                    type="number"
                    min={1}
                    placeholder="e.g. 50"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className={inputCls(errors.quantity)}
                  />
                  {errors.quantity && <p className="text-xs text-red-500">{errors.quantity}</p>}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="bulk-msg">Additional Details</Label>
                <Textarea
                  id="bulk-msg"
                  placeholder="Any specific requirements — sizes, colors, delivery timeline, etc."
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full font-semibold" size="lg" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Submit Bulk Inquiry"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                We'll respond via email or phone within 24 hours.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
