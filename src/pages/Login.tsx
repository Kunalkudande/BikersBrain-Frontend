import { useState, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const from = (location.state as { from?: string })?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back!" });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials";
      toast({ title: "Login failed", description: message, variant: "destructive" });
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
            Premium motorcycle gear for riders who demand the best. Helmets, jackets, gloves, and accessories — all under one roof.
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

          <h2 className="font-oswald text-2xl font-bold mb-1">Welcome Back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="font-barlow-condensed uppercase tracking-wider text-xs">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="rider@bikersbrain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-barlow-condensed uppercase tracking-wider text-xs">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  autoComplete="current-password"
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

            <Button type="submit" className="w-full font-barlow-condensed font-semibold tracking-wider uppercase gap-2" size="lg" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-semibold">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
