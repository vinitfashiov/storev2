
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Vercel Constants
const VERCEL_API_URL = "https://api.vercel.com/v9/projects";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, domain_id } = await req.json();

    if (!domain || !domain_id) {
      return new Response(
        JSON.stringify({ error: 'Domain and domain_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vercelToken = Deno.env.get('VERCEL_API_TOKEN');
    const vercelProjectId = Deno.env.get('VERCEL_PROJECT_ID');
    const vercelTeamId = Deno.env.get('VERCEL_TEAM_ID'); // Optional

    if (!vercelToken || !vercelProjectId) {
      console.error("Missing Vercel credentials");
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: Missing Vercel credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Add/Get Domain Status from Vercel
    console.log(`Checking/Adding domain on Vercel: ${domain}`);

    // Construct Vercel API URL
    let url = `${VERCEL_API_URL}/${vercelProjectId}/domains?teamId=${vercelTeamId || ''}`;
    if (!vercelTeamId) {
      url = `${VERCEL_API_URL}/${vercelProjectId}/domains`;
    }

    const vercelResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    });

    if (!vercelResponse.ok) {
      const errorText = await vercelResponse.text();
      console.error("Vercel API Error:", errorText);
      return new Response(
        JSON.stringify({
          error: `Vercel API verification failed: ${vercelResponse.statusText}`,
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vercelData = await vercelResponse.json();
    console.log("Vercel Response:", JSON.stringify(vercelData));

    // 2. Interpret Response
    // Vercel returns details about the domain status, including verification errors if any.
    const isVerified = !vercelData.verified ? false : true;

    // 3. Prepare Instructions for User (if not verified)
    // Vercel provides 'verification' array in response if issues exist, but simpler to just standardise instructions.
    // However, the response object usually contains specific 'verification' challenges.

    const verificationData = vercelData.verification || [];
    let instructions = {
      type: 'A',
      name: '@',
      value: '76.76.21.21'
    };

    // Detect if subdomain or root
    const parts = domain.split('.');
    if (parts.length > 2) {
      instructions = {
        type: 'CNAME',
        name: parts[0], // e.g. 'shop'
        value: 'cname.vercel-dns.com'
      };
    }

    // 4. Update Supabase
    // If Vercel says it's verified, we mark it active.
    let dbStatus = 'pending';
    let dbMessage = 'Pending DNS verification';

    if (isVerified) {
      dbStatus = 'active';
      dbMessage = 'Domain verified and active!';
    } else {
      // Retrieve specific verification error message from Vercel if available
      if (vercelData.error) {
        dbMessage = vercelData.error.message;
      } else if (vercelData.verification && vercelData.verification.length > 0) {
        // Often Vercel sends reasons like "domain not found" or "conflicting records"
        // For now, we stick to the generic "please configure DNS".
      }
    }

    const { error: updateError } = await supabase
      .from('custom_domains')
      .update({ status: dbStatus })
      .eq('id', domain_id);

    if (updateError) {
      console.error('Failed to update domain status:', updateError);
    }

    return new Response(
      JSON.stringify({
        verified: isVerified,
        activated: isVerified,
        vercelStatus: vercelData,
        instructions: instructions, // Send back instructions so frontend can display them dynamicallly
        message: dbMessage
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-domain-dns:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
