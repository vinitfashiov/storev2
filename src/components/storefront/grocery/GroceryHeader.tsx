import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, MapPin, ChevronDown, Mic, User, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGroceryLocation } from '@/contexts/GroceryLocationContext';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { cn } from '@/lib/utils';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface GroceryHeaderProps {
  storeName: string;
  storeSlug: string;
  tenantId: string;
  logoPath?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: () => void;
  onLocationClick: () => void;
}

export function GroceryHeader({
  storeName,
  storeSlug,
  tenantId,
  logoPath,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onLocationClick
}: GroceryHeaderProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  const { pincode, deliveryArea, isLocationSet } = useGroceryLocation();

  const { isListening, isSupported, startListening, stopListening, transcript } = useVoiceSearch({
    onResult: (result) => {
      onSearchChange(result);
      if (onSearchSubmit) {
        setTimeout(() => onSearchSubmit(), 300);
      }
    },
    language: 'en-IN'
  });

  // Update search when transcript changes
  useEffect(() => {
    if (transcript) {
      onSearchChange(transcript);
    }
  }, [transcript, onSearchChange]);

  const handleVoiceClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClearSearch = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  const locationDisplay = isLocationSet
    ? deliveryArea?.name || pincode
    : 'Set Location';

  return (
    <header className="bg-white sticky top-0 z-40">
      {/* Top Section - Location & Icons */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center justify-between gap-3">
          {/* Location Selector */}
          <button
            onClick={onLocationClick}
            className="flex items-center gap-1.5 flex-1 min-w-0"
          >
            <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex flex-col items-start min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-neutral-900 truncate max-w-[150px]">
                  {locationDisplay}
                </span>
                <ChevronDown className="w-4 h-4 text-neutral-500 flex-shrink-0" />
              </div>
              <span className="text-xs text-neutral-500">India</span>
            </div>
          </button>

          {/* Right Icons */}
          <div className="flex items-center gap-1">
            <Link to={getLink('/wishlist')}>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                <Heart className="w-5 h-5 text-neutral-700" />
              </Button>
            </Link>
            <Link to={getLink('/account')}>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-green-100 hover:bg-green-200">
                <User className="w-5 h-5 text-green-700" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className={cn(
          "relative flex items-center bg-neutral-100 rounded-xl transition-all",
          isFocused && "ring-2 ring-green-500 bg-white",
          isListening && "ring-2 ring-red-500 bg-red-50"
        )}>
          <Search className="absolute left-4 w-5 h-5 text-neutral-400" />
          <Input
            ref={inputRef}
            placeholder={isListening ? "Listening..." : `Search for "Vegetables"`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.()}
            className="pl-12 pr-24 h-12 bg-transparent border-none rounded-xl focus-visible:ring-0 text-base placeholder:text-neutral-400"
          />

          {/* Clear button */}
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-14 p-1.5 hover:bg-neutral-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          )}

          {/* Voice search button */}
          {isSupported && (
            <button
              onClick={handleVoiceClick}
              className={cn(
                "absolute right-3 p-2 rounded-full transition-all",
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-neutral-200 hover:bg-neutral-300 text-neutral-600"
              )}
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Listening indicator */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-red-600">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Listening... Speak now
          </div>
        )}
      </div>
    </header>
  );
}
