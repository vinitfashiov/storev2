import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { store_slug, payment_intent_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    console.log('Verifying Razorpay payment:', { store_slug, payment_intent_id, razorpay_order_id, razorpay_payment_id });

    if (!store_slug || !payment_intent_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Resolve tenant
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
      return new Response(
        JSON.stringify({ success: false, error: 'Store subscription expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load Razorpay secret
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

    // Fetch payment intent
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

    // Verify signature using HMAC SHA256
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
    console.log('Signature verification:', { isValid, computed: signatureHex, received: razorpay_signature });

    if (isValid) {
      // Update payment intent as paid
      await supabase
        .from('payment_intents')
        .update({
          status: 'paid',
          razorpay_payment_id,
        })
        .eq('id', payment_intent_id);

      // Create the real order from draft_order_data
      const draftData = paymentIntent.draft_order_data as {
        order_number: string;
        customer_name: string;
        customer_phone: string;
        customer_email?: string;
        customer_id?: string;
        shipping_address: Record<string, string>;
        subtotal: number;
        delivery_fee: number;
        total: number;
        delivery_zone_id?: string;
        delivery_slot_id?: string;
        delivery_option: string;
        items: Array<{
          product_id: string;
          name: string;
          qty: number;
          unit_price: number;
          stock_qty: number;
        }>;
      };

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          tenant_id: tenant.id,
          order_number: draftData.order_number,
          customer_id: draftData.customer_id || null,
          customer_name: draftData.customer_name,
          customer_phone: draftData.customer_phone,
          customer_email: draftData.customer_email || null,
          shipping_address: draftData.shipping_address,
          subtotal: draftData.subtotal,
          delivery_fee: draftData.delivery_fee,
          total: draftData.total,
          payment_method: 'razorpay',
          status: 'confirmed',
          payment_status: 'paid',
          delivery_zone_id: draftData.delivery_zone_id || null,
          delivery_slot_id: draftData.delivery_slot_id || null,
          delivery_option: draftData.delivery_option,
          razorpay_order_id,
          razorpay_payment_id,
        })
        .select()
        .single();

      if (orderError || !newOrder) {
        console.error('Failed to create order:', orderError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create order' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Order created:', newOrder.id);

      // Create order items, reduce stock, and create inventory movements
      for (const item of draftData.items) {
        await supabase.from('order_items').insert({
          tenant_id: tenant.id,
          order_id: newOrder.id,
          product_id: item.product_id,
          name: item.name,
          qty: item.qty,
          unit_price: item.unit_price,
          line_total: item.unit_price * item.qty,
        });

        // Create inventory movement for ledger tracking
        await supabase.from('inventory_movements').insert({
          tenant_id: tenant.id,
          product_id: item.product_id,
          movement_type: 'sale',
          quantity: -item.qty,
          reference_type: 'order',
          reference_id: newOrder.id,
          notes: `Online order ${draftData.order_number}`,
        });

        // Reduce stock
        const newStock = Math.max(0, (item.stock_qty || 0) - item.qty);
        await supabase
          .from('products')
          .update({ stock_qty: newStock })
          .eq('id', item.product_id);
      }

      // Mark cart as converted
      await supabase
        .from('carts')
        .update({ status: 'converted' })
        .eq('id', paymentIntent.cart_id);

      console.log('Payment verified and order created successfully');
      return new Response(
        JSON.stringify({ success: true, order_number: draftData.order_number }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Mark payment intent as failed
      await supabase
        .from('payment_intents')
        .update({ status: 'failed' })
        .eq('id', payment_intent_id);

      console.error('Invalid signature');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid payment signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in verify-razorpay-payment:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
