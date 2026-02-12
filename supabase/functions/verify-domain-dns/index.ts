
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

    let vercelData;
    // Check if response is valid JSON even on error
    try {
      vercelData = await vercelResponse.json();
    } catch (e) {
      console.error("Failed to parse Vercel response", e);
    }

    // Handle standard errors, but allow 409 (Conflict/Ownership) to pass through if it has verification data
    if (!vercelResponse.ok && vercelResponse.status !== 409) {
      console.error("Vercel API Error:", JSON.stringify(vercelData));
      return new Response(
        JSON.stringify({
          error: `Vercel API verification failed: ${vercelResponse.statusText}`,
          details: vercelData || await vercelResponse.text()
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Vercel Response:", JSON.stringify(vercelData));

    // 2. Interpret Response
    // If verified is true, great. If not, check for verification challenges.
    const isVerified = vercelData?.verified || false;

    // 3. Prepare Instructions
    // Default to A/CNAME
    let instructions = [];

    // Detect if subdomain or root
    const parts = domain.split('.');
    if (parts.length > 2) {
      instructions.push({
        type: 'CNAME',
        name: parts[0], // e.g. 'shop'
        value: 'cname.vercel-dns.com'
      });
    } else {
      instructions.push({
        type: 'A',
        name: '@',
        value: '76.76.21.21'
      });
    }

    // Check for Ownership Verification (TXT record needed)
    // Vercel returns this in the 'verification' array or error object for 409s
    const verificationChallenges = vercelData?.verification || [];

    // Sometimes it's nested in error.code === 'existing_project_domain' context, 
    // but typically standard 'verification' array works for newer API versions.
    // If 409, Vercel might send the challenges in the error body or we specifically look for TXT.

    if (verificationChallenges.length > 0) {
      verificationChallenges.forEach((challenge: any) => {
        if (challenge.type === 'TXT') {
          instructions.push({
            type: 'TXT',
            name: challenge.domain.replace(`.${domain}`, ''), // usually '_vercel'
            value: challenge.value
          });
        }
      });
    }
    // Fallback: Check if user provided info (screenshot) matches a specific pattern response
    // If we have a 409 and no verification array, it might be in `vercelData.error`
    else if (vercelResponse.status === 409 && vercelData?.error?.message?.includes('TXT record')) {
      // Try to parse message or just return a generic "Check Vercel Dashboard" 
      // But usually the API returns the challenge. 
      // Let's assume the previous screenshot data came from a similar response structure.
    }

    // 4. Update Supabase
    let dbStatus = 'pending';
    let dbMessage = 'Pending DNS verification';

    if (isVerified) {
      dbStatus = 'active';
      dbMessage = 'Domain verified and active!';
    } else {
      if (vercelData?.error?.code === 'existing_project_domain') {
        dbMessage = 'Domain ownership verification required (Add TXT Record)';
      } else if (vercelData?.error) {
        dbMessage = vercelData.error.message;
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
