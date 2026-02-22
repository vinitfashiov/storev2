import { D2CFooter } from './d2c/D2CFooter';
import { useStoreData, useStoreSettings } from '@/hooks/useOptimizedQueries';

interface StoreFooterProps {
  storeName: string;
  storeSlug: string;
  address: string | null;
  phone: string | null;
  email?: string | null;
  logoPath?: string | null;
  businessType?: 'ecommerce' | 'grocery';
}

export function StoreFooter({
  storeName,
  storeSlug,
  address,
  phone,
  email,
  logoPath,
  businessType
}: StoreFooterProps) {
  // Fetch missing data if not provided
  const { data: tenant } = useStoreData(storeSlug);
  const { data: storeSettings } = useStoreSettings(tenant?.id);

  const finalLogoPath = logoPath || storeSettings?.logo_path;

  return (
    <D2CFooter
      storeName={storeName}
      storeSlug={storeSlug}
      address={address}
      phone={phone}
      email={email}
      logoPath={finalLogoPath}
    />
  );
}
