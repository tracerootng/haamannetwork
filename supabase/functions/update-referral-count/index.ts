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
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { referrerId, referredUserId, referredUserName, referralCode } = await req.json();

    // Validate required fields
    if (!referrerId) {
      throw new Error("Missing required referrer ID");
    }

    // Get current referrer profile
    const { data: referrerProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("total_referrals")
      .eq("id", referrerId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch referrer profile: ${fetchError.message}`);
    }

    // Calculate new total referrals
    const currentTotal = referrerProfile.total_referrals || 0;
    const newTotal = currentTotal + 1;

    // Update referrer's total_referrals count
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ total_referrals: newTotal })
      .eq("id", referrerId);

    if (updateError) {
      throw new Error(`Failed to update referrer profile: ${updateError.message}`);
    }

    // Log the referral in admin_logs
    await supabase.from("admin_logs").insert([{
      admin_id: null,
      action: "update_referral_count",
      details: { 
        referrer_id: referrerId,
        referred_user_id: referredUserId,
        referred_user_name: referredUserName,
        referral_code: referralCode,
        previous_count: currentTotal,
        new_count: newTotal
      },
    }]);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Referral count updated successfully",
        data: { newTotalReferrals: newTotal }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating referral count:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to update referral count",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});