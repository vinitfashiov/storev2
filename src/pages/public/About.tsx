import SEOHead from "@/components/shared/SEOHead";

export default function About() {
  return (
    <>
      <SEOHead
        title="About Storekriti – Our Mission & Story"
        description="Storekriti is on a mission to democratize ecommerce for everyone. Learn about our journey, values, and the team building the future of commerce."
        canonicalUrl="https://storekriti.com/about"
      />

      <div className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl font-display font-bold tracking-tight mb-8">About Storekriti</h1>
          <div className="prose prose-emerald max-w-none">
            <p className="text-xl text-muted-foreground mb-6">
              Storekriti is India's first D2C ecommerce business enabler, designed to help anyone launch an online store
              in minutes.
            </p>
            <p>
              We believe that technology should be an equalizer, not a barrier. That's why we built a platform that
              combines enterprise-grade power with consumer-grade simplicity. Whether you're a home baker, a fashion
              designer, or a large retail brand, Storekriti gives you platform the tools to succeed online.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
