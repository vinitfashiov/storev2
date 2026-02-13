import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, MapPin, ChevronDown, User, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useGroceryLocation } from '@/contexts/GroceryLocationContext';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface GroceryDesktopHeaderProps {
  storeName: string;
  storeSlug: string;
  logoPath?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: () => void;
  deliveryAddress?: string;
  cartCount?: number;
  onLocationClick?: () => void;
}

export function GroceryDesktopHeader({
  storeName,
  storeSlug,
  logoPath,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  deliveryAddress,
  cartCount = 0,
  onLocationClick
}: GroceryDesktopHeaderProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { pincode, deliveryArea, isLocationSet } = useGroceryLocation();
  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  const getLogoUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return supabase.storage.from('store-assets').getPublicUrl(path).data.publicUrl;
  };

  const locationDisplay = isLocationSet
    ? deliveryArea?.name || pincode || 'Location set'
    : 'Select location';

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link to={getLink('/')} className="flex items-center gap-2 shrink-0">
            {logoPath ? (
              <img src={getLogoUrl(logoPath)} alt={storeName} className="h-10 w-auto object-contain" />
            ) : (
              <span className="font-bold text-2xl text-green-600">{storeName}</span>
            )}
          </Link>

          {/* Delivery Address - Now clickable */}
          <button
            onClick={onLocationClick}
            className="flex flex-col items-start shrink-0 hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-neutral-900">Delivery in 8 minutes</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-neutral-600 group-hover:text-green-600 transition-colors">
              <span className="truncate max-w-[180px]">{locationDisplay}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className={`relative flex items-center bg-neutral-100 rounded-lg transition-all ${isFocused ? 'ring-2 ring-green-500' : ''}`}>
              <Search className="absolute left-4 w-5 h-5 text-neutral-400" />
              <Input
                placeholder='Search "Bread"'
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.()}
                className="pl-12 pr-4 h-11 bg-transparent border-none rounded-lg focus-visible:ring-0 text-base"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to={getLink('/wishlist')}>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-neutral-600 hover:text-green-600 hover:bg-green-50">
                <Heart className="w-5 h-5" />
              </Button>
            </Link>
            <Link to={getLink('/account')}>
              <Button variant="ghost" className="text-neutral-700 hover:text-green-600 hover:bg-green-50 font-medium">
                <User className="w-4 h-4 mr-2" />
                Account
              </Button>
            </Link>
            <Link to={getLink('/cart')}>
              <Button className="bg-green-600 hover:bg-green-700 text-white font-medium h-10 px-4 rounded-lg">
                <ShoppingCart className="w-4 h-4 mr-2" />
                My Cart
                {cartCount > 0 && (
                  <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-sm">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
