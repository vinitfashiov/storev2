import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Package, MapPin, Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  is_active: boolean;
}

interface DeliveryZone {
  id: string;
  name: string;
}

interface Availability {
  product_id: string;
  is_available: boolean;
}

interface Props {
  tenantId: string;
  disabled?: boolean;
}

export default function AdminProductAvailability({ tenantId, disabled }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [availability, setAvailability] = useState<Map<string, boolean>>(new Map());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, zonesRes] = await Promise.all([
        supabase.from('products').select('id, name, sku, is_active').eq('tenant_id', tenantId).order('name'),
        supabase.from('delivery_zones').select('id, name').eq('tenant_id', tenantId).eq('is_active', true)
      ]);
      
      if (productsRes.data) setProducts(productsRes.data);
      if (zonesRes.data) {
        setZones(zonesRes.data);
        if (zonesRes.data.length > 0) {
          setSelectedZone(zonesRes.data[0].id);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [tenantId]);

  useEffect(() => {
    if (!selectedZone) return;
    
    const fetchAvailability = async () => {
      const { data } = await supabase
        .from('product_zone_availability')
        .select('product_id, is_available')
        .eq('tenant_id', tenantId)
        .eq('zone_id', selectedZone);
      
      const map = new Map<string, boolean>();
      data?.forEach(a => map.set(a.product_id, a.is_available));
      setAvailability(map);
    };
    fetchAvailability();
  }, [selectedZone, tenantId]);

  const toggleAvailability = async (productId: string) => {
    if (!selectedZone) return;
    
    setSaving(productId);
    const currentAvailable = availability.get(productId) ?? true;
    const newAvailable = !currentAvailable;

    // Check if record exists
    const { data: existing } = await supabase
      .from('product_zone_availability')
      .select('id')
      .eq('product_id', productId)
      .eq('zone_id', selectedZone)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('product_zone_availability')
        .update({ is_available: newAvailable })
        .eq('product_id', productId)
        .eq('zone_id', selectedZone));
    } else {
      ({ error } = await supabase
        .from('product_zone_availability')
        .insert({
          tenant_id: tenantId,
          product_id: productId,
          zone_id: selectedZone,
          is_available: newAvailable
        }));
    }

    setSaving(null);
    if (error) {
      toast.error(error.message);
    } else {
      setAvailability(new Map(availability.set(productId, newAvailable)));
      toast.success(newAvailable ? 'Product available in zone' : 'Product unavailable in zone');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (zones.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Product Availability</h1>
          <p className="text-muted-foreground">Manage product availability by zone</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No delivery zones configured</h3>
            <p className="text-muted-foreground mb-4">Create delivery zones first to manage product availability</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Product Availability</h1>
        <p className="text-muted-foreground">Manage which products are available in each zone</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedZone} onValueChange={setSelectedZone}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select zone" />
          </SelectTrigger>
          <SelectContent>
            {zones.map(zone => (
              <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground">Add products to manage their zone availability</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Product Status</TableHead>
                <TableHead className="text-right">Available in Zone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(product => {
                const isAvailable = availability.get(product.id) ?? true;
                return (
                  <TableRow key={product.id} className={!product.is_active ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.sku || '-'}</TableCell>
                    <TableCell>
                      <span className={`text-sm ${product.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch 
                        checked={isAvailable}
                        onCheckedChange={() => toggleAvailability(product.id)}
                        disabled={disabled || saving === product.id}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        Products without explicit availability settings are shown everywhere by default.
        Toggle off to hide a product in a specific zone.
      </p>
    </div>
  );
}
