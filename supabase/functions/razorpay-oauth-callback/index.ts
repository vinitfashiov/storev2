import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Parse state: tenant_id:state_token:redirect_url
    const stateParts = state?.split(':') || [];
    const tenantId = stateParts[0];
    const stateToken = stateParts[1];
    const redirectUrl = stateParts.length > 2 ? decodeURIComponent(stateParts.slice(2).join(':')) : null;

    // Build error redirect helper
    const redirectWithError = (msg: string) => {
      const errorUrl = redirectUrl 
        ? `${redirectUrl}?razorpay_error=${encodeURIComponent(msg)}`
        : `/?razorpay_error=${encodeURIComponent(msg)}`;
      return Response.redirect(errorUrl, 302);
    };

    // Build success redirect helper
    const redirectWithSuccess = () => {
      const successUrl = redirectUrl 
        ? `${redirectUrl}?razorpay_connected=true`
        : `/?razorpay_connected=true`;
      return Response.redirect(successUrl, 302);
    };

    if (error) {
      console.error('Razorpay OAuth error:', error, errorDescription);
      return redirectWithError(errorDescription || error);
    }

    if (!code || !tenantId || !stateToken) {
      console.error('Missing required parameters');
      return redirectWithError('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify state token to prevent CSRF
    const { data: integration } = await supabase
      .from('tenant_integrations')
      .select('razorpay_oauth_state')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!integration || integration.razorpay_oauth_state !== stateToken) {
      console.error('Invalid state token');
      return redirectWithError('Invalid state token - possible CSRF attack');
    }

    // Exchange authorization code for access token
    const clientId = Deno.env.get('RAZORPAY_OAUTH_CLIENT_ID')!;
    const clientSecret = Deno.env.get('RAZORPAY_OAUTH_CLIENT_SECRET')!;
    const callbackUrl = `${supabaseUrl}/functions/v1/razorpay-oauth-callback`;

    const tokenResponse = await fetch('https://auth.razorpay.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return redirectWithError('Failed to connect Razorpay account');
    }

    const tokenData = await tokenResponse.json();
    console.log('Razorpay OAuth token received for tenant:', tenantId);

    // Store tokens in database
    const { error: updateError } = await supabase
      .from('tenant_integrations')
      .update({
        razorpay_oauth_access_token: tokenData.access_token,
        razorpay_oauth_refresh_token: tokenData.refresh_token,
        razorpay_oauth_token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        razorpay_oauth_merchant_id: tokenData.razorpay_account_id,
        razorpay_oauth_public_token: tokenData.public_token,
        razorpay_oauth_connected: true,
        razorpay_oauth_state: null // Clear state after use
      })
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('Failed to store tokens:', updateError);
      return redirectWithError('Failed to save connection');
    }

    console.log('Razorpay OAuth connected successfully for tenant:', tenantId);
    return redirectWithSuccess();

  } catch (error) {
    console.error('Error in razorpay-oauth-callback:', error);
    return Response.redirect('/?razorpay_error=Connection failed', 302);
  }
});
