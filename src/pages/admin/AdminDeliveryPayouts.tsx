import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, X, Wallet, TrendingUp, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

type PayoutStatus = Database['public']['Enums']['payout_status'];

interface AdminDeliveryPayoutsProps {
  tenantId: string;
}

export default function AdminDeliveryPayouts({ tenantId }: AdminDeliveryPayoutsProps) {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data: deliveryBoys } = useQuery({
    queryKey: ['delivery-boys', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  const { data: payoutRequests } = useQuery({
    queryKey: ['payout-requests', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_payout_requests')
        .select('*, delivery_boys(full_name, mobile_number, wallet_balance)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: payoutHistory } = useQuery({
    queryKey: ['payout-history', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_payouts')
        .select('*, delivery_boys(full_name)')
        .eq('tenant_id', tenantId)
        .order('paid_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const processPayoutMutation = useMutation({
    mutationFn: async ({ requestId, action, boyId, amount }: { 
      requestId: string; 
      action: 'approve' | 'reject'; 
      boyId: string;
      amount: number;
    }) => {
      if (action === 'approve') {
        // Create payout record
        await supabase.from('delivery_payouts').insert({
          tenant_id: tenantId,
          delivery_boy_id: boyId,
          payout_request_id: requestId,
          amount,
          payment_method: paymentMethod,
          transaction_reference: transactionRef,
          notes: adminNotes,
        });

        // Update delivery boy wallet
        const { data: boy } = await supabase
          .from('delivery_boys')
          .select('wallet_balance, total_paid')
          .eq('id', boyId)
          .single();

        if (boy) {
          await supabase
            .from('delivery_boys')
            .update({
              wallet_balance: Math.max(0, boy.wallet_balance - amount),
              total_paid: boy.total_paid + amount,
            })
            .eq('id', boyId);
        }

        // Update request status
        await supabase
          .from('delivery_payout_requests')
          .update({
            status: 'paid' as PayoutStatus,
            processed_at: new Date().toISOString(),
            admin_notes: adminNotes,
          })
          .eq('id', requestId);
      } else {
        // Reject request
        await supabase
          .from('delivery_payout_requests')
          .update({
            status: 'rejected' as PayoutStatus,
            processed_at: new Date().toISOString(),
            admin_notes: adminNotes,
          })
          .eq('id', requestId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
      queryClient.invalidateQueries({ queryKey: ['payout-history'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-boys'] });
      setIsProcessDialogOpen(false);
      setSelectedRequest(null);
      setPaymentMethod('');
      setTransactionRef('');
      setAdminNotes('');
      toast.success('Payout processed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process payout');
    },
  });

  const pendingRequests = payoutRequests?.filter((r: any) => r.status === 'pending') || [];
  const totalPendingAmount = pendingRequests.reduce((sum: number, r: any) => sum + r.amount, 0);
  const totalWalletBalance = deliveryBoys?.reduce((sum, b) => sum + b.wallet_balance, 0) || 0;

  const getStatusBadge = (status: PayoutStatus) => {
    const variants: Record<PayoutStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'Pending' },
      approved: { variant: 'secondary', label: 'Approved' },
      paid: { variant: 'default', label: 'Paid' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Delivery Payouts</h1>
        <p className="text-muted-foreground">Manage payout requests from delivery boys</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Boys</p>
                <p className="text-2xl font-bold">{deliveryBoys?.filter(b => b.is_active).length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payable</p>
                <p className="text-2xl font-bold">₹{totalWalletBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold">₹{totalPendingAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Payout Requests</TabsTrigger>
          <TabsTrigger value="history">Payout History</TabsTrigger>
          <TabsTrigger value="balances">Boy Balances</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delivery Boy</TableHead>
                    <TableHead>Requested Amount</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutRequests?.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payout requests</TableCell></TableRow>
                  ) : (
                    payoutRequests?.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.delivery_boys?.full_name}</div>
                            <div className="text-xs text-muted-foreground">{request.delivery_boys?.mobile_number}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">₹{request.amount.toFixed(2)}</TableCell>
                        <TableCell>₹{request.delivery_boys?.wallet_balance?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>{format(new Date(request.requested_at), 'dd MMM yyyy, hh:mm a')}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-right">
                          {request.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setIsProcessDialogOpen(true);
                                }}
                              >
                                <Check className="w-4 h-4 mr-1" /> Process
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  processPayoutMutation.mutate({
                                    requestId: request.id,
                                    action: 'reject',
                                    boyId: request.delivery_boy_id,
                                    amount: request.amount,
                                  });
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delivery Boy</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Paid On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutHistory?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payout history</TableCell></TableRow>
                  ) : (
                    payoutHistory?.map((payout: any) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">{payout.delivery_boys?.full_name}</TableCell>
                        <TableCell>₹{payout.amount.toFixed(2)}</TableCell>
                        <TableCell>{payout.payment_method || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{payout.transaction_reference || '-'}</TableCell>
                        <TableCell>{format(new Date(payout.paid_at), 'dd MMM yyyy, hh:mm a')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delivery Boy</TableHead>
                    <TableHead>Total Earned</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryBoys?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No delivery boys</TableCell></TableRow>
                  ) : (
                    deliveryBoys?.map((boy) => (
                      <TableRow key={boy.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{boy.full_name}</div>
                            <div className="text-xs text-muted-foreground">{boy.mobile_number}</div>
                          </div>
                        </TableCell>
                        <TableCell>₹{boy.total_earned.toFixed(2)}</TableCell>
                        <TableCell>₹{boy.total_paid.toFixed(2)}</TableCell>
                        <TableCell className="font-medium text-green-600">₹{boy.wallet_balance.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={boy.is_active ? 'default' : 'secondary'}>
                            {boy.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Payout Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{selectedRequest?.delivery_boys?.full_name}</p>
              <p className="text-2xl font-bold text-green-600">₹{selectedRequest?.amount?.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transaction Reference (optional)</Label>
              <Input
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g., UPI ref, bank txn ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  processPayoutMutation.mutate({
                    requestId: selectedRequest.id,
                    action: 'approve',
                    boyId: selectedRequest.delivery_boy_id,
                    amount: selectedRequest.amount,
                  });
                }}
                disabled={processPayoutMutation.isPending}
              >
                <Check className="w-4 h-4 mr-2" /> Mark as Paid
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  processPayoutMutation.mutate({
                    requestId: selectedRequest.id,
                    action: 'reject',
                    boyId: selectedRequest.delivery_boy_id,
                    amount: selectedRequest.amount,
                  });
                }}
                disabled={processPayoutMutation.isPending}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
