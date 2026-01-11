import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TWOFACTOR_API_KEY = Deno.env.get("TWOFACTOR_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    if (!TWOFACTOR_API_KEY) {
      console.error("2Factor API key not configured");
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

      // Send OTP via 2Factor
      const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${cleanPhone}/AUTOGEN/OTP1`;
      console.log("Sending OTP to:", cleanPhone);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log("2Factor response:", data);

      if (data.Status === "Success") {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "OTP sent successfully",
            sessionId: data.Details 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.error("2Factor error:", data);
        return new Response(
          JSON.stringify({ error: data.Details || "Failed to send OTP" }),
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

      // Verify OTP via 2Factor
      const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/VERIFY3/${cleanPhone}/${otp}`;
      console.log("Verifying OTP for:", cleanPhone);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log("2Factor verify response:", data);

      if (data.Status === "Success" && data.Details === "OTP Matched") {
        // OTP verified - now handle Supabase auth
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const email = `${cleanPhone}@phone.storekriti.com`;
        const password = `phone_${cleanPhone}_${TWOFACTOR_API_KEY?.slice(0, 8)}`;

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
      } else {
        return new Response(
          JSON.stringify({ error: "Invalid OTP. Please try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
