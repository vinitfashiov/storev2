import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StoreFooterProps {
  storeName: string;
  storeSlug: string;
  address: string | null;
  phone: string | null;
  email?: string | null;
  logoPath?: string | null;
}

export function StoreFooter({ 
  storeName, 
  storeSlug, 
  address, 
  phone, 
  email,
  logoPath 
}: StoreFooterProps) {
  return (
    <footer className="bg-neutral-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
          {/* Store Info */}
          <div>
            {logoPath ? (
              <img 
                src={logoPath} 
                alt={storeName}
                className="h-10 w-auto object-contain mb-4 brightness-0 invert"
              />
            ) : (
              <h3 className="font-serif text-xl font-semibold mb-4">{storeName}</h3>
            )}
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              Discover our exclusive collection of premium products crafted with excellence and designed for those who appreciate quality.
            </p>
            <div className="space-y-3 text-sm text-neutral-400">
              {address && (
                <p className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>{address}</span>
                </p>
              )}
              {phone && (
                <p className="flex items-center gap-3">
                  <Phone className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{phone}</span>
                </p>
              )}
              {email && (
                <p className="flex items-center gap-3">
                  <Mail className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-5">Shop</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to={`/store/${storeSlug}/products`} className="text-neutral-400 hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to={`/store/${storeSlug}/products?sort=newest`} className="text-neutral-400 hover:text-white transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to={`/store/${storeSlug}/products?sort=popular`} className="text-neutral-400 hover:text-white transition-colors">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link to={`/store/${storeSlug}/wishlist`} className="text-neutral-400 hover:text-white transition-colors">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link to={`/store/${storeSlug}/cart`} className="text-neutral-400 hover:text-white transition-colors">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Information Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-5">Information</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to={`/store/${storeSlug}/page/about`} className="text-neutral-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to={`/store/${storeSlug}/page/contact`} className="text-neutral-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to={`/store/${storeSlug}/page/terms`} className="text-neutral-400 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to={`/store/${storeSlug}/page/privacy`} className="text-neutral-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to={`/store/${storeSlug}/page/refund`} className="text-neutral-400 hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-5">Subscribe to Newsletter</h4>
            <p className="text-neutral-400 text-sm mb-4">
              Enter your email to be the first to know about new collections and exclusive launches.
            </p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Your Email"
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 flex-1"
              />
              <Button className="bg-amber-600 hover:bg-amber-700 text-white px-4 shrink-0">
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-500">
              © {new Date().getFullYear()} {storeName}. All Rights Reserved.
            </p>
            
            {/* Payment Icons - UI Only */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500">We Accept:</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-neutral-800 rounded text-xs font-medium">Visa</span>
                <span className="px-2 py-1 bg-neutral-800 rounded text-xs font-medium">MC</span>
                <span className="px-2 py-1 bg-neutral-800 rounded text-xs font-medium">Amex</span>
                <span className="px-2 py-1 bg-neutral-800 rounded text-xs font-medium">PayPal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
