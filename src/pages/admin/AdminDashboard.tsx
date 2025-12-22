import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  Users,
  ExternalLink,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

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
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, customers: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('total, status').eq('tenant_id', tenant.id),
        supabase.from('products').select('id').eq('tenant_id', tenant.id).eq('is_active', true)
      ]);

      const orders = ordersRes.data || [];
      const revenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0);
      
      setStats({
        revenue,
        orders: orders.length,
        products: productsRes.data?.length || 0,
        customers: new Set(orders.map(o => o.status)).size // Placeholder
      });
    };

    fetchStats();
  }, [tenant.id]);

  const getDaysRemaining = () => {
    const now = new Date();
    const trialEnd = new Date(tenant.trial_ends_at);
    return Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">₹{stats.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{stats.orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{stats.products}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{stats.customers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/dashboard/products">
              <Button variant="outline" className="w-full justify-start">
                <Package className="w-4 h-4 mr-2" /> Manage Products
              </Button>
            </Link>
            <Link to="/dashboard/orders">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingBag className="w-4 h-4 mr-2" /> View Orders
              </Button>
            </Link>
            <Link to="/dashboard/integrations">
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="w-4 h-4 mr-2" /> Configure Payments
              </Button>
            </Link>
            <Link to={`/store/${tenant.store_slug}`} target="_blank">
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="w-4 h-4 mr-2" /> View Storefront
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Complete these steps to launch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="font-medium text-success">Store Created</span>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg ${stats.products > 0 ? 'bg-success/10' : 'bg-muted'}`}>
              {stats.products > 0 ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
              )}
              <span className={stats.products > 0 ? 'text-success font-medium' : ''}>Add Products</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
              <span>Configure Payments</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
              <span>First Sale</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
