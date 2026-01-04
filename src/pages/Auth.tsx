import { useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Store,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Loader2,
} from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user, profile } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showSignupPwd, setShowSignupPwd] = useState(false);

  // ✅ Prevent navigate during render
  useEffect(() => {
    if (user && profile) {
      if (!profile.onboarding_completed) navigate("/onboarding");
      else navigate("/dashboard");
    }
  }, [user, profile, navigate]);

  const niceEmail = useMemo(() => loginEmail.trim() || signupEmail.trim(), [loginEmail, signupEmail]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      if (error.message.includes("Invalid login credentials")) toast.error("Invalid email or password");
      else toast.error(error.message);
    } else {
      toast.success("Welcome back!");
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);

    if (error) {
      if (error.message.includes("already registered"))
        toast.error("This email is already registered. Please log in instead.");
      else toast.error(error.message);
    } else {
      toast.success("Account created! Setting up your store...");
    }

    setIsLoading(false);
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
                      <div className="text-sm text-muted-foreground">Tenant isolation + best-practice safeguards.</div>
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
                      <div className="font-display font-bold tracking-tight">Fast</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Onboarding</div>
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

                <Tabs defaultValue="login" className="w-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-display tracking-tight">Welcome back</CardTitle>
                    <CardDescription>Log in or create your account to continue.</CardDescription>

                    <TabsList className="grid w-full grid-cols-2 mt-4">
                      <TabsTrigger value="login">Log In</TabsTrigger>
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* LOGIN */}
                    <TabsContent value="login" className="mt-0">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="you@example.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="pl-10 h-11 rounded-xl bg-background/60"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">Password</Label>
                            <button
                              type="button"
                              className="text-xs text-muted-foreground hover:text-foreground transition"
                              onClick={() => toast.message("Add reset password flow here.")}
                            >
                              Forgot password?
                            </button>
                          </div>

                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="login-password"
                              type={showLoginPwd ? "text" : "password"}
                              placeholder="••••••••"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="pl-10 pr-10 h-11 rounded-xl bg-background/60"
                              required
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:text-foreground transition"
                              onClick={() => setShowLoginPwd((s) => !s)}
                              aria-label={showLoginPwd ? "Hide password" : "Show password"}
                            >
                              {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <Button type="submit" className="w-full shadow-glow h-11 rounded-xl" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Logging in...
                            </>
                          ) : (
                            <>
                              Log In <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>

                        <div className="relative py-2">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border/60" />
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-background/70 px-2 text-xs text-muted-foreground">Secure login</span>
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
                    </TabsContent>

                    {/* SIGNUP */}
                    <TabsContent value="signup" className="mt-0">
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder="John Doe"
                              value={signupName}
                              onChange={(e) => setSignupName(e.target.value)}
                              className="pl-10 h-11 rounded-xl bg-background/60"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="you@example.com"
                              value={signupEmail}
                              onChange={(e) => setSignupEmail(e.target.value)}
                              className="pl-10 h-11 rounded-xl bg-background/60"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="signup-password"
                              type={showSignupPwd ? "text" : "password"}
                              placeholder="••••••••"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="pl-10 pr-10 h-11 rounded-xl bg-background/60"
                              required
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:text-foreground transition"
                              onClick={() => setShowSignupPwd((s) => !s)}
                              aria-label={showSignupPwd ? "Hide password" : "Show password"}
                            >
                              {showSignupPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Min 6 characters</span>
                            <span className="hidden sm:inline">Tip: add number + symbol</span>
                          </div>
                        </div>

                        <Button type="submit" className="w-full shadow-glow h-11 rounded-xl" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating account...
                            </>
                          ) : (
                            <>
                              Create Account <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>

                        <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                          By signing up, you agree to our{" "}
                          <Link to="#" className="text-foreground underline underline-offset-4 hover:opacity-80">
                            Terms
                          </Link>{" "}
                          and{" "}
                          <Link to="#" className="text-foreground underline underline-offset-4 hover:opacity-80">
                            Privacy Policy
                          </Link>
                          .
                        </p>
                      </form>
                    </TabsContent>

                    {/* Bottom micro text */}
                    <div className="mt-5 text-center text-xs text-muted-foreground">
                      Need help?{" "}
                      <Link to="#" className="text-foreground hover:underline underline-offset-4">
                        Contact support
                      </Link>
                    </div>
                  </CardContent>
                </Tabs>
              </Card>

              <div className="mt-4 text-center text-xs text-muted-foreground lg:hidden">
                7-day free trial • No credit card required
              </div>
            </div>
          </div>

          {/* Tiny footer */}
          <div className="mt-6 text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} StoreSaaS • All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
