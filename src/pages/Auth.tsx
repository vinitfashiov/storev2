import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, User } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AuthCarousel } from "@/components/auth/AuthCarousel";

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");
const otpSchema = z.string().length(6, "Please enter 6-digit OTP");

type AuthStep = "phone" | "otp" | "name";

export default function Auth() {
  const navigate = useNavigate();
  const { user, profile, loading, signIn } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>("phone");
  const [isNewUser, setIsNewUser] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Form states
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Single redirect effect - only runs once when we have definitive auth state
  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // If user is logged in, redirect
    if (user) {
      setRedirecting(true);
      if (profile && !profile.onboarding_completed) {
        navigate("/onboarding", { replace: true });
      } else if (profile) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

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
        setRedirecting(true);
        const { error: signInError } = await signIn(data.email, data.password);
        if (signInError) {
          console.error("Sign in after OTP error:", signInError);
          toast.error("Verification successful but login failed. Please try again.");
          setIsLoading(false);
          setRedirecting(false);
          return;
        }

        toast.success("Welcome back!");
        // Navigation will happen via useEffect
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
        setRedirecting(true);
        const { error: signInError } = await signIn(data.email, data.password);
        if (signInError) {
          console.error("Sign in after signup error:", signInError);
          toast.error("Account created but login failed. Please try again.");
          setIsLoading(false);
          setRedirecting(false);
          return;
        }

        toast.success("Account created! Setting up your store...");
        // Navigation will happen via useEffect
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

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans selection:bg-[#34A853]/20">
      {/* 
        =============================================
        CENTERED CONTAINER (All Steps)
        =============================================
      */}
      <div className="w-full max-w-[480px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
        {/* Back Button / Navigation */}
        {step !== "phone" && (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors group mb-4"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-900" />
          </button>
        )}

        {/* ----------------------------------------------------
            STEP 1: PHONE NUMBER (Exact Match to Image)
            ---------------------------------------------------- */}
        {step === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="space-y-8 text-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F5E9] text-[#34A853] text-xs font-bold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-[#34A853]" />
                GET STARTED
              </div>
              <h1 className="text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-[#0F172A] leading-[1.15]">
                Create your <br /> <span className="text-[#34A853]">store today.</span>
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed max-w-[360px] mx-auto">
                Enter your mobile number to launch your e-commerce journey in seconds.
              </p>
            </div>

            <div className="space-y-6">
              {/* Input Container - Clean Style */}
              <div className="group relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-400 pr-4 border-r border-slate-200">IN</span>
                  <span className="pl-3 font-bold text-slate-900">+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="block w-full pl-[6.5rem] pr-4 h-[64px] rounded-xl border-2 border-slate-200 bg-white text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:border-[#34A853] focus:ring-4 focus:ring-[#34A853]/10 outline-none transition-all duration-300"
                  placeholder="1234567890"
                  maxLength={10}
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold tracking-wide rounded-xl bg-[#34A853] hover:bg-[#2D9147] text-white shadow-none hover:shadow-lg hover:shadow-[#34A853]/20 transition-all duration-300"
                disabled={isLoading || phone.length < 10}
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Continue"}
              </Button>
            </div>

            <div className="pt-8">
              <p className="text-xs text-slate-400 text-center leading-relaxed max-w-[320px] mx-auto">
                By clicking Continue, you agree to our{" "}
                <a
                  href="#"
                  className="text-slate-600 font-semibold hover:text-[#34A853] underline decoration-slate-200 underline-offset-2 transition-colors"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-slate-600 font-semibold hover:text-[#34A853] underline decoration-slate-200 underline-offset-2 transition-colors"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </form>
        )}

        {/* ----------------------------------------------------
            STEP 2: OTP (Centered & Consistent)
            ---------------------------------------------------- */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-10 text-center">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">✨</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">Verify account</h1>
              <p className="text-slate-500 text-lg">
                We've sent a 6-digit code to <br /> <span className="font-bold text-slate-900">+91 {phone}</span>
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                <InputOTPGroup className="gap-3 flex-wrap justify-center">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <InputOTPSlot
                      key={idx}
                      index={idx}
                      className="w-12 h-14 lg:w-14 lg:h-16 text-2xl font-bold border-2 border-slate-200 bg-white rounded-xl shadow-none focus:border-[#34A853] focus:border-2 focus:ring-4 focus:ring-[#34A853]/10 transition-all duration-200"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="space-y-6">
              {/* Timer / Resend */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-slate-500">Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isLoading}
                  className="text-sm font-bold text-[#34A853] hover:text-[#2D9147] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend"}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold tracking-wide rounded-xl bg-[#34A853] hover:bg-[#2D9147] text-white shadow-none hover:shadow-lg hover:shadow-[#34A853]/20 transition-all duration-300"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify & Login"}
              </Button>
            </div>
          </form>
        )}

        {/* ----------------------------------------------------
            STEP 3: NAME (Centered & Consistent)
            ---------------------------------------------------- */}
        {step === "name" && (
          <form
            onSubmit={handleNameSubmit}
            className="space-y-8 animate-in slide-in-from-right-8 duration-500 text-center"
          >
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">Welcome aboard! 🚀</h1>
              <p className="text-slate-500 text-lg">What should we call you?</p>
            </div>

            <div className="space-y-6">
              <div className="relative group text-left">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-[#34A853] transition-colors" />
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-14 h-[64px] rounded-xl border-2 border-slate-200 bg-white text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:border-[#34A853] focus:ring-4 focus:ring-[#34A853]/10 focus:bg-white transition-all duration-300"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold tracking-wide rounded-xl bg-[#34A853] hover:bg-[#2D9147] text-white shadow-none hover:shadow-lg hover:shadow-[#34A853]/20 transition-all duration-300"
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Signup"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Copyright */}
      <div className="absolute bottom-8 text-center w-full">
        <p className="text-slate-400 text-sm font-medium">
          © {new Date().getFullYear()} Storekriti. All rights reserved.
        </p>
      </div>
    </div>
  );
}
