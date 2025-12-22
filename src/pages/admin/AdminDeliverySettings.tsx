import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Settings, Loader2 } from 'lucide-react';

interface DeliverySettings {
  delivery_mode: 'slots' | 'asap' | 'both';
  asap_eta_minutes: number;
  min_order_amount: number;
  delivery_fee: number;
  free_delivery_above: number | null;
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
    free_delivery_above: null
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
          free_delivery_above: data.free_delivery_above ? Number(data.free_delivery_above) : null
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
      delivery_mode: settings.delivery_mode,
      asap_eta_minutes: settings.asap_eta_minutes,
      min_order_amount: settings.min_order_amount,
      delivery_fee: settings.delivery_fee,
      free_delivery_above: settings.free_delivery_above
    };

    const { error } = await supabase
      .from('tenant_delivery_settings')
      .upsert(payload, { onConflict: 'tenant_id' });
    
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Settings saved');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Delivery Settings</h1>
        <p className="text-muted-foreground">Configure delivery options and fees</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Mode</CardTitle>
          <CardDescription>Choose how customers can receive their orders</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={settings.delivery_mode} 
            onValueChange={(v) => setSettings({...settings, delivery_mode: v as 'slots' | 'asap' | 'both'})}
            disabled={disabled}
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="asap" id="asap" />
              <Label htmlFor="asap" className="cursor-pointer flex-1">
                <span className="font-medium">ASAP Only</span>
                <p className="text-sm text-muted-foreground">Quick delivery within estimated minutes</p>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg mt-2">
              <RadioGroupItem value="slots" id="slots" />
              <Label htmlFor="slots" className="cursor-pointer flex-1">
                <span className="font-medium">Slots Only</span>
                <p className="text-sm text-muted-foreground">Scheduled delivery in time slots</p>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg mt-2">
              <RadioGroupItem value="both" id="both" />
              <Label htmlFor="both" className="cursor-pointer flex-1">
                <span className="font-medium">Both Options</span>
                <p className="text-sm text-muted-foreground">Customer chooses ASAP or scheduled</p>
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
              onChange={e => setSettings({...settings, asap_eta_minutes: parseInt(e.target.value) || 30})}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground mt-1">Shown to customers as "Deliver in ~X mins"</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Requirements</CardTitle>
          <CardDescription>Minimum order and delivery fees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Minimum Order Amount (₹)</Label>
            <Input 
              type="number"
              min={0}
              value={settings.min_order_amount}
              onChange={e => setSettings({...settings, min_order_amount: parseFloat(e.target.value) || 0})}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground mt-1">Set to 0 for no minimum</p>
          </div>
          <div>
            <Label>Delivery Fee (₹)</Label>
            <Input 
              type="number"
              min={0}
              value={settings.delivery_fee}
              onChange={e => setSettings({...settings, delivery_fee: parseFloat(e.target.value) || 0})}
              disabled={disabled}
            />
          </div>
          <div>
            <Label>Free Delivery Above (₹)</Label>
            <Input 
              type="number"
              min={0}
              value={settings.free_delivery_above ?? ''}
              onChange={e => setSettings({...settings, free_delivery_above: e.target.value ? parseFloat(e.target.value) : null})}
              placeholder="Leave empty to always charge"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground mt-1">Orders above this amount get free delivery</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={disabled || saving} className="w-full">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Settings'}
      </Button>
    </div>
  );
}
