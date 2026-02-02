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
                    <h1 className="text-3xl font-display font-bold mb-8">
                        Privacy Policy
                    </h1>

                    <div className="prose prose-sm max-w-none text-muted-foreground">
                        <p><strong>Last updated:</strong> February 2, 2026</p>

                        <p>
                            Welcome to <strong>Storekriti</strong> (“we”, “our”, “us”).
                            This Privacy Policy explains how we collect, use, disclose,
                            and protect your information when you use our website
                            <strong> https://storekriti.com</strong> and related services.
                        </p>

                        <h2>1. Information We Collect</h2>

                        <p><strong>a) Personal Information</strong></p>
                        <ul>
                            <li>Mobile phone number (used for OTP-based login/signup)</li>
                            <li>Name (if provided)</li>
                            <li>Store details such as store name, products, pricing, and content</li>
                            <li>Payment-related metadata (transaction ID, status)</li>
                        </ul>

                        <p>
                            <strong>Note:</strong> We do <strong>not</strong> store your
                            card details, UPI IDs, or banking credentials.
                        </p>

                        <p><strong>b) Automatically Collected Information</strong></p>
                        <ul>
                            <li>IP address</li>
                            <li>Device and browser information</li>
                            <li>Pages visited and usage activity</li>
                            <li>Cookies and session data</li>
                        </ul>

                        <h2>2. How We Use Your Information</h2>
                        <ul>
                            <li>To authenticate users via OTP</li>
                            <li>To create and manage online stores</li>
                            <li>To process payments and subscriptions</li>
                            <li>To improve platform performance and user experience</li>
                            <li>To communicate service updates and notifications</li>
                            <li>To prevent fraud and unauthorized access</li>
                            <li>To comply with legal and regulatory requirements</li>
                        </ul>

                        <h2>3. Payments and Third-Party Services</h2>
                        <p>
                            Payments on Storekriti are processed using trusted
                            third-party payment gateways such as Razorpay or similar providers.
                        </p>
                        <p>
                            All payment information is handled directly by the payment
                            provider and is subject to their privacy policies.
                            Storekriti does not store sensitive payment details.
                        </p>

                        <p>
                            We may also use third-party services for analytics, hosting,
                            messaging, and infrastructure support.
                            These providers receive only the data necessary to perform their services.
                        </p>

                        <h2>4. Cookies</h2>
                        <p>
                            We use cookies to maintain login sessions, enhance functionality,
                            and analyze usage patterns.
                            You can disable cookies through your browser settings,
                            but some features may not function properly.
                        </p>

                        <h2>5. Data Security</h2>
                        <p>
                            We implement reasonable technical and organizational measures
                            such as HTTPS encryption, secure servers, and access controls
                            to protect your information.
                            However, no internet transmission is completely secure.
                        </p>

                        <h2>6. Data Retention</h2>
                        <p>
                            We retain your information only as long as your account remains active
                            or as required by applicable laws and regulations.
                            You may request account deletion by contacting us.
                        </p>

                        <h2>7. Your Rights</h2>
                        <ul>
                            <li>Access your personal information</li>
                            <li>Correct inaccurate or incomplete data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Withdraw consent where applicable</li>
                        </ul>

                        <h2>8. Children’s Privacy</h2>
                        <p>
                            Storekriti is not intended for individuals under the age of 18.
                            We do not knowingly collect personal data from children.
                        </p>

                        <h2>9. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time.
                            Any changes will be posted on this page with an updated date.
                        </p>

                        <h2>10. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy,
                            please contact us at:
                        </p>
                        <p>
                            <strong>Email:</strong> support@storekriti.com<br />
                            <strong>Website:</strong> https://storekriti.com
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
