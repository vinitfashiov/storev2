import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CreditCard, Truck, Eye, EyeOff, Link2, Unlink, Loader2, CheckCircle2, Settings, Bell, ShoppingBag, UtensilsCrossed, Package } from 'lucide-react';

interface AdminIntegrationsProps {
  tenantId: string;
  disabled?: boolean;
}

// Reuseable Integration Row Component
function IntegrationRow({
  name,
  description,
  logoUrl,
  isEnabled,
  onSettingsClick,
  onToggle
}: {
  name: string;
  description: string;
  logoUrl: string;
  isEnabled: boolean;
  onSettingsClick?: () => void;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg border bg-white p-2 flex items-center justify-center shrink-0">
          <img src={logoUrl} alt={name} className="w-full h-full object-contain" />
        </div>
        <div>
          <h3 className="font-semibold text-lg leading-none mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground min-w-[2rem] text-right">
            {isEnabled ? 'On' : 'Off'}
          </span>
          <Switch checked={isEnabled} onCheckedChange={onToggle} />
        </div>
        <Button variant="outline" size="icon" onClick={onSettingsClick} disabled={!onSettingsClick}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Coming Soon / Marketplace Card Component
function ComingSoonCard({ name, description, color, features, logoUrl }: {
  name: string;
  description: string;
  color: string;
  features: string[];
  logoUrl: string;
}) {
  return (
    <Card className="relative overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col group">
      <div className={`absolute top-0 left-0 w-full h-1.5 ${color}`} />
      <CardContent className="p-6 pt-7 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg border bg-white p-1.5 flex items-center justify-center shadow-sm shrink-0">
            <img src={logoUrl} alt={name} className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-none flex items-center gap-2">
              {name}
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-muted text-muted-foreground">Coming Soon</Badge>
            </h3>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6 min-h-[2.5rem]">{description}</p>

        <div className="bg-muted/40 rounded-lg p-4 mb-6 flex-1">
          <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">PLANNED FEATURES</p>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs font-medium text-muted-foreground/80">
                <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${color}`} />
                <span className="leading-tight">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Bell className="w-4 h-4" />
          Join Waitlist
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

  // Dialog states
  const [razorpayOpen, setRazorpayOpen] = useState(false);
  const [shiprocketOpen, setShiprocketOpen] = useState(false);

  useEffect(() => {
    // Handle OAuth callback params
    const razorpayConnected = searchParams.get('razorpay_connected');
    const razorpayError = searchParams.get('razorpay_error');

    if (razorpayConnected === 'true') {
      toast.success('Razorpay account connected successfully!');
      searchParams.delete('razorpay_connected');
      setSearchParams(searchParams);
      // Open dialog to show success state if needed, or just refresh
      setRazorpayOpen(true);
    }
    if (razorpayError) {
      toast.error(`Razorpay connection failed: ${razorpayError}`);
      searchParams.delete('razorpay_error');
      setSearchParams(searchParams);
      setRazorpayOpen(true);
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
      if (type === 'razorpay') {
        setForm(prev => ({ ...prev, razorpay_key_secret: '' }));
        setRazorpayOpen(false);
      }
      if (type === 'shiprocket') {
        setForm(prev => ({ ...prev, shiprocket_password: '' }));
        setShiprocketOpen(false);
      }
    }
    setSaving(false);
  };

  const handleConnectOAuth = async () => {
    if (disabled) return;
    setConnectingOAuth(true);

    try {
      const redirectUrl = window.location.href.split('?')[0];

      const { data, error } = await supabase.functions.invoke('razorpay-oauth-init', {
        body: { tenant_id: tenantId, redirect_url: redirectUrl }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.message || data.error);
        setConnectingOAuth(false);
        return;
      }

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

  const isRazorpayEnabled = oauthConnected || !!form.razorpay_key_id;
  const isShiprocketEnabled = !!form.shiprocket_email;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-display font-bold">Integrations</h1>
        <p className="text-muted-foreground">Manage your payment gateways, shipping providers, and marketplace connections.</p>
      </div>

      {/* Payments Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Payments</h2>
        <div className="space-y-3">
          <IntegrationRow
            name="Razorpay"
            description="Accept online payments from customers"
            logoUrl="https://cdn.brandfetch.io/idHc4m3b7C/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668516398215"
            isEnabled={isRazorpayEnabled}
            onSettingsClick={() => setRazorpayOpen(true)}
            onToggle={() => setRazorpayOpen(true)}
          />

          <IntegrationRow
            name="Stripe"
            description="Global payments platform"
            logoUrl="https://cdn.brandfetch.io/idxAg10C0L/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1715873956123"
            isEnabled={false}
          />
        </div>
      </div>

      {/* Shipping Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Shipping</h2>
        <div className="space-y-3">
          <IntegrationRow
            name="Shiprocket"
            description="Shipping integration for order fulfillment"
            logoUrl="https://cdn.brandfetch.io/idW3zCkzQE/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1767432978068"
            isEnabled={isShiprocketEnabled}
            onSettingsClick={() => setShiprocketOpen(true)}
            onToggle={() => setShiprocketOpen(true)}
          />

          <IntegrationRow
            name="Delhivery"
            description="Integrated logistics services"
            logoUrl="https://cdn.brandfetch.io/id7_3XkQ5-/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668516140667"
            isEnabled={false}
          />
        </div>
      </div>

      {/* Marketplace Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Marketplace</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <ComingSoonCard
            name="Blinkit"
            description="List your products on Blinkit for quick commerce delivery"
            color="bg-yellow-400"
            logoUrl="https://cdn.brandfetch.io/idqFC5Rk0D/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1700856649486"
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
            color="bg-red-500"
            logoUrl="https://cdn.brandfetch.io/idEql8nEWn/w/2048/h/2048/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1724311594781"
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
            color="bg-blue-600"
            logoUrl="https://play-lh.googleusercontent.com/SzVgq9ni1W5YM7ZFk171Sq3c03RMA9nX3lrUV8Z6VRWfxSqxAGTU89O11-jmB559hgDL"
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
            color="bg-yellow-500"
            logoUrl="https://play-lh.googleusercontent.com/rpWjr-6s3EYPXUD7IDDB1fb0hxr75C76mIYVHpAILvzyPZwmQLZasAhitE0P3el8Dw=s96-rw"
            features={[
              "Instant delivery assignment",
              "Bike delivery for small packages",
              "Live GPS tracking",
              "Affordable last-mile rates"
            ]}
          />
        </div>
      </div>

      {/* Razorpay Configuration Dialog */}
      <Dialog open={razorpayOpen} onOpenChange={setRazorpayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Razorpay</DialogTitle>
            <DialogDescription>
              Connect your Razorpay account to accept payments.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue={oauthConnected ? "oauth" : "manual"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="oauth">
                <Link2 className="w-4 h-4 mr-2" />
                Connect Account
              </TabsTrigger>
              <TabsTrigger value="manual">
                <CreditCard className="w-4 h-4 mr-2" />
                Manual Keys
              </TabsTrigger>
            </TabsList>

            <TabsContent value="oauth" className="space-y-4">
              {oauthConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Connected</p>
                      {oauthMerchantId && (
                        <p className="text-xs text-green-600 dark:text-green-400">ID: {oauthMerchantId}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDisconnectOAuth}
                    disabled={disabled || disconnectingOAuth}
                    className="w-full"
                  >
                    {disconnectingOAuth ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Disconnecting...</>
                    ) : (
                      <><Unlink className="w-4 h-4 mr-2" /> Disconnect</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect your Razorpay account with one click using secure OAuth.
                  </p>
                  <Button
                    onClick={handleConnectOAuth}
                    disabled={disabled || connectingOAuth}
                    className="w-full"
                  >
                    {connectingOAuth ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                    ) : (
                      <><Link2 className="w-4 h-4 mr-2" /> Connect with Razorpay</>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
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
              <Button onClick={() => handleSave('razorpay')} disabled={disabled || saving} className="w-full">{saving ? 'Saving...' : 'Save Configuration'}</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Shiprocket Configuration Dialog */}
      <Dialog open={shiprocketOpen} onOpenChange={setShiprocketOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Shiprocket</DialogTitle>
            <DialogDescription>
              Enter your Shiprocket API credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.shiprocket_email} onChange={e => setForm({ ...form, shiprocket_email: e.target.value })} disabled={disabled} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={form.shiprocket_password} onChange={e => setForm({ ...form, shiprocket_password: e.target.value })} placeholder={hasExisting ? '••••••••' : ''} disabled={disabled} />
            </div>
            <div>
              <Label>Pickup Location</Label>
              <Input
                value={form.shiprocket_pickup_location}
                onChange={e => setForm({ ...form, shiprocket_pickup_location: e.target.value })}
                placeholder="e.g., Warehouse"
                disabled={disabled}
              />
            </div>
            <Button onClick={() => handleSave('shiprocket')} disabled={disabled || saving} className="w-full">{saving ? 'Saving...' : 'Save Configuration'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
