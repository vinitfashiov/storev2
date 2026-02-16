import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, Eye, MapPin, ShoppingBag, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminCustomers } from '@/hooks/useOptimizedQueries';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';
import { useDebouncedCallback } from '@/hooks/useDebounce';

interface CustomerAddress {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
}

interface AdminCustomersProps {
  tenantId: string;
}

export default function AdminCustomers({ tenantId }: AdminCustomersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { page, pageSize, setPage, setPageSize } = usePagination(1, 25);
  const prevTenantIdRef = useRef(tenantId);

  // Preserve page state when tenant changes (don't reset to page 1)
  useEffect(() => {
    if (prevTenantIdRef.current !== tenantId) {
      prevTenantIdRef.current = tenantId;
      // Don't reset page - keep current page number
    }
  }, [tenantId]);

  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const { data, isLoading, isFetching, refetch } = useAdminCustomers({
    tenantId,
    search: debouncedSearch || undefined,
    page,
    limit: pageSize,
  });

  const customers = data?.customers || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || 0;

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
    setPage(1);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearch(value);
  };

  const openCustomerDetail = async (customer: any) => {
    setSelectedCustomer(customer);
    setDetailLoading(true);

    const [addressRes, orderRes] = await Promise.all([
      supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customer.id)
        .order('is_default', { ascending: false }),
      supabase
        .from('orders')
        .select('id, order_number, status, payment_status, total, created_at')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    setAddresses(addressRes.data || []);
    setOrders(orderRes.data || []);
    setDetailLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Customers</h1>
          <p className="text-muted-foreground">
            View customer information and order history
            {totalItems > 0 && <span className="ml-1">({totalItems.toLocaleString()} customers)</span>}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedCustomer.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{format(new Date(selectedCustomer.created_at), 'PP')}</p>
                </div>
              </div>

              {detailLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Addresses ({addresses.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {addresses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No saved addresses</p>
                      ) : (
                        <div className="space-y-3">
                          {addresses.map(addr => (
                            <div key={addr.id} className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{addr.label}</span>
                                {addr.is_default && <Badge variant="secondary">Default</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {addr.line1}{addr.line2 && `, ${addr.line2}`}
                                <br />
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Recent Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {orders.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No orders yet</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Payment</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map(order => (
                              <TableRow key={order.id}>
                                <TableCell>
                                  <div>
                                    <span className="font-medium">{order.order_number}</span>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(order.created_at), 'PP')}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{order.status}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                                    {order.payment_status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">₹{Number(order.total).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No customers found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Customers will appear here after they sign up'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer: any) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          <Link to={`/dashboard/customers/${customer.id}`} className="hover:underline">
                            {customer.name || 'Guest'}
                          </Link>
                        </TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(customer.created_at), 'PP')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/dashboard/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
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
