import { useState, useEffect } from 'react';
import { D2CHeader } from './d2c/D2CHeader';
import { useStoreData, useStoreSettings, useStoreCategories } from '@/hooks/useOptimizedQueries';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface StoreHeaderProps {
  storeName: string;
  storeSlug: string;
  businessType?: 'ecommerce' | 'grocery';
  cartCount: number;
  wishlistCount?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  logoPath?: string | null;
  categories?: Category[];
}

export function StoreHeader({
  storeName,
  storeSlug,
  businessType,
  cartCount,
  wishlistCount = 0,
  searchQuery = '',
  onSearchChange,
  logoPath,
  categories = []
}: StoreHeaderProps) {
  // Fetch missing data if it wasn't provided by the parent
  const { data: tenant } = useStoreData(storeSlug);
  const { data: storeSettings } = useStoreSettings(tenant?.id);
  const { data: fetchedCategories } = useStoreCategories(tenant?.id, 12);

  const finalLogoPath = logoPath || storeSettings?.logo_path;
  const finalCategories = categories.length > 0 ? categories : (fetchedCategories || []);

  return (
    <D2CHeader
      storeName={storeName}
      storeSlug={storeSlug}
      logoPath={finalLogoPath}
      cartCount={cartCount}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      categories={finalCategories}
    />
  );
}
