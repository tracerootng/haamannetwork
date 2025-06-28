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
      .select("total_referrals, referral_earnings")
      .eq("id", referrerId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch referrer profile: ${fetchError.message}`);
    }

    // Get referral settings
    const { data: settings, error: settingsError } = await supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["referral_invite_limit", "referral_reward_count", "referral_bonus_percentage"]);

    if (settingsError) {
      console.error("Error fetching referral settings:", settingsError);
    }

    // Parse settings
    const settingsMap: Record<string, string> = {};
    settings?.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    const inviteLimit = parseInt(settingsMap.referral_invite_limit || "5");
    const requiredReferrals = parseInt(settingsMap.referral_reward_count || "5");
    const bonusPercentage = parseFloat(settingsMap.referral_bonus_percentage || "6");

    // Check if user has already claimed a reward
    const { data: rewardData, error: rewardError } = await supabase
      .from("referral_rewards")
      .select("id")
      .eq("user_id", referrerId)
      .eq("status", "claimed")
      .maybeSingle();

    if (rewardError) {
      console.error("Error checking reward status:", rewardError);
    }

    const hasClaimed = !!rewardData;
    const currentTotal = referrerProfile.total_referrals || 0;
    
    // Check if user has reached their limit
    let canIncrease = true;
    if (hasClaimed) {
      // If they've claimed a reward, check against invite_limit
      canIncrease = currentTotal < inviteLimit;
    } else {
      // If they haven't claimed, check against required_referrals
      canIncrease = currentTotal < requiredReferrals;
    }

    // Only update if they haven't reached their limit
    if (canIncrease) {
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
          data: { 
            newTotalReferrals: newTotal,
            limitReached: newTotal >= (hasClaimed ? inviteLimit : requiredReferrals)
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // Return response indicating limit reached
      return new Response(
        JSON.stringify({
          success: false,
          message: "Referral limit reached",
          data: { 
            currentTotal: currentTotal,
            limitReached: true,
            hasClaimed: hasClaimed,
            limit: hasClaimed ? inviteLimit : requiredReferrals
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
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