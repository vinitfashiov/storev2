import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, User, LogOut, Package, MapPin, Heart, Menu, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface StoreHeaderProps {
  storeName: string;
  storeSlug: string;
  businessType: 'ecommerce' | 'grocery';
  cartCount: number;
  wishlistCount?: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  logoPath?: string | null;
  categories?: Category[];
}

export function StoreHeader({
  storeName,
  storeSlug,
  businessType,
  cartCount,
  wishlistCount = 0,
  searchQuery,
  onSearchChange,
  logoPath,
  categories = []
}: StoreHeaderProps) {
  const { customer, signOut } = useStoreAuth();
  const { isCustomDomain } = useCustomDomain();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  return (
    <header className="bg-white sticky top-0 z-50">
      {/* Top Promo Bar */}
      <div className="bg-amber-700 text-white text-center py-2 px-4 text-sm">
        <span className="font-medium">Free Shipping on orders above ₹999</span>
        <span className="mx-2">•</span>
        <span>Use code WELCOME10 for 10% off</span>
      </div>

      {/* Main Header */}
      <div className="border-b border-neutral-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="p-4 border-b border-neutral-200">
                  <Link
                    to={getLink('/')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-serif text-xl font-semibold tracking-tight"
                  >
                    {storeName}
                  </Link>
                </div>
                <nav className="p-4 space-y-1">
                  <Link
                    to={getLink('/products')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3 px-2 text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                  >
                    <span>All Products</span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={getLink(`/products?category=${cat.slug}`)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-3 px-2 text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                    >
                      <span>{cat.name}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </Link>
                  ))}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 bg-white">
                  {customer ? (
                    <div className="space-y-2">
                      <Link
                        to={getLink('/account')}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 py-2 text-neutral-700"
                      >
                        <User className="w-5 h-5" />
                        <span>My Account</span>
                      </Link>
                      <button
                        onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                        className="flex items-center gap-3 py-2 text-red-600 w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <Link
                      to={getLink('/login')}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full">Sign In</Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link to={getLink('/')} className="shrink-0">
              {logoPath ? (
                <img
                  src={logoPath}
                  alt={storeName}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <span className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-neutral-900">
                  {storeName}
                </span>
              )}
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 bg-neutral-50 border-neutral-200 focus:bg-white"
                />
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Mobile Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Wishlist */}
              <Link to={getLink('/wishlist')}>
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-medium">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart */}
              <Link to={getLink('/cart')}>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-medium">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Account - Desktop */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white">
                  {customer ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={getLink('/account')} className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          My Account
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={getLink('/account/orders')} className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          My Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={getLink('/account/addresses')} className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Addresses
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={getLink('/login')} className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Sign In
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={getLink('/signup')} className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Create Account
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {searchOpen && (
        <div className="md:hidden border-b border-neutral-200 p-3 bg-neutral-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Category Navigation - Desktop */}
      {categories.length > 0 && (
        <nav className="hidden lg:block border-b border-neutral-100 bg-white">
          <div className="container mx-auto px-4">
            <ul className="flex items-center justify-center gap-8">
              <li>
                <Link
                  to={getLink('/products')}
                  className="inline-block py-3 text-sm font-medium text-neutral-700 hover:text-amber-700 transition-colors relative group"
                >
                  ALL PRODUCTS
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-700 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </Link>
              </li>
              {categories.slice(0, 7).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={getLink(`/products?category=${cat.slug}`)}
                    className="inline-block py-3 text-sm font-medium text-neutral-700 hover:text-amber-700 transition-colors relative group"
                  >
                    {cat.name.toUpperCase()}
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-700 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}

      {/* Category Navigation - Mobile (Scrollable) */}
      {categories.length > 0 && (
        <nav className="lg:hidden border-b border-neutral-100 bg-white overflow-x-auto scrollbar-hide">
          <ul className="flex items-center gap-6 px-4 min-w-max">
            <li>
              <Link
                to={getLink('/products')}
                className="inline-block py-3 text-xs font-medium text-neutral-700 whitespace-nowrap"
              >
                ALL
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  to={getLink(`/products?category=${cat.slug}`)}
                  className="inline-block py-3 text-xs font-medium text-neutral-700 whitespace-nowrap"
                >
                  {cat.name.toUpperCase()}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
