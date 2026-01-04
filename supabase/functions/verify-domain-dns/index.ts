import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXPECTED_IP = "185.158.133.1";

interface DnsResponse {
  Answer?: Array<{
    type: number;
    data: string;
  }>;
}

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get domain info
    const { data: domainInfo, error: domainError } = await supabase
      .from('custom_domains')
      .select('id, tenant_id, status')
      .eq('id', domain_id)
      .single();

    if (domainError || !domainInfo) {
      console.error('Domain lookup error:', domainError);
      return new Response(
        JSON.stringify({ error: 'Domain not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check DNS records using Google DNS API
    console.log(`Checking DNS for domain: ${domain}`);
    const dnsUrl = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`;
    
    const dnsResponse = await fetch(dnsUrl, {
      headers: { 'Accept': 'application/dns-json' }
    });

    if (!dnsResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'DNS lookup failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dnsData: DnsResponse = await dnsResponse.json();
    console.log('DNS response:', JSON.stringify(dnsData));

    const aRecords = dnsData.Answer?.filter(r => r.type === 1) || [];
    const hasCorrectARecord = aRecords.some(r => r.data === EXPECTED_IP);

    if (!hasCorrectARecord) {
      const currentIps = aRecords.map(r => r.data).join(', ') || 'none';
      console.log(`DNS verification failed. Current IPs: ${currentIps}, Expected: ${EXPECTED_IP}`);
      
      return new Response(
        JSON.stringify({
          verified: false,
          current_records: currentIps,
          expected_ip: EXPECTED_IP,
          message: aRecords.length === 0 
            ? 'No A records found. Please add the required DNS records.'
            : `A records point to ${currentIps} instead of ${EXPECTED_IP}. Please update your DNS settings.`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DNS verified - update the domain status to active
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
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Domain ${domain} verified and activated successfully`);

    return new Response(
      JSON.stringify({
        verified: true,
        activated: true,
        message: 'Domain DNS verified and activated successfully!'
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
