import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a cryptographically secure random password
function generatePassword(): string {
  return crypto.randomUUID() + crypto.randomUUID().slice(0, 8);
}

function generateOTP(): string {
  return (100000 + Math.floor(Math.random() * 900000)).toString();
}

function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

console.log("Store Customer OTP: Script loaded, starting server...");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      throw new Error(`Invalid JSON body: ${e.message}`);
    }

    const { action, phone, otp, tenantId, name, customerEmail } = body;
    const cleanPhone = cleanPhoneNumber(phone || "");

    console.log(`Store Customer OTP - Action: ${action}, Phone: ${cleanPhone}, Tenant: ${tenantId}`);

    if (!cleanPhone || cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid 10-digit mobile number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: "Store ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read env vars inside handler
    const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Clean expired OTPs
    await supabase.from("otp_verifications").delete().lt("expires_at", new Date().toISOString());

    // CHECK action
    if (action === "check") {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id, name")
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

    // SEND action
    if (action === "send") {
      if (!FAST2SMS_API_KEY) {
        return new Response(
          JSON.stringify({ error: "OTP service not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const otpKey = `${cleanPhone}_${tenantId}`;

      // Delete existing OTPs for this key
      await supabase.from("otp_verifications").delete().eq("phone", otpKey);

      // Store OTP
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
          JSON.stringify({ error: "Failed to process OTP request" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send via Fast2SMS (POST method like admin-otp)
      console.log("Sending OTP via Fast2SMS POST to:", cleanPhone);
      const smsResponse = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": FAST2SMS_API_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otpCode,
          numbers: cleanPhone,
        })
      });

      const smsData = await smsResponse.json();
      console.log("Fast2SMS response:", smsData);

      if (smsData.return === true || smsData.status_code === 200) {
        return new Response(
          JSON.stringify({ success: true, message: "OTP sent successfully" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.error("Fast2SMS error:", smsData);
        // Clear stored OTP
        await supabase.from("otp_verifications").delete().eq("phone", otpKey);
        return new Response(
          JSON.stringify({ error: smsData.message || "Failed to send OTP" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // VERIFY action
    if (action === "verify") {
      const otpKey = `${cleanPhone}_${tenantId}`;

      // Get OTP
      const { data: otpRecord, error: otpError } = await supabase
        .from("otp_verifications")
        .select("*")
        .eq("phone", otpKey)
        .maybeSingle();

      if (otpError || !otpRecord) {
        return new Response(
          JSON.stringify({ error: "OTP expired or invalid. Please request a new one." }),
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

      // Verify OTP code (if not already verified)
      if (!otpRecord.verified && otpRecord.otp !== otp) {
        return new Response(
          JSON.stringify({ error: "Invalid OTP. Please try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check Customer
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (existingCustomer) {
        // LOGIN
        await supabase.from("otp_verifications").delete().eq("id", otpRecord.id);

        // Update password if user_id exists
        const password = generatePassword();
        if (existingCustomer.user_id) {
          await supabase.auth.admin.updateUserById(existingCustomer.user_id, { password });
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: "login",
            email: existingCustomer.email,
            password,
            customerName: existingCustomer.name
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // SIGNUP
        if (!name) {
          // Mark verified, ask for name
          await supabase.from("otp_verifications").update({ verified: true }).eq("id", otpRecord.id);
          return new Response(
            JSON.stringify({ success: true, action: "need_name" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Complete Signup
        const password = generatePassword();
        // Use provided email or fallback
        const finalEmail = customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
          ? customerEmail.toLowerCase().trim()
          : `customer_${cleanPhone}@store.storekriti.com`; // Fallback unique email

        // Create Auth User
        // Check if exists in Auth first (global check)
        const { data: listUsers } = await supabase.auth.admin.listUsers();
        const existingAuth = listUsers?.users?.find(u => u.email === finalEmail);

        let userId;
        if (existingAuth) {
          await supabase.auth.admin.updateUserById(existingAuth.id, { password });
          userId = existingAuth.id;
        } else {
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: finalEmail,
            password,
            email_confirm: true,
            user_metadata: { name, phone: cleanPhone, role: 'customer' }
          });
          if (createError) throw createError;
          userId = newUser.user.id;
        }

        // Create Customer Record
        const { error: custError } = await supabase.from("customers").insert({
          tenant_id: tenantId,
          user_id: userId,
          name,
          phone: cleanPhone,
          email: finalEmail
        });

        if (custError) {
          console.error("Customer creation failed:", custError);
          return new Response(
            JSON.stringify({ error: "Failed to create account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase.from("otp_verifications").delete().eq("id", otpRecord.id);

        return new Response(
          JSON.stringify({
            success: true,
            action: "signup",
            email: finalEmail,
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
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
