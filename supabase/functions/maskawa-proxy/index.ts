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

// Data plan mappings for MASKAWA API
const DATA_PLAN_MAPPINGS = {
  // MTN Plans
  'mtn-500mb-30days': 1,
  'mtn-1gb-30days': 2,
  'mtn-2gb-30days': 3,
  'mtn-3gb-30days': 4,
  'mtn-5gb-30days': 5,
  'mtn-10gb-30days': 6,
  'mtn-15gb-30days': 7,
  'mtn-20gb-30days': 8,
  
  // Airtel Plans
  'airtel-500mb-30days': 9,
  'airtel-1gb-30days': 10,
  'airtel-2gb-30days': 11,
  'airtel-3gb-30days': 12,
  'airtel-5gb-30days': 13,
  'airtel-10gb-30days': 14,
  'airtel-15gb-30days': 15,
  'airtel-20gb-30days': 16,
  
  // Glo Plans
  'glo-500mb-30days': 17,
  'glo-1gb-30days': 18,
  'glo-2gb-30days': 19,
  'glo-3gb-30days': 20,
  'glo-5gb-30days': 21,
  'glo-10gb-30days': 22,
  'glo-15gb-30days': 23,
  'glo-20gb-30days': 24,
  
  // 9mobile Plans
  '9mobile-500mb-30days': 25,
  '9mobile-1gb-30days': 26,
  '9mobile-2gb-30days': 27,
  '9mobile-3gb-30days': 28,
  '9mobile-5gb-30days': 29,
  '9mobile-10gb-30days': 30,
  '9mobile-15gb-30days': 31,
  '9mobile-20gb-30days': 32,
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
        const planId = DATA_PLAN_MAPPINGS[data.plan as keyof typeof DATA_PLAN_MAPPINGS]
        if (!planId) {
          throw new Error(`Invalid data plan: ${data.plan}`)
        }
        
        apiEndpoint = '/api/data/'
        apiPayload = {
          network: NETWORK_MAPPINGS[data.network as keyof typeof NETWORK_MAPPINGS],
          mobile_number: data.phoneNumber,
          plan: planId,
          Ported_number: true,
          payment_medium: 'MAIN WALLET',
        }
        break

      case 'buy_electricity':
        apiEndpoint = '/api/billpayment/'
        apiPayload = {
          disco_name: data.disco,
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