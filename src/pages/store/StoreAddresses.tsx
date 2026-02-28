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
  latitude: number | null;
  longitude: number | null;
}

interface StoreAddressesProps {
  tenantId: string;
}

const AddressesSkeleton = () => (
  <div className="min-h-screen bg-white flex flex-col">
    <div className="container mx-auto px-4 py-8 lg:py-12 max-w-3xl flex-1">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-4 h-4 bg-neutral-100 rounded animate-pulse" />
        <div className="w-24 h-4 bg-neutral-100 rounded animate-pulse" />
      </div>
      <div className="flex justify-between mb-8">
        <div className="w-40 h-8 bg-neutral-100 rounded animate-pulse" />
        <div className="w-28 h-9 bg-neutral-100 rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="border border-neutral-100 rounded-none p-6 space-y-3">
            <div className="flex gap-2 mb-2">
              <div className="w-16 h-5 bg-neutral-100 rounded animate-pulse" />
              <div className="w-16 h-5 bg-neutral-100 rounded animate-pulse" />
            </div>
            <div className="w-full h-4 bg-neutral-100 rounded animate-pulse" />
            <div className="w-3/4 h-4 bg-neutral-100 rounded animate-pulse" />
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
    is_default: false,
    latitude: null as number | null,
    longitude: null as number | null
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
      is_default: form.is_default || addresses.length === 0,
      latitude: form.latitude,
      longitude: form.longitude
    });

    if (error) {
      toast.error('Failed to save address');
      setSaving(false);
      return;
    }

    toast.success('Address saved');
    setForm({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', is_default: false, latitude: null, longitude: null });
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
      <div className="min-h-screen bg-white flex flex-col pt-20 items-center px-4">
        <User className="w-12 h-12 mb-6 text-neutral-300" />
        <h2 className="text-2xl font-serif text-neutral-900 tracking-tight mb-2">Please log in</h2>
        <p className="text-neutral-500 mb-8 text-center">You need to log in to manage addresses.</p>
        <Link to={getLink('/login')}>
          <Button className="rounded-none px-8 py-6 text-sm tracking-widest uppercase bg-black text-white hover:bg-neutral-800">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-3xl flex-1">
        <Link to={getLink('/account')} className="flex items-center gap-2 text-neutral-500 hover:text-black transition-colors w-fit mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium uppercase tracking-widest">Back to account</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
          <h1 className="text-3xl font-serif text-neutral-900 tracking-tight">Saved Addresses</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-none px-6 tracking-widest uppercase bg-black text-white hover:bg-neutral-800 self-start sm:self-auto h-12">
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none sm:rounded-none bg-white border-neutral-200 shadow-xl sm:max-w-[500px] p-0">
              <div className="p-6 md:p-8">
                <DialogHeader className="mb-8 text-left">
                  <DialogTitle className="font-serif text-2xl font-normal text-neutral-900 tracking-tight">Add New Address</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Label</Label>
                    <Input
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="Home, Office, etc."
                      className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Address Line 1 *</Label>
                    <Input
                      value={form.line1}
                      onChange={(e) => setForm({ ...form, line1: e.target.value })}
                      placeholder="Street address"
                      required
                      className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Address Line 2</Label>
                    <Input
                      value={form.line2}
                      onChange={(e) => setForm({ ...form, line2: e.target.value })}
                      placeholder="Apartment, suite, etc."
                      className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">City *</Label>
                      <Input
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        required
                        className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">State *</Label>
                      <Input
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        required
                        className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors"
                      />
                    </div>
                  </div>
                  <div className="pb-4 space-y-4">
                    <div>
                      <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Pincode *</Label>
                      <Input
                        value={form.pincode}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                        maxLength={6}
                        required
                        className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-neutral-100 bg-neutral-50/50">
                      <div className="space-y-1 pr-4">
                        <Label className="text-sm font-medium">Delivery Location</Label>
                        <p className="text-xs text-neutral-500">
                          {form.latitude && form.longitude
                            ? "Location captured for accurate delivery"
                            : "Location helps us calculate accurate grocery delivery fees"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          if ('geolocation' in navigator) {
                            toast.loading('Getting location...', { id: 'geo' });
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setForm({ ...form, latitude: position.coords.latitude, longitude: position.coords.longitude });
                                toast.success('Location captured successfully', { id: 'geo' });
                              },
                              (err) => {
                                toast.error('Failed to get location. Please enable location permissions.', { id: 'geo' });
                              }
                            );
                          } else {
                            toast.error('Geolocation is not supported by your browser');
                          }
                        }}
                        className="rounded-none gap-2 flex-shrink-0 whitespace-nowrap"
                      >
                        <MapPin className="w-4 h-4" />
                        {form.latitude ? 'Update Location' : 'Get Location'}
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full rounded-none h-12 tracking-widest uppercase bg-black text-white hover:bg-neutral-800 mt-4"
                    onClick={handleSave}
                    disabled={saving || !form.line1 || !form.city || !form.state || !form.pincode}
                  >
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Address'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-black animate-spin" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-neutral-50 p-6 border border-neutral-100">
            <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="font-medium text-lg text-neutral-900 mb-2">No saved addresses</h3>
            <p className="text-neutral-500 mb-6">Add an address to speed up your checkout process.</p>
            <Button className="rounded-none px-8 py-6 text-sm tracking-widest uppercase bg-black text-white hover:bg-neutral-800" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address.id} className={`border p-6 transition-colors bg-white ${address.is_default ? 'border-black' : 'border-neutral-200 hover:border-black'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest border border-neutral-200 text-neutral-700 bg-neutral-50">
                        {address.label}
                      </span>
                      {address.is_default && (
                        <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest border border-black bg-black text-white flex items-center gap-1.5">
                          <Star className="w-3 h-3 fill-white" />
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-neutral-600 space-y-1.5 text-base">
                      <p className="font-medium text-neutral-900">{address.line1}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>{address.city}, {address.state} - {address.pincode}</p>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-3 sm:gap-2 self-start sm:self-auto sm:items-end w-full sm:w-auto pt-4 sm:pt-0 border-t border-neutral-100 sm:border-0">
                    {!address.is_default && (
                      <Button variant="outline" className="flex-1 sm:flex-none rounded-none border-neutral-200 text-neutral-600 hover:text-black hover:border-black transition-colors uppercase tracking-widest text-xs font-semibold" onClick={() => handleSetDefault(address.id)}>
                        Set Default
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1 sm:flex-none rounded-none border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors uppercase tracking-widest text-xs font-semibold" onClick={() => handleDelete(address.id)}>
                      <Trash2 className="w-4 h-4 mr-2 sm:hidden" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
