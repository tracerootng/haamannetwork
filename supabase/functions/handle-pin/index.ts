import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHash } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  action: 'set_pin' | 'verify_pin' | 'check_pin_status' | 'reset_pin';
  userId: string;
  pin?: string;
  currentPin?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse request body
    const body: RequestBody = await req.json();
    const { action, userId, pin, currentPin } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Hash PIN function
    const hashPin = (pinValue: string): string => {
      return createHash('sha256').update(pinValue).digest('hex');
    };

    switch (action) {
      case 'set_pin': {
        if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          return new Response(
            JSON.stringify({ success: false, error: 'PIN must be exactly 4 digits' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Check if user already has a PIN and currentPin is required
        const { data: existingProfile } = await supabaseClient
          .from('profiles')
          .select('transaction_pin')
          .eq('id', userId)
          .single();

        if (existingProfile?.transaction_pin && !currentPin) {
          return new Response(
            JSON.stringify({ success: false, error: 'Current PIN is required to change PIN' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // If changing PIN, verify current PIN first
        if (existingProfile?.transaction_pin && currentPin) {
          const hashedCurrentPin = hashPin(currentPin);
          if (existingProfile.transaction_pin !== hashedCurrentPin) {
            return new Response(
              JSON.stringify({ success: false, error: 'Current PIN is incorrect' }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }

        // Hash and store the new PIN
        const hashedPin = hashPin(pin);
        const { error } = await supabaseClient
          .from('profiles')
          .update({ 
            transaction_pin: hashedPin,
            pin_attempts: 0,
            pin_locked_until: null
          })
          .eq('id', userId);

        if (error) {
          console.error('Error setting PIN:', error);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to set PIN' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'PIN set successfully' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'verify_pin': {
        if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid PIN format' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Get user's PIN and attempt info
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('transaction_pin, pin_attempts, pin_locked_until')
          .eq('id', userId)
          .single();

        if (!profile?.transaction_pin) {
          return new Response(
            JSON.stringify({ success: false, error: 'No PIN set for this user' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Check if PIN is locked
        if (profile.pin_locked_until && new Date(profile.pin_locked_until) > new Date()) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'PIN is temporarily locked due to too many failed attempts',
              isLocked: true,
              lockedUntil: profile.pin_locked_until
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Verify PIN
        const hashedPin = hashPin(pin);
        const isCorrect = profile.transaction_pin === hashedPin;

        if (isCorrect) {
          // Reset attempts on successful verification
          await supabaseClient
            .from('profiles')
            .update({ 
              pin_attempts: 0,
              pin_locked_until: null
            })
            .eq('id', userId);

          return new Response(
            JSON.stringify({ success: true, message: 'PIN verified successfully' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          // Increment failed attempts
          const newAttempts = (profile.pin_attempts || 0) + 1;
          const maxAttempts = 3;
          
          let updateData: any = { pin_attempts: newAttempts };
          
          // Lock PIN if max attempts reached
          if (newAttempts >= maxAttempts) {
            const lockUntil = new Date();
            lockUntil.setMinutes(lockUntil.getMinutes() + 15); // Lock for 15 minutes
            updateData.pin_locked_until = lockUntil.toISOString();
          }

          await supabaseClient
            .from('profiles')
            .update(updateData)
            .eq('id', userId);

          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Incorrect PIN. ${maxAttempts - newAttempts} attempts remaining`,
              attemptsRemaining: maxAttempts - newAttempts,
              isLocked: newAttempts >= maxAttempts
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      case 'check_pin_status': {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('transaction_pin, pin_attempts, pin_locked_until')
          .eq('id', userId)
          .single();

        const hasPin = !!profile?.transaction_pin;
        const isLocked = profile?.pin_locked_until && new Date(profile.pin_locked_until) > new Date();

        return new Response(
          JSON.stringify({ 
            success: true, 
            hasPin,
            isLocked: !!isLocked,
            lockedUntil: isLocked ? profile.pin_locked_until : null,
            attempts: profile?.pin_attempts || 0
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'reset_pin': {
        const { error } = await supabaseClient
          .from('profiles')
          .update({ 
            transaction_pin: null,
            pin_attempts: 0,
            pin_locked_until: null
          })
          .eq('id', userId);

        if (error) {
          console.error('Error resetting PIN:', error);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to reset PIN' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'PIN reset successfully' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error('Error in handle-pin function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});