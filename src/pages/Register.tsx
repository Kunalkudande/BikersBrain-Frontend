import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { fullName, email, phone, password, confirmPassword } = form;

    if (!fullName || !email || !password) {
      toast({ title: "Required fields missing", description: "Name, email and password are required", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast({ title: "Weak password", description: "Must contain at least one uppercase letter", variant: "destructive" });
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast({ title: "Weak password", description: "Must contain at least one lowercase letter", variant: "destructive" });
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast({ title: "Weak password", description: "Must contain at least one number", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await register({ fullName, email, password, phone: phone || undefined });
      toast({ title: "Account created!", description: "Welcome to BikersBrain!" });
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast({ title: "Registration failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Link to="/">
            <h1 className="font-oswald text-5xl font-bold mb-4">
              BIKERS<span className="text-primary">BRAIN</span>
            </h1>
          </Link>
          <p className="text-muted-foreground text-lg font-barlow">
            Join the community of passionate riders. Get access to exclusive deals, wishlists, order tracking, and more.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-8">
            <Link to="/">
              <h1 className="font-oswald text-3xl font-bold">
                BIKERS<span className="text-primary">BRAIN</span>
              </h1>
            </Link>
          </div>

          <h2 className="font-oswald text-2xl font-bold mb-1">Create Account</h2>
          <p className="text-muted-foreground mb-8">Start your riding journey with us</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="font-barlow-condensed uppercase tracking-wider text-xs">
                Full Name *
              </Label>
              <Input
                id="fullName"
                placeholder="John Rider"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className="mt-1"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="font-barlow-condensed uppercase tracking-wider text-xs">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="rider@bikersbrain.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="mt-1"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="font-barlow-condensed uppercase tracking-wider text-xs">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210 (10 digits)"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="mt-1"
                autoComplete="tel"
              />
            </div>

            <div>
              <Label htmlFor="password" className="font-barlow-condensed uppercase tracking-wider text-xs">
                Password *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Min 8 chars, uppercase, number"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="font-barlow-condensed uppercase tracking-wider text-xs">
                Confirm Password *
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                className="mt-1"
                autoComplete="new-password"
                required
              />
            </div>

            <Button type="submit" className="w-full font-barlow-condensed font-semibold tracking-wider uppercase gap-2" size="lg" disabled={loading}>
              <UserPlus className="h-4 w-4" />
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
