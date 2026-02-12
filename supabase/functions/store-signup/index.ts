import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient, successResponse, errorResponse } from "../_shared/utils.ts";
import { monitor, createContext } from "../_shared/monitoring.ts";
import { RateLimiter } from "../_shared/rate-limiter.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    const context = createContext('store-signup', req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // 1. Rate Limiting Check
    try {
        const supabase = getSupabaseClient();
        const rateLimiter = new RateLimiter(supabase);
        // Use IP as key. In Edge Functions, x-forwarded-for is standard.
        // If behind a proxy like Cloudflare, might need cf-connecting-ip
        const clientIp = req.headers.get("x-forwarded-for")?.split(',')[0] || "unknown";

        // Limit: 5 signups per minute per IP
        const allowed = await rateLimiter.check(`signup:${clientIp}`, 5, 60);

        if (!allowed) {
            await monitor.logError(new Error(`Rate limit exceeded for ${clientIp}`), context);
            return errorResponse("Too many signup attempts. Please try again later.", 429);
        }

        const { email, password, name, phone, tenant_id } = await req.json();

        if (!email || !password || !tenant_id) {
            return errorResponse('Email, password, and tenant_id are required', 400);
        }

        // 2. Process Signup
        const result = await monitor.trackPerformance('store_signup_process', async () => {
            // Create user (Admin API)
            const { data: userData, error: userError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name, phone, tenant_id },
            });

            if (userError) throw userError;

            // Auto Sign-in
            const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (sessionError) {
                // Not fatal, account is created
                await monitor.logError(new Error(`Auto-login failed: ${sessionError.message}`), context);
                return {
                    user: userData.user,
                    session: null,
                    message: 'Account created but failed to sign in automatically. Please log in.'
                };
            }

            return {
                user: userData.user,
                session: sessionData.session
            };
        }, { ...context, email, tenant_id });

        return successResponse(result);

    } catch (error) {
        await monitor.logError(error, context);
        return errorResponse(error.message || 'Internal Server Error', 500, error);
    }
});
