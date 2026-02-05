import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PreloadLink } from "@/components/PreloadLink";
import SEOHead from "@/components/shared/SEOHead";
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
  Play,
  ChevronDown,
  ChevronUp,
  Star,
  Quote,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

// Brand logos for marquee
const BRAND_LOGOS = [
  { name: "YAYA", logo: "YAYA" },
  { name: "AZONE", logo: "AZONE" },
  { name: "Shalvie", logo: "shalvie" },
  { name: "Oucch", logo: "oucch!" },
  { name: "Plor", logo: "PLOR" },
  { name: "Zyra", logo: "ZYRA" },
];

// Stats data
const STATS = [
  { value: "22", suffix: "%", label: "Enhanced Conversions", desc: "Storekriti boosts conversions and enhances the quality of each sale." },
  { value: "40", suffix: "%", label: "Reduced RTO Rates", desc: "Using our platform, brands have improved Return-to-Origin rates significantly." },
  { value: "48", suffix: "%", label: "Improved Prepaid Share", desc: "Our checkout increases prepaid orders by optimizing trust and speed." },
];

// Features data
const FEATURES = [
  {
    title: "OTP Authentication & Pre-Filled Addresses",
    desc: "Elevate your checkout experience with OTP authentication for security and instant address fill to speed up transactions. Combat RTO issues, and make every sale seamless.",
    stat: "30% of e-commerce deliveries face Return To Origin (RTO) challenges.",
    imagePosition: "right",
  },
  {
    title: "Dynamic Couponing & AI Upselling",
    desc: "Maximize AOV with dynamic couponing and smart upselling. Offer personalized promotions and recommendations to enhance customer satisfaction.",
    stat: "92% of online shoppers search for a coupon before completing purchase.",
    imagePosition: "left",
  },
  {
    title: "Prepaid Incentives & COD Optimization",
    desc: "Boost prepaid purchases and manage COD efficiently with discounts and surcharges, optimizing your revenue and operational flow in a mobile-friendly experience.",
    stat: "E-commerce brands report COD share over 65%.",
    imagePosition: "right",
  },
];

// Integration partners
const INTEGRATIONS = [
  "Cashfree", "Razorpay", "Delhivery", "Snapdeal", "PhonePe", "Emsobuzz",
  "Paytm", "Senri", "Meta", "Google Ads", "Google Analytics", "Paxyu", "Shiprocket"
];

// FAQ data
const FAQ_DATA = [
  {
    q: "What does Storekriti cost?",
    a: "Pricing depends on volume and features (OTP, COD rules, couponing, integrations). We offer flexible plans—schedule a demo for an exact quote.",
  },
  {
    q: "Is Storekriti a payment gateway?",
    a: "No. Storekriti is a complete ecommerce platform that works with your payment gateway(s). It improves conversion, prepaid share, and reduces RTO with smarter flows.",
  },
  {
    q: "Do I incur Shopify transaction fees with Storekriti?",
    a: "Storekriti is an independent platform, not a Shopify app. You have full control over your store without platform transaction fees.",
  },
  {
    q: "Can I migrate from my existing platform?",
    a: "Yes! We offer seamless migration support. Our team will help you transfer your products, customers, and orders with zero downtime.",
  },
];

// Testimonials
const TESTIMONIALS = [
  {
    quote: "Storekriti has greatly improved our operations by reducing COD orders with Partial COD and boosting prepaid ones. They've enabled efficient scaling, and the team's support has made a strong business impact.",
    name: "Faraz Khan",
    role: "Co-Founder & MD of Plor",
    featured: true,
  },
  {
    quote: "Storekriti has transformed our checkout process with a smooth, customizable experience. Their support is exceptional.",
    name: "Jatin Dugar",
    role: "Founder & CEO of Lagorii",
  },
  {
    quote: "Storekriti promised a customized checkout and higher prepaid share—and delivered within four months. Support and expertise were key.",
    name: "Abhishek Singh",
    role: "Founder of Gifts Gallery",
  },
];

