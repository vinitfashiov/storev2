
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const vercelTeamId = Deno.env.get('VERCEL_TEAM_ID');

    if (!vercelToken || !vercelProjectId) {
      console.error("Missing Vercel credentials");
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: Missing Vercel credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const teamQuery = vercelTeamId ? `?teamId=${vercelTeamId}` : '';

    // ── Step 1: Try to add the domain to Vercel ──
    console.log(`[verify-domain-dns] Checking/Adding domain: ${domain}`);

    const addUrl = `https://api.vercel.com/v10/projects/${vercelProjectId}/domains${teamQuery}`;
    const addResponse = await fetch(addUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    });

    let addData: any;
    try {
      addData = await addResponse.json();
    } catch {
      console.error("[verify-domain-dns] Failed to parse Vercel add-domain response");
      addData = null;
    }

    console.log(`[verify-domain-dns] Add response ${addResponse.status}:`, JSON.stringify(addData));

    // ── Step 2: If domain already exists, GET its real config status ──
    let isVerified = false;
    let instructions: any[] = [];
    let dbMessage = 'Pending DNS verification';

    // Build default DNS instructions based on domain type
    const parts = domain.split('.');
    const isSubdomain = parts.length > 2;
    const defaultInstruction = isSubdomain
      ? { type: 'CNAME', name: parts.slice(0, -2).join('.'), value: 'cname.vercel-dns.com' }
      : { type: 'A', name: '@', value: '76.76.21.21' };

    if (addResponse.ok) {
      // Domain was freshly added — check if already verified
      isVerified = addData?.verified === true;
      if (!isVerified) {
        instructions.push(defaultInstruction);
        // Check for verification challenges (TXT records)
        const challenges = addData?.verification || [];
        for (const c of challenges) {
          if (c.type === 'TXT') {
            instructions.push({
              type: 'TXT',
              name: c.domain?.replace(`.${domain}`, '') || '_vercel',
              value: c.value,
            });
          }
        }
        dbMessage = 'Domain added to Vercel. Please configure DNS records.';
      } else {
        dbMessage = 'Domain verified and active!';
      }
    } else if (addResponse.status === 409) {
      // Domain already exists — need to GET its current status
      console.log(`[verify-domain-dns] Domain already exists, checking config...`);

      // Check if it's on another account entirely
      if (addData?.error?.code === 'domain_owned_by_another_account') {
        dbMessage = 'Domain is registered on another Vercel account. Please remove it there first or verify ownership via TXT record.';
        instructions.push(defaultInstruction);
        // Include TXT verification challenges if provided
        const challenges = addData?.error?.verification || [];
        for (const c of (Array.isArray(challenges) ? challenges : [challenges])) {
          if (c?.type === 'TXT') {
            instructions.push({
              type: 'TXT',
              name: c.domain?.replace(`.${domain}`, '') || '_vercel',
              value: c.value,
            });
          }
        }
      } else {
        // Domain exists in our project — GET the actual domain config to see if DNS is working
        const getUrl = `https://api.vercel.com/v6/domains/${domain}/config${teamQuery}`;
        console.log(`[verify-domain-dns] GET domain config: ${getUrl}`);

        const configResponse = await fetch(getUrl, {
          headers: { "Authorization": `Bearer ${vercelToken}` },
        });

        let configData: any;
        try {
          configData = await configResponse.json();
        } catch {
          configData = null;
        }

        console.log(`[verify-domain-dns] Config response ${configResponse.status}:`, JSON.stringify(configData));

        // Also get the domain info from the project to check 'verified' flag
        const domainInfoUrl = `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}${teamQuery}`;
        const domainInfoResponse = await fetch(domainInfoUrl, {
          headers: { "Authorization": `Bearer ${vercelToken}` },
        });

        let domainInfo: any;
        try {
          domainInfo = await domainInfoResponse.json();
        } catch {
          domainInfo = null;
        }

        console.log(`[verify-domain-dns] Domain info:`, JSON.stringify(domainInfo));

        // Check multiple signals for verification:
        // 1. configData.misconfigured === false means DNS is properly configured
        // 2. domainInfo.verified === true means domain ownership is verified
        // 3. configData.cnames or configData.aValues being populated means DNS resolves

        const dnsConfigured = configData?.misconfigured === false;
        const ownershipVerified = domainInfo?.verified === true;

        if (dnsConfigured || ownershipVerified) {
          isVerified = true;
          dbMessage = 'Domain verified and active!';
          console.log(`[verify-domain-dns] Domain verified! dnsConfigured=${dnsConfigured}, ownershipVerified=${ownershipVerified}`);
        } else {
          // Not yet verified — provide instructions
          instructions.push(defaultInstruction);

          // Check for pending TXT verification challenges
          const challenges = domainInfo?.verification || [];
          if (Array.isArray(challenges)) {
            for (const c of challenges) {
              if (c?.type === 'TXT') {
                instructions.push({
                  type: 'TXT',
                  name: c.domain?.replace(`.${domain}`, '') || '_vercel',
                  value: c.value,
                });
              }
            }
          }

          if (configData?.misconfigured === true) {
            dbMessage = 'DNS is not yet configured correctly. Please check your DNS records.';
          } else if (!ownershipVerified) {
            dbMessage = 'Domain ownership verification pending. Add the TXT record shown below.';
          } else {
            dbMessage = 'DNS verification pending. Please check your configuration.';
          }
        }
      }
    } else {
      // Unexpected error from Vercel
      console.error("[verify-domain-dns] Vercel API Error:", JSON.stringify(addData));
      return new Response(
        JSON.stringify({
          verified: false,
          error: `Vercel API error: ${addData?.error?.message || addResponse.statusText}`,
          message: addData?.error?.message || 'Failed to verify domain with Vercel',
          instructions: [defaultInstruction],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Step 3: Update domain status in Supabase ──
    const dbStatus = isVerified ? 'active' : 'pending';
    const { error: updateError } = await supabase
      .from('custom_domains')
      .update({ status: dbStatus })
      .eq('id', domain_id);

    if (updateError) {
      console.error('[verify-domain-dns] Failed to update domain status:', updateError);
    }

    console.log(`[verify-domain-dns] Final status: verified=${isVerified}, dbStatus=${dbStatus}`);

    return new Response(
      JSON.stringify({
        verified: isVerified,
        activated: isVerified,
        message: dbMessage,
        instructions: isVerified ? [] : instructions,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[verify-domain-dns] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
