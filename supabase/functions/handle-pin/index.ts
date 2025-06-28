import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as bcrypt from "npm:bcryptjs@2.4.3";

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
    const { action, userId, pin, currentPin } = await req.json();

    // Validate required fields
    if (!action || !userId) {
      throw new Error("Missing required parameters");
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("transaction_pin, pin_attempts, pin_locked_until")
      .eq("id", userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    // Check if PIN is locked
    if (profile.pin_locked_until && new Date(profile.pin_locked_until) > new Date()) {
      const timeLeft = Math.ceil((new Date(profile.pin_locked_until).getTime() - new Date().getTime()) / 60000);
      throw new Error(`PIN is locked due to too many failed attempts. Try again in ${timeLeft} minutes.`);
    }

    // Handle different actions
    switch (action) {
      case "set_pin": {
        if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          throw new Error("PIN must be exactly 4 digits");
        }

        // If user already has a PIN, verify the current PIN
        if (profile.transaction_pin) {
          if (!currentPin) {
            throw new Error("Current PIN is required to set a new PIN");
          }

          const isPinValid = await bcrypt.compare(currentPin, profile.transaction_pin);
          if (!isPinValid) {
            // Increment failed attempts
            const newAttempts = (profile.pin_attempts || 0) + 1;
            
            // If too many failed attempts, lock the PIN
            let lockedUntil = null;
            if (newAttempts >= 5) {
              // Lock for 30 minutes
              lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
            }
            
            // Update attempts counter
            await supabase
              .from("profiles")
              .update({ 
                pin_attempts: newAttempts,
                pin_locked_until: lockedUntil
              })
              .eq("id", userId);
              
            throw new Error("Current PIN is incorrect");
          }
        }

        // Hash the new PIN
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        // Update the user's profile with the hashed PIN
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            transaction_pin: hashedPin,
            pin_attempts: 0,
            pin_locked_until: null
          })
          .eq("id", userId);

        if (updateError) {
          throw new Error(`Failed to update PIN: ${updateError.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "PIN set successfully",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "verify_pin": {
        if (!pin) {
          throw new Error("PIN is required");
        }

        // Check if user has a PIN set
        if (!profile.transaction_pin) {
          throw new Error("No PIN set. Please set a PIN first.");
        }

        // Verify the PIN
        const isPinValid = await bcrypt.compare(pin, profile.transaction_pin);
        
        if (!isPinValid) {
          // Increment failed attempts
          const newAttempts = (profile.pin_attempts || 0) + 1;
          
          // If too many failed attempts, lock the PIN
          let lockedUntil = null;
          if (newAttempts >= 5) {
            // Lock for 30 minutes
            lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          }
          
          // Update attempts counter
          await supabase
            .from("profiles")
            .update({ 
              pin_attempts: newAttempts,
              pin_locked_until: lockedUntil
            })
            .eq("id", userId);
            
          throw new Error("Incorrect PIN");
        }

        // Reset attempts on successful verification
        await supabase
          .from("profiles")
          .update({ 
            pin_attempts: 0,
            pin_locked_until: null
          })
          .eq("id", userId);

        return new Response(
          JSON.stringify({
            success: true,
            message: "PIN verified successfully",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "check_pin_status": {
        return new Response(
          JSON.stringify({
            success: true,
            hasPin: !!profile.transaction_pin,
            isLocked: profile.pin_locked_until && new Date(profile.pin_locked_until) > new Date(),
            lockedUntil: profile.pin_locked_until,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "reset_pin": {
        // This would typically involve some form of verification like email or phone
        // For now, we'll just clear the PIN (in a real app, you'd want additional security)
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            transaction_pin: null,
            pin_attempts: 0,
            pin_locked_until: null
          })
          .eq("id", userId);

        if (updateError) {
          throw new Error(`Failed to reset PIN: ${updateError.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "PIN reset successfully",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Error handling PIN operation:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process PIN operation",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});