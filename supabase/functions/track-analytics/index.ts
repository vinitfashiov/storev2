import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-tenant-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TrackingEvent {
  type: "session_start" | "session_end" | "page_view" | "event" | "performance";
  session_id: string;
  visitor_id?: string;
  data: Record<string, unknown>;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return null;
}

async function getGeoFromIp(ip: string): Promise<{
  country?: string;
  country_code?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
} | null> {
  // ipapi.co provides a free tier without keys; keep tight timeouts.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);

  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "store-analytics/1.0",
      },
    });

    if (!res.ok) return null;
    const json = await res.json();

    return {
      country: typeof json.country_name === "string" ? json.country_name : undefined,
      country_code: typeof json.country_code === "string" ? json.country_code : undefined,
      city: typeof json.city === "string" ? json.city : undefined,
      region: typeof json.region === "string" ? json.region : undefined,
      latitude: typeof json.latitude === "number" ? json.latitude : undefined,
      longitude: typeof json.longitude === "number" ? json.longitude : undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function reverseGeoFromCoords(lat: number, lon: number): Promise<{
  country?: string;
  country_code?: string;
  city?: string;
  region?: string;
} | null> {
  // OpenStreetMap Nominatim reverse geocode (no key). Keep very tight timeouts.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('zoom', '10');
    url.searchParams.set('addressdetails', '1');

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        // Nominatim requires a valid UA
        'User-Agent': 'store-analytics/1.0',
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const addr = json?.address || {};

    const city =
      (typeof addr.city === 'string' && addr.city) ||
      (typeof addr.town === 'string' && addr.town) ||
      (typeof addr.village === 'string' && addr.village) ||
      (typeof addr.county === 'string' && addr.county) ||
      undefined;

    return {
      city,
      region: typeof addr.state === 'string' ? addr.state : undefined,
      country: typeof addr.country === 'string' ? addr.country : undefined,
      country_code: typeof addr.country_code === 'string' ? String(addr.country_code).toUpperCase() : undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tenantId = req.headers.get("x-tenant-id");
    if (!tenantId) {
      return new Response(JSON.stringify({ error: "Missing tenant ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isUuid(tenantId)) {
      return new Response(JSON.stringify({ error: "Invalid tenant ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: TrackingEvent = await req.json();
    const { type, session_id, visitor_id, data } = body;

    // 1) Prefer client-provided geo (browser permission) when present.
    const clientLat = typeof (data as any).geo_lat === 'number' ? ((data as any).geo_lat as number) : null;
    const clientLon = typeof (data as any).geo_lng === 'number' ? ((data as any).geo_lng as number) : null;

    // 2) Then try edge-network geo headers.
    const headerCountryCode = req.headers.get("cf-ipcountry") || req.headers.get("x-country") || null;
    const headerCity = req.headers.get("cf-ipcity") || req.headers.get("x-city") || null;
    const headerRegion = req.headers.get("cf-ipregion") || req.headers.get("x-region") || null;
    const headerLat = parseFloat(req.headers.get("cf-iplat") || req.headers.get("x-lat") || "");
    const headerLon = parseFloat(req.headers.get("cf-iplon") || req.headers.get("x-lon") || "");

    let country_code: string | null = headerCountryCode;
    let country: string | null = null;
    let city: string | null = headerCity;
    let region: string | null = headerRegion;
    let latitude: number | null = Number.isFinite(headerLat) ? headerLat : null;
    let longitude: number | null = Number.isFinite(headerLon) ? headerLon : null;

    // If browser geo is available, use it (and reverse geocode to improve city accuracy).
    if (clientLat !== null && clientLon !== null) {
      latitude = clientLat;
      longitude = clientLon;
      const rev = await reverseGeoFromCoords(clientLat, clientLon);
      if (rev) {
        country = rev.country ?? country;
        country_code = rev.country_code ?? country_code;
        city = rev.city ?? city;
        region = rev.region ?? region;
      }
    }

    // If we still don't have good geo, fallback to IP.
    const needsIpFallback = latitude === null || longitude === null || !city || !country_code;
    if (needsIpFallback) {
      const ip = getClientIp(req);
      if (ip) {
        const geo = await getGeoFromIp(ip);
        if (geo) {
          country = geo.country ?? country;
          country_code = geo.country_code ?? country_code;
          city = geo.city ?? city;
          region = geo.region ?? region;
          latitude = (geo.latitude ?? latitude) ?? null;
          longitude = (geo.longitude ?? longitude) ?? null;
        }
      }
    }

    switch (type) {
      case "session_start": {
        const { error } = await supabase.from("store_sessions").insert({
          tenant_id: tenantId,
          session_id,
          visitor_id,
          country,
          country_code,
          city,
          region,
          latitude,
          longitude,
          device_type: (data.device_type as string) || null,
          browser: (data.browser as string) || null,
          os: (data.os as string) || null,
          referrer: (data.referrer as string) || null,
          landing_page: (data.landing_page as string) || null,
        });
        if (error) throw error;
        break;
      }

      case "session_end": {
        const { error } = await supabase
          .from("store_sessions")
          .update({
            ended_at: new Date().toISOString(),
            duration_seconds: (data.duration_seconds as number) || 0,
            page_views: (data.page_views as number) || 1,
            exit_page: (data.exit_page as string) || null,
            is_bounce: (data.is_bounce as boolean) || false,
            is_converted: (data.is_converted as boolean) || false,
            order_id: (data.order_id as string) || null,
            cart_value: (data.cart_value as number) || null,
          })
          .eq("session_id", session_id)
          .eq("tenant_id", tenantId);
        if (error) throw error;
        break;
      }

      case "page_view": {
        const { error } = await supabase.from("store_page_views").insert({
          tenant_id: tenantId,
          session_id,
          page_url: data.page_url as string,
          page_title: (data.page_title as string) || null,
          load_time_ms: (data.load_time_ms as number) || null,
        });
        if (error) throw error;
        break;
      }

      case "event": {
        const { error } = await supabase.from("store_events").insert({
          tenant_id: tenantId,
          session_id,
          event_type: data.event_type as string,
          event_data: (data.event_data as Record<string, unknown>) || null,
          page_url: (data.page_url as string) || null,
        });
        if (error) throw error;
        break;
      }

      case "performance": {
        const { error } = await supabase.from("store_performance_metrics").insert({
          tenant_id: tenantId,
          page_url: data.page_url as string,
          ttfb_ms: (data.ttfb_ms as number) || null,
          fcp_ms: (data.fcp_ms as number) || null,
          lcp_ms: (data.lcp_ms as number) || null,
          fid_ms: (data.fid_ms as number) || null,
          cls: (data.cls as number) || null,
          dom_interactive_ms: (data.dom_interactive_ms as number) || null,
          dom_complete_ms: (data.dom_complete_ms as number) || null,
          device_type: (data.device_type as string) || null,
          connection_type: (data.connection_type as string) || null,
        });
        if (error) throw error;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unsupported event type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Tracking error:", error);

    const payload =
      error instanceof Error
        ? { error: error.message }
        : { error: typeof error === "string" ? error : "Request failed", details: error };

    return new Response(JSON.stringify(payload), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

