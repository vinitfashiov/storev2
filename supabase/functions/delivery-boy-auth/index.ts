import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { getSupabaseClient, getTenantBySlug, successResponse, errorResponse } from "../_shared/utils.ts";
import { monitor, createContext } from "../_shared/monitoring.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const context = createContext('delivery-boy-auth', req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

    const { action, mobile_number, password, store_slug } = await req.json();

    if (action === 'login') {
      if (!mobile_number || !password || !store_slug) {
        return errorResponse('Mobile number, password, and store slug are required', 400);
      }

      // Get tenant (cached)
      const tenant = await monitor.trackPerformance(
        'get_tenant',
        () => getTenantBySlug(supabase, store_slug),
        { ...context, store_slug }
      );

      if (!tenant) {
        return errorResponse('Store not found', 404);
      }

      // Check if business type is grocery
      if (tenant.business_type !== 'grocery') {
        return errorResponse('Delivery system not available for this store', 403);
      }

      // Find delivery boy by mobile number and tenant
      const { data: deliveryBoy, error: boyError } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('mobile_number', mobile_number)
        .eq('is_active', true)
        .maybeSingle();

      if (boyError || !deliveryBoy) {
        return errorResponse('Invalid credentials', 401);
      }

      // Verify password using bcrypt
      let isValidPassword = false;
      try {
        // Try bcrypt verification first (for properly hashed passwords)
        isValidPassword = await bcrypt.compare(password, deliveryBoy.password_hash);
      } catch {
        // Fallback for legacy plaintext passwords - compare directly
        // This allows existing users to login and they should reset password
        isValidPassword = deliveryBoy.password_hash === password;
        
        // If plaintext match, upgrade to bcrypt hash
        if (isValidPassword) {
          const newHash = await bcrypt.hash(password);
          await supabase
            .from('delivery_boys')
            .update({ password_hash: newHash })
            .eq('id', deliveryBoy.id);
        }
      }

      if (!isValidPassword) {
        return errorResponse('Invalid credentials', 401);
      }

      // Create session token with proper storage and expiry
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      // Store session in database
      const { error: sessionError } = await supabase
        .from('delivery_boy_sessions')
        .insert({
          delivery_boy_id: deliveryBoy.id,
          token: sessionToken,
          expires_at: expiresAt,
        });

      if (sessionError) {
        await monitor.logError(sessionError, context);
        return errorResponse('Failed to create session', 500);
      }

      // Update last login time
      await supabase
        .from('delivery_boys')
        .update({
          last_login_at: new Date().toISOString(),
        })
        .eq('id', deliveryBoy.id);

      return successResponse({
        success: true,
        delivery_boy: {
          id: deliveryBoy.id,
          name: deliveryBoy.full_name,
          mobile_number: deliveryBoy.mobile_number,
          tenant_id: deliveryBoy.tenant_id,
        },
        token: sessionToken,
        expires_at: expiresAt,
      });

    } else if (action === 'logout') {
      return successResponse({ success: true });
    } else {
      return errorResponse('Invalid action', 400);
    }

  } catch (error) {
    await monitor.logError(error, context);
    return errorResponse('Internal server error', 500, error);
  }
});
