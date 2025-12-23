import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Expected IP for domain verification
const EXPECTED_IP = "185.158.133.1";

interface DnsResponse {
  Answer?: Array<{
    type: number;
    data: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    console.log(`Verifying DNS for domain: ${domain}`);

    // Extract the host part for DNS lookup
    // For subdomains like shop.example.com, we check the subdomain
    // For root domains like example.com, we check @
    const domainParts = domain.split('.');
    const isSubdomain = domainParts.length > 2;
    
    // Query DNS using Google's DNS-over-HTTPS API
    const dnsUrl = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`;
    
    console.log(`DNS lookup URL: ${dnsUrl}`);
    
    const dnsResponse = await fetch(dnsUrl, {
      headers: { 'Accept': 'application/dns-json' }
    });

    if (!dnsResponse.ok) {
      console.error('DNS lookup failed:', await dnsResponse.text());
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'DNS lookup failed',
          message: 'Unable to query DNS records. Please try again later.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dnsData: DnsResponse = await dnsResponse.json();
    console.log('DNS response:', JSON.stringify(dnsData));

    // Check if A records exist and point to expected IP
    const aRecords = dnsData.Answer?.filter(r => r.type === 1) || [];
    const hasCorrectARecord = aRecords.some(r => r.data === EXPECTED_IP);

    console.log(`A records found: ${aRecords.map(r => r.data).join(', ')}`);
    console.log(`Has correct A record: ${hasCorrectARecord}`);

    if (!hasCorrectARecord) {
      const currentIps = aRecords.map(r => r.data).join(', ') || 'none';
      return new Response(
        JSON.stringify({
          verified: false,
          current_records: currentIps,
          expected_ip: EXPECTED_IP,
          message: aRecords.length === 0 
            ? 'No A records found. Please add the required DNS records.'
            : `A records point to ${currentIps} instead of ${EXPECTED_IP}. Please update your DNS settings.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DNS verified - update the domain status to active
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from('custom_domains')
      .update({ status: 'active' })
      .eq('id', domain_id);

    if (updateError) {
      console.error('Failed to update domain status:', updateError);
      return new Response(
        JSON.stringify({
          verified: true,
          activated: false,
          error: 'DNS verified but failed to activate domain'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Domain ${domain} verified and activated successfully`);

    return new Response(
      JSON.stringify({
        verified: true,
        activated: true,
        message: 'Domain DNS verified and activated successfully!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying domain:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
