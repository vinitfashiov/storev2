import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, MapPin, Plus, Trash2, User, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface StoreAddressesProps {
  tenantId: string;
}

// Loading skeleton for addresses page
const AddressesSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-4 h-4 bg-muted rounded animate-pulse" />
        <div className="w-24 h-4 bg-muted rounded animate-pulse" />
      </div>
      <div className="flex justify-between mb-6">
        <div className="w-40 h-8 bg-muted rounded animate-pulse" />
        <div className="w-28 h-9 bg-muted rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-card rounded-lg p-4 space-y-3">
            <div className="flex gap-2">
              <div className="w-16 h-5 bg-muted rounded animate-pulse" />
              <div className="w-16 h-5 bg-muted rounded animate-pulse" />
            </div>
            <div className="w-full h-4 bg-muted rounded animate-pulse" />
            <div className="w-3/4 h-4 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function StoreAddresses({ tenantId }: StoreAddressesProps) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const { customer, loading: authLoading } = useStoreAuth();
  const { isCustomDomain, tenant: cdTenant } = useCustomDomain();
  const slug = isCustomDomain ? cdTenant?.store_slug : paramSlug;

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${slug}${cleanPath}`;
  };

  // Show skeleton while auth is loading
  if (authLoading) return <AddressesSkeleton />;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false
  });

  const fetchAddresses = async () => {
    if (!customer) return;

    const { data } = await supabaseStore
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customer.id)
      .order('is_default', { ascending: false });

    if (data) setAddresses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAddresses();
  }, [customer]);

  const handleSave = async () => {
    if (!customer) return;

    setSaving(true);

    // If setting as default, unset other defaults first
    if (form.is_default) {
      await supabaseStore
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customer.id);
    }

    const { error } = await supabaseStore.from('customer_addresses').insert({
      tenant_id: tenantId,
      customer_id: customer.id,
      label: form.label,
      line1: form.line1,
      line2: form.line2 || null,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      is_default: form.is_default || addresses.length === 0
    });

    if (error) {
      toast.error('Failed to save address');
      setSaving(false);
      return;
    }

    toast.success('Address saved');
    setForm({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', is_default: false });
    setDialogOpen(false);
    setSaving(false);
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabaseStore.from('customer_addresses').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete address');
      return;
    }
    toast.success('Address deleted');
    fetchAddresses();
  };

  const handleSetDefault = async (id: string) => {
    if (!customer) return;

    await supabaseStore
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', customer.id);

    await supabaseStore
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', id);

    toast.success('Default address updated');
    fetchAddresses();
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Please log in to manage addresses</p>
            <Link to={getLink('/login')}>
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to={getLink('/account')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to account
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold">Saved Addresses</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Label</Label>
                  <Input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="Home, Office, etc."
                  />
                </div>
                <div>
                  <Label>Address Line 1 *</Label>
                  <Input
                    value={form.line1}
                    onChange={(e) => setForm({ ...form, line1: e.target.value })}
                    placeholder="Street address"
                    required
                  />
                </div>
                <div>
                  <Label>Address Line 2</Label>
                  <Input
                    value={form.line2}
                    onChange={(e) => setForm({ ...form, line2: e.target.value })}
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Pincode *</Label>
                  <Input
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    maxLength={6}
                    required
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={saving || !form.line1 || !form.city || !form.state || !form.pincode}
                >
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Address'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : addresses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No saved addresses</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card key={address.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{address.label}</Badge>
                        {address.is_default && (
                          <Badge className="bg-primary/10 text-primary">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p>{address.line1}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>{address.city}, {address.state} - {address.pincode}</p>
                    </div>
                    <div className="flex gap-2">
                      {!address.is_default && (
                        <Button variant="ghost" size="sm" onClick={() => handleSetDefault(address.id)}>
                          Set Default
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(address.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
