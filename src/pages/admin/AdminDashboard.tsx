import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  ExternalLink,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useOptimizedQueries';
import { supabase } from '@/integrations/supabase/client';

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: string;
  plan: string;
  trial_ends_at: string;
}

interface AdminDashboardProps {
  tenant: Tenant;
  isTrialExpired: boolean;
}

export default function AdminDashboard({ tenant, isTrialExpired }: AdminDashboardProps) {
  const { data: stats, isLoading, refetch, isFetching } = useDashboardStats(tenant.id);
  const [todos, setTodos] = useState({
    storeCreated: true, // Always true since they're on the dashboard
    addProducts: false,
    designStore: false,
    setupPayment: false,
    reviewShipping: false,
    customizeDomain: false,
  });
  const [todosLoading, setTodosLoading] = useState(true);

  useEffect(() => {
    const checkTodos = async () => {
      try {
        // Check if products exist
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('is_active', true);
        
        // Check if payment provider is configured
        const { data: integration } = await supabase
          .from('tenant_integrations')
          .select('razorpay_key_id, razorpay_key_secret')
          .eq('tenant_id', tenant.id)
          .maybeSingle();
        const hasPayment = !!(integration?.razorpay_key_id && integration?.razorpay_key_secret);
        
        // Check if shipping rates are configured (delivery_zones or delivery_settings)
        const { count: zonesCount } = await supabase
          .from('delivery_zones')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('is_active', true);
        
        const { data: deliverySettings } = await supabase
          .from('tenant_delivery_settings')
          .select('*')
          .eq('tenant_id', tenant.id)
          .maybeSingle();
        
        const hasShipping = (zonesCount && zonesCount > 0) || !!deliverySettings;
        
        // Check if custom domain is configured
        const { count: domainsCount } = await supabase
          .from('custom_domains')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('status', 'active');
        
        // Check if store has banners or pages (design store)
        const { count: bannersCount } = await supabase
          .from('store_banners')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('is_active', true);
        
        const { count: pagesCount } = await supabase
          .from('store_pages')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('is_published', true);
        
        setTodos({
          storeCreated: true,
          addProducts: (productsCount || 0) > 0,
          designStore: (bannersCount || 0) > 0 || (pagesCount || 0) > 0,
          setupPayment: hasPayment,
          reviewShipping: hasShipping,
          customizeDomain: (domainsCount || 0) > 0,
        });
      } catch (error) {
        console.error('Error checking todos:', error);
      } finally {
        setTodosLoading(false);
      }
    };

    checkTodos();
  }, [tenant.id]);

  const getDaysRemaining = () => {
    const now = new Date();
    const trialEnd = new Date(tenant.trial_ends_at);
    return Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Plan Status */}
      {tenant.plan === 'trial' && !isTrialExpired && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium">{getDaysRemaining()} days left in your trial</p>
                <p className="text-sm text-muted-foreground">Upgrade to Pro for unlimited access</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tenant.plan === 'pro' && (
        <Card className="border-success bg-success/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <div>
                <p className="font-medium">Pro Plan Active</p>
                <p className="text-sm text-muted-foreground">Full access to all features</p>
              </div>
              <Badge className="ml-auto bg-success text-success-foreground">PRO</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Overview (Last 30 Days)</h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-display font-bold">
                {formatCurrency(Number(stats?.total_revenue) || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-display font-bold">
                  {formatNumber(Number(stats?.total_orders) || 0)}
                </span>
                {Number(stats?.pending_orders) > 0 && (
                  <Badge variant="outline" className="text-warning border-warning">
                    {stats?.pending_orders} pending
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-display font-bold">-</span>
                {Number(stats?.low_stock_products) > 0 && (
                  <Badge variant="destructive">
                    {stats?.low_stock_products} low stock
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-display font-bold">
                {formatNumber(Number(stats?.total_customers) || 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Avg Order Value */}
      {stats && Number(stats.avg_order_value) > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Order Value</p>
                <p className="text-xl font-bold">{formatCurrency(Number(stats.avg_order_value))}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your store</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="w-full justify-start h-12">
              <Link to="/dashboard/products">
                <Package className="w-4 h-4 mr-2" />
                <span className="truncate">Products</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start h-12">
              <Link to="/dashboard/orders">
                <ShoppingBag className="w-4 h-4 mr-2" />
                <span className="truncate">Orders</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start h-12">
              <Link to="/dashboard/integrations">
                <CreditCard className="w-4 h-4 mr-2" />
                <span className="truncate">Payments</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start h-12">
              <Link to={`/store/${tenant.store_slug}`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" />
                <span className="truncate">Store</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold">To-dos</CardTitle>
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-purple-300">
              {[
                todos.storeCreated,
                todos.addProducts,
                todos.designStore,
                todos.setupPayment,
                todos.reviewShipping,
                todos.customizeDomain
              ].filter(Boolean).length}/6
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {todosLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                {/* Store Created */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  todos.storeCreated 
                    ? 'bg-success/10' 
                    : 'bg-transparent'
                }`}>
                  {todos.storeCreated ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                  <span className={`text-sm leading-tight ${
                    todos.storeCreated 
                      ? 'text-success font-medium line-through' 
                      : 'text-gray-600'
                  }`}>
                    Add store name
                  </span>
                </div>

                {/* Add Products */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  todos.addProducts 
                    ? 'bg-success/10' 
                    : 'bg-transparent'
                }`}>
                  {todos.addProducts ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                  <span className={`text-sm leading-tight ${
                    todos.addProducts 
                      ? 'text-success font-medium line-through' 
                      : 'text-gray-600'
                  }`}>
                    Add your first product
                  </span>
                </div>

                {/* Design Store */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  todos.designStore 
                    ? 'bg-success/10' 
                    : 'bg-transparent'
                }`}>
                  {todos.designStore ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                  <span className={`text-sm leading-tight ${
                    todos.designStore 
                      ? 'text-success font-medium line-through' 
                      : 'text-gray-600'
                  }`}>
                    Design your store
                  </span>
                </div>

                {/* Setup Payment */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  todos.setupPayment 
                    ? 'bg-success/10' 
                    : 'bg-transparent'
                }`}>
                  {todos.setupPayment ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                  <span className={`text-sm leading-tight ${
                    todos.setupPayment 
                      ? 'text-success font-medium line-through' 
                      : 'text-gray-600'
                  }`}>
                    Set up a payment provider
                  </span>
                </div>

                {/* Review Shipping */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  todos.reviewShipping 
                    ? 'bg-success/10' 
                    : 'bg-transparent'
                }`}>
                  {todos.reviewShipping ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                  <span className={`text-sm leading-tight ${
                    todos.reviewShipping 
                      ? 'text-success font-medium line-through' 
                      : 'text-gray-600'
                  }`}>
                    Review your shipping rates
                  </span>
                </div>

                {/* Customize Domain */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  todos.customizeDomain 
                    ? 'bg-success/10' 
                    : 'bg-transparent'
                }`}>
                  {todos.customizeDomain ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                  <span className={`text-sm leading-tight ${
                    todos.customizeDomain 
                      ? 'text-success font-medium line-through' 
                      : 'text-gray-600'
                  }`}>
                    Customize your domain
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
