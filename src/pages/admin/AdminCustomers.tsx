import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Eye, MapPin, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  created_at: string;
  order_count?: number;
  total_spent?: number;
}

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data: customersData } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (customersData) {
      // Get order stats for each customer
      const customersWithStats = await Promise.all(
        customersData.map(async (customer) => {
          const { data: orderData } = await supabase
            .from('orders')
            .select('total, payment_status')
            .eq('tenant_id', tenantId)
            .eq('customer_id', customer.id);

          const paidOrders = orderData?.filter(o => o.payment_status === 'paid') || [];
          return {
            ...customer,
            order_count: orderData?.length || 0,
            total_spent: paidOrders.reduce((sum, o) => sum + Number(o.total), 0)
          };
        })
      );
      setCustomers(customersWithStats);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, [tenantId]);

  const openCustomerDetail = async (customer: Customer) => {
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

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Customers</h1>
          <p className="text-muted-foreground">View customer information and order history</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
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
                        <ShoppingBag className="w-4 h-4" /> Recent Orders ({selectedCustomer.order_count})
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
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No customers found</h3>
              <p className="text-sm text-muted-foreground">Customers will appear here after they sign up</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{customer.name}</span>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.order_count}</Badge>
                    </TableCell>
                    <TableCell>₹{(customer.total_spent || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(customer.created_at), 'PP')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openCustomerDetail(customer)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
