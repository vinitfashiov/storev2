import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function generateOTP(): string {
  return (100000 + Math.floor(Math.random() * 900000)).toString();
}

// Generate a cryptographically secure random password
function generatePassword(): string {
  // Use crypto.randomUUID for strong random password
  return crypto.randomUUID() + crypto.randomUUID().slice(0, 8);
}

function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, phone, otp, tenantId, name } = await req.json();
    const cleanPhone = cleanPhoneNumber(phone);
    
    console.log(`Store Customer OTP - Action: ${action}, Phone: ${cleanPhone}, Tenant: ${tenantId}, Name: ${name || 'not provided'}`);

    if (!cleanPhone || cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number. Please enter a 10-digit number." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: "Store ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Clean expired OTPs
    await supabase
      .from("otp_verifications")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (action === "check") {
      // Check if customer exists for this tenant
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id, name, email")
        .eq("tenant_id", tenantId)
        .eq("phone", cleanPhone)
        .maybeSingle();

      return new Response(
        JSON.stringify({ 
          exists: !!existingCustomer,
          customerName: existingCustomer?.name || null
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "send") {
      // Generate OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Store OTP with tenant context
      const otpKey = `${cleanPhone}_${tenantId}`;
      
      // Check if user exists (do this in parallel with OTP storage for speed)
      const [existingCustomerResult, _] = await Promise.all([
        supabase
          .from("customers")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("phone", cleanPhone)
          .maybeSingle(),
        // Delete existing OTP for this phone+tenant
        supabase
          .from("otp_verifications")
          .delete()
          .eq("phone", otpKey)
      ]);

      const userExists = !!existingCustomerResult.data;

      // Insert new OTP
      const { error: insertError } = await supabase
        .from("otp_verifications")
        .insert({
          phone: otpKey,
          otp: otpCode,
          expires_at: expiresAt,
          verified: false
        });

      if (insertError) {
        console.error("Failed to store OTP:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to generate OTP" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send OTP via Fast2SMS
      if (!FAST2SMS_API_KEY) {
        console.error("FAST2SMS_API_KEY not configured");
        return new Response(
          JSON.stringify({ error: "SMS service not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=otp&variables_values=${otpCode}&flash=0&numbers=${cleanPhone}`;
        
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const smsResponse = await fetch(smsUrl, {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
          signal: controller.signal
        });
        
        clearTimeout(timeout);

        const smsResult = await smsResponse.json();
        console.log("Fast2SMS response:", smsResult);

        if (!smsResult.return) {
          throw new Error(smsResult.message || "SMS sending failed");
        }
      } catch (smsError: any) {
        console.error("SMS sending error:", smsError);
        // Clean up stored OTP
        await supabase.from("otp_verifications").delete().eq("phone", otpKey);
        
        const errorMessage = smsError.name === 'AbortError' 
          ? "SMS service timeout. Please try again."
          : "Failed to send OTP. Please try again.";
        
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "OTP sent successfully", userExists }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      const otpKey = `${cleanPhone}_${tenantId}`;
      const email = `customer_${cleanPhone}@store.storekriti.com`;
      const password = generatePassword();

      // Get stored OTP - check for both verified and unverified (for name submission flow)
      const { data: otpRecord, error: otpError } = await supabase
        .from("otp_verifications")
        .select("*")
        .eq("phone", otpKey)
        .maybeSingle();

      if (otpError || !otpRecord) {
        console.error("OTP not found:", otpError);
        return new Response(
          JSON.stringify({ error: "OTP not found. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiry
      if (new Date(otpRecord.expires_at) < new Date()) {
        await supabase.from("otp_verifications").delete().eq("id", otpRecord.id);
        return new Response(
          JSON.stringify({ error: "OTP expired. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If OTP is not yet verified, check the OTP code
      if (!otpRecord.verified) {
        if (otpRecord.otp !== otp) {
          return new Response(
            JSON.stringify({ error: "Invalid OTP. Please try again." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      // If OTP is already verified (name submission flow), we skip OTP check

      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id, user_id, name, email")
        .eq("tenant_id", tenantId)
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (existingCustomer) {
        // LOGIN FLOW - User exists
        // Mark OTP as verified and delete
        await supabase.from("otp_verifications").delete().eq("id", otpRecord.id);

        // Update password for consistency
        if (existingCustomer.user_id) {
          await supabase.auth.admin.updateUserById(
            existingCustomer.user_id,
            { password }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: "login",
            email: existingCustomer.email || email,
            password,
            customerName: existingCustomer.name
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // SIGNUP FLOW - New user, need name
        if (!name) {
          // Mark OTP as verified but don't delete - we need it for name submission
          await supabase
            .from("otp_verifications")
            .update({ verified: true })
            .eq("id", otpRecord.id);

          return new Response(
            JSON.stringify({
              success: true,
              action: "need_name",
              message: "Please enter your name to complete signup"
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Name provided - complete signup
        console.log(`Creating account for ${cleanPhone} with name: ${name}`);

        // Create auth user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingAuthUser = existingUsers?.users?.find(u => u.email === email);

        let userId: string;

        if (existingAuthUser) {
          // Update password
          await supabase.auth.admin.updateUserById(existingAuthUser.id, { password });
          userId = existingAuthUser.id;
          console.log(`Updated existing auth user: ${userId}`);
        } else {
          // Create new user
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, phone: cleanPhone }
          });

          if (createError || !newUser.user) {
            console.error("Failed to create user:", createError);
            return new Response(
              JSON.stringify({ error: "Failed to create account" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          userId = newUser.user.id;
          console.log(`Created new auth user: ${userId}`);
        }

        // Create customer record
        const { error: customerError } = await supabase
          .from("customers")
          .insert({
            tenant_id: tenantId,
            user_id: userId,
            name,
            phone: cleanPhone,
            email
          });

        if (customerError) {
          console.error("Failed to create customer:", customerError);
          return new Response(
            JSON.stringify({ error: "Failed to create account. Please try again." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete OTP record
        await supabase.from("otp_verifications").delete().eq("id", otpRecord.id);

        console.log(`Customer created successfully for ${cleanPhone}`);

        return new Response(
          JSON.stringify({
            success: true,
            action: "signup",
            email,
            password,
            customerName: name
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Store Customer OTP error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
