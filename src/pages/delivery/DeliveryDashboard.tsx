import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeliveryAuth } from '@/contexts/DeliveryAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Package,
  Truck,
  Wallet,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  RefreshCw,
  User,
  IndianRupee
} from 'lucide-react';
import { format } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

type DeliveryStatus = Database['public']['Enums']['delivery_status'];

export default function DeliveryDashboard() {
  const { deliveryBoy, tenant, assignedAreas, logout } = useDeliveryAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('orders');

  const areaPincodes = assignedAreas.flatMap(a => a.pincodes || []);

  // Fetch orders for assigned areas
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['delivery-orders', deliveryBoy?.id, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id || !deliveryBoy?.id) return [];

      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          orders(
            id,
            order_number,
            customer_name,
            customer_phone,
            shipping_address,
            total,
            payment_method,
            payment_status,
            created_at
          ),
          delivery_areas(name)
        `)
        .eq('tenant_id', tenant.id)
        .or(`delivery_boy_id.eq.${deliveryBoy.id},and(delivery_boy_id.is.null,status.eq.unassigned)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter unassigned orders by area pincodes
      return data?.filter((d: any) => {
        if (d.delivery_boy_id === deliveryBoy.id) return true;
        if (d.status === 'unassigned') {
          const orderPincode = d.orders?.shipping_address?.pincode || d.orders?.shipping_address?.zip;
          return areaPincodes.includes(orderPincode);
        }
        return false;
      }) || [];
    },
    enabled: !!tenant?.id && !!deliveryBoy?.id,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch earnings
  const { data: earnings } = useQuery({
    queryKey: ['delivery-earnings', deliveryBoy?.id],
    queryFn: async () => {
      if (!deliveryBoy?.id) return [];
      const { data, error } = await supabase
        .from('delivery_earnings')
        .select('*')
        .eq('delivery_boy_id', deliveryBoy.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!deliveryBoy?.id,
  });

  // Fetch payout requests
  const { data: payoutRequests } = useQuery({
    queryKey: ['delivery-payout-requests', deliveryBoy?.id],
    queryFn: async () => {
      if (!deliveryBoy?.id) return [];
      const { data, error } = await supabase
        .from('delivery_payout_requests')
        .select('*')
        .eq('delivery_boy_id', deliveryBoy.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!deliveryBoy?.id,
  });

  // Self-assign order mutation
  const selfAssignMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('delivery_assignments')
        .update({
          delivery_boy_id: deliveryBoy!.id,
          status: 'assigned' as DeliveryStatus,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);
      if (error) throw error;

      await supabase.from('delivery_status_logs').insert({
        tenant_id: tenant!.id,
        assignment_id: assignmentId,
        delivery_boy_id: deliveryBoy!.id,
        old_status: 'unassigned',
        new_status: 'assigned',
        notes: 'Self-assigned by delivery boy',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      toast.success('Order assigned to you');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign order');
    },
  });

  // Update order status mutation - uses secure edge function
  const updateStatusMutation = useMutation({
    mutationFn: async ({ assignmentId, status, oldStatus }: {
      assignmentId: string;
      status: DeliveryStatus;
      oldStatus: DeliveryStatus;
    }) => {
      // Use secure edge function with validation
      const response = await fetch(
        `/supabase-api/functions/v1/update-delivery-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            assignment_id: assignmentId,
            delivery_boy_id: deliveryBoy!.id,
            new_status: status,
            notes: `Status updated from ${oldStatus} to ${status}`,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

      // If delivered, calculate and add earnings via edge function or local
      if (status === 'delivered' && deliveryBoy) {
        const assignment = orders?.find((o: any) => o.id === assignmentId);
        const orderTotal = assignment?.orders?.total || 0;
        let earningAmount = 0;

        if (deliveryBoy.payment_type === 'fixed_per_order') {
          const { data: boyData } = await supabase
            .from('delivery_boys')
            .select('per_order_amount, percentage_value')
            .eq('id', deliveryBoy.id)
            .single();

          earningAmount = boyData?.per_order_amount || 0;
        } else if (deliveryBoy.payment_type === 'percentage_per_order') {
          const { data: boyData } = await supabase
            .from('delivery_boys')
            .select('percentage_value')
            .eq('id', deliveryBoy.id)
            .single();

          earningAmount = (orderTotal * (boyData?.percentage_value || 0)) / 100;
        }

        if (earningAmount > 0) {
          // Earnings are now handled via owner policies in the database
          // The edge function handles status updates securely
          await supabase.from('delivery_earnings').insert({
            tenant_id: tenant!.id,
            delivery_boy_id: deliveryBoy.id,
            assignment_id: assignmentId,
            order_id: assignment?.orders?.id,
            earning_type: deliveryBoy.payment_type,
            amount: earningAmount,
            description: `Delivery for order #${assignment?.orders?.order_number}`,
          });

          // Update wallet balance
          const { data: currentBoy } = await supabase
            .from('delivery_boys')
            .select('wallet_balance, total_earned')
            .eq('id', deliveryBoy.id)
            .single();

          if (currentBoy) {
            await supabase
              .from('delivery_boys')
              .update({
                wallet_balance: currentBoy.wallet_balance + earningAmount,
                total_earned: currentBoy.total_earned + earningAmount,
              })
              .eq('id', deliveryBoy.id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-earnings'] });
      toast.success('Status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async (amount: number) => {
      const { error } = await supabase.from('delivery_payout_requests').insert({
        tenant_id: tenant!.id,
        delivery_boy_id: deliveryBoy!.id,
        amount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-payout-requests'] });
      toast.success('Payout request submitted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to request payout');
    },
  });

  const getStatusBadge = (status: DeliveryStatus) => {
    const config: Record<DeliveryStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      unassigned: { variant: 'outline', label: 'Available' },
      assigned: { variant: 'secondary', label: 'Assigned' },
      picked_up: { variant: 'default', label: 'Picked Up' },
      out_for_delivery: { variant: 'default', label: 'Out for Delivery' },
      delivered: { variant: 'default', label: 'Delivered' },
      failed: { variant: 'destructive', label: 'Failed' },
      returned: { variant: 'destructive', label: 'Returned' },
    };
    const c = config[status];
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const pendingOrders = orders?.filter((o: any) => !['delivered', 'failed', 'returned'].includes(o.status)) || [];
  const completedOrders = orders?.filter((o: any) => ['delivered', 'failed', 'returned'].includes(o.status)) || [];

  const [payoutAmount, setPayoutAmount] = useState('');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold">{deliveryBoy?.full_name}</h1>
                <p className="text-xs text-muted-foreground">{tenant?.store_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => refetchOrders()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold">{pendingOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Wallet className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-xl font-bold">₹{deliveryBoy?.wallet_balance?.toFixed(0) || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
            <TabsTrigger value="earnings" className="flex-1">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4 space-y-3">
            {ordersLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
            ) : orders?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No orders available</p>
              </div>
            ) : (
              orders?.map((assignment: any) => {
                const order = assignment.orders;
                const address = order?.shipping_address as Record<string, any> | null;
                const isUnassigned = assignment.status === 'unassigned';
                const isMyOrder = assignment.delivery_boy_id === deliveryBoy?.id;

                return (
                  <Card key={assignment.id} className={isUnassigned ? 'border-dashed' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">#{order?.order_number}</span>
                            {getStatusBadge(assignment.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {order?.created_at && format(new Date(order.created_at), 'dd MMM, hh:mm a')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{order?.total}</p>
                          <Badge variant={order?.payment_status === 'paid' ? 'default' : 'secondary'} className="text-xs mt-1">
                            {order?.payment_method?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span>{order?.customer_name}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <a href={`tel:${order?.customer_phone}`} className="text-primary">{order?.customer_phone}</a>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">
                            {address?.line1}, {address?.city} - {address?.pincode || address?.zip}
                          </span>
                        </div>
                      </div>

                      {order?.payment_method === 'cod' && order?.payment_status !== 'paid' && (
                        <div className="bg-yellow-500/10 text-yellow-700 text-sm p-2 rounded-lg mb-3 flex items-center gap-2">
                          <IndianRupee className="w-4 h-4" />
                          <span>Collect ₹{order?.total} on delivery</span>
                        </div>
                      )}

                      {isUnassigned && !isMyOrder ? (
                        <Button
                          className="w-full"
                          onClick={() => selfAssignMutation.mutate(assignment.id)}
                          disabled={selfAssignMutation.isPending}
                        >
                          Accept Order
                        </Button>
                      ) : isMyOrder && !['delivered', 'failed', 'returned'].includes(assignment.status) ? (
                        <Select
                          value={assignment.status}
                          onValueChange={(status) => {
                            updateStatusMutation.mutate({
                              assignmentId: assignment.id,
                              status: status as DeliveryStatus,
                              oldStatus: assignment.status,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="picked_up">Picked Up</SelectItem>
                            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          {assignment.status === 'delivered' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {['failed', 'returned'].includes(assignment.status) && <XCircle className="w-4 h-4 text-destructive" />}
                          <span>Order {assignment.status}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="earnings" className="mt-4 space-y-4">
            {/* Wallet Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                    <p className="text-lg font-bold">₹{deliveryBoy?.total_earned?.toFixed(0) || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="text-lg font-bold">₹{deliveryBoy?.total_paid?.toFixed(0) || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-lg font-bold text-green-600">₹{deliveryBoy?.wallet_balance?.toFixed(0) || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Payout */}
            {(deliveryBoy?.wallet_balance || 0) > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Request Payout</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                      max={deliveryBoy?.wallet_balance || 0}
                    />
                    <Button
                      onClick={() => {
                        const amount = parseFloat(payoutAmount);
                        if (amount > 0 && amount <= (deliveryBoy?.wallet_balance || 0)) {
                          requestPayoutMutation.mutate(amount);
                          setPayoutAmount('');
                        } else {
                          toast.error('Invalid amount');
                        }
                      }}
                      disabled={requestPayoutMutation.isPending}
                    >
                      Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payout Requests */}
            {payoutRequests && payoutRequests.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Payout Requests</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {payoutRequests.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">₹{req.amount}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(req.requested_at), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <Badge variant={
                        req.status === 'pending' ? 'outline' :
                          req.status === 'paid' ? 'default' :
                            req.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Earnings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Earnings</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {earnings?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No earnings yet</p>
                ) : (
                  <div className="space-y-2">
                    {earnings?.map((earning: any) => (
                      <div key={earning.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm">{earning.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(earning.created_at), 'dd MMM, hh:mm a')}
                          </p>
                        </div>
                        <span className="font-medium text-green-600">+₹{earning.amount.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
