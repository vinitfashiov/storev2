import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryAuthProvider, useDeliveryAuth } from '@/contexts/DeliveryAuthContext';
import DeliveryLogin from './DeliveryLogin';
import DeliveryDashboard from './DeliveryDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Truck } from 'lucide-react';

interface Tenant {
  id: string;
  store_name: string;
  business_type: 'ecommerce' | 'grocery';
  is_active: boolean;
}

function DeliveryPanelContent({ tenant, storeSlug }: { tenant: Tenant; storeSlug: string }) {
  const { deliveryBoy, loading } = useDeliveryAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!deliveryBoy) {
    return <DeliveryLogin storeSlug={storeSlug} storeName={tenant.store_name} />;
  }

  return <DeliveryDashboard />;
}

export default function DeliveryPanel() {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) {
        setError('Store not found');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tenants')
        .select('id, store_name, business_type, is_active')
        .eq('store_slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        setError('Store not found');
      } else if (data.business_type !== 'grocery') {
        setError('Delivery system not available for this store');
      } else {
        setTenant(data as Tenant);
      }
      
      setLoading(false);
    };

    fetchTenant();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{error || 'Not available'}</h1>
            <p className="text-muted-foreground">
              The delivery portal is not available for this store.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DeliveryAuthProvider storeSlug={slug!}>
      <DeliveryPanelContent tenant={tenant} storeSlug={slug!} />
    </DeliveryAuthProvider>
  );
}
