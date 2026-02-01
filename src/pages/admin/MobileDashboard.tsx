import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Bell,
    ShoppingBag,
    Users,
    Clock,
    Wallet,
    CheckCircle2,
    Activity,
    Globe,
    Zap,
    Plus,
    Share2,
    Settings,
    AlertTriangle,
    ChevronRight,
    CreditCard
} from 'lucide-react';
import { useDashboardStats, useAnalyticsSummary, useRecentOrders } from '@/hooks/useOptimizedQueries';
import { subDays, formatDistanceToNow } from 'date-fns';

interface Tenant {
    id: string;
    store_name: string;
    store_slug: string;
    business_type: string;
    plan: string;
    trial_ends_at: string;
}

interface MobileDashboardProps {
    tenant: Tenant;
    todos: {
        storeCreated: boolean;
        addProducts: boolean;
        designStore: boolean;
        setupPayment: boolean;
        reviewShipping: boolean;
        customizeDomain: boolean;
    };
    todosLoading: boolean;
}

export default function MobileDashboard({ tenant, todos, todosLoading }: MobileDashboardProps) {
    const [dateRange] = useState({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const { data: stats, isLoading: statsLoading } = useDashboardStats(tenant.id);
    const { data: analytics, isLoading: analyticsLoading } = useAnalyticsSummary(tenant.id, dateRange);
    const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders(tenant.id);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumSignificantDigits: 3
        }).format(value);
    };

    const handleShare = async () => {
        const url = `https://${tenant.store_slug}.storekriti.com`; // Assuming domain structure
        if (navigator.share) {
            try {
                await navigator.share({
                    title: tenant.store_name,
                    text: `Check out my store ${tenant.store_name}!`,
                    url: url,
                });
            } catch (err) {
                console.error("Share failed:", err);
            }
        } else {
            navigator.clipboard.writeText(url);
            // Basic fallback toast could go here
        }
    };

    const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
        <Card className="border-none shadow-sm bg-card h-full">
            <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
                    </div>
                    <div className={`p-2 rounded-full ${colorClass} bg-opacity-10 shrink-0`}>
                        <Icon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`} />
                    </div>
                </div>
                <div className="mt-auto">
                    <h3 className="text-xl font-bold font-display">{value}</h3>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8 pb-24 px-1">
            {/* Header */}
            <div className="pt-2 px-1">
                <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Welcome Back,</h1>
                <p className="text-muted-foreground text-sm">Overview for <span className="font-medium text-foreground">{tenant.store_name}</span></p>
            </div>

            {/* Trial Warning */}
            {tenant.plan === 'trial' && (
                <div className="mx-1 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                            <Clock className="w-4 h-4 text-amber-600 stroke-[2]" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-amber-900">
                                {Math.ceil((new Date(tenant.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 0
                                    ? `${Math.ceil((new Date(tenant.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days Left in Trial`
                                    : 'Trial Expired'}
                            </h4>
                            <p className="text-xs text-amber-700/90 mt-0.5 leading-relaxed">
                                Upgrade to premium plan to unlock full features and continue scaling your store.
                            </p>
                        </div>
                    </div>
                    <Link to="/dashboard/subscription" className="w-full">
                        <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium h-9 rounded-lg shadow-none">
                            Upgrade to Premium
                            <ChevronRight className="w-4 h-4 ml-1 opacity-80" />
                        </Button>
                    </Link>
                </div>
            )}

            {/* Stats Grid (Top) */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground px-1">Performance</h3>
                <div className="grid grid-cols-2 gap-3">
                    {statsLoading ? (
                        <>
                            <Skeleton className="h-32 w-full rounded-2xl" />
                            <Skeleton className="h-32 w-full rounded-2xl" />
                            <Skeleton className="h-32 w-full rounded-2xl" />
                            <Skeleton className="h-32 w-full rounded-2xl" />
                        </>
                    ) : (
                        <>
                            <StatCard
                                title="Total Revenue"
                                value={formatCurrency(Number(stats?.total_revenue || 0))}
                                icon={Wallet}
                                colorClass="bg-indigo-500 text-indigo-500"
                            />
                            <StatCard
                                title="Total Orders"
                                value={stats?.total_orders || 0}
                                icon={ShoppingBag}
                                colorClass="bg-emerald-500 text-emerald-500"
                            />
                            <StatCard
                                title="Total Customers"
                                value={stats?.total_customers || 0}
                                icon={Users}
                                colorClass="bg-blue-500 text-blue-500"
                            />
                            <StatCard
                                title="Pending"
                                value={stats?.pending_orders || 0}
                                icon={Clock}
                                colorClass="bg-amber-500 text-amber-500"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Quick Actions (Middle) */}
            <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 px-1">Quick Actions</h3>
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                    <div className="grid grid-cols-5 gap-2">
                        <Link to="/dashboard/products/new" className="group flex flex-col items-center gap-2 active:scale-95 transition-transform">
                            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                                <Plus className="w-6 h-6 text-indigo-600 stroke-[1.5]" />
                            </div>
                            <span className="text-[10px] font-medium text-center text-muted-foreground uppercase tracking-wide group-hover:text-indigo-600 transition-colors">Add</span>
                        </Link>
                        <Link to="/dashboard/orders" className="group flex flex-col items-center gap-2 active:scale-95 transition-transform">
                            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                                <ShoppingBag className="w-6 h-6 text-emerald-600 stroke-[1.5]" />
                            </div>
                            <span className="text-[10px] font-medium text-center text-muted-foreground uppercase tracking-wide group-hover:text-emerald-600 transition-colors">Orders</span>
                        </Link>
                        <button onClick={handleShare} className="group flex flex-col items-center gap-2 active:scale-95 transition-transform">
                            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
                                <Share2 className="w-6 h-6 text-blue-600 stroke-[1.5]" />
                            </div>
                            <span className="text-[10px] font-medium text-center text-muted-foreground uppercase tracking-wide group-hover:text-blue-600 transition-colors">Share</span>
                        </button>
                        <Link to="/dashboard/customers" className="group flex flex-col items-center gap-2 active:scale-95 transition-transform">
                            <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100/50">
                                <Users className="w-6 h-6 text-violet-600 stroke-[1.5]" />
                            </div>
                            <span className="text-[10px] font-medium text-center text-muted-foreground uppercase tracking-wide group-hover:text-violet-600 transition-colors">Customers</span>
                        </Link>
                        <Link to="/dashboard/payment-intents" className="group flex flex-col items-center gap-2 active:scale-95 transition-transform">
                            <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100/50">
                                <CreditCard className="w-6 h-6 text-rose-600 stroke-[1.5]" />
                            </div>
                            <span className="text-[10px] font-medium text-center text-muted-foreground uppercase tracking-wide group-hover:text-rose-600 transition-colors">Payments</span>
                        </Link>
                    </div>
                </div>
            </div >

            {/* Low Stock Alert */}
            {
                stats && Number(stats.low_stock_products) > 0 && (
                    <div className="mx-1 bg-amber-50/80 border border-amber-200/50 rounded-xl p-4 flex items-center gap-4 shadow-sm backdrop-blur-sm">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-700 stroke-[1.5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-amber-900">Inventory Alert</h4>
                            <p className="text-xs text-amber-700/90 truncate">
                                {stats.low_stock_products} items are running low.
                            </p>
                        </div>
                        <Link to="/dashboard/products?filter=low_stock">
                            <Button size="sm" variant="ghost" className="h-8 text-xs font-semibold text-amber-900 hover:bg-amber-100">Review</Button>
                        </Link>
                    </div>
                )
            }

            {/* Todos / Setup Guide */}
            <Card className="border-none shadow-sm bg-card overflow-hidden">
                <div className="p-4 flex flex-row items-center justify-between border-b border-border/50 pb-3">
                    <h3 className="text-sm font-semibold text-foreground">Setup Progress</h3>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
                        {[
                            todos.storeCreated,
                            todos.addProducts,
                            todos.designStore,
                            todos.setupPayment,
                            todos.reviewShipping,
                            todos.customizeDomain
                        ].filter(Boolean).length}/6
                    </Badge>
                </div>
                <CardContent className="space-y-1 pt-2 p-2">
                    {todosLoading ? (
                        <div className="space-y-2 p-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <Link to="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                                {todos.storeCreated ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-muted" />}
                                <span className={todos.storeCreated ? "text-muted-foreground line-through text-sm" : "text-foreground text-sm font-medium"}>Add store name</span>
                            </Link>
                            <Link to={todos.addProducts ? "/dashboard/products" : "/dashboard/products/new"} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                                {todos.addProducts ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-muted" />}
                                <span className={todos.addProducts ? "text-muted-foreground line-through text-sm" : "text-foreground text-sm font-medium"}>Add first product</span>
                            </Link>
                            <Link to="/dashboard/store-settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                                {todos.designStore ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-muted" />}
                                <span className={todos.designStore ? "text-muted-foreground line-through text-sm" : "text-foreground text-sm font-medium"}>Design store</span>
                            </Link>
                            <Link to="/dashboard/integrations" className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                                {todos.setupPayment ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-muted" />}
                                <span className={todos.setupPayment ? "text-muted-foreground line-through text-sm" : "text-foreground text-sm font-medium"}>Setup payments</span>
                            </Link>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Store Analytics Overview */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-semibold text-foreground">Traffic Analytics</h3>
                    <Link to="/dashboard/analytics" className="text-xs text-primary font-medium hover:underline">Full Report</Link>
                </div>

                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        {analyticsLoading ? (
                            <>
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </>
                        ) : (
                            <>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Sessions</p>
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-violet-500" />
                                        <span className="text-lg font-bold font-display">{analytics?.total_sessions?.toLocaleString() || '0'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Visitors</p>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-pink-500" />
                                        <span className="text-lg font-bold font-display">{analytics?.unique_visitors?.toLocaleString() || '0'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Page Views</p>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-cyan-500" />
                                        <span className="text-lg font-bold font-display">{analytics?.total_page_views?.toLocaleString() || '0'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Load Time</p>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        <span className="text-lg font-bold font-display">{(Number(analytics?.avg_load_time) || 0).toFixed(2)}s</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-semibold text-foreground">Recent Orders</h3>
                    <Link to="/dashboard/orders" className="text-xs text-primary font-medium hover:underline">View All</Link>
                </div>

                {ordersLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                    </div>
                ) : recentOrders?.length === 0 ? (
                    <div className="text-center py-10 bg-muted/20 border border-dashed border-border rounded-2xl">
                        <ShoppingBag className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                        <p className="text-xs text-muted-foreground font-medium">No orders yet</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {recentOrders?.map((order: any) => (
                            <div key={order.id} className="bg-card p-4 rounded-2xl border border-border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] active:scale-[0.99] transition-transform">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-100">
                                            <span className="text-xs font-bold text-indigo-700">
                                                {order.customer_name?.[0] || 'G'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {order.customer_name || `Order #${order.order_number?.slice(-4)}`}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground font-medium">
                                                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className={`
                                        text-[10px] font-medium h-5 px-2 rounded-full border-none
                                        ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'}
                                     `}>
                                        {order.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between pl-[52px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${order.payment_status === 'paid' ? 'bg-green-500' : 'bg-amber-400'}`} />
                                        <span className="text-[11px] text-muted-foreground capitalize">{order.payment_status}</span>
                                    </div>
                                    <p className="font-bold text-sm font-display tracking-tight">{formatCurrency(order.total_amount)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
