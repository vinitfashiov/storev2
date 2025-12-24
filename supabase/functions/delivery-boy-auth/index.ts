import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, mobile_number, password, store_slug } = await req.json();

    console.log(`Delivery boy auth action: ${action} for store: ${store_slug}`);

    if (action === 'login') {
      if (!mobile_number || !password || !store_slug) {
        return new Response(
          JSON.stringify({ error: 'Mobile number, password, and store slug are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get tenant by store slug
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, store_name, business_type')
        .eq('store_slug', store_slug)
        .eq('is_active', true)
        .single();

      if (tenantError || !tenant) {
        console.error('Tenant not found:', tenantError);
        return new Response(
          JSON.stringify({ error: 'Store not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if business type is grocery
      if (tenant.business_type !== 'grocery') {
        return new Response(
          JSON.stringify({ error: 'Delivery system not available for this store' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find delivery boy by mobile number and tenant
      const { data: deliveryBoy, error: boyError } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('mobile_number', mobile_number)
        .eq('is_active', true)
        .single();

      if (boyError || !deliveryBoy) {
        console.error('Delivery boy not found:', boyError);
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify password (simple comparison - in production use bcrypt)
      if (deliveryBoy.password_hash !== password) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get assigned areas
      const { data: assignedAreas } = await supabase
        .from('delivery_boy_areas')
        .select('delivery_area_id, delivery_areas(id, name, pincodes)')
        .eq('delivery_boy_id', deliveryBoy.id);

      // Generate a simple session token (in production use JWT)
      const sessionToken = crypto.randomUUID();

      console.log(`Delivery boy ${deliveryBoy.full_name} logged in successfully`);

      return new Response(
        JSON.stringify({
          success: true,
          delivery_boy: {
            id: deliveryBoy.id,
            full_name: deliveryBoy.full_name,
            mobile_number: deliveryBoy.mobile_number,
            payment_type: deliveryBoy.payment_type,
            wallet_balance: deliveryBoy.wallet_balance,
            total_earned: deliveryBoy.total_earned,
            total_paid: deliveryBoy.total_paid,
          },
          tenant: {
            id: tenant.id,
            store_name: tenant.store_name,
          },
          assigned_areas: assignedAreas?.map(a => a.delivery_areas) || [],
          session_token: sessionToken,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delivery-boy-auth:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
