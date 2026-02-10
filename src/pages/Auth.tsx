import { GradientWaves } from "@/components/ui/GradientWaves";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, User, ShieldCheck, Pencil, X } from "lucide-react";
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
    <div className="min-h-[100dvh] bg-white flex flex-col font-sans selection:bg-[#34A853]/20">
      {/* 
        =============================================
        CENTERED CONTAINER (All Steps)
        =============================================
      */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 w-full">
        <div className="w-full max-w-[480px] space-y-8 animate-in fade-in zoom-in-95 duration-500">
          {/* Back Button / Navigation - Only for Name step or others, NOT OTP (has custom header) */}
          {step !== "phone" && step !== "otp" && (
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
          {/* ----------------------------------------------------
              STEP 1: PHONE NUMBER (Responsive Split)
              ---------------------------------------------------- */}
          {step === "phone" && (
            <>
              {/* MOBILE LAYOUT (< 768px): Existing Design */}
              <form onSubmit={handlePhoneSubmit} className="md:hidden space-y-8 text-center">
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

              {/* PC LAYOUT (>= 768px): Gradient Waves & Flat White Card */}
              <div className="hidden md:flex fixed inset-0 z-50 w-full h-full items-center justify-center bg-slate-100 overflow-hidden">
                <GradientWaves />
                <div className="relative z-10 bg-white rounded-[2rem] p-12 w-full max-w-[480px] text-center space-y-8 animate-in zoom-in-95 fade-in duration-500">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold tracking-wider uppercase mb-2">
                      WELCOME
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create your store</h1>
                    <p className="text-slate-500">
                      Enter your mobile number to get started <br /> with your e-commerce journey.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="relative text-left">
                      <label className="text-xs font-semibold text-slate-500 ml-1 mb-1.5 block">Mobile Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-base font-bold text-slate-400 pr-3 border-r border-slate-200">IN</span>
                          <span className="pl-3 font-bold text-slate-900">+91</span>
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          className="block w-full pl-[5.5rem] pr-4 h-12 rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:ring-0 outline-none transition-all duration-200"
                          placeholder="00000 00000"
                          maxLength={10}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && phone.length === 10) {
                              handlePhoneSubmit(e);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handlePhoneSubmit}
                      className="w-full h-12 bg-[#0a0a0a] hover:bg-black text-white rounded-xl font-bold text-lg transition-all duration-300"
                      disabled={isLoading || phone.length < 10}
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Get OTP"}
                    </Button>
                  </div>

                  <div className="text-xs text-slate-400 leading-relaxed">
                    By continuing, you agree to our <br />
                    <a href="#" className="underline hover:text-slate-900">Terms of Service</a> & <a href="#" className="underline hover:text-slate-900">Privacy Policy</a>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ----------------------------------------------------
              STEP 2: OTP (Responsive Split)
              ---------------------------------------------------- */}
          {step === "otp" && (
            <>
              {/* MOBILE LAYOUT (< 768px): Top/Bottom Alignment */}
              <form onSubmit={handleVerifyOTP} className="md:hidden flex-1 flex flex-col w-full max-w-[480px] mx-auto animate-in slide-in-from-right-8 duration-500 min-h-[calc(100dvh-4rem)]">

                {/* TOP SECTION: Header, Title, Inputs */}
                <div className="flex flex-col items-start w-full space-y-6">

                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtp("");
                    }}
                    className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-900" />
                  </button>

                  {/* Title & Subtitle */}
                  <div className="space-y-2 text-left w-full mt-4">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Verify account with OTP</h1>
                    <p className="text-slate-500 text-base">
                      We've sent 6 code to <span className="text-slate-900 font-semibold">+91 {phone}</span>
                    </p>
                  </div>

                  {/* OTP Inputs */}
                  <div className="w-full pt-4">
                    <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                      <InputOTPGroup className="gap-2 sm:gap-3 flex w-full justify-between">
                        {[0, 1, 2, 3, 4, 5].map((idx) => (
                          <InputOTPSlot
                            key={idx}
                            index={idx}
                            className="w-12 h-14 sm:w-14 sm:h-16 text-2xl font-bold border border-slate-200 bg-slate-50 rounded-xl shadow-sm focus:border-slate-900 focus:ring-0 focus:bg-white transition-all duration-200 flex-1"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {/* Optional Status Text / Resend */}
                  <div className="space-y-4 w-full">
                    {isLoading && <p className="text-slate-500 text-sm">Verifying your OTP...</p>}

                    {!isLoading && (
                      <div className="flex flex-col items-start gap-1">
                        <p className="text-slate-500 text-sm">Didn't receive code?</p>
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={countdown > 0 || isLoading}
                          className="text-slate-900 font-semibold text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM SECTION: Continue Button, Footer Text */}
                <div className="w-full mt-auto pt-8 space-y-6">
                  <Button
                    type="submit"
                    className={`w-full h-14 text-lg font-semibold tracking-wide rounded-full shadow-none transition-all duration-300 ${otp.length === 6
                      ? "bg-slate-900 hover:bg-slate-800 text-white"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200"
                      }`}
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Continue"}
                  </Button>

                  <p className="text-xs text-slate-400 text-center leading-relaxed">
                    By entering your number you agree to our <br />
                    <a href="#" className="underline hover:text-slate-600">Terms & Privacy Policy</a>
                  </p>
                </div>

              </form>

              {/* PC LAYOUT (>= 768px): Gradient Waves & Flat White Card */}
              <div className="hidden md:flex fixed inset-0 z-50 w-full h-full items-center justify-center bg-slate-100 overflow-hidden">

                {/* Visual Background: Gradient Waves */}
                <GradientWaves />

                {/* Pure White Card */}
                <div className="relative z-10 bg-white rounded-[2rem] p-12 w-full max-w-[480px] text-center space-y-8 animate-in zoom-in-95 fade-in duration-500">

                  {/* PC Back Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtp("");
                    }}
                    className="absolute top-8 left-8 w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-900" />
                  </button>

                  <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Confirm it&apos;s you</h1>
                    <p className="text-slate-500">
                      We sent a temporary sign-in code to <br /> <span className="text-slate-900 font-medium">+91 {phone}</span>
                    </p>
                  </div>

                  <div className="flex justify-center py-2">
                    <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                      <InputOTPGroup className="gap-3">
                        {[0, 1, 2, 3, 4, 5].map((idx) => (
                          <InputOTPSlot
                            key={idx}
                            index={idx}
                            className="w-12 h-14 text-2xl font-bold border border-slate-200 bg-white rounded-lg focus:border-slate-900 focus:ring-0 transition-all duration-200"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    onClick={handleVerifyOTP}
                    className="w-full h-12 bg-[#0a0a0a] hover:bg-black text-white rounded-xl font-bold text-lg transition-all duration-300"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Done"}
                  </Button>

                  <div className="text-sm text-slate-500">
                    Didn&apos;t get the code?{" "}
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={countdown > 0 || isLoading}
                      className="text-blue-600 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : "Click here to resend"}
                    </button>
                  </div>
                </div>
              </div>
            </>
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
      </div>

      {/* Footer Copyright - Hide on OTP step */}
      {step !== "otp" && (
        <div className="py-6 text-center w-full">
          <p className="text-slate-400 text-sm font-medium">
            © {new Date().getFullYear()} Storekriti. All rights reserved.
          </p>
        </div>
      )}
    </div>
  );
}

