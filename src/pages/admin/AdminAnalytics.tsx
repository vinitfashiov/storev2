import { useState, useEffect, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, RefreshCw, Activity, BarChart3, Globe2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnalyticsCard } from '@/components/admin/analytics/AnalyticsCard';
import { LiveSessionsPanel } from '@/components/admin/analytics/LiveSessionsPanel';
import { AnalyticsCharts } from '@/components/admin/analytics/AnalyticsCharts';
import { PerformanceMetrics } from '@/components/admin/analytics/PerformanceMetrics';
import { PaymentAnalytics } from '@/components/admin/analytics/PaymentAnalytics';

const LiveGlobe = lazy(() => import('@/components/admin/analytics/LiveGlobe').then(m => ({ default: m.LiveGlobe })));

interface AdminAnalyticsProps {
  tenantId: string;
}

export default function AdminAnalytics({ tenantId }: AdminAnalyticsProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState('live');

  interface SessionLocation {
    country: string;
    country_code: string;
    city: string;
    lat: number;
    lng: number;
    count: number;
  }

  interface LiveStats {
    active_sessions: number;
    visitors_right_now: number;
    active_carts: number;
    checking_out: number;
    purchased: number;
    top_locations: SessionLocation[];
  }

  // Live stats query - refreshes every 30 seconds
  const { data: liveStats, isLoading: liveLoading, refetch: refetchLive } = useQuery<LiveStats | null>({
    queryKey: ['live-stats', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_live_session_stats', {
        p_tenant_id: tenantId,
        p_minutes: 10
      });
      if (error) throw error;
      const raw = data?.[0];
      if (!raw) return null;
      return {
        active_sessions: raw.active_sessions || 0,
        visitors_right_now: raw.visitors_right_now || 0,
        active_carts: raw.active_carts || 0,
        checking_out: raw.checking_out || 0,
        purchased: raw.purchased || 0,
        top_locations: Array.isArray(raw.top_locations) ? (raw.top_locations as unknown as SessionLocation[]) : [],
      };
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Analytics summary query
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary', tenantId, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_analytics_summary', {
        p_tenant_id: tenantId,
        p_date_from: format(dateRange.from, 'yyyy-MM-dd'),
        p_date_to: format(dateRange.to, 'yyyy-MM-dd')
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    staleTime: 60000,
  });

  // Daily analytics for charts
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-analytics', tenantId, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_analytics_daily', {
        p_tenant_id: tenantId,
        p_date_from: format(dateRange.from, 'yyyy-MM-dd'),
        p_date_to: format(dateRange.to, 'yyyy-MM-dd'),
      });
      if (error) throw error;

      return (data || []).map((d: any) => ({
        date: d.date,
        sessions: Number(d.total_sessions) || 0,
        pageViews: Number(d.page_views) || 0,
        orders: Number(d.total_orders) || 0,
        revenue: Number(d.total_revenue) || 0,
        visitors: Number(d.unique_visitors) || 0,
      }));
    },
    staleTime: 60000,
  });

  // Order stats for payment analytics
  const { data: orderStats, isLoading: orderLoading } = useQuery({
    queryKey: ['order-stats', tenantId, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('payment_status, total')
        .eq('tenant_id', tenantId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());
      if (error) throw error;
      
      const stats = {
        total_transactions: data?.length || 0,
        successful_payments: data?.filter(o => o.payment_status === 'paid').length || 0,
        failed_payments: data?.filter(o => o.payment_status === 'failed').length || 0,
        pending_payments: data?.filter(o => o.payment_status === 'pending').length || 0,
        total_amount: data?.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0) || 0,
        success_rate: 0,
        avg_transaction_value: 0,
      };
      stats.success_rate = stats.total_transactions > 0 ? (stats.successful_payments / stats.total_transactions) * 100 : 0;
      stats.avg_transaction_value = stats.successful_payments > 0 ? stats.total_amount / stats.successful_payments : 0;
      return stats;
    },
    staleTime: 60000,
  });

  const locations = liveStats?.top_locations || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Store Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Real-time insights into your store performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={`${Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))}`}
            onValueChange={(v) => setDateRange({ from: subDays(new Date(), parseInt(v)), to: new Date() })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetchLive()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="live" className="text-xs sm:text-sm py-2">
            <Globe2 className="h-4 w-4 mr-1 hidden sm:inline" />
            Live View
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">
            <BarChart3 className="h-4 w-4 mr-1 hidden sm:inline" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm py-2">
            <Zap className="h-4 w-4 mr-1 hidden sm:inline" />
            Speed
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm py-2">
            <Activity className="h-4 w-4 mr-1 hidden sm:inline" />
            Payments
          </TabsTrigger>
        </TabsList>

        {/* Live View Tab */}
        <TabsContent value="live" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 order-2 lg:order-1">
              <LiveSessionsPanel 
                stats={liveStats} 
                loading={liveLoading}
                totalSales={orderStats?.total_amount || 0}
                totalOrders={orderStats?.total_transactions || 0}
              />
            </div>
            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden">
                <Suspense fallback={<Skeleton className="h-[300px] sm:h-[400px] w-full" />}>
                  <LiveGlobe locations={locations} className="h-[300px] sm:h-[400px]" />
                </Suspense>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <AnalyticsCard title="Sessions" value={summary?.total_sessions?.toLocaleString() || '0'} loading={summaryLoading} />
            <AnalyticsCard title="Unique Visitors" value={summary?.unique_visitors?.toLocaleString() || '0'} loading={summaryLoading} />
            <AnalyticsCard title="Page Views" value={summary?.total_page_views?.toLocaleString() || '0'} loading={summaryLoading} />
            <AnalyticsCard title="Bounce Rate" value={`${(summary?.bounce_rate || 0).toFixed(1)}%`} loading={summaryLoading} />
          </div>
          <AnalyticsCharts dailyData={dailyData || []} deviceData={[]} loading={dailyLoading} />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-4">
          <PerformanceMetrics metrics={summary ? { avg_load_time: Number(summary.avg_load_time) || 0, ttfb: 150, fcp: 1200, lcp: 2100, cls: 0.05 } : null} loading={summaryLoading} />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-4">
          <PaymentAnalytics stats={orderStats || null} loading={orderLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
