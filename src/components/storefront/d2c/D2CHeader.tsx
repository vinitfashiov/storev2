import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface D2CHeaderProps {
  storeName: string;
  storeSlug: string;
  logoPath?: string | null;
  cartCount?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: () => void;
  categories?: Array<{ id: string; name: string; slug: string }>;
}

export function D2CHeader({
  storeName,
  storeSlug,
  logoPath,
  cartCount = 0,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  categories = []
}: D2CHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`${getLink('/products')}?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <>

      {/* Main Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between px-8 py-4">
            {/* Left - Navigation */}
            <nav className="flex items-center gap-8">
              <Link
                to={getLink('/products')}
                className="text-sm font-medium tracking-wide text-neutral-600 hover:text-neutral-900 hover:underline underline-offset-4 decoration-2 transition-all"
              >
                SHOP
              </Link>
              {categories.slice(0, 4).map(cat => (
                <Link
                  key={cat.id}
                  to={`${getLink('/products')}?category=${cat.slug}`}
                  className="text-sm font-medium tracking-wide text-neutral-600 hover:text-neutral-900 hover:underline underline-offset-4 decoration-2 transition-all"
                >
                  {cat.name.toUpperCase()}
                </Link>
              ))}
            </nav>

            {/* Center - Logo */}
            <Link to={getLink('/')} className="absolute left-1/2 -translate-x-1/2">
              {logoPath ? (
                <img src={getLogoUrl(logoPath)} alt={storeName} className="h-8 w-auto object-contain" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                  {storeName.toUpperCase()}
                </h1>
              )}
            </Link>

            {/* Right - Actions */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <Link
                to={getLink('/account')}
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
                aria-label="Account"
              >
                <User className="w-5 h-5" />
              </Link>
              <Link
                to={getLink('/wishlist')}
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>
              <Link
                to={getLink('/cart')}
                className="text-neutral-600 hover:text-neutral-900 transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2 -ml-2">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-sm p-0">
                <div className="p-6">
                  <Link to={getLink('/')} className="block mb-8">
                    {logoPath ? (
                      <img src={getLogoUrl(logoPath)} alt={storeName} className="h-6 w-auto" />
                    ) : (
                      <h1 className="text-lg font-light tracking-[0.15em]">
                        {storeName.toUpperCase()}
                      </h1>
                    )}
                  </Link>

                  <nav className="space-y-6">
                    <Link
                      to={getLink('/products')}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-lg font-light tracking-wide"
                    >
                      Shop All
                    </Link>
                    {categories.slice(0, 6).map(cat => (
                      <Link
                        key={cat.id}
                        to={`${getLink('/products')}?category=${cat.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-lg font-light tracking-wide text-neutral-600"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-12 pt-8 border-t border-neutral-100 space-y-6">
                    <Link
                      to={getLink('/account')}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-sm tracking-wide"
                    >
                      <User className="w-5 h-5" />
                      Account
                    </Link>
                    <Link
                      to={getLink('/wishlist')}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-sm tracking-wide"
                    >
                      <Heart className="w-5 h-5" />
                      Wishlist
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link to={getLink('/')}>
              {logoPath ? (
                <img src={getLogoUrl(logoPath)} alt={storeName} className="h-7 w-auto object-contain" />
              ) : (
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                  {storeName.toUpperCase()}
                </h1>
              )}
            </Link>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <Link to={getLink('/cart')} className="p-2 relative text-neutral-600 hover:text-neutral-900 transition-colors" aria-label="Cart">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-white">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-light tracking-wide">SEARCH</h2>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 -mr-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative">
              <Input
                type="text"
                placeholder="What are you looking for?"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full h-14 text-lg border-0 border-b-2 border-neutral-900 rounded-none px-0 focus-visible:ring-0 placeholder:text-neutral-400"
                autoFocus
              />
              <button
                onClick={handleSearch}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-12">
              <h3 className="text-xs font-medium tracking-[0.2em] text-neutral-500 mb-4">POPULAR SEARCHES</h3>
              <div className="flex flex-wrap gap-2">
                {['New Arrivals', 'Best Sellers', 'On Sale'].map(term => (
                  <button
                    key={term}
                    onClick={() => {
                      onSearchChange?.(term);
                      handleSearch();
                    }}
                    className="px-4 py-2 border border-neutral-200 text-sm hover:border-neutral-900 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
