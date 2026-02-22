import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
}

// Loading skeleton for orders page
const OrdersSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-4 h-4 bg-muted rounded animate-pulse" />
        <div className="w-24 h-4 bg-muted rounded animate-pulse" />
      </div>
      <div className="w-32 h-8 bg-muted rounded animate-pulse mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <div className="w-24 h-4 bg-muted rounded animate-pulse" />
              <div className="w-16 h-5 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex justify-between">
              <div className="w-20 h-3 bg-muted rounded animate-pulse" />
              <div className="w-16 h-4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function StoreOrders() {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const { customer, loading: authLoading } = useStoreAuth();
  const { isCustomDomain, tenant: cdTenant } = useCustomDomain();
  const slug = isCustomDomain ? cdTenant?.store_slug : paramSlug;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${slug}${cleanPath}`;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!customer) {
        setLoading(false);
        return;
      }

      const { data } = await supabaseStore
        .from('orders')
        .select('id, order_number, status, payment_status, total, created_at')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
      setLoading(false);
    };

    if (!authLoading) {
      fetchOrders();
    }
  }, [customer, authLoading]);

  // Show skeleton while auth is loading
  if (authLoading) return <OrdersSkeleton />;

  if (!customer) {
    return (
      <div className="min-h-screen bg-white flex flex-col pt-20 items-center px-4">
        <User className="w-12 h-12 mb-6 text-neutral-300" />
        <h2 className="text-2xl font-serif text-neutral-900 tracking-tight mb-2">Please log in</h2>
        <p className="text-neutral-500 mb-8 text-center">You need to log in to view your orders.</p>
        <Link to={getLink('/login')}>
          <Button className="rounded-none px-8 py-6 text-sm tracking-widest uppercase bg-black text-white hover:bg-neutral-800">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'confirmed':
      case 'packed': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default: return 'bg-neutral-50 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-3xl flex-1">
        <Link to={getLink('/account')} className="flex items-center gap-2 text-neutral-500 hover:text-black mb-8 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium uppercase tracking-widest">Back to account</span>
        </Link>

        <h1 className="text-3xl font-serif text-neutral-900 tracking-tight mb-8">My Orders</h1>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-black animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-neutral-50 p-6 border border-neutral-100">
            <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="font-medium text-lg text-neutral-900 mb-2">No orders yet</h3>
            <p className="text-neutral-500 mb-6">Discover our latest collections and place your first order.</p>
            <Link to={getLink('/products')}>
              <Button className="rounded-none px-8 py-6 text-sm tracking-widest uppercase bg-black text-white hover:bg-neutral-800">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} to={getLink(`/account/orders/${order.id}`)} className="block group">
                <div className="border border-neutral-200 p-6 hover:border-black transition-colors bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div>
                      <span className="text-sm text-neutral-500 uppercase tracking-widest font-semibold block mb-1">Order Number</span>
                      <span className="font-medium text-neutral-900">#{order.order_number}</span>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest border ${getStatusColor(order.status)} w-fit`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-end pt-4 border-t border-neutral-100">
                    <div>
                      <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-1">Placed On</p>
                      <p className="font-medium text-neutral-900">{format(new Date(order.created_at), 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-1">Total Amount</p>
                      <p className="font-medium text-neutral-900 text-lg">₹{order.total.toFixed(2)}</p>
                    </div>
                  </div>
                  {order.payment_status === 'unpaid' && (
                    <div className="mt-4 pt-4 border-t border-neutral-100">
                      <span className="text-xs text-red-600 font-semibold uppercase tracking-widest">
                        Payment Pending
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
