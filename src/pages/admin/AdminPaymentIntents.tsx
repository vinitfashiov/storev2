import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { RefreshCw, CreditCard, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PaymentIntent {
  id: string;
  store_slug: string;
  cart_id: string;
  draft_order_data: {
    order_number?: string;
    customer_name?: string;
    customer_phone?: string;
    total?: number;
  };
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminPaymentIntentsProps {
  tenantId: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  initiated: { label: 'Initiated', color: 'bg-blue-100 text-blue-800', icon: Clock },
  razorpay_order_created: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800', icon: CreditCard },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function AdminPaymentIntents({ tenantId }: AdminPaymentIntentsProps) {
  const [intents, setIntents] = useState<PaymentIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchIntents = async () => {
    setLoading(true);
    let query = supabase
      .from('payment_intents')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    if (data) {
      setIntents(data.map(pi => ({
        ...pi,
        draft_order_data: typeof pi.draft_order_data === 'object' ? pi.draft_order_data as PaymentIntent['draft_order_data'] : {}
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIntents();
  }, [tenantId, statusFilter]);

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Clock };
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: intents.length,
    initiated: intents.filter(i => i.status === 'initiated').length,
    pending: intents.filter(i => i.status === 'razorpay_order_created').length,
    paid: intents.filter(i => i.status === 'paid').length,
    cancelled: intents.filter(i => i.status === 'cancelled').length,
    failed: intents.filter(i => i.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Payment Intents</h1>
          <p className="text-muted-foreground">View all payment attempts for debugging</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchIntents} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Initiated</p>
            <p className="text-2xl font-bold text-blue-600">{stats.initiated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Attempts</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="razorpay_order_created">Pending Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : intents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payment intents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Razorpay Order</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intents.map((intent) => (
                    <TableRow key={intent.id}>
                      <TableCell className="font-mono text-sm">
                        {intent.draft_order_data?.order_number || intent.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{intent.draft_order_data?.customer_name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{intent.draft_order_data?.customer_phone || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{intent.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(intent.status)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {intent.razorpay_order_id || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(intent.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(intent.updated_at), 'MMM d, h:mm a')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
