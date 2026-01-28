import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PreloadLink } from "@/components/PreloadLink";
import {
  Store,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  CreditCard,
  Check,
  Users,
  BarChart3,
  Sparkles,
  Search,
  Boxes,
  Workflow,
  Plug,
  Lock,
  Quote,
  ChevronRight,
} from "lucide-react";

/**
 * ✅ Performance notes (no SEO change needed):
 * - No external images → ultra fast (all “illustrations” are CSS/SVG).
 * - content-visibility: auto on heavy sections (browser can skip rendering offscreen).
 * - Mobile-first layout (stacked by default).
 * - Keep arrays outside component to avoid re-allocations.
 */

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#solutions", label: "Solutions" },
  { href: "#pricing", label: "Pricing" },
  { href: "#security", label: "Security" },
];

const LOGOS = ["ANTHROPIC", "coinbase", "Microsoft", "perplexity", "HubSpot", "x", "PayPal", "Lovable"];

const FEATURE_GRID = [
  {
    icon: Zap,
    title: "Fast setup",
    desc: "Launch a tenant store in minutes with templates + guided onboarding.",
  },
  {
    icon: Globe,
    title: "Multi-tenant architecture",
    desc: "Isolated stores, data separation, and safe scaling for thousands of tenants.",
  },
  {
    icon: Shield,
    title: "Security by design",
    desc: "RBAC, audit logs, and best-practice defaults to protect customer data.",
  },
  {
    icon: CreditCard,
    title: "Payments & billing",
    desc: "Razorpay-ready checkout + subscription billing patterns for SaaS monetization.",
  },
  {
    icon: Users,
    title: "Customer management",
    desc: "Orders, customers, retention, and operational workflows in one place.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Store-level & platform-level insights to optimize growth and revenue.",
  },
];

const SOLUTIONS = [
  {
    icon: Boxes,
    title: "Agency / Studio",
    desc: "Create and manage multiple client stores from a single dashboard.",
    bullets: ["White-label branding", "Tenant templates", "Central billing"],
  },
  {
    icon: Store,
    title: "SaaS founders",
    desc: "Ship a store-builder product with tiers, add-ons, and analytics on day 1.",
    bullets: ["Pricing tiers", "Add-ons", "Usage analytics"],
  },
  {
    icon: Workflow,
    title: "Vertical marketplaces",
    desc: "Onboard sellers faster with isolated catalogs, themes, and payment setup.",
    bullets: ["Seller onboarding", "Store isolation", "Payments per tenant"],
  },
];

