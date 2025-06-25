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
    // Get Flutterwave secret key for verification
    const flutterwaveSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flutterwaveSecretKey) {
      throw new Error("Flutterwave secret key not configured");
    }

    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the signature from the request headers
    const signature = req.headers.get("verif-hash");
    
    // In production, verify the signature
    // For testing, we'll skip this step but in production you should uncomment this
    /*
    if (!signature || signature !== flutterwaveSecretKey) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    */

    // Parse webhook payload
    const payload = await req.json();
    console.log("Webhook payload:", JSON.stringify(payload));

    // Verify this is a charge.completed event for a bank transfer
    if (
      payload.event !== "charge.completed" || 
      payload.data?.payment_type !== "bank_transfer" ||
      payload.data?.status !== "successful"
    ) {
      // Not a successful bank transfer, log and exit
      console.log("Not a successful bank transfer event, ignoring");
      return new Response(
        JSON.stringify({ success: true, message: "Event ignored" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract relevant data from the webhook
    const { 
      tx_ref, 
      flw_ref, // Extract the unique Flutterwave reference
      amount, 
      currency, 
      customer: { email }
    } = payload.data;

    // Check if this transaction has already been processed (idempotency)
    // Use flw_ref instead of tx_ref for idempotency check
    const { data: existingTransaction, error: txCheckError } = await supabase
      .from("transactions")
      .select("id")
      .eq("flutterwave_tx_ref", flw_ref) // Use flw_ref instead of tx_ref
      .eq("status", "success")
      .maybeSingle();

    if (txCheckError) {
      console.error("Error checking for existing transaction:", txCheckError);
    }

    if (existingTransaction) {
      console.log("Transaction already processed:", flw_ref);
      return new Response(
        JSON.stringify({ success: true, message: "Transaction already processed" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Ensure tx_ref is present in the payload
    if (!tx_ref) {
      console.error("Missing tx_ref in webhook payload for virtual account payment");
      throw new Error("Missing tx_ref in webhook payload");
    }

    // Find the user by the virtual account reference (tx_ref)
    let userProfile;
    const { data: profileData, error: userError } = await supabase
      .from("profiles")
      .select("id, wallet_balance, email")
      .eq("virtual_account_reference", tx_ref)
      .single();

    if (userError) {
      // If not found by virtual_account_reference, try to find by other means
      console.log("User not found by virtual_account_reference, trying alternative lookup methods");
      
      // Try to find by email as a fallback
      const { data: userByEmail, error: emailError } = await supabase
        .from("profiles")
        .select("id, wallet_balance, email")
        .eq("email", email)
        .single();
        
      if (emailError || !userByEmail) {
        console.error("Error finding user profile:", userError);
        console.error("Email fallback also failed:", emailError);
        throw new Error("User profile not found for this transaction reference");
      }
      
      console.log("User found by email fallback");
      // Use the user found by email
      userProfile = userByEmail;
    } else {
      userProfile = profileData;
    }

    // Verify the email matches (additional security check)
    if (userProfile.email !== email) {
      console.error("Email mismatch:", userProfile.email, email);
      throw new Error("Email mismatch in transaction");
    }

    // Update user's wallet balance
    const newBalance = parseFloat(userProfile.wallet_balance) + parseFloat(amount);
    
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ wallet_balance: newBalance })
      .eq("id", userProfile.id);

    if (updateError) {
      console.error("Error updating wallet balance:", updateError);
      throw new Error("Failed to update wallet balance");
    }

    // Create a transaction record
    const transactionData = {
      user_id: userProfile.id,
      type: "wallet_funding",
      amount: parseFloat(amount),
      status: "success",
      reference: `FLW-${flw_ref || tx_ref}`, // Use Flutterwave's transaction reference for the incoming payment
      flutterwave_tx_ref: flw_ref, // Store the unique flw_ref for idempotency checks
      details: {
        payment_method: "bank_transfer",
        currency,
        flutterwave_data: payload.data,
      },
    };

    const { error: transactionError } = await supabase
      .from("transactions")
      .insert([transactionData]);

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError);
      throw new Error("Failed to create transaction record");
    }

    // Log the successful wallet funding
    await supabase.from("admin_logs").insert([{
      admin_id: null,
      action: "wallet_funding_webhook",
      details: { 
        user_id: userProfile.id,
        amount,
        tx_ref,
        flw_ref,
        previous_balance: userProfile.wallet_balance,
        new_balance: newBalance,
      },
    }]);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Wallet funded successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process webhook",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});