import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, ChevronDown, Heart, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface UnifiedHeaderProps {
  storeName: string;
  storeSlug: string;
  logoPath?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: () => void;
  cartCount?: number;
  wishlistCount?: number;
  categories?: Category[];
  accentColor?: string;
}

export function UnifiedHeader({
  storeName,
  storeSlug,
  logoPath,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  cartCount = 0,
  wishlistCount = 0,
  categories = [],
  accentColor = 'primary'
}: UnifiedHeaderProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const getLogoUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return supabase.storage.from('store-assets').getPublicUrl(path).data.publicUrl;
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/store/${storeSlug}/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
    onSearchSubmit?.();
  };

  const accentBg = accentColor === 'green' ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90';
  const accentText = accentColor === 'green' ? 'text-green-600' : 'text-primary';
  const focusRing = accentColor === 'green' ? 'ring-green-500' : 'ring-primary';

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-neutral-100">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to={`/store/${storeSlug}`} className="flex items-center gap-2 shrink-0">
              {logoPath ? (
                <img src={getLogoUrl(logoPath)} alt={storeName} className="h-10 w-auto object-contain" />
              ) : (
                <span className="font-bold text-2xl text-neutral-900">{storeName}</span>
              )}
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className={`relative flex items-center bg-neutral-100 rounded-xl transition-all ${isFocused ? `ring-2 ${focusRing}` : ''}`}>
                <Search className="absolute left-4 w-5 h-5 text-neutral-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 pr-4 h-12 bg-transparent border-none rounded-xl focus-visible:ring-0 text-base"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link to={`/store/${storeSlug}/wishlist`}>
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${accentBg} text-white text-xs flex items-center justify-center`}>
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to={`/store/${storeSlug}/account`}>
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Link to={`/store/${storeSlug}/cart`}>
                <Button className={`${accentBg} text-white font-medium h-11 px-5 rounded-xl`}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-sm">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>

          {/* Categories Row */}
          {categories.length > 0 && (
            <div className="flex items-center gap-6 mt-3 overflow-x-auto scrollbar-hide">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/store/${storeSlug}/products?category=${cat.slug}`}
                  className="text-sm text-neutral-600 hover:text-neutral-900 whitespace-nowrap font-medium transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
              {categories.length > 8 && (
                <Link
                  to={`/store/${storeSlug}/categories`}
                  className={`text-sm ${accentText} whitespace-nowrap font-medium`}
                >
                  View All
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4">
          <Link to={`/store/${storeSlug}`} className="flex items-center gap-2">
            {logoPath ? (
              <img src={getLogoUrl(logoPath)} alt={storeName} className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-bold text-xl text-neutral-900">{storeName}</span>
            )}
          </Link>

          <div className="flex items-center gap-2">
            <Link to={`/store/${storeSlug}/wishlist`}>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${accentBg} text-white text-[10px] flex items-center justify-center`}>
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="py-4">
                  <h3 className="font-bold text-lg mb-4">Menu</h3>
                  <div className="space-y-2">
                    <Link 
                      to={`/store/${storeSlug}/account`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100"
                    >
                      <User className="w-5 h-5" />
                      My Account
                    </Link>
                    <Link 
                      to={`/store/${storeSlug}/account/orders`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      My Orders
                    </Link>
                    <Link 
                      to={`/store/${storeSlug}/wishlist`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100"
                    >
                      <Heart className="w-5 h-5" />
                      Wishlist
                    </Link>
                  </div>
                  {categories.length > 0 && (
                    <>
                      <h3 className="font-bold text-lg mt-6 mb-4">Categories</h3>
                      <div className="space-y-1">
                        {categories.slice(0, 10).map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/store/${storeSlug}/products?category=${cat.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block p-2 text-neutral-600 hover:text-neutral-900"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="px-4 pb-3">
          <div className={`relative flex items-center bg-neutral-100 rounded-xl transition-all ${isFocused ? `ring-2 ${focusRing}` : ''}`}>
            <Search className="absolute left-4 w-5 h-5 text-neutral-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-12 pr-4 h-11 bg-transparent border-none rounded-xl focus-visible:ring-0"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
