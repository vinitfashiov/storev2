import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, Truck, Eye, EyeOff, Link2, Unlink, Loader2, CheckCircle2, ShoppingBag, UtensilsCrossed, Package, Zap } from 'lucide-react';

interface AdminIntegrationsProps {
  tenantId: string;
  disabled?: boolean;
}

// Coming Soon integration card component
function ComingSoonCard({ name, description, icon: Icon, color, features, logoUrl }: {
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  features: string[];
  logoUrl?: string; // Optional logo URL
}) {
  return (
    <Card className="relative overflow-hidden opacity-90 h-full flex flex-col">
      <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-3">
            {logoUrl ? (
              <div className="w-10 h-10 rounded-lg border bg-white p-1.5 flex items-center justify-center shadow-sm shrink-0">
                <img src={logoUrl} alt={name} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className={`w-10 h-10 rounded-lg ${color.replace('bg-', 'bg-opacity-10 ')} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {name}
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">Coming Soon</Badge>
              </div>
            </div>
          </CardTitle>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20 flex-1">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Planned Features</p>
          <ul className="text-sm text-muted-foreground space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${color}`} />
                <span className="leading-tight">{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button className="mt-4 w-full" variant="outline" disabled>
          <Zap className="w-4 h-4 mr-2" />
          Notify Me
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminIntegrations({ tenantId, disabled }: AdminIntegrationsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [disconnectingOAuth, setDisconnectingOAuth] = useState(false);
  const [showSecrets, setShowSecrets] = useState({ razorpay: false, shiprocket: false });
  const [form, setForm] = useState({
    razorpay_key_id: '',
    razorpay_key_secret: '',
    shiprocket_email: '',
    shiprocket_password: '',
    shiprocket_pickup_location: ''
  });
  const [hasExisting, setHasExisting] = useState(false);
  const [oauthConnected, setOauthConnected] = useState(false);
  const [oauthMerchantId, setOauthMerchantId] = useState<string | null>(null);

  useEffect(() => {
    // Handle OAuth callback params
    const razorpayConnected = searchParams.get('razorpay_connected');
    const razorpayError = searchParams.get('razorpay_error');

    if (razorpayConnected === 'true') {
      toast.success('Razorpay account connected successfully!');
      searchParams.delete('razorpay_connected');
      setSearchParams(searchParams);
    }
    if (razorpayError) {
      toast.error(`Razorpay connection failed: ${razorpayError}`);
      searchParams.delete('razorpay_error');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchIntegrations = async () => {
      const { data } = await supabase
        .from('tenant_integrations_safe')
        .select('razorpay_key_id, shiprocket_email, shiprocket_pickup_location, has_razorpay_secret, has_shiprocket_password, razorpay_oauth_connected, razorpay_oauth_merchant_id')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (data) {
        setHasExisting(true);
        setForm(prev => ({
          ...prev,
          razorpay_key_id: data.razorpay_key_id || '',
          shiprocket_email: data.shiprocket_email || '',
          shiprocket_pickup_location: data.shiprocket_pickup_location || ''
        }));
        setOauthConnected(data.razorpay_oauth_connected || false);
        setOauthMerchantId(data.razorpay_oauth_merchant_id || null);
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
      if (form.shiprocket_pickup_location) updateData.shiprocket_pickup_location = form.shiprocket_pickup_location;
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

  const handleConnectOAuth = async () => {
    if (disabled) return;
    setConnectingOAuth(true);

    try {
      const redirectUrl = window.location.href.split('?')[0]; // Current page without params

      const { data, error } = await supabase.functions.invoke('razorpay-oauth-init', {
        body: { tenant_id: tenantId, redirect_url: redirectUrl }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.message || data.error);
        setConnectingOAuth(false);
        return;
      }

      // Redirect to Razorpay authorization page
      window.location.href = data.auth_url;
    } catch (err) {
      console.error('OAuth init error:', err);
      toast.error('Failed to start Razorpay connection');
      setConnectingOAuth(false);
    }
  };

  const handleDisconnectOAuth = async () => {
    if (disabled) return;
    setDisconnectingOAuth(true);

    try {
      const { error } = await supabase.functions.invoke('razorpay-oauth-disconnect', {
        body: { tenant_id: tenantId }
      });

      if (error) throw error;

      setOauthConnected(false);
      setOauthMerchantId(null);
      toast.success('Razorpay account disconnected');
    } catch (err) {
      console.error('Disconnect error:', err);
      toast.error('Failed to disconnect');
    } finally {
      setDisconnectingOAuth(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Integrations</h1>
        <p className="text-muted-foreground">Connect payment, shipping, and marketplace providers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Razorpay
            {oauthConnected && <Badge variant="default" className="ml-2"><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</Badge>}
          </CardTitle>
          <CardDescription>Accept online payments from customers</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={oauthConnected ? "oauth" : "manual"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="oauth">
                <Link2 className="w-4 h-4 mr-2" />
                Connect Account
              </TabsTrigger>
              <TabsTrigger value="manual">
                <CreditCard className="w-4 h-4 mr-2" />
                Manual API Keys
              </TabsTrigger>
            </TabsList>

            <TabsContent value="oauth" className="space-y-4">
              {oauthConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Razorpay Connected</p>
                      {oauthMerchantId && (
                        <p className="text-sm text-green-600 dark:text-green-400">Merchant ID: {oauthMerchantId}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDisconnectOAuth}
                    disabled={disabled || disconnectingOAuth}
                  >
                    {disconnectingOAuth ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Disconnecting...</>
                    ) : (
                      <><Unlink className="w-4 h-4 mr-2" /> Disconnect Account</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect your Razorpay account with one click. No need to copy-paste API keys manually.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Secure OAuth connection</li>
                      <li>Automatic token refresh</li>
                      <li>No manual key management</li>
                    </ul>
                  </div>
                  <Button
                    onClick={handleConnectOAuth}
                    disabled={disabled || connectingOAuth}
                    className="w-full sm:w-auto"
                  >
                    {connectingOAuth ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                    ) : (
                      <><Link2 className="w-4 h-4 mr-2" /> Connect with Razorpay</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Note: Requires platform OAuth configuration. Contact support if this doesn't work.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">
                  Manually enter your Razorpay API credentials. Get them from your{' '}
                  <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Razorpay Dashboard
                  </a>.
                </p>
              </div>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5" /> Shiprocket</CardTitle>
          <CardDescription>Shipping integration for order fulfillment</CardDescription>
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
          <div>
            <Label>Pickup Location Name</Label>
            <Input
              value={form.shiprocket_pickup_location}
              onChange={e => setForm({ ...form, shiprocket_pickup_location: e.target.value })}
              placeholder="e.g., Primary, Warehouse, Office"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the exact pickup location name as configured in your Shiprocket dashboard
            </p>
          </div>
          <Button onClick={() => handleSave('shiprocket')} disabled={disabled || saving}>{saving ? 'Saving...' : 'Save Shiprocket'}</Button>
        </CardContent>
      </Card>

      {/* Coming Soon Integrations */}
      <div className="pt-2">
        <h2 className="text-lg font-semibold mb-1">Marketplace & Delivery Partners</h2>
        <p className="text-sm text-muted-foreground mb-4">Expand your reach with these upcoming integrations</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ComingSoonCard
          name="Blinkit"
          description="List your products on Blinkit for quick commerce delivery"
          icon={ShoppingBag}
          color="bg-yellow-500"
          logoUrl="https://logo.clearbit.com/blinkit.com"
          features={[
            "Sync product catalog automatically",
            "Real-time inventory updates",
            "Order management from dashboard",
            "Quick commerce delivery (10–30 min)"
          ]}
        />

        <ComingSoonCard
          name="Zomato"
          description="Reach millions of customers through Zomato marketplace"
          icon={UtensilsCrossed}
          color="bg-red-500"
          logoUrl="https://logo.clearbit.com/zomato.com"
          features={[
            "Menu sync with Zomato listing",
            "Live order tracking integration",
            "Rating & review management",
            "Zomato Hyperpure supply chain"
          ]}
        />

        <ComingSoonCard
          name="Porter"
          description="On-demand delivery for your store orders via Porter"
          icon={Package}
          color="bg-blue-600"
          logoUrl="https://logo.clearbit.com/porter.in"
          features={[
            "Auto-assign deliveries to Porter",
            "Real-time tracking for customers",
            "Multi-stop delivery support",
            "Cash-on-delivery reconciliation"
          ]}
        />

        <ComingSoonCard
          name="Rapido"
          description="Fast last-mile delivery powered by Rapido's bike fleet"
          icon={Truck}
          color="bg-yellow-400"
          logoUrl="https://logo.clearbit.com/rapido.bike"
          features={[
            "Instant delivery assignment",
            "Bike delivery for small packages",
            "Live GPS tracking",
            "Affordable last-mile rates"
          ]}
        />
      </div>
    </div>
  );
}

