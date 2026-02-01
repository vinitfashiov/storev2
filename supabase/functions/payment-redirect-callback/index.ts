/**
 * Payment Redirect Callback Edge Function
 * 
 * Handles Razorpay payment redirects for both:
 * 1. Admin subscription upgrades
 * 2. Storefront order payments
 * 
 * Flow:
 * 1. Razorpay redirects here after payment
 * 2. Verify payment signature
 * 3. Process order/subscription
 * 4. Redirect to app via deep link or HTTPS callback
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL = "https://storekriti.lovable.app";
const DEEP_LINK_SCHEME = "storekriti://";

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function redirectResponse(url: string): Response {
  return new Response(null, {
    status: 302,
    headers: { 'Location': url }
  });
}

function buildRedirectUrl(
  isNative: boolean,
  type: 'upgrade' | 'order',
  status: 'success' | 'failed' | 'cancelled',
  params: Record<string, string>
): string {
  const queryString = new URLSearchParams({ type, status, ...params }).toString();
  
  if (isNative) {
    // Deep link for native apps
    const path = status === 'success' 
      ? (type === 'upgrade' ? 'upgrade-success' : 'order-success')
      : (type === 'upgrade' ? 'upgrade-failure' : 'order-failure');
    return `${DEEP_LINK_SCHEME}payment/${path}?${queryString}`;
  } else {
    // HTTPS callback for web
    return `${APP_URL}/payment-callback?${queryString}`;
  }
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    
    // Handle both GET (redirect) and POST (form submit) from Razorpay
    let params: Record<string, string> = {};
    
    if (req.method === 'GET') {
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } else if (req.method === 'POST') {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      type, // 'upgrade' or 'order'
      tenant_id,
      store_slug,
      payment_intent_id,
      is_native, // 'true' or 'false'
    } = params;

    const isNative = is_native === 'true';
    const paymentType = (type === 'upgrade' ? 'upgrade' : 'order') as 'upgrade' | 'order';

    // Missing payment details - cancelled or error
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      const redirectUrl = buildRedirectUrl(isNative, paymentType, 'cancelled', {
        error: 'Payment was cancelled or incomplete',
        store_slug: store_slug || '',
        tenant_id: tenant_id || ''
      });
      return redirectResponse(redirectUrl);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine which secret to use for verification
    let razorpaySecret: string | null = null;

    if (paymentType === 'upgrade') {
      // Platform-level Razorpay for upgrades
      razorpaySecret = Deno.env.get('PLATFORM_RAZORPAY_KEY_SECRET') || null;
    } else if (tenant_id || payment_intent_id) {
      // Tenant-level Razorpay for orders
      let tenantIdToUse = tenant_id;
      
      if (!tenantIdToUse && payment_intent_id) {
        const { data: pi } = await supabase
          .from('payment_intents')
          .select('tenant_id')
          .eq('id', payment_intent_id)
          .single();
        tenantIdToUse = pi?.tenant_id;
      }

      if (tenantIdToUse) {
        const { data: integration } = await supabase
          .from('tenant_integrations')
          .select('razorpay_key_secret')
          .eq('tenant_id', tenantIdToUse)
          .single();
        razorpaySecret = integration?.razorpay_key_secret || null;
      }
    }

    if (!razorpaySecret) {
      const redirectUrl = buildRedirectUrl(isNative, paymentType, 'failed', {
        error: 'Payment gateway not configured',
        store_slug: store_slug || '',
        tenant_id: tenant_id || ''
      });
      return redirectResponse(redirectUrl);
    }

    // Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = await hmacSha256(razorpaySecret, body);

    if (expectedSignature !== razorpay_signature) {
      console.error('Invalid payment signature');
      const redirectUrl = buildRedirectUrl(isNative, paymentType, 'failed', {
        error: 'Invalid payment signature',
        store_slug: store_slug || '',
        tenant_id: tenant_id || ''
      });
      return redirectResponse(redirectUrl);
    }

    // Process based on payment type
    if (paymentType === 'upgrade' && tenant_id) {
      // Upgrade tenant to pro plan
      await supabase
        .from('tenants')
        .update({ plan: 'pro' })
        .eq('id', tenant_id);

      // Create subscription record
      await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenant_id,
          status: 'active',
          amount: 1, // Testing price
          razorpay_payment_id: razorpay_payment_id
        });

      const redirectUrl = buildRedirectUrl(isNative, 'upgrade', 'success', {
        tenant_id: tenant_id,
        payment_id: razorpay_payment_id
      });
      return redirectResponse(redirectUrl);

    } else if (paymentType === 'order' && payment_intent_id) {
      // Check if already processed
      const { data: existingIntent } = await supabase
        .from('payment_intents')
        .select('status, callback_handled, draft_order_data')
        .eq('id', payment_intent_id)
        .single();

      if (existingIntent?.callback_handled) {
        // Already processed - just redirect to success
        const orderNumber = (existingIntent.draft_order_data as any)?.order_number;
        const redirectUrl = buildRedirectUrl(isNative, 'order', 'success', {
          store_slug: store_slug || '',
          order_number: orderNumber || '',
          payment_id: razorpay_payment_id
        });
        return redirectResponse(redirectUrl);
      }

      // Mark as handled to prevent duplicate processing
      await supabase
        .from('payment_intents')
        .update({ 
          callback_handled: true,
          status: 'processing'
        })
        .eq('id', payment_intent_id);

      // Get payment intent details
      const { data: paymentIntent } = await supabase
        .from('payment_intents')
        .select('*')
        .eq('id', payment_intent_id)
        .single();

      if (!paymentIntent || !paymentIntent.draft_order_data) {
        const redirectUrl = buildRedirectUrl(isNative, 'order', 'failed', {
          error: 'Payment intent not found',
          store_slug: store_slug || '',
          intent_id: payment_intent_id
        });
        return redirectResponse(redirectUrl);
      }

      const draftOrder = paymentIntent.draft_order_data as any;

      // Create order using atomic function
      const { data: orderId, error: orderError } = await supabase.rpc('create_order_atomic', {
        p_tenant_id: paymentIntent.tenant_id,
        p_order_number: draftOrder.order_number,
        p_customer_id: draftOrder.customer_id || null,
        p_customer_name: draftOrder.customer_name,
        p_customer_phone: draftOrder.customer_phone,
        p_customer_email: draftOrder.customer_email || null,
        p_shipping_address: draftOrder.shipping_address,
        p_subtotal: draftOrder.subtotal,
        p_discount_total: draftOrder.discount_total || 0,
        p_delivery_fee: draftOrder.delivery_fee || 0,
        p_total: draftOrder.total,
        p_payment_method: 'razorpay',
        p_payment_status: 'paid',
        p_status: 'pending',
        p_delivery_zone_id: draftOrder.delivery_zone_id || null,
        p_delivery_slot_id: draftOrder.delivery_slot_id || null,
        p_delivery_option: draftOrder.delivery_option || 'standard',
        p_coupon_id: draftOrder.coupon_id || null,
        p_coupon_code: draftOrder.coupon_code || null,
        p_razorpay_order_id: razorpay_order_id,
        p_razorpay_payment_id: razorpay_payment_id,
        p_order_items: draftOrder.items,
        p_cart_id: paymentIntent.cart_id
      });

      if (orderError) {
        console.error('Order creation error:', orderError);
        await supabase
          .from('payment_intents')
          .update({ status: 'failed', callback_handled: false })
          .eq('id', payment_intent_id);
          
        const redirectUrl = buildRedirectUrl(isNative, 'order', 'failed', {
          error: orderError.message || 'Failed to create order',
          store_slug: store_slug || '',
          intent_id: payment_intent_id
        });
        return redirectResponse(redirectUrl);
      }

      // Update payment intent to completed
      await supabase
        .from('payment_intents')
        .update({
          status: 'completed',
          razorpay_payment_id: razorpay_payment_id
        })
        .eq('id', payment_intent_id);

      // Handle coupon redemption if applicable
      if (draftOrder.coupon_id) {
        await supabase.from('coupon_redemptions').insert({
          tenant_id: paymentIntent.tenant_id,
          coupon_id: draftOrder.coupon_id,
          order_id: orderId,
          customer_id: draftOrder.customer_id || null,
          discount_amount: draftOrder.discount_total || 0
        });
        
        await supabase.rpc('increment_coupon_usage', {
          p_coupon_id: draftOrder.coupon_id
        });
      }

      const redirectUrl = buildRedirectUrl(isNative, 'order', 'success', {
        store_slug: store_slug || '',
        order_number: draftOrder.order_number,
        payment_id: razorpay_payment_id
      });
      return redirectResponse(redirectUrl);
    }

    // Unknown type - redirect to app
    return redirectResponse(`${APP_URL}/payment-callback?status=error&error=Unknown payment type`);

  } catch (error) {
    console.error('Payment callback error:', error);
    return redirectResponse(`${APP_URL}/payment-callback?status=error&error=Internal server error`);
  }
});
