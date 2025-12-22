import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CreditCard, Truck, Eye, EyeOff } from 'lucide-react';

interface AdminIntegrationsProps {
  tenantId: string;
  disabled?: boolean;
}

export default function AdminIntegrations({ tenantId, disabled }: AdminIntegrationsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({ razorpay: false, shiprocket: false });
  const [form, setForm] = useState({
    razorpay_key_id: '',
    razorpay_key_secret: '',
    shiprocket_email: '',
    shiprocket_password: ''
  });
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    const fetchIntegrations = async () => {
      const { data } = await supabase
        .from('tenant_integrations')
        .select('razorpay_key_id, shiprocket_email')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (data) {
        setHasExisting(true);
        setForm(prev => ({
          ...prev,
          razorpay_key_id: data.razorpay_key_id || '',
          shiprocket_email: data.shiprocket_email || ''
        }));
      }
      setLoading(false);
    };

    fetchIntegrations();
  }, [tenantId]);

  const handleSave = async (type: 'razorpay' | 'shiprocket') => {
    if (disabled) return;
    setSaving(true);

    const updateData: Record<string, string> = {};
    if (type === 'razorpay') {
      if (form.razorpay_key_id) updateData.razorpay_key_id = form.razorpay_key_id;
      if (form.razorpay_key_secret) updateData.razorpay_key_secret = form.razorpay_key_secret;
    } else {
      if (form.shiprocket_email) updateData.shiprocket_email = form.shiprocket_email;
      if (form.shiprocket_password) updateData.shiprocket_password = form.shiprocket_password;
    }

    let error;
    if (hasExisting) {
      ({ error } = await supabase.from('tenant_integrations').update(updateData).eq('tenant_id', tenantId));
    } else {
      ({ error } = await supabase.from('tenant_integrations').insert({ tenant_id: tenantId, ...updateData }));
      if (!error) setHasExisting(true);
    }

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Saved successfully');
      if (type === 'razorpay') setForm(prev => ({ ...prev, razorpay_key_secret: '' }));
      if (type === 'shiprocket') setForm(prev => ({ ...prev, shiprocket_password: '' }));
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Integrations</h1>
        <p className="text-muted-foreground">Connect payment and shipping providers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Razorpay</CardTitle>
          <CardDescription>Accept online payments from customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Key ID</Label>
            <Input value={form.razorpay_key_id} onChange={e => setForm({ ...form, razorpay_key_id: e.target.value })} placeholder="rzp_live_..." disabled={disabled} />
          </div>
          <div>
            <Label>Key Secret</Label>
            <div className="relative">
              <Input 
                type={showSecrets.razorpay ? 'text' : 'password'} 
                value={form.razorpay_key_secret} 
                onChange={e => setForm({ ...form, razorpay_key_secret: e.target.value })} 
                placeholder={hasExisting ? '••••••••' : 'Enter secret'} 
                disabled={disabled} 
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowSecrets(s => ({ ...s, razorpay: !s.razorpay }))}>
                {showSecrets.razorpay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <Button onClick={() => handleSave('razorpay')} disabled={disabled || saving}>{saving ? 'Saving...' : 'Save Razorpay'}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5" /> Shiprocket</CardTitle>
          <CardDescription>Shipping integration (coming soon)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.shiprocket_email} onChange={e => setForm({ ...form, shiprocket_email: e.target.value })} disabled={disabled} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={form.shiprocket_password} onChange={e => setForm({ ...form, shiprocket_password: e.target.value })} placeholder={hasExisting ? '••••••••' : ''} disabled={disabled} />
          </div>
          <Button onClick={() => handleSave('shiprocket')} disabled={disabled || saving}>{saving ? 'Saving...' : 'Save Shiprocket'}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
