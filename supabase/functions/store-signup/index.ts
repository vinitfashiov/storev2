import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        const { email, password, name, phone, tenant_id } = await req.json();

        if (!email || !password || !tenant_id) {
            return new Response(
                JSON.stringify({ error: 'Email, password, and tenant_id are required' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                }
            );
        }

        // 1. Create the user using Admin API (Bypasses rate limits, Auto-confirms email)
        const { data: userData, error: userError } = await supabaseClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm the email
            user_metadata: {
                name,
                phone,
                tenant_id,
            },
        });

        if (userError) {
            console.error('Error creating user:', userError);
            return new Response(
                JSON.stringify({ error: userError.message }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                }
            );
        }

        const user = userData.user;

        // 2. The database trigger 'handle_new_user' will automatically create the profile & customer record
        //    because we passed the metadata (tenant_id, etc.) in admin.createUser.

        // 3. Sign in the user to get a session
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (sessionError) {
            console.error('Error signing in:', sessionError);
            return new Response(
                JSON.stringify({ error: 'Account created but failed to sign in automatically. Please log in.' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200, // Still return 200 because account creation succeeded
                }
            );
        }

        return new Response(
            JSON.stringify({
                user: user,
                session: sessionData.session,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
