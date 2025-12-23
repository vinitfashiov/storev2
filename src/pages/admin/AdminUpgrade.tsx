import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Check, 
  CreditCard, 
  Crown, 
  Loader2, 
  Zap, 
  Shield, 
  Clock,
  Star,
  ArrowLeft
} from 'lucide-react';

interface Tenant {
  id: string;
  store_name: string;
  plan: 'trial' | 'pro';
  trial_ends_at: string;
}

interface Integration {
  razorpay_key_id: string | null;
  razorpay_key_secret: string | null;
}

const PRO_FEATURES = [
  'Unlimited products',
  'Unlimited orders',
  'Custom domain support',
  'Priority support',
  'Advanced analytics',
  'No transaction fees',
  'Hero banners & pages',
  'Multiple delivery zones',
];

const PLAN_PRICE = 24900; // ₹249 in paise

export default function AdminUpgrade() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [checkingIntegration, setCheckingIntegration] = useState(true);

  useEffect(() => {
    if (tenant?.id) {
      fetchIntegration();
    }
  }, [tenant?.id]);

  const fetchIntegration = async () => {
    if (!tenant?.id) return;
    
    const { data } = await supabase
      .from('tenant_integrations')
      .select('razorpay_key_id, razorpay_key_secret')
      .eq('tenant_id', tenant.id)
      .maybeSingle();

    setIntegration(data);
    setCheckingIntegration(false);
  };

  const getDaysRemaining = () => {
    if (!tenant?.trial_ends_at) return 0;
    const now = new Date();
    const trialEnd = new Date(tenant.trial_ends_at);
    const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const handleUpgrade = async () => {
    if (!tenant) return;

    // Check if Razorpay is configured
    if (!integration?.razorpay_key_id || !integration?.razorpay_key_secret) {
      toast.error('Please configure Razorpay in Integrations first');
      navigate('/dashboard/integrations');
      return;
    }

    setLoading(true);

    try {
      // Create subscription record
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenant.id,
          amount: PLAN_PRICE,
          status: 'pending',
        })
        .select()
        .single();

      if (subError) throw subError;

      // For now, we'll simulate a successful upgrade
      // In production, you'd integrate with Razorpay subscription API
      
      // Update tenant plan to pro
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ 
          plan: 'pro',
          trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        })
        .eq('id', tenant.id);

      if (updateError) throw updateError;

      // Update subscription status
      await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', subscription.id);

      toast.success('Upgraded to Pro successfully!');
      navigate('/dashboard');
      
      // Refresh the page to update tenant data
      window.location.reload();

    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || 'Failed to upgrade');
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) return null;

  const isPro = tenant.plan === 'pro';
  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">Upgrade Your Plan</h1>
          <p className="text-muted-foreground">Unlock all features and grow your business</p>
        </div>
      </div>

      {/* Current Plan Status */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPro ? 'bg-primary' : 'bg-muted'}`}>
                {isPro ? (
                  <Crown className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <Clock className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-lg">
                    {isPro ? 'Pro Plan' : 'Trial Plan'}
                  </h3>
                  <Badge variant={isPro ? 'default' : 'secondary'}>
                    {isPro ? 'Active' : `${daysRemaining} days left`}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isPro 
                    ? 'You have access to all Pro features' 
                    : daysRemaining > 0 
                      ? 'Upgrade now to continue after trial ends'
                      : 'Your trial has expired. Upgrade to continue.'
                  }
                </p>
              </div>
            </div>
            {isPro && (
              <div className="flex items-center gap-2 text-primary">
                <Check className="w-5 h-5" />
                <span className="font-medium">All features unlocked</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Card */}
      {!isPro && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Free/Trial Plan */}
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Trial Plan
              </CardTitle>
              <CardDescription>Perfect for testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                ₹0 <span className="text-base font-normal text-muted-foreground">/7 days</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-muted-foreground" />
                  Limited products
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-muted-foreground" />
                  Basic features
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-muted-foreground" />
                  7-day trial period
                </li>
              </ul>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
              Recommended
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Pro Plan
              </CardTitle>
              <CardDescription>For growing businesses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                ₹249 <span className="text-base font-normal text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm">
                {PRO_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full shadow-glow" 
                onClick={handleUpgrade}
                disabled={loading || checkingIntegration}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
              {!integration?.razorpay_key_id && !checkingIntegration && (
                <p className="text-xs text-muted-foreground text-center">
                  ⚠️ Configure Razorpay in Integrations first
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Pro Features
          </CardTitle>
          <CardDescription>Everything you need to grow your online store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm">Unlimited Products</h4>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm">Priority Support</h4>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm">No Transaction Fees</h4>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Crown className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm">Advanced Analytics</h4>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
