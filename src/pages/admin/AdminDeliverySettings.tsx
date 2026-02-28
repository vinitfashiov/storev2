import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Settings, Loader2, MapPin, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DistanceSlab {
  minDistance: number;
  maxDistance: number;
  fee: number;
}

interface DeliverySettings {
  delivery_mode: 'slots' | 'asap' | 'both';
  asap_eta_minutes: number;
  min_order_amount: number;
  delivery_fee: number;
  free_delivery_above: number | null;
  fixed_delivery_fee_enabled: boolean;
  free_delivery_enabled: boolean;
  minimum_order_enabled: boolean;
  max_delivery_fee_enabled: boolean;
  max_delivery_fee: number;
  distance_based_delivery_enabled: boolean;
  distance_calculation_type: 'slab' | 'per_km';
  per_km_rate: number;
  max_delivery_distance: number | null;
  store_address: string;
  store_latitude: number | null;
  store_longitude: number | null;
  distance_slabs: DistanceSlab[];
}

interface Props {
  tenantId: string;
  disabled?: boolean;
}

export default function AdminDeliverySettings({ tenantId, disabled }: Props) {
  const [settings, setSettings] = useState<DeliverySettings>({
    delivery_mode: 'both',
    asap_eta_minutes: 30,
    min_order_amount: 0,
    delivery_fee: 0,
    free_delivery_above: null,
    fixed_delivery_fee_enabled: false,
    free_delivery_enabled: false,
    minimum_order_enabled: false,
    max_delivery_fee_enabled: false,
    max_delivery_fee: 0,
    distance_based_delivery_enabled: false,
    distance_calculation_type: 'slab',
    per_km_rate: 0,
    max_delivery_distance: null,
    store_address: '',
    store_latitude: null,
    store_longitude: null,
    distance_slabs: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('tenant_delivery_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (data) {
        setSettings({
          delivery_mode: data.delivery_mode as 'slots' | 'asap' | 'both',
          asap_eta_minutes: data.asap_eta_minutes,
          min_order_amount: Number(data.min_order_amount),
          delivery_fee: Number(data.delivery_fee),
          free_delivery_above: data.free_delivery_above ? Number(data.free_delivery_above) : null,
          fixed_delivery_fee_enabled: data.fixed_delivery_fee_enabled || false,
          free_delivery_enabled: data.free_delivery_enabled || false,
          minimum_order_enabled: data.minimum_order_enabled || false,
          max_delivery_fee_enabled: data.max_delivery_fee_enabled || false,
          max_delivery_fee: Number(data.max_delivery_fee || 0),
          distance_based_delivery_enabled: data.distance_based_delivery_enabled || false,
          distance_calculation_type: (data.distance_calculation_type as 'slab' | 'per_km') || 'slab',
          per_km_rate: Number(data.per_km_rate || 0),
          max_delivery_distance: data.max_delivery_distance ? Number(data.max_delivery_distance) : null,
          store_address: data.store_address || '',
          store_latitude: data.store_latitude ? Number(data.store_latitude) : null,
          store_longitude: data.store_longitude ? Number(data.store_longitude) : null,
          distance_slabs: data.distance_slabs ? (data.distance_slabs as unknown as DistanceSlab[]) : []
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, [tenantId]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      tenant_id: tenantId,
      ...settings,
      distance_slabs: settings.distance_slabs as any
    };

    const { error } = await supabase
      .from('tenant_delivery_settings')
      .upsert(payload, { onConflict: 'tenant_id' });

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Grocery Delivery Settings saved');
    }
  };

  const handleAddSlab = () => {
    setSettings({
      ...settings,
      distance_slabs: [
        ...settings.distance_slabs,
        { minDistance: 0, maxDistance: 0, fee: 0 }
      ]
    });
  };

  const handleUpdateSlab = (index: number, field: keyof DistanceSlab, value: number) => {
    const newSlabs = [...settings.distance_slabs];
    newSlabs[index][field] = value;
    setSettings({ ...settings, distance_slabs: newSlabs });
  };

  const handleRemoveSlab = (index: number) => {
    const newSlabs = [...settings.distance_slabs];
    newSlabs.splice(index, 1);
    setSettings({ ...settings, distance_slabs: newSlabs });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <div>
        <h1 className="text-2xl font-display font-bold">Delivery Settings</h1>
        <p className="text-muted-foreground">Configure grocery delivery rules and fees</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Mode</CardTitle>
            <CardDescription>Choose how customers can receive orders</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={settings.delivery_mode}
              onValueChange={(v) => setSettings({ ...settings, delivery_mode: v as 'slots' | 'asap' | 'both' })}
              disabled={disabled}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="asap" id="asap" />
                <Label htmlFor="asap" className="cursor-pointer flex-1">
                  <span className="font-medium">ASAP Only</span>
                  <p className="text-sm text-muted-foreground">Quick delivery in ~X minutes</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg mt-2">
                <RadioGroupItem value="slots" id="slots" />
                <Label htmlFor="slots" className="cursor-pointer flex-1">
                  <span className="font-medium">Slots Only</span>
                  <p className="text-sm text-muted-foreground">Scheduled delivery</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg mt-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="cursor-pointer flex-1">
                  <span className="font-medium">Both Options</span>
                  <p className="text-sm text-muted-foreground">Customer decides</p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ASAP Delivery</CardTitle>
            <CardDescription>Settings for express delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Estimated Delivery Time (minutes)</Label>
              <Input
                type="number"
                min={5}
                value={settings.asap_eta_minutes}
                onChange={e => setSettings({ ...settings, asap_eta_minutes: parseInt(e.target.value) || 30 })}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground mt-1">Shown to customers as "Deliver in ~X mins"</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fixed Delivery Fee</CardTitle>
                <CardDescription>Base rate for delivery</CardDescription>
              </div>
              <Switch
                checked={settings.fixed_delivery_fee_enabled}
                onCheckedChange={(c) => setSettings({ ...settings, fixed_delivery_fee_enabled: c })}
                disabled={disabled}
              />
            </div>
          </CardHeader>
          {settings.fixed_delivery_fee_enabled && (
            <CardContent>
              <Label>Fixed Delivery Fee (₹)</Label>
              <Input
                type="number"
                min={0}
                value={settings.delivery_fee}
                onChange={e => setSettings({ ...settings, delivery_fee: parseFloat(e.target.value) || 0 })}
                disabled={disabled}
              />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Minimum Order Constraint</CardTitle>
                <CardDescription>Restrict low-value checkouts</CardDescription>
              </div>
              <Switch
                checked={settings.minimum_order_enabled}
                onCheckedChange={(c) => setSettings({ ...settings, minimum_order_enabled: c })}
                disabled={disabled}
              />
            </div>
          </CardHeader>
          {settings.minimum_order_enabled && (
            <CardContent>
              <Label>Minimum Amount (₹)</Label>
              <Input
                type="number"
                min={0}
                value={settings.min_order_amount}
                onChange={e => setSettings({ ...settings, min_order_amount: parseFloat(e.target.value) || 0 })}
                disabled={disabled}
              />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Free Delivery</CardTitle>
                <CardDescription>Override delivery fees on high baskets</CardDescription>
              </div>
              <Switch
                checked={settings.free_delivery_enabled}
                onCheckedChange={(c) => setSettings({ ...settings, free_delivery_enabled: c })}
                disabled={disabled}
              />
            </div>
          </CardHeader>
          {settings.free_delivery_enabled && (
            <CardContent>
              <Label>Free Delivery Above (₹)</Label>
              <Input
                type="number"
                min={0}
                value={settings.free_delivery_above ?? ''}
                onChange={e => setSettings({ ...settings, free_delivery_above: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="e.g. 500"
                disabled={disabled}
              />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Max Fee Cap</CardTitle>
                <CardDescription>Upper limit on combined fees</CardDescription>
              </div>
              <Switch
                checked={settings.max_delivery_fee_enabled}
                onCheckedChange={(c) => setSettings({ ...settings, max_delivery_fee_enabled: c })}
                disabled={disabled}
              />
            </div>
          </CardHeader>
          {settings.max_delivery_fee_enabled && (
            <CardContent>
              <Label>Maximum Fee Cap (₹)</Label>
              <Input
                type="number"
                min={0}
                value={settings.max_delivery_fee}
                onChange={e => setSettings({ ...settings, max_delivery_fee: parseFloat(e.target.value) || 0 })}
                disabled={disabled}
              />
            </CardContent>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Distance-Based Delivery</CardTitle>
              <CardDescription>Calculate fees dynamically by customer distance</CardDescription>
            </div>
            <Switch
              checked={settings.distance_based_delivery_enabled}
              onCheckedChange={c => setSettings({ ...settings, distance_based_delivery_enabled: c })}
              disabled={disabled}
            />
          </div>
        </CardHeader>
        {settings.distance_based_delivery_enabled && (
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
              <div className="col-span-1 md:col-span-2">
                <Label>Store Base Address</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter store's full address to calculate distance from"
                    value={settings.store_address}
                    onChange={e => setSettings({ ...settings, store_address: e.target.value })}
                    disabled={disabled}
                  />
                  <Button type="button" variant="outline" size="icon" disabled={disabled}><MapPin className="w-4 h-4" /></Button>
                </div>
              </div>
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={settings.store_latitude ?? ''}
                  onChange={e => setSettings({ ...settings, store_latitude: e.target.value ? parseFloat(e.target.value) : null })}
                  disabled={disabled}
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={settings.store_longitude ?? ''}
                  onChange={e => setSettings({ ...settings, store_longitude: e.target.value ? parseFloat(e.target.value) : null })}
                  disabled={disabled}
                />
              </div>
              <div className="col-span-1 md:col-span-2 pt-2">
                <Label>Maximum Delivery Radius (KM)</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.max_delivery_distance ?? ''}
                  onChange={e => setSettings({ ...settings, max_delivery_distance: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Leave empty for unlimited radius"
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground mt-1">Orders outside this radius will be rejected.</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="mb-2 block">Calculation Mode</Label>
              <Select
                disabled={disabled}
                value={settings.distance_calculation_type}
                onValueChange={(v: 'slab' | 'per_km') => setSettings({ ...settings, distance_calculation_type: v })}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slab">Slab-Based (e.g. 0-5km = ₹50)</SelectItem>
                  <SelectItem value="per_km">Rate Per KM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.distance_calculation_type === 'per_km' ? (
              <div>
                <Label>Rate (₹ per KM)</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.per_km_rate}
                  onChange={e => setSettings({ ...settings, per_km_rate: parseFloat(e.target.value) || 0 })}
                  disabled={disabled}
                  className="max-w-[300px]"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Label>Distance Slabs (KM)</Label>
                {settings.distance_slabs.map((slab, index) => (
                  <div key={index} className="flex items-center gap-4 bg-muted/10 p-3 rounded-md border">
                    <div className="flex-1">
                      <Label className="text-xs">Min (KM)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={slab.minDistance}
                        onChange={e => handleUpdateSlab(index, 'minDistance', parseFloat(e.target.value) || 0)}
                        disabled={disabled}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Max (KM)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={slab.maxDistance}
                        onChange={e => handleUpdateSlab(index, 'maxDistance', parseFloat(e.target.value) || 0)}
                        disabled={disabled}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Fee (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={slab.fee}
                        onChange={e => handleUpdateSlab(index, 'fee', parseFloat(e.target.value) || 0)}
                        disabled={disabled}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSlab(index)}
                      disabled={disabled}
                      className="mt-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={handleAddSlab}
                  disabled={disabled}
                  className="w-full border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Distance Slab
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Button onClick={handleSave} disabled={disabled || saving} className="w-full h-12">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Delivery Settings'}
      </Button>
    </div>
  );
}
