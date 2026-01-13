import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Store,
  Phone,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Loader2,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");
const otpSchema = z.string().length(6, "Please enter 6-digit OTP");

type AuthStep = "phone" | "otp" | "name";

export default function Auth() {
  const navigate = useNavigate();
  const { user, profile, signIn } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>("phone");
  const [isNewUser, setIsNewUser] = useState(false);

  // Form states
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      if (!profile.onboarding_completed) navigate("/onboarding");
      else navigate("/dashboard");
    }
  }, [user, profile, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const cleanPhone = (p: string) => p.replace(/\D/g, "").slice(-10);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cleanPhone(phone);

    try {
      phoneSchema.parse(cleaned);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      // First check if user exists
      const { data: checkData, error: checkError } = await supabase.functions.invoke("admin-otp", {
        body: { action: "check", phone: cleaned },
      });

      if (checkError) throw checkError;

      setIsNewUser(!checkData.exists);

      // Then send OTP
      const { data, error } = await supabase.functions.invoke("admin-otp", {
        body: { action: "send", phone: cleaned },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        setIsLoading(false);
        return;
      }

      setStep("otp");
      setCountdown(30);
      toast.success("OTP sent to your phone!");
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast.error(error.message || "Failed to send OTP");
    }

    setIsLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      otpSchema.parse(otp);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      const cleaned = cleanPhone(phone);
      const { data, error } = await supabase.functions.invoke("admin-otp", {
        body: {
          action: "verify",
          phone: cleaned,
          otp,
          name: null, // Don't send name yet for new users
        },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        setIsLoading(false);
        return;
      }

      if (data.action === "need_name") {
        // New user - need to collect name
        setStep("name");
        setIsLoading(false);
        return;
      }

      // Existing user - sign in directly
      if (data.email && data.password) {
        const { error: signInError } = await signIn(data.email, data.password);
        if (signInError) {
          console.error("Sign in after OTP error:", signInError);
          toast.error("Verification successful but login failed. Please try again.");
          setIsLoading(false);
          return;
        }

        toast.success("Welcome back!");
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast.error(error.message || "Failed to verify OTP");
    }

    setIsLoading(false);
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      nameSchema.parse(name);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      const cleaned = cleanPhone(phone);
      const { data, error } = await supabase.functions.invoke("admin-otp", {
        body: {
          action: "verify",
          phone: cleaned,
          otp,
          name: name.trim(),
        },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        setIsLoading(false);
        return;
      }

      // Sign in with the created credentials
      if (data.email && data.password) {
        const { error: signInError } = await signIn(data.email, data.password);
        if (signInError) {
          console.error("Sign in after signup error:", signInError);
          toast.error("Account created but login failed. Please try again.");
          setIsLoading(false);
          return;
        }

        toast.success("Account created! Setting up your store...");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    }

    setIsLoading(false);
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    const cleaned = cleanPhone(phone);

    try {
      const { data, error } = await supabase.functions.invoke("admin-otp", {
        body: { action: "send", phone: cleaned },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        setIsLoading(false);
        return;
      }

      setCountdown(30);
      toast.success("OTP resent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend OTP");
    }

    setIsLoading(false);
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("phone");
      setOtp("");
    } else if (step === "name") {
      setStep("otp");
      setName("");
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "phone": return "Welcome";
      case "otp": return "Verify OTP";
      case "name": return "Almost there!";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "phone": return "Enter your phone number to continue";
      case "otp": return `Enter the 6-digit code sent to +91 ${phone}`;
      case "name": return "Enter your name to complete signup";
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case "phone": return <Phone className="w-8 h-8 text-primary" />;
      case "otp": return <KeyRound className="w-8 h-8 text-primary" />;
      case "name": return <User className="w-8 h-8 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,hsl(var(--primary)/0.18),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,hsl(var(--accent)/0.16),transparent_50%)]" />
        <div className="absolute -top-28 -right-28 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px]" />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* Left: Brand / Trust panel */}
            <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-background/45 backdrop-blur-xl shadow-xl p-8 lg:p-10 hidden lg:block">
              <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,hsl(var(--primary)/0.12),transparent_50%)]" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl gradient-primary shadow-glow flex items-center justify-center ring-1 ring-white/10">
                    <Store className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="leading-none">
                    <div className="text-2xl font-display font-bold tracking-tight">Storekriti</div>
                    <div className="text-xs text-muted-foreground mt-1">Launch • Manage • Scale</div>
                  </div>
                </div>

                <h2 className="mt-10 text-3xl font-display font-bold tracking-tight leading-tight">
                  Create a beautiful store,
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    start selling today
                  </span>
                </h2>

                <p className="mt-4 text-muted-foreground max-w-md">
                  Multi-tenant platform with integrated payments, analytics, and secure store isolation.
                  Everything you need—without code.
                </p>

                {/* Value bullets */}
                <div className="mt-8 grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Instant setup</div>
                      <div className="text-sm text-muted-foreground">Go live in minutes with guided onboarding.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium">Secure by design</div>
                      <div className="text-sm text-muted-foreground">Phone OTP verification + tenant isolation.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-medium">Payments ready</div>
                      <div className="text-sm text-muted-foreground">Razorpay integration for fast checkouts.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <div className="font-medium">Analytics dashboard</div>
                      <div className="text-sm text-muted-foreground">Track revenue, orders, products & customers.</div>
                    </div>
                  </div>
                </div>

                {/* Social proof */}
                <div className="mt-10 rounded-2xl border bg-background/50 p-5">
                  <div className="text-xs text-muted-foreground">Trusted experience</div>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border bg-background/60 p-3">
                      <div className="font-display font-bold tracking-tight">7 Days</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Free trial</div>
                    </div>
                    <div className="rounded-xl border bg-background/60 p-3">
                      <div className="font-display font-bold tracking-tight">No Card</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Required</div>
                    </div>
                    <div className="rounded-xl border bg-background/60 p-3">
                      <div className="font-display font-bold tracking-tight">OTP</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Secured</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Auth Card */}
            <div className="relative">
              {/* Mobile brand header */}
              <div className="lg:hidden text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary shadow-glow ring-1 ring-white/10 mb-3">
                  <Store className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="text-2xl font-display font-bold tracking-tight">Storekriti</div>
                <div className="text-sm text-muted-foreground mt-1">Launch your store in minutes</div>
              </div>

              <Card className="border-border/50 bg-background/70 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
                {/* top accent */}
                <div className="h-1.5 gradient-primary" />

                <CardHeader className="pb-4">
                  {step !== "phone" && (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 -ml-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Go back
                    </button>
                  )}
                  
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      {getStepIcon()}
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl font-display tracking-tight text-center">
                    {getStepTitle()}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {getStepDescription()}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  {step === "phone" && (
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            +91
                          </div>
                          <Phone className="absolute left-12 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            className="pl-[4.5rem] h-11 rounded-xl bg-background/60"
                            required
                            maxLength={10}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          We'll send a 6-digit OTP to verify your number
                        </p>
                      </div>

                      <Button type="submit" className="w-full shadow-glow h-11 rounded-xl" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>

                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border/60" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-background/70 px-2 text-xs text-muted-foreground">
                            OTP secured • 7-day free trial
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        By continuing, you agree to our{" "}
                        <Link to="#" className="text-foreground underline underline-offset-4 hover:opacity-80">
                          Terms
                        </Link>{" "}
                        &{" "}
                        <Link to="#" className="text-foreground underline underline-offset-4 hover:opacity-80">
                          Privacy Policy
                        </Link>
                        .
                      </p>
                    </form>
                  )}

                  {step === "otp" && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <InputOTP
                            value={otp}
                            onChange={setOtp}
                            maxLength={6}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} className="w-12 h-14 text-lg" />
                              <InputOTPSlot index={1} className="w-12 h-14 text-lg" />
                              <InputOTPSlot index={2} className="w-12 h-14 text-lg" />
                              <InputOTPSlot index={3} className="w-12 h-14 text-lg" />
                              <InputOTPSlot index={4} className="w-12 h-14 text-lg" />
                              <InputOTPSlot index={5} className="w-12 h-14 text-lg" />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={countdown > 0 || isLoading}
                            className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full shadow-glow h-11 rounded-xl"
                        disabled={isLoading || otp.length !== 6}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify & Continue <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}

                  {step === "name" && (
                    <form onSubmit={handleNameSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-background/60"
                            required
                            autoFocus
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This will be used for your store account
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full shadow-glow h-11 rounded-xl"
                        disabled={isLoading || !name.trim()}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            Complete Signup <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
