import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Types & Interfaces ---

interface ShiprocketTokenResponse {
    token?: string;
    message?: string;
    error?: string;
}

// Validation Schema
const RequestSchema = z.object({
    delivery_postcode: z.string().min(6).max(6),
    weight: z.number().optional().default(0.5),
    cod: z.boolean().optional().default(false),
});

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

        // --- Validation Start ---
        const body = await req.json().catch(() => ({}));
        const validationResult = RequestSchema.safeParse(body);

        if (!validationResult.success) {
            const errorMsg = validationResult.error.errors[0].message;
            return new Response(JSON.stringify({ error: errorMsg }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { delivery_postcode, weight, cod } = validationResult.data;
        // --- Validation End ---

        // Get Shiprocket credentials
        const { data: integration, error: integrationError } = await supabaseClient
            .from('tenant_integrations_safe')
            .select('has_shiprocket_password')
            .eq('tenant_id', profile.tenant_id)
            .single();

        if (integrationError) {
            console.error('Integration fetch safe error:', integrationError);
        }

        if (!integration?.has_shiprocket_password) {
            return new Response(JSON.stringify({ error: 'Shiprocket not configured for this store.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // We need the actual password and email to auth
        const { data: fullIntegration, error: fullIntegrationError } = await supabaseClient
            .from('tenant_integrations')
            .select('shiprocket_email, shiprocket_password')
            .eq('tenant_id', profile.tenant_id)
            .single();

        if (fullIntegrationError || !fullIntegration?.shiprocket_email || !fullIntegration?.shiprocket_password) {
            return new Response(JSON.stringify({ error: 'Failed to access Shiprocket credentials.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Get store address to extract origin pincode
        const { data: tenantData } = await supabaseClient
            .from('tenants')
            .select('address')
            .eq('id', profile.tenant_id)
            .single();

        let pickup_postcode = '110001'; // default fallback
        if (tenantData?.address) {
            // try to find a 6 digit number in address string
            const matchedPincodes = tenantData.address.match(/\b\d{6}\b/);
            if (matchedPincodes && matchedPincodes.length > 0) {
                pickup_postcode = matchedPincodes[0];
            }
        }

        // Authenticate with Shiprocket
        const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: fullIntegration.shiprocket_email,
                password: fullIntegration.shiprocket_password,
            }),
        });

        const authRaw = await authRes.text();
        let authData: ShiprocketTokenResponse = {};
        try {
            authData = authRaw ? JSON.parse(authRaw) : {};
        } catch {
            // Keep empty if parsing fails
        }

        if (!authRes.ok || !authData?.token) {
            return new Response(
                JSON.stringify({
                    error: authData?.message || authData?.error || 'Shiprocket authentication failed.',
                }),
                {
                    status: authRes.status >= 400 ? authRes.status : 502,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Check Serviceability
        // API requires weight in KG, order amount etc.
        // cod parameter is 1 for Cash on Delivery, 0 for Prepaid
        const serviceabilityRes = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickup_postcode}&delivery_postcode=${delivery_postcode}&cod=${cod ? 1 : 0}&weight=${weight}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.token}`
            }
        });

        const serviceData = await serviceabilityRes.json();

        if (!serviceabilityRes.ok) {
            return new Response(
                JSON.stringify({
                    error: serviceData?.message || 'Failed to check serviceability.',
                    details: serviceData
                }),
                {
                    status: serviceabilityRes.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        return new Response(JSON.stringify({
            success: true,
            pickup_postcode,
            delivery_postcode,
            data: serviceData?.data || null
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Internal server error'
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
