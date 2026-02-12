import { Link } from 'react-router-dom';
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  MapPin,
  Phone,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface D2CFooterProps {
  storeName: string;
  storeSlug: string;
  logoPath?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export function D2CFooter({
  storeName,
  storeSlug,
  logoPath,
  address,
  phone,
  email
}: D2CFooterProps) {
  const { isCustomDomain } = useCustomDomain();

  const getLogoUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return supabase.storage.from('store-assets').getPublicUrl(path).data.publicUrl;
  };

  // Helper to generate correct links based on domain context
  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  return (
    <footer className="bg-neutral-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-sm tracking-[0.3em] text-neutral-400 mb-4">
              SUBSCRIBE TO OUR NEWSLETTER
            </h3>
            <p className="text-2xl lg:text-3xl font-light mb-8">
              Get 10% off your first order
            </p>
            <div className="flex gap-0">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 bg-transparent border border-neutral-700 rounded-none text-white placeholder:text-neutral-500 focus-visible:ring-0 focus-visible:border-white"
              />
              <Button className="h-12 px-8 bg-white text-neutral-900 rounded-none hover:bg-neutral-100">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            {logoPath ? (
              <img src={getLogoUrl(logoPath)} alt={storeName} className="h-8 w-auto mb-6 invert" />
            ) : (
              <h2 className="text-lg font-light tracking-[0.15em] mb-6">
                {storeName.toUpperCase()}
              </h2>
            )}
            <p className="text-neutral-400 text-sm font-light leading-relaxed">
              Curated collection of premium products, crafted with excellence and designed for those who appreciate quality.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-xs tracking-[0.2em] text-neutral-400 mb-6">SHOP</h4>
            <nav className="space-y-4">
              <Link to={getLink('/products')} className="block text-sm font-light hover:text-neutral-300 transition-colors">
                All Products
              </Link>
              <Link to={getLink('/products')} className="block text-sm font-light hover:text-neutral-300 transition-colors">
                New Arrivals
              </Link>
              <Link to={getLink('/products')} className="block text-sm font-light hover:text-neutral-300 transition-colors">
                Best Sellers
              </Link>
              <Link to={getLink('/products')} className="block text-sm font-light hover:text-neutral-300 transition-colors">
                Sale
              </Link>
            </nav>
          </div>

          {/* Help Links */}
          <div>
            <h4 className="text-xs tracking-[0.2em] text-neutral-400 mb-6">HELP</h4>
            <nav className="space-y-4">
              <Link to="#" className="block text-sm font-light hover:text-neutral-300 transition-colors">
                Contact Us
              </Link>
              <Link to="#" className="block text-sm font-light hover:text-neutral-300 transition-colors">
                FAQs
              </Link>
              <Link to="#" className="block text-sm font-light hover:text-neutral-300 transition-colors">
                Shipping & Returns
              </Link>
              <Link to="#" className="block text-sm font-light hover:text-neutral-300 transition-colors">
                Size Guide
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.2em] text-neutral-400 mb-6">CONTACT</h4>
            <div className="space-y-4">
              {email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-0.5 text-neutral-400" />
                  <a href={`mailto:${email}`} className="text-sm font-light hover:text-neutral-300 transition-colors">
                    {email}
                  </a>
                </div>
              )}
              {phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-0.5 text-neutral-400" />
                  <a href={`tel:${phone}`} className="text-sm font-light hover:text-neutral-300 transition-colors">
                    {phone}
                  </a>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-neutral-400 flex-shrink-0" />
                  <span className="text-sm font-light text-neutral-400">{address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral-500">
              © {new Date().getFullYear()} {storeName}. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">We accept</span>
              <div className="flex gap-2">
                {['Visa', 'MC', 'Amex', 'UPI'].map(method => (
                  <span key={method} className="text-xs px-2 py-1 border border-neutral-700 text-neutral-400">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
