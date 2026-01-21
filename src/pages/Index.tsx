import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Sparkles,
  TrendingUp,
  Lock,
  Rocket,
  Code,
  Layers,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Index() {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Setup",
      desc: "Launch your enterprise store in under 5 minutes. No technical expertise needed.",
      gradient: "from-yellow-500 to-orange-500",
      bg: "bg-yellow-500/10",
    },
    {
      icon: Globe,
      title: "Multi-Tenant Architecture",
      desc: "Scalable infrastructure with complete data isolation for each business.",
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      desc: "SOC 2 compliant with end-to-end encryption and tenant isolation.",
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: CreditCard,
      title: "Unified Payment Gateway",
      desc: "Razorpay integration with support for 100+ payment methods.",
      gradient: "from-purple-500 to-pink-500",
      bg: "bg-purple-500/10",
    },
    {
      icon: Users,
      title: "Advanced CRM",
      desc: "360° customer view with purchase history, preferences, and behavior tracking.",
      gradient: "from-rose-500 to-red-500",
      bg: "bg-rose-500/10",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      desc: "AI-powered insights with predictive analytics and custom dashboards.",
      gradient: "from-indigo-500 to-violet-500",
      bg: "bg-indigo-500/10",
    },
  ];

  const stats = [
    { value: "99.99%", label: "Uptime SLA", icon: TrendingUp },
    { value: "<100ms", label: "API Response", icon: Zap },
    { value: "5000+", label: "Active Stores", icon: Store },
    { value: "ISO 27001", label: "Certified", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s", animationDelay: "2s" }}
        />
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-2xl" : "bg-transparent"}`}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/50 group-hover:shadow-blue-500/80 transition-all duration-300 group-hover:scale-110">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-950 animate-pulse" />
              </div>
              <div className="leading-tight">
                <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Storekriti
                </div>
                <div className="text-xs text-slate-400">Enterprise Commerce Platform</div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-8 text-sm">
              {["Features", "Solutions", "Pricing", "Enterprise"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-slate-300 hover:text-white transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" className="hidden sm:inline-flex text-white hover:text-white hover:bg-white/10">
                <Link to="/authentication">Sign In</Link>
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300">
                <Link to="/authentication" className="flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 backdrop-blur-sm mb-8 animate-pulse">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">Trusted by 5000+ B2B businesses worldwide</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
              Build Your
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                Commerce Empire
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              The all-in-one B2B eCommerce platform trusted by enterprises. Launch faster, scale smarter, and sell more
              with our enterprise-grade infrastructure.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-10 py-7 shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 hover:scale-105"
              >
                <Link to="/authentication" className="flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/20 text-white hover:bg-white/10 text-lg px-10 py-7 backdrop-blur-sm"
              >
                <Link to="/authentication" className="flex items-center gap-2">
                  Watch Demo
                  <Rocket className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            <div className="text-sm text-slate-400 mb-16">
              ✓ 14-day free trial • ✓ No credit card required • ✓ Full feature access
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="group relative p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all duration-300" />
                  <stat.icon className="w-8 h-8 text-blue-400 mb-3 mx-auto group-hover:scale-110 transition-transform duration-300" />
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div
          className="absolute top-1/4 left-10 w-20 h-20 bg-blue-500/20 rounded-2xl blur-xl animate-pulse"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        />
        <div
          className="absolute bottom-1/4 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30 px-4 py-2">Platform Features</Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              Everything Your Business
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Needs to Succeed
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Enterprise-grade features designed to help you scale without limits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className={`group relative overflow-hidden border-0 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl transition-all duration-500 hover:scale-105 cursor-pointer ${activeFeature === idx ? "ring-2 ring-blue-500 shadow-2xl shadow-blue-500/50" : ""}`}
                onMouseEnter={() => setActiveFeature(idx)}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />
                <CardContent className="p-8 relative z-10">
                  <div
                    className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon
                      className={`w-8 h-8 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`}
                      style={{ WebkitTextFillColor: "transparent", WebkitBackgroundClip: "text" }}
                    />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Security Banner */}
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 p-8 md:p-12 backdrop-blur-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-4">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300">Enterprise Security</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Bank-Grade Security.
                  <br />
                  Zero Compromises.
                </h3>
                <p className="text-slate-300 text-lg max-w-2xl">
                  SOC 2 Type II certified with complete tenant isolation, end-to-end encryption, and 24/7 security
                  monitoring. Your data is protected by the same standards used by financial institutions.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-xl shadow-blue-500/30"
              >
                <Link to="/authentication" className="flex items-center gap-2">
                  Learn More
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-2">
              Transparent Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              Choose Your
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Growth Plan
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Flexible pricing that scales with your business. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Starter */}
            <Card className="relative border-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl overflow-hidden group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2 text-white">Starter</h3>
                <p className="text-slate-400 mb-6">Perfect for testing</p>
                <div className="mb-8">
                  <span className="text-5xl font-black text-white">₹0</span>
                  <span className="text-slate-400 ml-2">/ 14 days</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Full platform access",
                    "Up to 100 products",
                    "Basic analytics",
                    "Email support",
                    "SSL certificate",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full border-2 border-white/20 text-white hover:bg-white/10 py-6">
                  <Link to="/authentication">Start Free Trial</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="relative border-2 border-blue-500/50 bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-xl overflow-hidden shadow-2xl shadow-blue-500/30 scale-105">
              <div className="absolute -top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              <div className="absolute top-4 right-4">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-3 py-1">
                  Popular
                </Badge>
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Professional
                </h3>
                <p className="text-slate-400 mb-6">For growing businesses</p>
                <div className="mb-8">
                  <span className="text-5xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    ₹1
                  </span>
                  <span className="text-slate-400 ml-2">/ month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Unlimited products",
                    "Advanced analytics",
                    "Priority support",
                    "Custom domain",
                    "API access",
                    "Multi-currency",
                    "Advanced integrations",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 shadow-lg shadow-blue-500/50">
                  <Link to="/authentication">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="relative border-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl overflow-hidden group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2 text-white">Enterprise</h3>
                <p className="text-slate-400 mb-6">For large organizations</p>
                <div className="mb-8">
                  <span className="text-5xl font-black text-white">Custom</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Everything in Pro",
                    "Dedicated infrastructure",
                    "Custom integrations",
                    "24/7 phone support",
                    "SLA guarantee",
                    "Advanced security",
                    "Custom contracts",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full border-2 border-white/20 text-white hover:bg-white/10 py-6">
                  <Link to="/authentication">Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 backdrop-blur-sm mb-8">
              <Rocket className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">Join 5000+ successful businesses</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              Ready to Transform Your
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Business Online?
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
              Start your 14-day free trial today. No credit card required. Full access to all features.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-12 py-7 shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 hover:scale-105"
              >
                <Link to="/authentication" className="flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/20 text-white hover:bg-white/10 text-lg px-12 py-7 backdrop-blur-sm"
              >
                <Link to="/authentication">Schedule Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="font-bold text-white">Storekriti</div>
                <div className="text-xs text-slate-400">Enterprise Commerce Platform</div>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              © 2026 Storekriti. Owned and Operated by: Shailendra Singh. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