const FAQ = [
  {
    q: "Is Storekriti a website builder or a full SaaS platform?",
    a: "It’s a multi-tenant SaaS platform: tenant stores + admin console + payments + analytics, built to run many stores at scale.",
  },
  {
    q: "Can each tenant map a custom domain?",
    a: "Yes. Tenants can map custom domains, while you can keep a default platform domain for instant onboarding.",
  },
  {
    q: "How do you handle tenant isolation?",
    a: "Stores are isolated by tenant boundaries (data + configuration), designed for safe scaling and controlled access.",
  },
  {
    q: "Does it support Razorpay?",
    a: "Yes—Razorpay-friendly flows (checkout + webhook patterns) are supported for ecommerce and subscriptions.",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* =========================
          Top Nav (Mintlify-like)
          ========================= */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Store className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-display font-bold tracking-tight">Storekriti</div>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="hover:text-foreground transition">
                  {l.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" className="hidden sm:inline-flex" asChild>
                <PreloadLink to="/authentication">Log In</PreloadLink>
              </Button>
              <Button className="rounded-full" asChild>
                <PreloadLink to="/authentication">
                  Contact sales
                  <ArrowRight className="w-4 h-4 ml-2" />
                </PreloadLink>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* =========================
          HERO (match screenshot)
          ========================= */}
      <section className="relative overflow-hidden">
        {/* Mintlify-ish sky background (CSS only, super fast) */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b5b6a_0%,#1b7b83_35%,#63b5a4_70%,#f7faf9_100%)]" />

        {/* Soft atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.18),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(255,255,255,0.10),transparent_45%)]" />

        {/* Lightweight “clouds” using inline SVG */}
        <svg
          className="absolute left-0 top-16 w-[900px] max-w-none opacity-90"
          viewBox="0 0 900 260"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M130 190c-62 0-112-40-112-90 0-44 40-82 94-88 22-38 70-64 126-64 72 0 132 42 142 98 8-2 17-3 26-3 58 0 106 36 106 80 0 45-48 81-106 81H130Z"
            fill="rgba(255,232,140,0.95)"
          />
          <path
            d="M520 210c-64 0-116-38-116-86 0-41 37-76 88-84 20-36 64-60 116-60 66 0 122 38 132 90 8-2 17-3 26-3 54 0 98 34 98 76 0 42-44 77-98 77H520Z"
            fill="rgba(255,232,140,0.70)"
          />
        </svg>

        <div className="relative container mx-auto px-4">
          {/* Top spacing matches screenshot */}
          <div className="pt-14 pb-10 md:pt-16 md:pb-12 text-center">
            <div className="flex items-center justify-center">
              <Badge className="rounded-full bg-white/10 text-white border-white/15">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                AI search, docs & commerce operations
              </Badge>
            </div>

            {/* ✅ Keep SEO strong: h1 stays, same semantics */}
            <h1 className="mt-5 text-3xl sm:text-4xl md:text-6xl font-display font-bold tracking-tight text-white leading-[1.07]">
              The intelligent
              <br />
              ecommerce builder platform
            </h1>

            <p className="mt-4 text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto">
              Build and manage multi-tenant ecommerce stores with speed, security, and an admin experience your
              customers will love.
            </p>

            {/* CTA row like screenshot (email + button) */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch justify-center gap-2 max-w-md mx-auto">
              <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 h-11">
                <Search className="w-4 h-4 text-white/75" />
                <input
                  className="w-full bg-transparent outline-none text-white placeholder:text-white/60 text-sm"
                  placeholder="Email address"
                  inputMode="email"
                />
              </div>

              <Button className="h-11 rounded-full bg-white text-[#0b5b6a] hover:bg-white/90" asChild>
                <PreloadLink to="/authentication">
                  Start free <ArrowRight className="w-4 h-4 ml-2" />
                </PreloadLink>
              </Button>
            </div>

            <div className="mt-3 text-[12px] text-white/70">7-day free trial • No credit card required</div>
          </div>

          {/* Browser mock (fast, no image) */}
          <div className="pb-10 md:pb-14">
            <div className="mx-auto max-w-5xl rounded-2xl border border-black/10 bg-white/95 shadow-[0_20px_50px_rgba(0,0,0,0.18)] overflow-hidden">
              {/* top chrome */}
              <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="ml-2 text-xs text-muted-foreground">app.storekriti.com</div>
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Dashboard • Stores • Billing • Analytics
                </div>
              </div>

              {/* inner content */}
              <div className="grid grid-cols-12">
                {/* sidebar */}
                <div className="col-span-4 sm:col-span-3 border-r bg-emerald-50/40 p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Store className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-sm font-semibold">Storekriti</div>
                      <div className="text-[11px] text-muted-foreground">Workspace</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    {[
                      { i: Boxes, t: "Stores" },
                      { i: Users, t: "Customers" },
                      { i: CreditCard, t: "Payments" },
                      { i: BarChart3, t: "Analytics" },
                      { i: Plug, t: "Integrations" },
                      { i: Workflow, t: "Automations" },
                    ].map((x) => (
                      <div key={x.t} className="flex items-center gap-2 rounded-xl px-3 py-2 border bg-white">
                        <x.i className="w-4 h-4 text-emerald-700/80" />
                        <span className="text-foreground/80">{x.t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* main */}
                <div className="col-span-8 sm:col-span-9 p-3 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Stores</div>
                      <div className="text-lg font-semibold tracking-tight">Quickstart</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Create a tenant store and go live with a theme + catalog + payments.
                      </div>
                    </div>
                    <Badge className="rounded-full bg-emerald-600 text-white">New</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { t: "Create store", d: "Tenant setup, branding & domain" },
                      { t: "Add products", d: "Catalog import & collections" },
                      { t: "Configure payments", d: "Razorpay + webhooks" },
                      { t: "Go live", d: "SEO, speed, and launch checklist" },
                    ].map((c) => (
                      <div key={c.t} className="rounded-xl border bg-emerald-50/30 p-4">
                        <div className="text-sm font-medium">{c.t}</div>
                        <div className="text-xs text-muted-foreground mt-1">{c.d}</div>
                        <div className="mt-3 h-2 rounded-full bg-emerald-600/15 overflow-hidden">
                          <div className="h-full w-2/5 bg-emerald-600/55 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* subtle skeleton row */}
                  <div className="mt-4 rounded-xl border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Live metrics</div>
                      <div className="text-xs text-muted-foreground">last 24h</div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {["Orders", "Revenue", "Active stores"].map((k) => (
                        <div key={k} className="rounded-lg border bg-muted/20 p-3">
                          <div className="text-[11px] text-muted-foreground">{k}</div>
                          <div className="mt-2 h-3 w-16 rounded bg-muted/40" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logos row */}
            <div className="mt-10 md:mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-xs text-muted-foreground">
              {LOGOS.map((l) => (
                <div key={l} className="font-medium tracking-wide opacity-80">
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          FEATURES (like screenshot)
          ========================= */}
      <section
        id="features"
        className="py-14 sm:py-16 md:py-20 px-4"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "900px",
        }}
      >
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-[11px] tracking-widest text-muted-foreground">BUILT FOR THE COMMERCE AGE</div>
            <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight">
              Built for modern SaaS commerce builders
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Everything you need to launch tenant stores, manage operations, and scale safely—without sacrificing
              performance.
            </p>
          </div>

          {/* Two large feature blocks (mimic screenshot) */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border bg-background">
              <CardHeader>
                <div className="text-[11px] tracking-widest text-muted-foreground">BUILT TO SCALE</div>
                <CardTitle className="font-display">For both people and systems</CardTitle>
                <CardDescription>
                  Your clients get a clean admin. Your platform gets safe tenant boundaries, observability, and
                  predictable ops.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* mini illustration */}
                <div className="rounded-2xl border bg-muted/15 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600/15 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-sm font-medium">Speed score</div>
                    </div>
                    <Badge className="rounded-full bg-emerald-600 text-white">Excellent</Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    {["Edge-cached landing pages", "Instant tenant routing", "Lean UI, minimal JS"].map((x) => (
                      <div key={x} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-700" />
                        <div className="text-sm text-muted-foreground">{x}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 h-2 rounded-full bg-emerald-600/15 overflow-hidden">
                    <div className="h-full w-[78%] bg-emerald-600/55 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-background">
              <CardHeader>
                <div className="text-[11px] tracking-widest text-muted-foreground">SELF-SERVING</div>
                <CardTitle className="font-display">Self-updating operations</CardTitle>
                <CardDescription>
                  Templates, workflows, and guardrails so tenants can ship faster while your team stays in control.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* mini illustration */}
                <div className="rounded-2xl border bg-muted/15 p-5">
                  <div className="flex items-center gap-3">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="w-10 h-10 rounded-full bg-emerald-600/15 flex items-center justify-center"
                      >
                        <Check className="w-5 h-5 text-emerald-700" />
                      </div>
                    ))}
                    <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="w-4 h-4" />
                      Audit-ready
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { t: "RBAC", d: "Roles & access control" },
                      { t: "Templates", d: "Store presets & themes" },
                      { t: "Billing", d: "Plans & add-ons" },
                      { t: "Logs", d: "Actions & events" },
                    ].map((m) => (
                      <div key={m.t} className="rounded-xl border bg-background p-4">
                        <div className="text-sm font-medium">{m.t}</div>
                        <div className="text-xs text-muted-foreground mt-1">{m.d}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature grid */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURE_GRID.map((f) => (
              <Card key={f.title} className="border bg-background/80 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600/15 flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="mt-4 text-base font-semibold">{f.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          ENTERPRISE STRIP (like screenshot)
          ========================= */}
      <section
        id="security"
        className="py-14 sm:py-16 md:py-20 px-4 bg-muted/25"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "820px",
        }}
      >
        <div className="container mx-auto">
          <div className="max-w-2xl">
            <div className="text-[11px] tracking-widest text-muted-foreground">ENTERPRISE-READY</div>
            <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight">
              Bring multi-tenant commerce to enterprise
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Professional services, compliance options, and platform controls built for teams that ship serious
              products.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border bg-background/80">
              <CardHeader>
                <CardTitle className="text-lg font-display">Build with partnership</CardTitle>
                <CardDescription>
                  We help you plan tenant architecture, billing, and onboarding flows that scale.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-700 mt-0.5" />
                  <span>Architecture review & rollout plan</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-700 mt-0.5" />
                  <span>Migration assistance & best practices</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-700 mt-0.5" />
                  <span>Dedicated success channel</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-background/80">
              <CardHeader>
                <CardTitle className="text-lg font-display">Compliance & access control</CardTitle>
                <CardDescription>Keep teams safe with controlled access and auditable operations.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-700 mt-0.5" />
                  <span>RBAC with scoped permissions</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-700 mt-0.5" />
                  <span>Audit logs + export-ready events</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-700 mt-0.5" />
                  <span>Security-first defaults</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Big gradient card with “arch” illustration vibe */}
          <div className="mt-8 rounded-2xl overflow-hidden border bg-[linear-gradient(180deg,#0b5b6a_0%,#1b7b83_40%,#123a43_100%)]">
            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="text-white">
                <div className="text-[11px] tracking-widest text-white/70">CASE STUDY</div>
                <h3 className="mt-3 text-2xl md:text-3xl font-display font-bold tracking-tight">
                  See how teams accelerate development with Storekriti
                </h3>
                <p className="mt-3 text-sm md:text-base text-white/80">
                  Launch stores faster, keep tenants isolated, and track growth across your platform with clean
                  analytics.
                </p>

                <div className="mt-5 flex flex-wrap gap-6">
                  <div>
                    <div className="text-2xl font-display font-bold">2M+</div>
                    <div className="text-xs text-white/70">monthly page views</div>
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold">3+</div>
                    <div className="text-xs text-white/70">tenant tiers supported</div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button className="rounded-full bg-white text-[#0b5b6a] hover:bg-white/90" asChild>
                    <PreloadLink to="/authentication">
                      Explore enterprise <ArrowRight className="w-4 h-4 ml-2" />
                    </PreloadLink>
                  </Button>
                </div>
              </div>

              {/* Arch illustration (CSS only, no images) */}
              <div className="relative">
                <div className="absolute -inset-6 rounded-3xl bg-white/5 blur-2xl" />
                <div className="relative mx-auto w-full max-w-md aspect-[16/10] rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02))] border border-white/10 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(255,220,120,0.35),transparent_55%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.25),transparent_60%)]" />

                  {/* arch */}
                  <div className="absolute right-6 bottom-4 w-40 h-40">
                    <div className="absolute inset-0 rounded-[999px] bg-[conic-gradient(from_180deg,rgba(255,195,80,1),rgba(255,230,150,1),rgba(255,195,80,1))]" />
                    <div className="absolute inset-[10px] rounded-[999px] bg-[#0f4d57]" />
                    <div className="absolute inset-[24px] rounded-[999px] bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.00))]" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-24 h-24 bg-[#0f4d57]" />
                  </div>

                  {/* ground */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.35))]" />

                  {/* subtle stats badges */}
                  <div className="absolute left-4 bottom-4 space-y-2">
                    <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-white">
                      <div className="text-xs text-white/70">Tenants</div>
                      <div className="text-lg font-display font-bold">128</div>
                    </div>
                    <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-white">
                      <div className="text-xs text-white/70">Speed</div>
                      <div className="text-lg font-display font-bold">Fast</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* footer logos */}
            <div className="border-t border-white/10 px-6 md:px-8 py-4 flex flex-wrap gap-x-10 gap-y-3 items-center justify-center text-white/70 text-xs">
              {["ANTHROPIC", "coinbase", "HubSpot", "zapier", "AT&T"].map((x) => (
                <span key={x} className="tracking-wide">
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          SOLUTIONS + TESTIMONIALS
          ========================= */}
      <section
        id="solutions"
        className="py-14 sm:py-16 md:py-20 px-4"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "950px",
        }}
      >
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-[11px] tracking-widest text-muted-foreground">CUSTOMERS</div>
            <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight">
              Unlock commerce for any industry
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              From agencies to vertical marketplaces, teams use Storekriti to launch fast and scale safely.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {SOLUTIONS.map((s) => (
              <Card key={s.title} className="border bg-background">
                <CardHeader>
                  <div className="w-11 h-11 rounded-xl bg-emerald-600/15 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-emerald-700" />
                  </div>
                  <CardTitle className="mt-3 font-display">{s.title}</CardTitle>
                  <CardDescription>{s.desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {s.bullets.map((b) => (
                    <div key={b} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-700 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Story cards (like screenshot) */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                brand: "Perplexity",
                title: "How teams scale operations with multi-tenant workflows",
              },
              {
                brand: "X",
                title: "How a builder platform cut launch time by 60%",
              },
              { brand: "Kalshi", title: "How marketplaces onboard sellers faster" },
            ].map((c) => (
              <Card key={c.brand} className="border overflow-hidden bg-background">
                <div className="h-40 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.35),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.14),transparent_60%)]" />
                <CardContent className="pt-5">
                  <div className="text-sm font-semibold">{c.brand}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{c.title}</div>
                  <div className="mt-4 inline-flex items-center text-sm text-emerald-700">
                    Read story <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          PRICING (keep id + structure)
          ========================= */}
      <section
        id="pricing"
        className="py-14 sm:py-16 md:py-20 px-4 bg-muted/25"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "900px",
        }}
      >
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-[11px] tracking-widest text-muted-foreground">PRICING</div>
            <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight">
              Pricing on your terms
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Start free, upgrade when you’re ready. No hidden fees.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="border bg-background">
              <CardHeader>
                <CardTitle className="text-xl font-display font-bold">Free Trial</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold tracking-tight">₹0</span>
                  <span className="text-muted-foreground"> / 7 days</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {["Full store functionality", "Up to 10 products", "Basic analytics", "Email support"].map(
                    (feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-600" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ),
                  )}
                </ul>

                <Button variant="outline" className="w-full rounded-full" asChild>
                  <PreloadLink to="/authentication">Start Free Trial</PreloadLink>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-emerald-600/30 bg-background shadow-[0_12px_30px_rgba(16,185,129,0.18)]">
              <div className="pt-6 flex justify-center">
                <Badge className="rounded-full bg-emerald-600 text-white">Most Popular</Badge>
              </div>

              <CardHeader>
                <CardTitle className="text-xl font-display font-bold">Pro Plan</CardTitle>
                <CardDescription>For growing businesses</CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold tracking-tight">₹1</span>
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

                <Button className="w-full rounded-full bg-emerald-600 hover:bg-emerald-600/90" asChild>
                  <PreloadLink to="/authentication">
                    Get Started <ArrowRight className="w-4 h-4 ml-2" />
                  </PreloadLink>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* CTA row like screenshot bottom */}
          <div className="mt-12 text-center">
            <h3 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              Make commerce your winning advantage
            </h3>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Join teams building modern multi-tenant ecommerce experiences with Storekriti.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button className="rounded-full bg-emerald-600 hover:bg-emerald-600/90" asChild>
                <PreloadLink to="/authentication">
                  Get started for free <ArrowRight className="w-4 h-4 ml-2" />
                </PreloadLink>
              </Button>
              <Button variant="outline" className="rounded-full" asChild>
                <PreloadLink to="/authentication">Get a demo</PreloadLink>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          FAQ
          ========================= */}
      <section
        id="faq"
        className="py-14 sm:py-16 md:py-20 px-4"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "700px",
        }}
      >
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-[11px] tracking-widest text-muted-foreground">FAQ</div>
            <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight">
              Questions, answered
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {FAQ.map((f) => (
              <Card key={f.q} className="border bg-background">
                <CardHeader>
                  <CardTitle className="text-base font-display font-semibold">{f.q}</CardTitle>
                  <CardDescription className="text-sm">{f.a}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Small testimonial row */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Agency owner",
                q: "We launched 10+ client stores without chaos.",
              },
              {
                name: "SaaS founder",
                q: "Billing + tenants worked from day one.",
              },
              {
                name: "Marketplace lead",
                q: "Seller onboarding became predictable and fast.",
              },
            ].map((t) => (
              <Card key={t.name} className="border bg-background">
                <CardContent className="pt-6">
                  <Quote className="w-5 h-5 text-muted-foreground" />
                  <div className="mt-3 text-sm text-muted-foreground">{t.q}</div>
                  <div className="mt-4 text-sm font-medium">{t.name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          Footer (like screenshot style)
          ========================= */}
      <footer className="border-t border-border/60 py-12 px-4 bg-muted/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/15 flex items-center justify-center">
                <Store className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="leading-none">
                <div className="font-display font-semibold tracking-tight">Storekriti</div>
                <div className="text-[11px] text-muted-foreground">Built for modern commerce</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
              <div>
                <div className="text-xs text-muted-foreground tracking-widest">PRODUCT</div>
                <div className="mt-3 space-y-2 text-muted-foreground">
                  <a href="#features" className="block hover:text-foreground">
                    Features
                  </a>
                  <a href="#pricing" className="block hover:text-foreground">
                    Pricing
                  </a>
                  <a href="#security" className="block hover:text-foreground">
                    Security
                  </a>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground tracking-widest">COMPANY</div>
                <div className="mt-3 space-y-2 text-muted-foreground">
                  <a href="#solutions" className="block hover:text-foreground">
                    Customers
                  </a>
                  <Link to="/authentication" className="block hover:text-foreground">
                    Contact
                  </Link>
                  <a href="#faq" className="block hover:text-foreground">
                    FAQ
                  </a>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground tracking-widest">RESOURCES</div>
                <div className="mt-3 space-y-2 text-muted-foreground">
                  <Link to="/authentication" className="block hover:text-foreground">
                    Docs
                  </Link>
                  <Link to="/authentication" className="block hover:text-foreground">
                    Guides
                  </Link>
                  <Link to="/authentication" className="block hover:text-foreground">
                    Support
                  </Link>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground tracking-widest">LEGAL</div>
                <div className="mt-3 space-y-2 text-muted-foreground">
                  <Link to="/authentication" className="block hover:text-foreground">
                    Privacy
                  </Link>
                  <Link to="/authentication" className="block hover:text-foreground">
                    Terms
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>© 2026 Storekriti. Owned and Operated by: Shailendra Singh.</div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Secure by design
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
