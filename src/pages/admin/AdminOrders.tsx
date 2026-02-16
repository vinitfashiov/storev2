import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Eye, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminOrders } from '@/hooks/useOptimizedQueries';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';

interface AdminOrdersProps {
  tenantId: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  packed: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  return_approved: 'bg-orange-100 text-orange-800',
  returned: 'bg-gray-100 text-gray-800',
};

const paymentColors: Record<string, string> = {
  unpaid: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export default function AdminOrders({ tenantId }: AdminOrdersProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const { page, pageSize, setPage, setPageSize } = usePagination(1, 25);
  const prevTenantIdRef = useRef(tenantId);

  // Preserve page state when tenant changes (don't reset to page 1)
  useEffect(() => {
    if (prevTenantIdRef.current !== tenantId) {
      prevTenantIdRef.current = tenantId;
      // Don't reset page - keep current page number
    }
  }, [tenantId]);

  const { data, isLoading, isFetching, refetch } = useAdminOrders({
    tenantId,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
    page,
    limit: pageSize,
  });

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || 0;

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePaymentChange = (value: string) => {
    setPaymentFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders
            {totalItems > 0 && <span className="ml-1">({totalItems.toLocaleString()} total)</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="packed">Packed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="return_approved">Return Approved</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={handlePaymentChange}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Payment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No orders yet</h3>
              <p className="text-sm text-muted-foreground">Orders will appear here when customers place them</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell className="font-medium">₹{Number(order.total).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status] || 'bg-gray-100'}>{order.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentColors[order.payment_status] || 'bg-gray-100'}>{order.payment_status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/dashboard/orders/${order.id}`}>
                            <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t">
                <PaginationControls
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[25, 50, 100]}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
