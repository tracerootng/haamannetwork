import { supabase } from './supabase';

// Network mappings for MASKAWA API
export const NETWORK_MAPPINGS = {
  'mtn': 1,
  'airtel': 2,
  'glo': 3,
  '9mobile': 4,
} as const;

// Data plan mappings (these would need to be updated based on actual API documentation)
export const DATA_PLAN_MAPPINGS = {
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
export const DISCO_MAPPINGS = {
  'ikeja': 'ikeja-electric',
  'eko': 'eko-electric',
  'ibadan': 'ibadan-electric',
  'abuja': 'abuja-electric',
} as const;

class MaskawaAPI {
  private baseUrl: string = '';
  private token: string = '';

  async initialize() {
    try {
      const { data: settings, error } = await supabase
        .from('api_settings')
        .select('key_name, key_value')
        .in('key_name', ['maskawa_token', 'maskawa_base_url']);

      if (error) {
        console.error('Database error fetching API settings:', error);
        throw new Error('Failed to fetch API configuration from database');
      }

      const tokenSetting = settings?.find(s => s.key_name === 'maskawa_token');
      const baseUrlSetting = settings?.find(s => s.key_name === 'maskawa_base_url');

      if (!tokenSetting?.key_value || !baseUrlSetting?.key_value) {
        throw new Error('MASKAWA API configuration is incomplete. Please contact support to configure the API settings.');
      }

      this.token = tokenSetting.key_value;
      this.baseUrl = baseUrlSetting.key_value;

      // Validate URL format
      try {
        new URL(this.baseUrl);
      } catch {
        throw new Error('Invalid API base URL configuration. Please contact support.');
      }

    } catch (error) {
      console.error('Failed to initialize MASKAWA API:', error);
      throw error;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.token || !this.baseUrl) {
      await this.initialize();
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Token ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`;
        
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch {
          // If we can't read the error text, use the status code
        }

        if (response.status === 401) {
          throw new Error('API authentication failed. Please contact support.');
        } else if (response.status === 403) {
          throw new Error('API access denied. Please contact support.');
        } else if (response.status >= 500) {
          throw new Error('API server error. Please try again later.');
        } else {
          throw new Error(errorMessage);
        }
      }

      // Some endpoints don't return JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return { success: true, status: response.status };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your internet connection and try again.');
      }
      
      if (error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to payment service. Please check your internet connection and try again.');
      }

      // Re-throw our custom errors
      throw error;
    }
  }

  async checkUserDetails() {
    return await this.makeRequest('/api/user/');
  }

  async buyAirtime(data: {
    network: keyof typeof NETWORK_MAPPINGS;
    amount: number;
    mobile_number: string;
    ported_number?: boolean;
  }) {
    const payload = {
      network: NETWORK_MAPPINGS[data.network],
      amount: data.amount,
      mobile_number: data.mobile_number,
      Ported_number: data.ported_number ?? true,
      airtime_type: 'VTU',
    };

    return await this.makeRequest('/api/topup/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async buyData(data: {
    network: keyof typeof NETWORK_MAPPINGS;
    mobile_number: string;
    plan: keyof typeof DATA_PLAN_MAPPINGS;
    ported_number?: boolean;
  }) {
    const payload = {
      network: NETWORK_MAPPINGS[data.network],
      mobile_number: data.mobile_number,
      plan: DATA_PLAN_MAPPINGS[data.plan],
      Ported_number: data.ported_number ?? true,
      payment_medium: 'MAIN WALLET',
    };

    return await this.makeRequest('/api/data/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async buyElectricity(data: {
    disco_name: keyof typeof DISCO_MAPPINGS;
    amount: number;
    meter_number: string;
    meter_type: 'prepaid' | 'postpaid';
  }) {
    const payload = {
      disco_name: DISCO_MAPPINGS[data.disco_name],
      amount: data.amount,
      meter_number: data.meter_number,
      MeterType: data.meter_type === 'prepaid' ? 1 : 2,
    };

    return await this.makeRequest('/api/billpayment/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getDataTransactions() {
    return await this.makeRequest('/api/data/');
  }

  async getAirtimeTransaction(id: string) {
    return await this.makeRequest(`/api/data/${id}`);
  }
}

export const maskawaAPI = new MaskawaAPI();