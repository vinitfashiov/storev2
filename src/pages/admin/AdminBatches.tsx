import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Package, AlertTriangle, Clock, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Batch {
  id: string;
  batch_number: string;
  expiry_date: string | null;
  manufactured_date: string | null;
  cost_price: number | null;
  current_stock: number;
  is_active: boolean;
  products: { name: string } | null;
}

interface AdminBatchesProps {
  tenantId: string;
}

export default function AdminBatches({ tenantId }: AdminBatchesProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired'>('all');

  useEffect(() => {
    fetchBatches();
  }, [tenantId]);

  async function fetchBatches() {
    const { data, error } = await supabase
      .from('product_batches')
      .select('*, products(name)')
      .eq('tenant_id', tenantId)
      .order('expiry_date', { ascending: true, nullsFirst: false });

    if (!error && data) {
      setBatches(data as unknown as Batch[]);
    }
    setLoading(false);
  }

  function getExpiryStatus(expiryDate: string | null) {
    if (!expiryDate) return { status: 'none', label: 'No Expiry', color: 'bg-muted text-muted-foreground' };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: `${daysUntilExpiry}d left`, color: 'bg-orange-100 text-orange-800' };
    } else if (daysUntilExpiry <= 90) {
      return { status: 'warning', label: `${daysUntilExpiry}d left`, color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'ok', label: `${daysUntilExpiry}d left`, color: 'bg-green-100 text-green-800' };
  }

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = 
      batch.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.products?.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'all') return matchesSearch;
    
    const { status } = getExpiryStatus(batch.expiry_date);
    if (filter === 'expiring') return matchesSearch && (status === 'expiring' || status === 'warning');
    if (filter === 'expired') return matchesSearch && status === 'expired';
    
    return matchesSearch;
  });

  const expiringCount = batches.filter(b => {
    const { status } = getExpiryStatus(b.expiry_date);
    return status === 'expiring' || status === 'warning';
  }).length;

  const expiredCount = batches.filter(b => {
    const { status } = getExpiryStatus(b.expiry_date);
    return status === 'expired';
  }).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <h1 className="text-2xl font-display font-bold">Batch & Expiry Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Batches</p>
                <p className="text-2xl font-bold">{batches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{expiringCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by batch number or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'expiring' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('expiring')}
              >
                <Clock className="h-4 w-4 mr-1" />
                Expiring ({expiringCount})
              </Button>
              <Button
                variant={filter === 'expired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('expired')}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Expired ({expiredCount})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Batch Number</TableHead>
                <TableHead>Manufactured</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => {
                const expiryInfo = getExpiryStatus(batch.expiry_date);
                return (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.products?.name}</TableCell>
                    <TableCell className="font-mono">{batch.batch_number}</TableCell>
                    <TableCell>
                      {batch.manufactured_date 
                        ? new Date(batch.manufactured_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {batch.expiry_date 
                        ? new Date(batch.expiry_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={expiryInfo.color}>
                        {expiryInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{batch.current_stock}</TableCell>
                    <TableCell className="text-right">
                      {batch.cost_price ? `₹${batch.cost_price}` : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredBatches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No batches found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
