import SEOHead from "@/components/shared/SEOHead";

export default function PrivacyPolicy() {
  return (
    <>
      <SEOHead
        title="Privacy Policy – Storekriti"
        description="Read Storekriti's Privacy Policy to understand how we collect, use, and protect your personal information."
        canonicalUrl="https://storekriti.com/privacy-policy"
      />

      <div className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl font-display font-bold mb-8">Privacy Policy</h1>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p>Last updated: February 1, 2026</p>
            <p>1. Introduction...</p>
            <p>2. Data Collection...</p>
            <p>3. Data Usage...</p>
            {/* Placeholder content - standard legal text would go here */}
            <p className="italic">This is a placeholder for the full legal text.</p>
          </div>
        </div>
      </div>
    </>
  );
}
