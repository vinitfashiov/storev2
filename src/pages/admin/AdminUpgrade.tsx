import { useState, useEffect, useRef, useCallback } from 'react';
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

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Tenant {
  id: string;
  store_name: string;
  plan: 'trial' | 'pro';
  trial_ends_at: string;
}

interface PreparedOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
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

const PLAN_PRICE = 1; // ₹1 (testing)

// Preload Razorpay script immediately (module level for fastest load)
const razorpayScriptPromise = new Promise<void>((resolve) => {
  if (typeof window !== 'undefined') {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  }
});

export default function AdminUpgrade() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(!!window.Razorpay);
  
  // Pre-created order cache
  const preparedOrderRef = useRef<PreparedOrder | null>(null);
  const orderCreationPromiseRef = useRef<Promise<PreparedOrder | null> | null>(null);

  // Pre-create order in background
  const preCreateOrder = useCallback(async (): Promise<PreparedOrder | null> => {
    if (!tenant || tenant.plan === 'pro') return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('create-upgrade-order', {
        body: { tenant_id: tenant.id, amount: PLAN_PRICE }
      });
      
      if (error || !data?.order_id) return null;
      
      const order: PreparedOrder = {
        order_id: data.order_id,
        amount: data.amount,
        currency: data.currency,
        key_id: data.key_id
      };
      preparedOrderRef.current = order;
      return order;
    } catch {
      return null;
    }
  }, [tenant]);

  useEffect(() => {
    // Mark script as loaded when ready
    razorpayScriptPromise.then(() => setScriptLoaded(true));
    
    // Pre-create order immediately when page loads (for trial users)
    if (tenant && tenant.plan !== 'pro' && !orderCreationPromiseRef.current) {
      orderCreationPromiseRef.current = preCreateOrder();
    }
  }, [tenant, preCreateOrder]);

  const getDaysRemaining = () => {
    if (!tenant?.trial_ends_at) return 0;
    const now = new Date();
    const trialEnd = new Date(tenant.trial_ends_at);
    const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const handleUpgrade = async () => {
    if (!tenant) return;

    setLoading(true);

    try {
      // Wait for script if not ready (should be instant since preloaded)
      await razorpayScriptPromise;
      
      // Use pre-created order or wait for it / create new one
      let orderData = preparedOrderRef.current;
      
      if (!orderData) {
        // Wait for existing creation or create new
        if (orderCreationPromiseRef.current) {
          orderData = await orderCreationPromiseRef.current;
        }
        if (!orderData) {
          // Fallback: create order now
          const { data, error } = await supabase.functions.invoke('create-upgrade-order', {
            body: { tenant_id: tenant.id, amount: PLAN_PRICE }
          });
          if (error || !data?.order_id) {
            throw new Error(data?.error || 'Failed to create payment order');
          }
          orderData = {
            order_id: data.order_id,
            amount: data.amount,
            currency: data.currency,
            key_id: data.key_id
          };
        }
      }

      // Clear cached order (will need new one if user cancels)
      preparedOrderRef.current = null;
      orderCreationPromiseRef.current = null;

      // Open Razorpay checkout immediately
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'Sellify Pro',
        description: 'Upgrade to Pro Plan - ₹1/month (testing)',
        handler: async function (response: any) {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-upgrade-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                tenant_id: tenant.id,
                amount: PLAN_PRICE
              }
            });

            if (verifyError || !verifyData?.success) {
              throw new Error(verifyData?.error || 'Payment verification failed');
            }

            toast.success('Upgraded to Pro successfully!');
            window.location.href = '/dashboard';
          } catch (err: any) {
            console.error('Verification error:', err);
            toast.error(err.message || 'Payment verification failed');
          }
        },
        prefill: { name: tenant.store_name },
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: function() {
            setLoading(false);
            // Pre-create new order for next attempt
            orderCreationPromiseRef.current = preCreateOrder();
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setLoading(false);
      // Pre-create new order for retry
      orderCreationPromiseRef.current = preCreateOrder();
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
                ₹1 <span className="text-base font-normal text-muted-foreground">/month (testing)</span>
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
                disabled={loading || !scriptLoaded}
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
