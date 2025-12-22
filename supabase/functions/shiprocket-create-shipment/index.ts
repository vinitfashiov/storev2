import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map of Indian state codes to full names (Shiprocket requires full names)
const stateNameMap: Record<string, string> = {
  'AN': 'Andaman and Nicobar Islands',
  'AP': 'Andhra Pradesh',
  'AR': 'Arunachal Pradesh',
  'AS': 'Assam',
  'BR': 'Bihar',
  'CH': 'Chandigarh',
  'CT': 'Chhattisgarh',
  'DD': 'Daman and Diu',
  'DL': 'Delhi',
  'GA': 'Goa',
  'GJ': 'Gujarat',
  'HP': 'Himachal Pradesh',
  'HR': 'Haryana',
  'JH': 'Jharkhand',
  'JK': 'Jammu and Kashmir',
  'KA': 'Karnataka',
  'KL': 'Kerala',
  'LA': 'Ladakh',
  'LD': 'Lakshadweep',
  'MH': 'Maharashtra',
  'ML': 'Meghalaya',
  'MN': 'Manipur',
  'MP': 'Madhya Pradesh',
  'MZ': 'Mizoram',
  'NL': 'Nagaland',
  'OR': 'Odisha',
  'PB': 'Punjab',
  'PY': 'Puducherry',
  'RJ': 'Rajasthan',
  'SK': 'Sikkim',
  'TN': 'Tamil Nadu',
  'TS': 'Telangana',
  'TR': 'Tripura',
  'UK': 'Uttarakhand',
  'UP': 'Uttar Pradesh',
  'WB': 'West Bengal',
};

function getFullStateName(stateCode: string): string {
  if (!stateCode) return '';
  const upperCode = stateCode.toUpperCase().trim();
  // Check if it's already a full name
  if (upperCode.length > 2) {
    return stateCode;
  }
  return stateNameMap[upperCode] || stateCode;
}

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
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile } = await supabaseClient.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile?.tenant_id) {
      console.error('No tenant found for user:', user.id);
      return new Response(JSON.stringify({ error: 'No tenant found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      console.error('No order_id provided');
      return new Response(JSON.stringify({ error: 'Order ID required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Processing order:', order_id, 'for tenant:', profile.tenant_id);

    // Get Shiprocket credentials
    const { data: integration, error: integrationError } = await supabaseClient
      .from('tenant_integrations')
      .select('shiprocket_email, shiprocket_password')
      .eq('tenant_id', profile.tenant_id)
      .single();
    
    if (integrationError) {
      console.error('Integration fetch error:', integrationError);
    }
    
    if (!integration?.shiprocket_email || !integration?.shiprocket_password) {
      console.error('Shiprocket credentials missing');
      return new Response(JSON.stringify({ error: 'Shiprocket not configured. Please add your Shiprocket email and password in Integrations settings.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Shiprocket credentials found for:', integration.shiprocket_email);

    // Check if shipment already exists
    const { data: existingShipment } = await supabaseClient
      .from('shiprocket_shipments')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle();
    
    if (existingShipment) {
      console.error('Shipment already exists for order:', order_id);
      return new Response(JSON.stringify({ error: 'Shipment already created for this order' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get order with items
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .eq('tenant_id', profile.tenant_id)
      .single();
    
    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Order found:', order.order_number, 'with', order.order_items?.length, 'items');

    // Authenticate with Shiprocket
    console.log('Authenticating with Shiprocket...');
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: integration.shiprocket_email,
        password: integration.shiprocket_password,
      }),
    });

    const authRaw = await authRes.text();
    let authData: any = {};
    try {
      authData = authRaw ? JSON.parse(authRaw) : {};
    } catch {
      authData = { raw: authRaw };
    }

    console.log('Shiprocket auth response status:', authRes.status);
    console.log('Shiprocket auth response body:', JSON.stringify(authData));

    if (!authRes.ok || !authData?.token) {
      const message =
        authData?.message ||
        authData?.error ||
        (typeof authData === 'string' ? authData : '') ||
        'Shiprocket authentication failed. Please check your credentials in Integrations.';

      console.error('Shiprocket auth failed:', JSON.stringify(authData));

      // Return the real HTTP status from Shiprocket for easier debugging
      return new Response(
        JSON.stringify({
          error: message,
          shiprocket_status: authRes.status,
          shiprocket_response: authData,
        }),
        {
          status: authRes.status === 401 || authRes.status === 403 ? authRes.status : 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Shiprocket authentication successful');

    const address = order.shipping_address as Record<string, string>;
    const fullStateName = getFullStateName(address.state || '');
    
    // Format order date as YYYY-MM-DD
    const orderDate = new Date(order.created_at).toISOString().split('T')[0];
    
    // Build order items for Shiprocket
    const orderItems = (order.order_items || []).map((item: any) => ({
      name: item.name || 'Product',
      sku: item.product_id ? `SKU-${item.product_id.slice(0, 8)}` : `SKU-${Date.now()}`,
      units: item.qty || 1,
      selling_price: Number(item.unit_price) || 0,
    }));

    if (orderItems.length === 0) {
      console.error('No order items found');
      return new Response(JSON.stringify({ error: 'Order has no items' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create shipment payload
    const shipmentPayload = {
      order_id: order.order_number,
      order_date: orderDate,
      pickup_location: 'Primary',
      billing_customer_name: order.customer_name || 'Customer',
      billing_last_name: '',
      billing_address: address.line1 || 'Address',
      billing_address_2: address.line2 || '',
      billing_city: address.city || 'City',
      billing_pincode: address.pincode || '000000',
      billing_state: fullStateName || 'State',
      billing_country: 'India',
      billing_email: order.customer_email || 'customer@example.com',
      billing_phone: order.customer_phone || '0000000000',
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
      sub_total: Number(order.total) || 0,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    console.log('Creating Shiprocket order with payload:', JSON.stringify(shipmentPayload));

    const shipRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${authData.token}` 
      },
      body: JSON.stringify(shipmentPayload)
    });
    
    const shipData = await shipRes.json();
    console.log('Shiprocket create order response status:', shipRes.status);
    console.log('Shiprocket create order response:', JSON.stringify(shipData));

    if (!shipData.order_id) {
      console.error('Shiprocket order creation failed:', JSON.stringify(shipData));
      const errorMessage = shipData.message || shipData.errors || 'Failed to create shipment in Shiprocket';
      return new Response(JSON.stringify({ 
        error: typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage 
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Shiprocket order created successfully:', shipData.order_id);

    // Save shipment record
    const { error: insertError } = await supabaseClient.from('shiprocket_shipments').insert({
      tenant_id: profile.tenant_id,
      order_id: order_id,
      shiprocket_order_id: String(shipData.order_id),
      shipment_id: shipData.shipment_id ? String(shipData.shipment_id) : null,
      awb_code: shipData.awb_code || null,
      courier_name: shipData.courier_name || null,
      status: shipData.status || 'created',
      raw_response: shipData
    });

    if (insertError) {
      console.error('Failed to save shipment record:', insertError);
      // Don't fail the request, the shipment was created in Shiprocket
    }

    console.log('Shipment record saved successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      shiprocket_order_id: shipData.order_id, 
      shipment_id: shipData.shipment_id,
      message: 'Shipment created successfully'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
