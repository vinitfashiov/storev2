import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, MapPin, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GroceryHeaderProps {
  storeName: string;
  storeSlug: string;
  logoPath?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: () => void;
  deliveryAddress?: string;
}

export function GroceryHeader({
  storeName,
  storeSlug,
  logoPath,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  deliveryAddress
}: GroceryHeaderProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <header className="bg-white sticky top-0 z-40">
      {/* Top Section - Store Name & Address */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Link to={`/store/${storeSlug}`} className="flex items-center gap-2">
              {logoPath ? (
                <img src={logoPath} alt={storeName} className="h-7 w-auto object-contain" />
              ) : (
                <span className="font-bold text-lg text-neutral-900">
                  From <span className="text-green-600">{storeName}</span> to
                </span>
              )}
            </Link>
            {deliveryAddress && (
              <button className="flex items-center gap-1 text-sm text-neutral-600 mt-0.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{deliveryAddress}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
          <Link to={`/store/${storeSlug}/wishlist`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Heart className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className={`relative flex items-center bg-neutral-100 rounded-full transition-all ${isFocused ? 'ring-2 ring-green-500' : ''}`}>
          <Search className="absolute left-4 w-5 h-5 text-neutral-400" />
          <Input
            placeholder={`Search for "Vegetables"`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.()}
            className="pl-12 pr-12 h-12 bg-transparent border-none rounded-full focus-visible:ring-0 text-base"
          />
          <button className="absolute right-4 p-1.5 rounded-full bg-neutral-200 hover:bg-neutral-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
