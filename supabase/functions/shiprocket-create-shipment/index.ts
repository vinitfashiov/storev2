import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile } = await supabaseClient.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile?.tenant_id) {
      return new Response(JSON.stringify({ error: 'No tenant found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Order ID required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get Shiprocket credentials
    const { data: integration } = await supabaseClient.from('tenant_integrations').select('shiprocket_email, shiprocket_password').eq('tenant_id', profile.tenant_id).single();
    if (!integration?.shiprocket_email || !integration?.shiprocket_password) {
      return new Response(JSON.stringify({ error: 'Shiprocket not configured' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if shipment already exists
    const { data: existingShipment } = await supabaseClient.from('shiprocket_shipments').select('id').eq('order_id', order_id).maybeSingle();
    if (existingShipment) {
      return new Response(JSON.stringify({ error: 'Shipment already created' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get order with items
    const { data: order, error: orderError } = await supabaseClient.from('orders').select('*, order_items(*)').eq('id', order_id).eq('tenant_id', profile.tenant_id).single();
    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Authenticate with Shiprocket
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: integration.shiprocket_email, password: integration.shiprocket_password })
    });
    const authData = await authRes.json();
    if (!authData.token) {
      console.error('Shiprocket auth failed:', authData);
      return new Response(JSON.stringify({ error: 'Shiprocket authentication failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const address = order.shipping_address as Record<string, string>;
    
    // Create shipment
    const shipmentPayload = {
      order_id: order.order_number,
      order_date: new Date(order.created_at).toISOString().split('T')[0],
      pickup_location: 'Primary',
      billing_customer_name: order.customer_name,
      billing_last_name: '',
      billing_address: address.line1 || '',
      billing_address_2: address.line2 || '',
      billing_city: address.city || '',
      billing_pincode: address.pincode || '',
      billing_state: address.state || '',
      billing_country: 'India',
      billing_email: order.customer_email || '',
      billing_phone: order.customer_phone,
      shipping_is_billing: true,
      order_items: order.order_items.map((item: any) => ({
        name: item.name,
        sku: `SKU-${item.product_id?.slice(0, 8) || 'NA'}`,
        units: item.qty,
        selling_price: Number(item.unit_price),
      })),
      payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
      sub_total: Number(order.total),
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    const shipRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authData.token}` },
      body: JSON.stringify(shipmentPayload)
    });
    const shipData = await shipRes.json();

    if (!shipData.order_id) {
      console.error('Shiprocket create failed:', shipData);
      return new Response(JSON.stringify({ error: shipData.message || 'Failed to create shipment' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Save shipment record
    await supabaseClient.from('shiprocket_shipments').insert({
      tenant_id: profile.tenant_id,
      order_id: order_id,
      shiprocket_order_id: String(shipData.order_id),
      shipment_id: shipData.shipment_id ? String(shipData.shipment_id) : null,
      awb_code: shipData.awb_code || null,
      courier_name: shipData.courier_name || null,
      status: shipData.status || 'created',
      raw_response: shipData
    });

    return new Response(JSON.stringify({ success: true, shiprocket_order_id: shipData.order_id, shipment_id: shipData.shipment_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