// Reviews
const REVIEWS = [
  {
    stars: 5,
    quote: "The checkout is fast, clean, and conversion-friendly. COD optimizations saved us a ton of RTO cost.",
    role: "Operations Lead",
    company: "D2C Brand",
  },
  {
    stars: 5,
    quote: "OTP + Address autofill made checkout frictionless. Prepaid share jumped noticeably in weeks.",
    role: "Growth Manager",
    company: "Shopify Store",
  },
  {
    stars: 5,
    quote: "Support is fast and practical. Integrations and tracking helped our team move quickly.",
    role: "Founder",
    company: "D2C Commerce",
  },
];

export default function Index() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Storekriti",
    "url": "https://www.storekriti.com",
    "logo": "https://www.storekriti.com/logo.png",
    "sameAs": [
      "https://www.facebook.com/storekriti",
      "https://www.instagram.com/storekriti",
      "https://www.linkedin.com/company/storekriti"
    ]
  });

  return (
    <div className="min-h-screen bg-white text-foreground font-sans">
      <SEOHead
        title="Storekriti – India's D2C Ecommerce Store Builder"
        description="Create your online store in minutes with Storekriti. Launch, manage and grow your ecommerce or grocery business with zero coding."
        canonicalUrl="https://storekriti.com"
        schema={schema}
      />

      {/* ========== HEADER ========== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Storekriti</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#integrations" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Integrations</a>
            <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
            <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
            <PreloadLink to="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Contact Us</PreloadLink>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:inline-flex text-sm" asChild>
              <PreloadLink to="/authentication">Log in</PreloadLink>
            </Button>
            <Button className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25" asChild>
              <PreloadLink to="/authentication">
                Schedule a demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </PreloadLink>
            </Button>
          </div>
        </div>
      </header>

      {/* ========== HERO SECTION ========== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white pt-16 pb-20 lg:pt-24 lg:pb-32">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <Badge className="mb-6 rounded-full bg-blue-50 text-blue-700 border-blue-200 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              🚀 Presenting Storekriti
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
              Simple{" "}
              <span className="relative inline-flex items-center">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">1 click</span>
                <span className="ml-2 inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </span>
              </span>
              <br />
              <span className="text-gray-900">Checkout That Converts</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Skyrocket your sales with the innovative checkout suite that provides a faster, smoother, and wiser checkout experience.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 h-12 text-base shadow-xl shadow-blue-500/25" asChild>
                <PreloadLink to="/authentication">
                  Talk to us
                  <ArrowRight className="w-5 h-5 ml-2" />
                </PreloadLink>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 px-8 h-12 text-base">
                <Play className="w-5 h-5 mr-2 text-blue-600" />
                How it works
              </Button>
            </div>
          </div>

          {/* Hero Image/Video Mockup */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gray-900/10 border border-gray-200 bg-white">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-full bg-white border border-gray-200 text-xs text-gray-500">
                    app.storekriti.com
                  </div>
                </div>
              </div>
              
              {/* Dashboard mockup content */}
              <div className="aspect-video bg-gradient-to-br from-slate-50 to-white p-6">
                <div className="grid grid-cols-12 gap-4 h-full">
                  {/* Sidebar */}
                  <div className="col-span-3 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <Store className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Storekriti</div>
                        <div className="text-xs text-gray-400">Dashboard</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {["Dashboard", "Orders", "Products", "Customers", "Analytics"].map((item, i) => (
                        <div key={item} className={`px-3 py-2 rounded-lg text-sm ${i === 0 ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Main content */}
                  <div className="col-span-9 space-y-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: "Total Sales", value: "₹12.4L", change: "+12%" },
                        { label: "Orders", value: "1,234", change: "+8%" },
                        { label: "Conversion", value: "4.2%", change: "+0.5%" },
                        { label: "Customers", value: "892", change: "+15%" },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                          <div className="text-xs text-gray-500">{stat.label}</div>
                          <div className="text-xl font-bold text-gray-900 mt-1">{stat.value}</div>
                          <div className="text-xs text-green-600 mt-1">{stat.change}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Chart area */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-semibold text-gray-900">Revenue Overview</div>
                        <div className="text-xs text-gray-500">Last 30 days</div>
                      </div>
                      <div className="h-32 flex items-end justify-between gap-2">
                        {[40, 65, 45, 80, 55, 70, 85, 60, 75, 90, 70, 95].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-indigo-400 rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button className="w-20 h-20 rounded-full bg-white/90 shadow-xl flex items-center justify-center pointer-events-auto hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-blue-600 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== BRAND LOGOS SECTION ========== */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="mb-4 rounded-full bg-gray-100 text-gray-700 border-gray-200 px-4 py-1">
              Partnered with the Best
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Trusted By Industry Leading Brands
            </h2>
            <p className="mt-3 text-gray-600 max-w-xl mx-auto">
              Storekriti powers the checkout for industry leaders, offering seamless checkout and unmatched reliability.
            </p>
          </div>

          {/* Logo marquee */}
          <div className="overflow-hidden">
            <div className="flex items-center gap-16 animate-marquee whitespace-nowrap">
              {[...BRAND_LOGOS, ...BRAND_LOGOS].map((brand, i) => (
                <div key={i} className="text-2xl font-bold text-gray-300 hover:text-gray-500 transition-colors cursor-default">
                  {brand.logo}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS SECTION ========== */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 rounded-full bg-blue-50 text-blue-700 border-blue-200 px-4 py-1">
              Success Snapshots
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              How Storekriti has revolutionised D2C checkouts
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Streamlined checkouts, elevated conversions. Transforming clicks into customers, effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                <div className="inline-flex items-baseline">
                  <span className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {stat.value}
                  </span>
                  <span className="text-3xl font-bold text-blue-600">{stat.suffix}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{stat.label}</h3>
                <p className="mt-2 text-sm text-gray-600">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES SECTION ========== */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 rounded-full bg-indigo-50 text-indigo-700 border-indigo-200 px-4 py-1">
              Feature Highlights
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Advanced Features for Enhanced Checkout Performance
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Unlock lightning-fast sales with one-tap authentication and instant address fill, crafted for peak performance.
            </p>
          </div>

          <div className="space-y-24">
            {FEATURES.map((feature, i) => (
              <div key={i} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${feature.imagePosition === "left" ? "lg:flex-row-reverse" : ""}`}>
                {/* Content */}
                <div className={feature.imagePosition === "left" ? "lg:order-2" : ""}>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {feature.desc}
                  </p>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-sm text-blue-800">{feature.stat}</p>
                  </div>
                  <Button className="mt-6 rounded-full" variant="outline" asChild>
                    <PreloadLink to="/features">
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </PreloadLink>
                  </Button>
                </div>

                {/* Image placeholder */}
                <div className={feature.imagePosition === "left" ? "lg:order-1" : ""}>
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-gray-200 flex items-center justify-center overflow-hidden shadow-lg">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4">
                        {i === 0 ? <Shield className="w-10 h-10 text-white" /> : 
                         i === 1 ? <Sparkles className="w-10 h-10 text-white" /> : 
                         <CreditCard className="w-10 h-10 text-white" />}
                      </div>
                      <div className="text-sm text-gray-500">Feature Preview</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center mt-16">
            <Button size="lg" className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 shadow-xl shadow-blue-500/25" asChild>
              <PreloadLink to="/authentication">
                Skyrocket Your Checkout
                <ArrowRight className="w-5 h-5 ml-2" />
              </PreloadLink>
            </Button>
          </div>
        </div>
      </section>

      {/* ========== INTEGRATIONS SECTION ========== */}
      <section id="integrations" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 rounded-full bg-green-50 text-green-700 border-green-200 px-4 py-1">
              Integration
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Seamless Sync with Your Favorite Tools
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Maximize efficiency with Storekriti's seamless integrations. Connect your favorite tools, streamline your workflow, and amplify your success.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl mx-auto">
            {INTEGRATIONS.map((integration, i) => (
              <div key={i} className="px-6 py-3 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-sm font-medium text-gray-700 hover:text-blue-600 cursor-default">
                {integration}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS SECTION ========== */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 rounded-full bg-purple-50 text-purple-700 border-purple-200 px-4 py-1">
              Voices of Trust
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Client Success Stories
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Real feedback from our partners — see how Storekriti has transformed their businesses and checkout experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Featured testimonial */}
            <div className="lg:col-span-2 lg:row-span-2 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
              <Quote className="absolute top-6 right-6 w-12 h-12 text-white/20" />
              <div className="relative z-10">
                <p className="text-lg sm:text-xl leading-relaxed mb-8">
                  "{TESTIMONIALS[0].quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                    {TESTIMONIALS[0].name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{TESTIMONIALS[0].name}</div>
                    <div className="text-white/80">{TESTIMONIALS[0].role}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other testimonials */}
            {TESTIMONIALS.slice(1).map((testimonial, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
                <p className="text-gray-600 leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button className="rounded-full" variant="outline" asChild>
              <PreloadLink to="/authentication">
                Simplify Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </PreloadLink>
            </Button>
          </div>
        </div>
      </section>

      {/* ========== REVIEWS SECTION ========== */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 rounded-full bg-amber-50 text-amber-700 border-amber-200 px-4 py-1">
              Voices of Experience
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              What Our Clients Say
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Hear directly from our customers about their experience partnering with Storekriti and the results we've delivered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {REVIEWS.map((review, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(review.stars)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">"{review.quote}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{review.role}</div>
                  <div className="text-sm text-gray-500">{review.company}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25" asChild>
              <PreloadLink to="/authentication">
                Boost Revenue
                <ArrowRight className="w-4 h-4 ml-2" />
              </PreloadLink>
            </Button>
          </div>
        </div>
      </section>

      {/* ========== FAQ SECTION ========== */}
      <section id="faq" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Left side */}
            <div>
              <Badge className="mb-4 rounded-full bg-cyan-50 text-cyan-700 border-cyan-200 px-4 py-1">
                Support
              </Badge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                FAQ: Your Questions, Answered
              </h2>
              <p className="mt-4 text-gray-600">
                Find quick answers to common queries and get clarity on how Storekriti can work for you.
              </p>
              <Button className="mt-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25" asChild>
                <PreloadLink to="/help">Get Answers</PreloadLink>
              </Button>
            </div>

            {/* Right side - Accordion */}
            <div className="space-y-4">
              {FAQ_DATA.map((faq, i) => (
                <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full px-6 py-4 flex items-center justify-between text-left bg-white hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium text-gray-900">{faq.q}</span>
                    {openFaq === i ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-gray-600 bg-gray-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA SECTION ========== */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Redefine the Checkout
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Tap into the power of Storekriti and let's transform your customer's journey together. It's time to lead the charge in D2C commerce.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="rounded-full bg-white text-blue-700 hover:bg-white/90 px-8 h-12 text-base shadow-xl" asChild>
                <PreloadLink to="/authentication">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </PreloadLink>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 px-8 h-12 text-base" asChild>
                <PreloadLink to="/features">Explore Features</PreloadLink>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Storekriti</span>
              </Link>
              <p className="text-sm text-gray-400 mb-6">
                Streamlining your checkout experience with cutting-edge, one-click solution that converts.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <Users className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Menu */}
            <div>
              <h4 className="text-white font-semibold mb-4">Menu</h4>
              <ul className="space-y-3">
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/help" className="text-gray-400 hover:text-white transition-colors">FAQs</Link></li>
                <li><Link to="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About us</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact us</Link></li>
                <li><Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact us</h4>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm">hello@storekriti.com</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
            Copyright © 2025 Storekriti | All Rights Reserved
          </div>
        </div>
      </footer>

      {/* Marquee animation style */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
