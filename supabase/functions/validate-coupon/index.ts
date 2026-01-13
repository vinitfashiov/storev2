import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient, getTenantBySlug, successResponse, errorResponse } from "../_shared/utils.ts";
import { monitor, createContext } from "../_shared/monitoring.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const context = createContext('validate-coupon', req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { store_slug, coupon_code, cart_subtotal, customer_id } = await req.json();

    if (!store_slug || !coupon_code) {
      return errorResponse('Missing required fields', 400);
    }

    const supabase = getSupabaseClient();

    // Get tenant (cached)
    const tenant = await monitor.trackPerformance(
      'get_tenant',
      () => getTenantBySlug(supabase, store_slug),
      { ...context, store_slug }
    );

    if (!tenant) {
      return errorResponse('Store not found', 404);
    }

    // Get coupon by code - check both 'code' field and look for matching coupon
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('code', coupon_code.toUpperCase().trim())
      .eq('is_active', true)
      .maybeSingle();

    if (couponError || !coupon) {
      return successResponse({ error: 'Invalid coupon code', valid: false });
    }

    // Check expiry date (ends_at is the field name in the schema)
    const now = new Date();
    
    if (coupon.ends_at) {
      const expiryDate = new Date(coupon.ends_at);
      if (expiryDate < now) {
        return successResponse({ error: 'Coupon has expired', valid: false });
      }
    }

    // Check start date
    if (coupon.starts_at) {
      const startDate = new Date(coupon.starts_at);
      if (startDate > now) {
        return successResponse({ error: 'Coupon is not yet active', valid: false });
      }
    }

    // Check minimum cart amount (min_cart_amount is the field name)
    if (coupon.min_cart_amount && cart_subtotal < coupon.min_cart_amount) {
      return successResponse({
        error: `Minimum cart amount of ₹${coupon.min_cart_amount} required`,
        valid: false,
      });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return successResponse({
        error: 'Coupon usage limit reached',
        valid: false,
      });
    }

    // Calculate discount - coupon.type is 'percent' or 'fixed', coupon.value is the amount
    let discount_amount = 0;
    if (coupon.type === 'percent') {
      discount_amount = (cart_subtotal * coupon.value) / 100;
      // Apply max discount cap if set
      if (coupon.max_discount_amount && discount_amount > coupon.max_discount_amount) {
        discount_amount = coupon.max_discount_amount;
      }
    } else {
      // Fixed discount
      discount_amount = coupon.value;
    }

    // Don't exceed cart total
    discount_amount = Math.min(discount_amount, cart_subtotal);

    // Return in the format the frontend expects
    return successResponse({
      valid: true,
      coupon_id: coupon.id,
      coupon_code: coupon.code,
      coupon_type: coupon.type, // 'percent' or 'fixed'
      coupon_value: coupon.value,
      discount_amount: Math.round(discount_amount * 100) / 100,
      message: `Coupon applied! You save ₹${Math.round(discount_amount)}`
    });

  } catch (error) {
    await monitor.logError(error, context);
    return errorResponse('Internal server error', 500, error);
  }
});
