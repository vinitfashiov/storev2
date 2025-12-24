import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, CreditCard, TrendingUp, ShoppingCart, Package, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SalesSummary {
  total_sales: number;
  cash_sales: number;
  online_sales: number;
  split_sales: number;
  total_transactions: number;
  total_items_sold: number;
}

interface TopProduct {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

interface Sale {
  id: string;
  sale_number: string;
  customer_name: string | null;
  total: number;
  payment_method: string;
  created_at: string;
}

interface AdminPOSReportsProps {
  tenantId: string;
}

export default function AdminPOSReports({ tenantId }: AdminPOSReportsProps) {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<SalesSummary>({
    total_sales: 0,
    cash_sales: 0,
    online_sales: 0,
    split_sales: 0,
    total_transactions: 0,
    total_items_sold: 0
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  useEffect(() => {
    fetchReports();
  }, [tenantId, selectedDate]);

  async function fetchReports() {
    setLoading(true);
    
    const startOfDay = `${selectedDate}T00:00:00.000Z`;
    const endOfDay = `${selectedDate}T23:59:59.999Z`;

    // Fetch sales for the day
    const { data: sales } = await supabase
      .from('pos_sales')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: false });

    if (sales) {
      const cashSales = sales
        .filter(s => s.payment_method === 'cash')
        .reduce((acc, s) => acc + Number(s.total), 0);
      
      const onlineSales = sales
        .filter(s => s.payment_method === 'online')
        .reduce((acc, s) => acc + Number(s.total), 0);
      
      const splitSales = sales
        .filter(s => s.payment_method === 'split')
        .reduce((acc, s) => acc + Number(s.total), 0);

      setSummary({
        total_sales: sales.reduce((acc, s) => acc + Number(s.total), 0),
        cash_sales: cashSales,
        online_sales: onlineSales,
        split_sales: splitSales,
        total_transactions: sales.length,
        total_items_sold: 0 // Will be updated below
      });

      setRecentSales(sales.slice(0, 10) as Sale[]);
    }

    // Fetch sale items for top products
    const { data: saleItems } = await supabase
      .from('pos_sale_items')
      .select('product_name, quantity, line_total, pos_sales!inner(created_at)')
      .eq('tenant_id', tenantId)
      .gte('pos_sales.created_at', startOfDay)
      .lte('pos_sales.created_at', endOfDay);

    if (saleItems) {
      // Calculate total items sold
      const totalItems = saleItems.reduce((acc, i) => acc + i.quantity, 0);
      setSummary(prev => ({ ...prev, total_items_sold: totalItems }));

      // Group by product
      const productMap = new Map<string, { quantity: number; revenue: number }>();
      saleItems.forEach(item => {
        const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
        productMap.set(item.product_name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + Number(item.line_total)
        });
      });

      const topProds = Array.from(productMap.entries())
        .map(([name, data]) => ({
          product_name: name,
          total_quantity: data.quantity,
          total_revenue: data.revenue
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);

      setTopProducts(topProds);
    }

    setLoading(false);
  }

  const getPaymentBadge = (method: string) => {
    const colors: Record<string, string> = {
      'cash': 'bg-green-100 text-green-800',
      'online': 'bg-blue-100 text-blue-800',
      'split': 'bg-purple-100 text-purple-800'
    };
    return colors[method] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-bold">POS Reports</h1>
        <div className="flex items-center gap-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
          </Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Sales</p>
                <p className="text-2xl font-bold">₹{summary.total_sales.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash Sales</p>
                <p className="text-2xl font-bold text-green-600">₹{summary.cash_sales.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Online Sales</p>
                <p className="text-2xl font-bold text-blue-600">₹{summary.online_sales.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-purple-600">{summary.total_transactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell className="text-right">{product.total_quantity}</TableCell>
                    <TableCell className="text-right">₹{product.total_revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {topProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No sales data for this date
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-sm">{sale.sale_number}</TableCell>
                    <TableCell>{sale.customer_name || 'Walk-in'}</TableCell>
                    <TableCell>
                      <Badge className={getPaymentBadge(sale.payment_method)}>
                        {sale.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{sale.total}</TableCell>
                  </TableRow>
                ))}
                {recentSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No transactions for this date
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Cash</span>
              </div>
              <p className="text-2xl font-bold text-green-600">₹{summary.cash_sales.toFixed(2)}</p>
              <p className="text-sm text-green-600">
                {summary.total_sales > 0 
                  ? `${((summary.cash_sales / summary.total_sales) * 100).toFixed(1)}% of total`
                  : '0%'}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Online</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">₹{summary.online_sales.toFixed(2)}</p>
              <p className="text-sm text-blue-600">
                {summary.total_sales > 0 
                  ? `${((summary.online_sales / summary.total_sales) * 100).toFixed(1)}% of total`
                  : '0%'}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  <Banknote className="h-4 w-4 text-purple-600" />
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </div>
                <span className="font-medium text-purple-800">Split</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">₹{summary.split_sales.toFixed(2)}</p>
              <p className="text-sm text-purple-600">
                {summary.total_sales > 0 
                  ? `${((summary.split_sales / summary.total_sales) * 100).toFixed(1)}% of total`
                  : '0%'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
