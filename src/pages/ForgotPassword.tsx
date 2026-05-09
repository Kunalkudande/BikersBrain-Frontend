import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Mail, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const queryToken = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(queryToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (queryToken) {
      setStep("verify");
      setOtp(queryToken);
    }
  }, [queryToken]);

  const sendOtp = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      await authApi.forgotPassword(email);
      setStep("verify");
      toast({
        title: "OTP sent",
        description: "Check your email for the reset code.",
      });
    } catch (error) {
      toast({
        title: "Unable to send OTP",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const resetPassword = async (e: FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length < 6) {
      toast({ title: "Enter the OTP", variant: "destructive" });
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast({ title: "Fill both password fields", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setResetting(true);
    try {
      await authApi.resetPassword(otp, newPassword);
      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Please check the OTP and try again.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/25 via-background to-background items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,107,53,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.07),_transparent_28%)]" />
        <div className="relative max-w-md text-center">
          <Link to="/">
            <h1 className="font-oswald text-5xl font-bold mb-5 tracking-wide">
              BIKERS<span className="text-primary">BRAIN</span>
            </h1>
          </Link>
          <p className="text-muted-foreground text-lg font-barlow leading-8">
            Secure password recovery with a one-time email code. Fast, simple, and built for riders on the move.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
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

          <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-oswald text-2xl font-bold leading-none">Reset Password</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {step === "request"
                    ? "Send a one-time code to your email"
                    : "Enter the code and create a new password"}
                </p>
              </div>
            </div>

            {step === "request" ? (
              <form onSubmit={sendOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-barlow-condensed uppercase tracking-wider text-xs">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="rider@bikersbrain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full font-barlow-condensed uppercase tracking-wider gap-2" disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {sending ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={resetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-barlow-condensed uppercase tracking-wider text-xs">One-Time Password</Label>
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-xs text-muted-foreground">
                    Check your inbox. The code expires in 10 minutes.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="font-barlow-condensed uppercase tracking-wider text-xs">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter a new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-barlow-condensed uppercase tracking-wider text-xs">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat the new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full font-barlow-condensed uppercase tracking-wider gap-2" disabled={resetting}>
                  {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {resetting ? "Updating password..." : "Reset Password"}
                </Button>
              </form>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 text-sm">
              {step === "verify" ? (
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Use a different email
                </button>
              ) : (
                <span className="text-muted-foreground">Remembered it?</span>
              )}
              <Link to="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Back to login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
