import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Store, Package, ShoppingBag, TrendingUp, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface SystemStats {
    totalUsers: number;
    totalTenants: number;
    totalProducts: number;
    totalOrders: number;
    recentUsers: Array<{ id: string; email: string; created_at: string }>;
    recentTenants: Array<{ id: string; store_name: string; created_at: string }>;
}

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSystemStats();
    }, []);

    const loadSystemStats = async () => {
        try {
            setLoading(true);

            // Fetch all stats in parallel
            const [
                { count: usersCount },
                { count: tenantsCount },
                { count: productsCount },
                { count: ordersCount },
                { data: recentUsers },
                { data: recentTenants }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('tenants').select('*', { count: 'exact', head: true }),
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('orders').select('*', { count: 'exact', head: true }),
                supabase
                    .from('profiles')
                    .select('id, email, created_at')
                    .order('created_at', { ascending: false })
                    .limit(10),
                supabase
                    .from('tenants')
                    .select('id, store_name, created_at')
                    .order('created_at', { ascending: false })
                    .limit(10)
            ]);

            setStats({
                totalUsers: usersCount || 0,
                totalTenants: tenantsCount || 0,
                totalProducts: productsCount || 0,
                totalOrders: ordersCount || 0,
                recentUsers: recentUsers || [],
                recentTenants: recentTenants || []
            });
        } catch (error) {
            console.error('Error loading system stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: Users,
            description: 'Registered users',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            title: 'Total Stores',
            value: stats?.totalTenants || 0,
            icon: Store,
            description: 'Active tenants',
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            title: 'Total Products',
            value: stats?.totalProducts || 0,
            icon: Package,
            description: 'Across all stores',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            title: 'Total Orders',
            value: stats?.totalOrders || 0,
            icon: ShoppingBag,
            description: 'All-time orders',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
        }
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        System-wide overview and data management
                    </p>
                </div>
                <Link to="/dashboard/super-admin/data-browser">
                    <Button>
                        <Activity className="w-4 h-4 mr-2" />
                        Data Browser
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Recent Users */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Recent Users
                        </CardTitle>
                        <CardDescription>Last 10 user signups</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats?.recentUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{user.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Link to="/dashboard/super-admin/data-browser?table=profiles">
                                        <Button variant="ghost" size="sm">View</Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Stores */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="w-5 h-5" />
                            Recent Stores
                        </CardTitle>
                        <CardDescription>Last 10 store creations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats?.recentTenants.map((tenant) => (
                                <div
                                    key={tenant.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{tenant.store_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(tenant.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Link to="/dashboard/super-admin/data-browser?table=tenants">
                                        <Button variant="ghost" size="sm">View</Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Quick Access
                    </CardTitle>
                    <CardDescription>Browse data by table</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Users', table: 'profiles' },
                            { label: 'Stores', table: 'tenants' },
                            { label: 'Products', table: 'products' },
                            { label: 'Orders', table: 'orders' },
                            { label: 'Customers', table: 'customers' },
                            { label: 'Categories', table: 'categories' },
                            { label: 'Brands', table: 'brands' },
                            { label: 'Coupons', table: 'coupons' }
                        ].map((item) => (
                            <Link
                                key={item.table}
                                to={`/dashboard/super-admin/data-browser?table=${item.table}`}
                            >
                                <Button variant="outline" className="w-full">
                                    {item.label}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
