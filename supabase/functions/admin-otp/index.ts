import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// In-memory OTP storage (TTL: 5 minutes)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOTP(): string {
  return (100000 + Math.floor(Math.random() * 900000)).toString();
}

function cleanExpiredOTPs() {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}

interface SendOTPRequest {
  action: "send";
  phone: string;
  name?: string;
  isSignup?: boolean;
}

interface VerifyOTPRequest {
  action: "verify";
  phone: string;
  otp: string;
  name?: string;
  isSignup?: boolean;
}

type RequestBody = SendOTPRequest | VerifyOTPRequest;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    console.log("Admin OTP request:", { action: body.action, phone: body.phone });

    if (!FAST2SMS_API_KEY) {
      console.error("Fast2SMS API key not configured");
      return new Response(
        JSON.stringify({ error: "OTP service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone number (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = body.phone.replace(/\D/g, "").slice(-10);
    
    if (!phoneRegex.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid 10-digit Indian mobile number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client for user checks
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const email = `${cleanPhone}@phone.storekriti.com`;

    // Clean expired OTPs periodically
    cleanExpiredOTPs();

    if (body.action === "send") {
      const { isSignup } = body as SendOTPRequest;
      
      // Check if user exists BEFORE sending OTP
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);

      if (isSignup && existingUser) {
        return new Response(
          JSON.stringify({ error: "This phone number is already registered. Please log in instead." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!isSignup && !existingUser) {
        return new Response(
          JSON.stringify({ error: "No account found with this phone number. Please sign up first." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate OTP locally
      const otp = generateOTP();
      
      // Store OTP with 5 minute expiry
      otpStore.set(cleanPhone, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
      });

      // Send OTP via Fast2SMS
      console.log("Sending OTP to:", cleanPhone);
      
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": FAST2SMS_API_KEY,
          "accept": "*/*",
          "cache-control": "no-cache",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender_id: "BBTPLE",
          message: "180929",
          variables_values: otp,
          route: "dlt",
          numbers: cleanPhone
        })
      });

      const data = await response.json();
      console.log("Fast2SMS response:", data);

      if (data.return === true || data.status_code === 200) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "OTP sent successfully",
            sessionId: cleanPhone // Use phone as session ID for simplicity
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.error("Fast2SMS error:", data);
        // Clear stored OTP on failure
        otpStore.delete(cleanPhone);
        return new Response(
          JSON.stringify({ error: data.message || "Failed to send OTP" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (body.action === "verify") {
      const { otp, name, isSignup } = body as VerifyOTPRequest;
      
      if (!otp || otp.length !== 6) {
        return new Response(
          JSON.stringify({ error: "Please enter a valid 6-digit OTP" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify OTP from local store
      const storedOTP = otpStore.get(cleanPhone);
      console.log("Verifying OTP for:", cleanPhone, "Stored:", !!storedOTP);

      if (!storedOTP) {
        return new Response(
          JSON.stringify({ error: "OTP expired. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (storedOTP.expiresAt < Date.now()) {
        otpStore.delete(cleanPhone);
        return new Response(
          JSON.stringify({ error: "OTP expired. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (storedOTP.otp !== otp) {
        return new Response(
          JSON.stringify({ error: "Invalid OTP. Please try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // OTP verified - clear it
      otpStore.delete(cleanPhone);

      // Now handle Supabase auth
      const password = `phone_${cleanPhone}_${FAST2SMS_API_KEY?.slice(0, 8)}`;

      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);

      if (existingUser) {
        // User exists - sign them in
        if (isSignup) {
          return new Response(
            JSON.stringify({ error: "This phone number is already registered. Please log in instead." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate a magic link token for the user
        const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: email,
        });

        if (signInError) {
          console.error("Sign in error:", signInError);
          return new Response(
            JSON.stringify({ error: "Failed to sign in" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Login successful",
            action: "login",
            token: signInData.properties?.hashed_token,
            email: email,
            password: password
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // New user - create account
        if (!isSignup) {
          return new Response(
            JSON.stringify({ error: "No account found with this phone number. Please sign up first." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!name || name.trim().length < 2) {
          return new Response(
            JSON.stringify({ error: "Please provide your name" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: { name: name.trim(), phone: cleanPhone }
        });

        if (createError) {
          console.error("Create user error:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Account created successfully",
            action: "signup",
            email: email,
            password: password
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
    console.error("Admin OTP error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
