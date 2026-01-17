import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenant_id, redirect_url } = await req.json();

    if (!tenant_id || !redirect_url) {
      return new Response(
        JSON.stringify({ error: 'tenant_id and redirect_url are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OAuth credentials from environment
    const clientId = Deno.env.get('RAZORPAY_OAUTH_CLIENT_ID');
    
    if (!clientId) {
      return new Response(
        JSON.stringify({ 
          error: 'Razorpay OAuth not configured',
          message: 'Platform owner needs to configure Razorpay Partner OAuth credentials'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a secure state parameter to prevent CSRF
    const state = crypto.randomUUID();

    // Store the state in the database for verification later
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update or insert the state for this tenant
    const { data: existing } = await supabase
      .from('tenant_integrations')
      .select('id')
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('tenant_integrations')
        .update({ razorpay_oauth_state: state })
        .eq('tenant_id', tenant_id);
    } else {
      await supabase
        .from('tenant_integrations')
        .insert({ tenant_id, razorpay_oauth_state: state });
    }

    // Build the Razorpay OAuth authorization URL
    // Scopes: read_write for full access to create orders and process payments
    const scopes = ['read_write'];
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/razorpay-oauth-callback`;

    const authUrl = new URL('https://auth.razorpay.com/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', `${tenant_id}:${state}:${encodeURIComponent(redirect_url)}`);

    console.log('Generated Razorpay OAuth URL for tenant:', tenant_id);

    return new Response(
      JSON.stringify({ auth_url: authUrl.toString() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in razorpay-oauth-init:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
