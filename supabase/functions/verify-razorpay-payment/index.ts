import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Validation Schemas ---

const WebhookSchema = z.object({
  store_slug: z.string().min(1, "Store slug is required"),
  payment_intent_id: z.string().uuid("Invalid Payment Intent ID"),
  razorpay_order_id: z.string().min(1, "Razorpay Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay Payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay Signature is required"),
});

// item inside draft_order_data
const OrderItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().nullable().optional(),
  name: z.string(),
  qty: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  line_total: z.number().nonnegative().optional(),
  stock_qty: z.number().int().nonnegative(),
});

// Draft Order Data Structure
const DraftOrderDataSchema = z.object({
  order_number: z.string(),
  customer_name: z.string(),
  customer_phone: z.string(),
  customer_email: z.string().email().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  shipping_address: z.record(z.string()), // Flexible address object
  subtotal: z.number(),
  delivery_fee: z.number(),
  total: z.number(),
  delivery_zone_id: z.string().uuid().optional().nullable(),
  delivery_slot_id: z.string().uuid().optional().nullable(),
  delivery_option: z.string().default('standard'),
  items: z.array(OrderItemSchema),
  coupon_id: z.string().uuid().optional().nullable(),
  coupon_code: z.string().optional().nullable(),
  discount_total: z.number().optional().default(0),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate Payload
    const body = await req.json().catch(() => ({}));
    const validationResult = WebhookSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation Error:', validationResult.error);
      return new Response(
        JSON.stringify({ success: false, error: validationResult.error.errors[0].message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { store_slug, payment_intent_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = validationResult.data;

    console.log('Verifying Razorpay payment:', { store_slug, payment_intent_id, razorpay_order_id });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Resolve & Validate Tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, plan, trial_ends_at, is_active')
      .eq('store_slug', store_slug)
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant not found:', tenantError);
      return new Response(
        JSON.stringify({ success: false, error: 'Store not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check tenant is active
    const now = new Date();
    const trialEndsAt = new Date(tenant.trial_ends_at);
    const isActive = tenant.plan === 'pro' || now < trialEndsAt;

    if (!isActive || !tenant.is_active) {
      console.error(`Store ${store_slug} is inactive or expired.`);
      return new Response(
        JSON.stringify({ success: false, error: 'Store subscription expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Load Secrets & Verify Signature
    const { data: integration, error: integrationError } = await supabase
      .from('tenant_integrations')
      .select('razorpay_key_secret')
      .eq('tenant_id', tenant.id)
      .single();

    if (integrationError || !integration?.razorpay_key_secret) {
      console.error('Razorpay not configured:', integrationError);
      return new Response(
        JSON.stringify({ success: false, error: 'Razorpay not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(integration.razorpay_key_secret);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = signatureHex === razorpay_signature;

    if (!isValid) {
      console.error('Invalid signature:', { computed: signatureHex, received: razorpay_signature });

      // Mark as failed
      await supabase
        .from('payment_intents')
        .update({ status: 'failed' })
        .eq('id', payment_intent_id);

      return new Response(
        JSON.stringify({ success: false, error: 'Invalid payment signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Retrieve Payment Intent & Parse Draft Data
    const { data: paymentIntent, error: piError } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('id', payment_intent_id)
      .eq('tenant_id', tenant.id)
      .single();

    if (piError || !paymentIntent) {
      console.error('Payment intent not found:', piError);
      return new Response(
        JSON.stringify({ success: false, error: 'Payment intent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (paymentIntent.status === 'paid') {
      console.log('Payment intent already paid. Returning success.');
      return new Response(
        JSON.stringify({ success: true, message: 'Already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Draft Order Data
    const draftParseResult = DraftOrderDataSchema.safeParse(paymentIntent.draft_order_data);
    if (!draftParseResult.success) {
      console.error('Corrupt draft_order_data:', draftParseResult.error);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid order data in payment intent' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const draftData = draftParseResult.data;

    // 5. Create Order (Atomic)
    // CRITICAL: Create order BEFORE marking intent as paid.

    // Prepare order items
    const orderItemsData = draftData.items.map(item => ({
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      name: item.name,
      qty: item.qty,
      unit_price: item.unit_price,
      line_total: item.line_total || (item.unit_price * item.qty)
    }));

    console.log('Attempting to create order via RPC...');

    const { data: orderId, error: orderError } = await supabase.rpc('create_order_atomic', {
      p_tenant_id: tenant.id,
      p_order_number: draftData.order_number,
      p_customer_id: draftData.customer_id || null,
      p_customer_name: draftData.customer_name,
      p_customer_phone: draftData.customer_phone,
      p_customer_email: draftData.customer_email || null,
      p_shipping_address: draftData.shipping_address,
      p_subtotal: draftData.subtotal,
      p_discount_total: draftData.discount_total || 0,
      p_delivery_fee: draftData.delivery_fee || 0,
      p_total: draftData.total,
      p_payment_method: 'razorpay',
      p_payment_status: 'paid',
      p_status: 'confirmed',
      p_delivery_zone_id: draftData.delivery_zone_id || null,
      p_delivery_slot_id: draftData.delivery_slot_id || null,
      p_delivery_option: draftData.delivery_option || 'standard',
      p_coupon_id: draftData.coupon_id || null,
      p_coupon_code: draftData.coupon_code || null,
      p_razorpay_order_id: razorpay_order_id,
      p_razorpay_payment_id: razorpay_payment_id,
      p_order_items: orderItemsData,
      p_cart_id: paymentIntent.cart_id
    });

    if (orderError || !orderId) {
      console.error('Failed to create order:', orderError);

      // Do NOT mark as paid. Return 500 so Razorpay (or client) knows it failed.
      return new Response(
        JSON.stringify({
          success: false,
          error: orderError?.message || 'Failed to create order'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order created atomically:', orderId);

    // 6. Success! Update Payment Intent & Auxiliary Tasks

    // Update payment intent
    await supabase
      .from('payment_intents')
      .update({
        status: 'paid',
        razorpay_payment_id,
      })
      .eq('id', payment_intent_id);

    // Handle Coupons
    if (draftData.coupon_id) {
      // Fire and forget - not critical for order success
      Promise.all([
        supabase.from('coupon_redemptions').insert({
          tenant_id: tenant.id,
          coupon_id: draftData.coupon_id,
          order_id: orderId,
          customer_id: draftData.customer_id || null,
          discount_amount: draftData.discount_total || 0
        }),
        supabase.rpc('increment_coupon_usage', {
          p_coupon_id: draftData.coupon_id
        })
      ]).catch(err => console.error('Coupon Error:', err));
    }

    // Handle Grocery Delivery Assignments
    const { data: tenantInfo } = await supabase
      .from('tenants')
      .select('business_type')
      .eq('id', tenant.id)
      .single();

    if (tenantInfo?.business_type === 'grocery') {
      const pincode = draftData.shipping_address?.pincode;

      // We can run this async
      (async () => {
        let deliveryAreaId = null;
        if (pincode) {
          const { data: deliveryAreas } = await supabase
            .from('delivery_areas')
            .select('id, pincodes')
            .eq('tenant_id', tenant.id)
            .eq('is_active', true);

          const matchedArea = deliveryAreas?.find((area: any) =>
            area.pincodes?.includes(pincode)
          );
          deliveryAreaId = matchedArea?.id || null;
        }

        await supabase.from('delivery_assignments').insert({
          tenant_id: tenant.id,
          order_id: orderId,
          delivery_area_id: deliveryAreaId,
          status: 'unassigned'
        });
      })().catch(err => console.error('Delivery Assignment Error:', err));
    }

    console.log('Payment verified and order created successfully');
    return new Response(
      JSON.stringify({ success: true, order_number: draftData.order_number }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-razorpay-payment:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

