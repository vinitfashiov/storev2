import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to verify the admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is authenticated and get their tenant
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's tenant
    const { data: userTenant } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!userTenant) {
      return new Response(
        JSON.stringify({ error: 'No tenant found for user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data } = await req.json();

    if (action === 'create') {
      const { full_name, mobile_number, password, payment_type, monthly_salary, per_order_amount, percentage_value, account_holder_name, account_number, upi_id, ifsc_code } = data;

      if (!full_name || !mobile_number || !password) {
        return new Response(
          JSON.stringify({ error: 'Name, mobile number, and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash the password with bcrypt
      const passwordHash = await bcrypt.hash(password);

      const { data: newBoy, error: insertError } = await supabase
        .from('delivery_boys')
        .insert({
          tenant_id: userTenant.tenant_id,
          full_name,
          mobile_number,
          password_hash: passwordHash,
          payment_type: payment_type || 'fixed_per_order',
          monthly_salary: monthly_salary || 0,
          per_order_amount: per_order_amount || 50,
          percentage_value: percentage_value || 0,
          account_holder_name: account_holder_name || null,
          account_number: account_number || null,
          upi_id: upi_id || null,
          ifsc_code: ifsc_code || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create delivery boy:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create delivery boy' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: newBoy }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'update') {
      const { id, full_name, mobile_number, password, payment_type, monthly_salary, per_order_amount, percentage_value, account_holder_name, account_number, upi_id, ifsc_code } = data;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Delivery boy ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the delivery boy belongs to the user's tenant
      const { data: existingBoy } = await supabase
        .from('delivery_boys')
        .select('id, tenant_id')
        .eq('id', id)
        .eq('tenant_id', userTenant.tenant_id)
        .maybeSingle();

      if (!existingBoy) {
        return new Response(
          JSON.stringify({ error: 'Delivery boy not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateData: Record<string, any> = {
        full_name,
        mobile_number,
        payment_type,
        monthly_salary,
        per_order_amount,
        percentage_value,
        account_holder_name: account_holder_name || null,
        account_number: account_number || null,
        upi_id: upi_id || null,
        ifsc_code: ifsc_code || null,
      };

      // Only hash password if provided
      if (password) {
        updateData.password_hash = await bcrypt.hash(password);
      }

      const { data: updatedBoy, error: updateError } = await supabase
        .from('delivery_boys')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update delivery boy:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update delivery boy' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: updatedBoy }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Delivery boy manage error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
