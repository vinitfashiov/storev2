import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tenant-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TrackingEvent {
  type: 'session_start' | 'session_end' | 'page_view' | 'event' | 'performance';
  session_id: string;
  visitor_id?: string;
  data: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'Missing tenant ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: TrackingEvent = await req.json();
    const { type, session_id, visitor_id, data } = body;

    // Get geo data from headers (Cloudflare/Supabase provides these)
    const country = req.headers.get('cf-ipcountry') || req.headers.get('x-country') || null;
    const city = req.headers.get('cf-ipcity') || req.headers.get('x-city') || null;
    const region = req.headers.get('cf-ipregion') || req.headers.get('x-region') || null;
    const latitude = parseFloat(req.headers.get('cf-iplat') || req.headers.get('x-lat') || '0') || null;
    const longitude = parseFloat(req.headers.get('cf-iplon') || req.headers.get('x-lon') || '0') || null;

    switch (type) {
      case 'session_start': {
        const { error } = await supabase.from('store_sessions').insert({
          tenant_id: tenantId,
          session_id,
          visitor_id,
          country,
          country_code: country,
          city,
          region,
          latitude,
          longitude,
          device_type: data.device_type as string || null,
          browser: data.browser as string || null,
          os: data.os as string || null,
          referrer: data.referrer as string || null,
          landing_page: data.landing_page as string || null,
        });
        if (error) throw error;
        break;
      }

      case 'session_end': {
        const { error } = await supabase
          .from('store_sessions')
          .update({
            ended_at: new Date().toISOString(),
            duration_seconds: data.duration_seconds as number || 0,
            page_views: data.page_views as number || 1,
            exit_page: data.exit_page as string || null,
            is_bounce: data.is_bounce as boolean || false,
            is_converted: data.is_converted as boolean || false,
            order_id: data.order_id as string || null,
            cart_value: data.cart_value as number || null,
          })
          .eq('session_id', session_id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        break;
      }

      case 'page_view': {
        const { error } = await supabase.from('store_page_views').insert({
          tenant_id: tenantId,
          session_id,
          page_url: data.page_url as string,
          page_title: data.page_title as string || null,
          load_time_ms: data.load_time_ms as number || null,
        });
        if (error) throw error;
        break;
      }

      case 'event': {
        const { error } = await supabase.from('store_events').insert({
          tenant_id: tenantId,
          session_id,
          event_type: data.event_type as string,
          event_data: data.event_data as Record<string, unknown> || null,
          page_url: data.page_url as string || null,
        });
        if (error) throw error;
        break;
      }

      case 'performance': {
        const { error } = await supabase.from('store_performance_metrics').insert({
          tenant_id: tenantId,
          page_url: data.page_url as string,
          ttfb_ms: data.ttfb_ms as number || null,
          fcp_ms: data.fcp_ms as number || null,
          lcp_ms: data.lcp_ms as number || null,
          fid_ms: data.fid_ms as number || null,
          cls: data.cls as number || null,
          dom_interactive_ms: data.dom_interactive_ms as number || null,
          dom_complete_ms: data.dom_complete_ms as number || null,
          device_type: data.device_type as string || null,
          connection_type: data.connection_type as string || null,
        });
        if (error) throw error;
        break;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Tracking error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
