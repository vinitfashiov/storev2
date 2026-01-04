import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  CreditCard,
  Check,
  Users,
  BarChart3,
} from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow" />
                <div className="absolute inset-0 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
              <div className="leading-none">
                <div className="text-lg font-display font-bold tracking-tight">
                  Storekriti
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Multi-tenant commerce
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition">
                Features
              </a>
              <a href="#pricing" className="hover:text-foreground transition">
                Pricing
              </a>
              <a href="#security" className="hover:text-foreground transition">
                Security
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/authentication">Log In</Link>
              </Button>
              <Button asChild className="shadow-glow">
                <Link to="/authentication">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* background */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,hsl(var(--primary)/0.18),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(var(--accent)/0.14),transparent_50%)]" />
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="py-20 md:py-28 text-center">
            <Badge variant="secondary" className="mb-6">
              ✨ Launch your store in minutes
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground leading-[1.05]">
              Build your online
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                business—beautifully
              </span>
            </h1>

            <p className="mt-6 text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              The all-in-one multi-tenant platform to launch, manage, and scale
              your e-commerce or grocery store. Fast setup. Secure by design. No
              coding required.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="shadow-glow text-base px-8 py-6"
              >
                <Link to="/authentication">
                  Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="mt-6 text-xs sm:text-sm text-muted-foreground">
              7-day free trial • No credit card required • Cancel anytime
            </div>

            {/* Trust row */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[
                { k: "99.9%", v: "Uptime SLA" },
                { k: "Razorpay", v: "Payments" },
                { k: "1-Click", v: "Store setup" },
                { k: "Secure", v: "Isolated tenants" },
              ].map((i) => (
                <div
                  key={i.k}
                  className="rounded-xl border bg-background/40 backdrop-blur px-4 py-3 text-left"
                >
                  <div className="font-display font-bold tracking-tight">
                    {i.k}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {i.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <Badge className="mb-4" variant="outline">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
              Everything you need to succeed
            </h2>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools to launch, grow, and manage your store with
              enterprise-level performance and simplicity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Instant Setup",
                desc: "Go from idea to live store in minutes with guided onboarding.",
                tone: "bg-primary/10 text-primary",
              },
              {
                icon: Globe,
                title: "Multi-Tenant Architecture",
                desc: "Isolated stores and data separation — built for scale and safety.",
                tone: "bg-accent/10 text-accent",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                desc: "Bank-grade protections with tenant isolation and best practices.",
                tone: "bg-emerald-500/10 text-emerald-600",
              },
              {
                icon: CreditCard,
                title: "Integrated Payments",
                desc: "Accept Razorpay payments with secure, reliable processing.",
                tone: "bg-amber-500/10 text-amber-600",
              },
              {
                icon: Users,
                title: "Customer Management",
                desc: "Track customers, orders, and retention — all from one place.",
                tone: "bg-sky-500/10 text-sky-600",
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                desc: "Real-time insights to make better decisions, faster.",
                tone: "bg-violet-500/10 text-violet-600",
              },
            ].map((f) => (
              <Card
                key={f.title}
                className="group relative overflow-hidden border bg-background/60 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-muted/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="pt-8">
                  <div
                    className={`w-14 h-14 rounded-2xl ${f.tone} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}
                  >
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg md:text-xl font-display font-semibold mb-2">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Security strip */}
          <div
            id="security"
            className="mt-12 rounded-2xl border bg-muted/20 p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  Security by design
                </div>
                <h3 className="mt-3 text-2xl font-display font-bold tracking-tight">
                  Isolated stores. Protected data.
                </h3>
                <p className="mt-2 text-muted-foreground max-w-2xl">
                  Every tenant is separated to keep customer data secure. Built
                  with best practices and modern infrastructure patterns.
                </p>
              </div>

              <Button asChild className="shadow-glow">
                <Link to="/authentication">
                  Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <Badge className="mb-4" variant="outline">
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you're ready. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="relative border bg-background/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-bold">
                  Free Trial
                </CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold tracking-tight">
                    ₹0
                  </span>
                  <span className="text-muted-foreground"> / 7 days</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "Full store functionality",
                    "Up to 10 products",
                    "Basic analytics",
                    "Email support",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild variant="outline" className="w-full">
                  <Link to="/authentication">Start Free Trial</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border-primary/50 shadow-glow bg-background/70 backdrop-blur">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="gradient-primary text-primary-foreground border-0">
                  Most Popular
                </Badge>
              </div>

              <CardHeader>
                <CardTitle className="text-2xl font-display font-bold">
                  Pro Plan
                </CardTitle>
                <CardDescription>For growing businesses</CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold tracking-tight">
                    ₹249
                  </span>
                  <span className="text-muted-foreground"> / month</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "Unlimited products",
                    "Advanced analytics",
                    "Priority support",
                    "Custom domain",
                    "Remove branding",
                    "API access",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="w-full shadow-glow">
                  <Link to="/authentication">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto rounded-3xl border bg-muted/20 px-6 md:px-10 py-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
              Ready to launch your store?
            </h2>
            <p className="mt-4 text-base md:text-xl text-muted-foreground">
              Join entrepreneurs building modern online businesses with
              Storekriti.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="shadow-glow text-base px-10 py-6"
              >
                <Link to="/authentication">
                  Start Your Free Trial <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              No credit card required
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                <Store className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="leading-none">
                <div className="font-display font-semibold tracking-tight">
                  Storekriti
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Built for modern commerce
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              © 2026 StoreSaaS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
