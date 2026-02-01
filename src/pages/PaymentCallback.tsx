/**
 * Payment Callback Handler Page
 * 
 * This page handles returns from external Razorpay payments:
 * 1. Web browser redirects (via URL query params)
 * 2. Deep link returns (via App Links)
 * 
 * It verifies the payment status and redirects to appropriate success/failure page.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PaymentStatus = 'loading' | 'success' | 'failed' | 'cancelled' | 'error';

interface PaymentResult {
  status: PaymentStatus;
  message: string;
  redirectUrl?: string;
  orderNumber?: string;
}

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<PaymentResult>({
    status: 'loading',
    message: 'Verifying payment...'
  });

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Extract parameters from URL
        const type = searchParams.get('type'); // 'upgrade' or 'order'
        const status = searchParams.get('status'); // 'success', 'failed', 'cancelled'
        const paymentId = searchParams.get('payment_id');
        const orderId = searchParams.get('order_id');
        const signature = searchParams.get('signature');
        const error = searchParams.get('error');
        const tenantId = searchParams.get('tenant_id');
        const storeSlug = searchParams.get('store_slug');
        const orderNumber = searchParams.get('order_number');
        const paymentIntentId = searchParams.get('intent_id');

        // Handle cancelled payments
        if (status === 'cancelled' || searchParams.get('cancelled') === 'true') {
          setResult({
            status: 'cancelled',
            message: 'Payment was cancelled',
            redirectUrl: type === 'upgrade' 
              ? '/dashboard/upgrade' 
              : storeSlug ? `/store/${storeSlug}/checkout` : '/dashboard'
          });
          return;
        }

        // Handle explicit failure from callback
        if (status === 'failed') {
          setResult({
            status: 'failed',
            message: error || 'Payment failed',
            redirectUrl: type === 'upgrade' 
              ? '/dashboard/upgrade' 
              : storeSlug ? `/store/${storeSlug}/checkout` : '/dashboard'
          });
          return;
        }

        // Handle success - the edge function already verified, just redirect
        if (status === 'success') {
          if (type === 'upgrade') {
            setResult({
              status: 'success',
              message: 'Payment successful! Your plan has been upgraded.',
              redirectUrl: '/dashboard'
            });
          } else if (type === 'order' && orderNumber && storeSlug) {
            setResult({
              status: 'success',
              message: 'Payment successful! Your order has been placed.',
              redirectUrl: `/store/${storeSlug}/order-confirmation?order=${orderNumber}`,
              orderNumber
            });
          } else {
            setResult({
              status: 'success',
              message: 'Payment successful!',
              redirectUrl: '/dashboard'
            });
          }
          return;
        }

        // If we get here without a clear status, check the payment_intent
        if (paymentIntentId) {
          const { data: pi } = await supabase
            .from('payment_intents')
            .select('status, draft_order_data')
            .eq('id', paymentIntentId)
            .single();

          if (pi?.status === 'completed') {
            const orderNum = (pi.draft_order_data as any)?.order_number;
            setResult({
              status: 'success',
              message: 'Payment successful!',
              redirectUrl: storeSlug 
                ? `/store/${storeSlug}/order-confirmation?order=${orderNum || ''}` 
                : '/dashboard',
              orderNumber: orderNum
            });
            return;
          }
        }

        // Unknown state
        setResult({
          status: 'error',
          message: 'Unable to determine payment status. Please check your orders.',
          redirectUrl: storeSlug ? `/store/${storeSlug}/account/orders` : '/dashboard'
        });

      } catch (err: any) {
        console.error('Payment callback error:', err);
        setResult({
          status: 'error',
          message: err.message || 'An error occurred while processing payment',
          redirectUrl: '/dashboard'
        });
      }
    };

    processPayment();
  }, [searchParams]);

  // Auto-redirect after 3 seconds for success
  useEffect(() => {
    if (result.status === 'success' && result.redirectUrl) {
      const timer = setTimeout(() => {
        navigate(result.redirectUrl!);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [result, navigate]);

  const handleContinue = () => {
    if (result.redirectUrl) {
      navigate(result.redirectUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Status Icon */}
        <div className="flex justify-center">
          {result.status === 'loading' && (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          {result.status === 'success' && (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          )}
          {(result.status === 'failed' || result.status === 'error') && (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
          {result.status === 'cancelled' && (
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {result.status === 'loading' && 'Processing Payment'}
            {result.status === 'success' && 'Payment Successful!'}
            {result.status === 'failed' && 'Payment Failed'}
            {result.status === 'cancelled' && 'Payment Cancelled'}
            {result.status === 'error' && 'Something Went Wrong'}
          </h1>
          <p className="text-muted-foreground">
            {result.message}
          </p>
          {result.orderNumber && (
            <p className="text-sm font-medium">
              Order Number: <span className="font-mono">{result.orderNumber}</span>
            </p>
          )}
        </div>

        {/* Action Button */}
        {result.status !== 'loading' && (
          <div className="pt-4">
            <Button onClick={handleContinue} className="min-w-[200px]">
              {result.status === 'success' ? 'Continue' : 'Try Again'}
            </Button>
            {result.status === 'success' && (
              <p className="text-xs text-muted-foreground mt-2">
                Redirecting automatically in 3 seconds...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
