import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Truck, User, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

type DeliveryStatus = Database['public']['Enums']['delivery_status'];

interface AdminDeliveryOrdersProps {
  tenantId: string;
}

export default function AdminDeliveryOrders({ tenantId }: AdminDeliveryOrdersProps) {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['delivery-orders', tenantId, statusFilter, areaFilter],
    queryFn: async () => {
      // Get orders with delivery assignments
      let query = supabase
        .from('orders')
        .select(`
          *,
          delivery_assignments(
            id,
            status,
            delivery_boy_id,
            delivery_area_id,
            assigned_at,
            picked_up_at,
            delivered_at,
            delivery_boys(id, full_name, mobile_number),
            delivery_areas(id, name)
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('delivery_option', 'delivery')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Create assignments for orders without them
      const ordersWithoutAssignment = data.filter((o: any) => !o.delivery_assignments || o.delivery_assignments.length === 0);
      
      for (const order of ordersWithoutAssignment) {
        // Determine area based on shipping address pincode
        const shippingAddr = order.shipping_address as Record<string, any> | null;
        const pincode = shippingAddr?.pincode || shippingAddr?.zip;
        
        if (pincode) {
          const { data: areaData } = await supabase
            .from('delivery_areas')
            .select('id')
            .eq('tenant_id', tenantId)
            .contains('pincodes', [pincode])
            .single();

          await supabase.from('delivery_assignments').insert({
            tenant_id: tenantId,
            order_id: order.id,
            delivery_area_id: areaData?.id || null,
            status: 'unassigned',
          });
        } else {
          await supabase.from('delivery_assignments').insert({
            tenant_id: tenantId,
            order_id: order.id,
            status: 'unassigned',
          });
        }
      }

      // Refetch if we created assignments
      if (ordersWithoutAssignment.length > 0) {
        const { data: refreshed } = await supabase
          .from('orders')
          .select(`
            *,
            delivery_assignments(
              id,
              status,
              delivery_boy_id,
              delivery_area_id,
              assigned_at,
              picked_up_at,
              delivered_at,
              delivery_boys(id, full_name, mobile_number),
              delivery_areas(id, name)
            )
          `)
          .eq('tenant_id', tenantId)
          .eq('delivery_option', 'delivery')
          .order('created_at', { ascending: false });
        return refreshed;
      }

      return data;
    },
  });

  const { data: deliveryBoys } = useQuery({
    queryKey: ['delivery-boys-active', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('id, full_name, mobile_number')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: areas } = useQuery({
    queryKey: ['delivery-areas', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_areas')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ assignmentId, deliveryBoyId }: { assignmentId: string; deliveryBoyId: string }) => {
      const { error } = await supabase
        .from('delivery_assignments')
        .update({
          delivery_boy_id: deliveryBoyId,
          status: 'assigned' as DeliveryStatus,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);
      if (error) throw error;

      // Log status change
      await supabase.from('delivery_status_logs').insert({
        tenant_id: tenantId,
        assignment_id: assignmentId,
        delivery_boy_id: deliveryBoyId,
        old_status: 'unassigned',
        new_status: 'assigned',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      setIsAssignDialogOpen(false);
      setSelectedOrder(null);
      toast.success('Order assigned to delivery boy');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign order');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ assignmentId, status, deliveryBoyId, oldStatus }: { 
      assignmentId: string; 
      status: DeliveryStatus; 
      deliveryBoyId: string;
      oldStatus: DeliveryStatus;
    }) => {
      const updateData: any = { status };
      if (status === 'picked_up') updateData.picked_up_at = new Date().toISOString();
      if (status === 'delivered') updateData.delivered_at = new Date().toISOString();

      const { error } = await supabase
        .from('delivery_assignments')
        .update(updateData)
        .eq('id', assignmentId);
      if (error) throw error;

      // Log status change
      await supabase.from('delivery_status_logs').insert({
        tenant_id: tenantId,
        assignment_id: assignmentId,
        delivery_boy_id: deliveryBoyId,
        old_status: oldStatus,
        new_status: status,
      });

      // If delivered, calculate and add earnings
      if (status === 'delivered') {
        // Get delivery boy details
        const { data: boy } = await supabase
          .from('delivery_boys')
          .select('*')
          .eq('id', deliveryBoyId)
          .single();

        if (boy) {
          let earningAmount = 0;
          const assignment = orders?.find((o: any) => o.delivery_assignments?.[0]?.id === assignmentId);
          const orderTotal = assignment?.total || 0;

          if (boy.payment_type === 'fixed_per_order') {
            earningAmount = boy.per_order_amount;
          } else if (boy.payment_type === 'percentage_per_order') {
            earningAmount = (orderTotal * boy.percentage_value) / 100;
          }

          if (earningAmount > 0) {
            await supabase.from('delivery_earnings').insert({
              tenant_id: tenantId,
              delivery_boy_id: deliveryBoyId,
              assignment_id: assignmentId,
              order_id: assignment?.id,
              earning_type: boy.payment_type,
              amount: earningAmount,
              description: `Delivery for order #${assignment?.order_number}`,
            });

            // Update wallet balance
            await supabase
              .from('delivery_boys')
              .update({
                wallet_balance: boy.wallet_balance + earningAmount,
                total_earned: boy.total_earned + earningAmount,
              })
              .eq('id', deliveryBoyId);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      toast.success('Status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const getStatusBadge = (status: DeliveryStatus) => {
    const variants: Record<DeliveryStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      unassigned: { variant: 'outline', label: 'Unassigned' },
      assigned: { variant: 'secondary', label: 'Assigned' },
      picked_up: { variant: 'default', label: 'Picked Up' },
      out_for_delivery: { variant: 'default', label: 'Out for Delivery' },
      delivered: { variant: 'default', label: 'Delivered' },
      failed: { variant: 'destructive', label: 'Failed' },
      returned: { variant: 'destructive', label: 'Returned' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredOrders = orders?.filter((order: any) => {
    const assignment = order.delivery_assignments?.[0];
    if (statusFilter !== 'all' && assignment?.status !== statusFilter) return false;
    if (areaFilter !== 'all' && assignment?.delivery_area_id !== areaFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Orders</h1>
          <p className="text-muted-foreground">Assign and track order deliveries</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="picked_up">Picked Up</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {areas?.map((area) => (
              <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filteredOrders?.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No delivery orders</TableCell></TableRow>
              ) : (
                filteredOrders?.map((order: any) => {
                  const assignment = order.delivery_assignments?.[0];
                  const address = order.shipping_address;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <div>{order.customer_name}</div>
                          <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-sm truncate">
                          {address?.line1}, {address?.city} - {address?.pincode || address?.zip}
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignment?.delivery_areas?.name ? (
                          <Badge variant="outline">{assignment.delivery_areas.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Not mapped</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {assignment?.delivery_boys ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.delivery_boys.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {assignment?.status && getStatusBadge(assignment.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>₹{order.total}</div>
                          <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                            {order.payment_method.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!assignment?.delivery_boy_id && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsAssignDialogOpen(true);
                              }}
                            >
                              <User className="w-4 h-4 mr-1" /> Assign
                            </Button>
                          )}
                          {assignment?.delivery_boy_id && assignment?.status !== 'delivered' && (
                            <Select
                              value={assignment.status}
                              onValueChange={(status) => {
                                updateStatusMutation.mutate({
                                  assignmentId: assignment.id,
                                  status: status as DeliveryStatus,
                                  deliveryBoyId: assignment.delivery_boy_id,
                                  oldStatus: assignment.status,
                                });
                              }}
                            >
                              <SelectTrigger className="w-36 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="picked_up">Picked Up</SelectItem>
                                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="returned">Returned</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery Boy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">Order #{selectedOrder?.order_number}</p>
              <p className="text-sm text-muted-foreground">{selectedOrder?.customer_name} - {selectedOrder?.customer_phone}</p>
            </div>
            <div className="space-y-2">
              {deliveryBoys?.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active delivery boys available</p>
              ) : (
                deliveryBoys?.map((boy) => (
                  <Button
                    key={boy.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      const assignment = selectedOrder?.delivery_assignments?.[0];
                      if (assignment) {
                        assignMutation.mutate({ assignmentId: assignment.id, deliveryBoyId: boy.id });
                      }
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {boy.full_name}
                    <span className="ml-auto text-muted-foreground">{boy.mobile_number}</span>
                  </Button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
