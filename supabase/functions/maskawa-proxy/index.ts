import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Network mappings for MASKAWA API
const NETWORK_MAPPINGS = {
  'mtn': 1,
  'airtel': 2,
  'glo': 3,
  '9mobile': 4,
} as const;

// Data plan mappings
const DATA_PLAN_MAPPINGS = {
  'mtn-500mb-30days': 101,
  'mtn-1gb-30days': 102,
  'mtn-2gb-30days': 103,
  'mtn-5gb-30days': 104,
  'airtel-500mb-30days': 201,
  'airtel-1gb-30days': 202,
  'airtel-2gb-30days': 203,
  'airtel-5gb-30days': 204,
  'glo-500mb-30days': 301,
  'glo-1gb-30days': 302,
  'glo-2gb-30days': 303,
  'glo-5gb-30days': 304,
  '9mobile-500mb-30days': 401,
  '9mobile-1gb-30days': 402,
  '9mobile-2gb-30days': 403,
  '9mobile-5gb-30days': 404,
} as const;

// Disco mappings for electricity
const DISCO_MAPPINGS = {
  'ikeja': 'ikeja-electric',
  'eko': 'eko-electric',
  'ibadan': 'ibadan-electric',
  'abuja': 'abuja-electric',
} as const;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get API settings from database
    const { data: settings, error: settingsError } = await supabaseClient
      .from('api_settings')
      .select('key_name, key_value')
      .in('key_name', ['maskawa_token', 'maskawa_base_url'])

    if (settingsError) {
      throw new Error('Failed to fetch API configuration')
    }

    const tokenSetting = settings?.find(s => s.key_name === 'maskawa_token')
    const baseUrlSetting = settings?.find(s => s.key_name === 'maskawa_base_url')

    if (!tokenSetting?.key_value || !baseUrlSetting?.key_value) {
      throw new Error('API configuration not found')
    }

    const token = tokenSetting.key_value
    const baseUrl = baseUrlSetting.key_value.replace(/\/$/, '')

    // Parse request
    const { action, data } = await req.json()

    let apiEndpoint = ''
    let apiPayload = {}

    // Route based on action
    switch (action) {
      case 'buy_airtime':
        apiEndpoint = '/api/topup/'
        apiPayload = {
          network: NETWORK_MAPPINGS[data.network as keyof typeof NETWORK_MAPPINGS],
          amount: data.amount,
          mobile_number: data.phoneNumber,
          Ported_number: true,
          airtime_type: 'VTU',
        }
        break

      case 'buy_data':
        apiEndpoint = '/api/data/'
        apiPayload = {
          network: NETWORK_MAPPINGS[data.network as keyof typeof NETWORK_MAPPINGS],
          mobile_number: data.phoneNumber,
          plan: DATA_PLAN_MAPPINGS[data.plan as keyof typeof DATA_PLAN_MAPPINGS],
          Ported_number: true,
          payment_medium: 'MAIN WALLET',
        }
        break

      case 'buy_electricity':
        apiEndpoint = '/api/billpayment/'
        apiPayload = {
          disco_name: DISCO_MAPPINGS[data.disco as keyof typeof DISCO_MAPPINGS],
          amount: data.amount,
          meter_number: data.meterNumber,
          MeterType: data.meterType === 'prepaid' ? 1 : 2,
        }
        break

      default:
        throw new Error('Invalid action')
    }

    // Make request to MASKAWA API
    const response = await fetch(`${baseUrl}${apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    // Handle response
    let result
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      result = await response.json()
    } else {
      result = { success: true, status: response.status }
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})