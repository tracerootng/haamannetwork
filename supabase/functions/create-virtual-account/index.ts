import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get Flutterwave secret key from environment variables
    const flutterwaveSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flutterwaveSecretKey) {
      throw new Error("Flutterwave secret key not configured");
    }

    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { userId, email, firstName, lastName, phoneNumber, bvn } = await req.json();

    // Validate required fields
    if (!userId || !email || !firstName || !lastName) {
      throw new Error("Missing required user information");
    }

    // Generate a unique transaction reference
    const txRef = `haaman-va-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Determine if we're creating a permanent account (requires BVN)
    const isPermanent = !!bvn;

    // Prepare request to Flutterwave API
    const requestBody = {
      email,
      tx_ref: txRef,
      phonenumber: phoneNumber || "",
      firstname: firstName,
      lastname: lastName,
      narration: `Haaman Network - ${firstName} ${lastName}`,
      is_permanent: isPermanent,
    };

    // Add BVN if provided (required for permanent accounts)
    if (isPermanent) {
      // @ts-ignore: Adding BVN to request body
      requestBody.bvn = bvn;
    }

    console.log("Making request to Flutterwave API:", JSON.stringify(requestBody, null, 2));

    // Make request to Flutterwave API
    const response = await fetch("https://api.flutterwave.com/v3/virtual-account-numbers", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${flutterwaveSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Parse response
    const responseData = await response.json();
    console.log("Flutterwave API response:", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error("Flutterwave API error:", responseData);
      throw new Error(`Failed to create virtual account: ${responseData.message || "Unknown error"}`);
    }

    if (responseData.status !== "success") {
      throw new Error(`Failed to create virtual account: ${responseData.message}`);
    }

    // Extract virtual account details
    const { bank_name, account_number } = responseData.data;

    // Update user profile with virtual account details
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        virtual_account_bank_name: bank_name,
        virtual_account_number: account_number,
        virtual_account_reference: txRef,
        bvn: bvn || null, // Store BVN if provided
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      throw new Error("Failed to update user profile with virtual account details");
    }

    // Log the virtual account creation
    await supabase.from("admin_logs").insert([{
      admin_id: null,
      action: "create_virtual_account",
      details: { 
        user_id: userId,
        email,
        tx_ref: txRef,
        is_permanent: isPermanent,
        bank_name,
        account_number: account_number.slice(-4), // Only log last 4 digits for security
      },
    }]);

    // Return success response with virtual account details
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          bank_name,
          account_number,
          reference: txRef,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating virtual account:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create virtual account",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});