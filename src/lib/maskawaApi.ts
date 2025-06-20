import { supabase } from './supabase';

// Network mappings for MASKAWA API
export const NETWORK_MAPPINGS = {
  'mtn': 1,
  'airtel': 2,
  'glo': 3,
  '9mobile': 4,
} as const;

// Disco mappings for electricity
export const DISCO_MAPPINGS = {
  'ikeja': 'ikeja-electric',
  'eko': 'eko-electric',
  'ibadan': 'ibadan-electric',
  'abuja': 'abuja-electric',
} as const;

class MaskawaAPI {
  private getEdgeFunctionUrl() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }
    return `${supabaseUrl}/functions/v1/maskawa-proxy`;
  }

  private async makeEdgeFunctionRequest(action: string, data: any) {
    try {
      const url = this.getEdgeFunctionUrl();
      const token = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!token) {
        throw new Error('Supabase anon key not configured');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result.data;

    } catch (error: any) {
      console.error('Edge function request error:', error);
      
      if (error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to payment service. Please check your internet connection and try again.');
      }
      
      if (error.message.includes('NetworkError') || 
          error.message.includes('ERR_NETWORK') ||
          error.message.includes('ERR_INTERNET_DISCONNECTED')) {
        throw new Error('Network connection error. Please check your internet connection and try again.');
      }

      throw error;
    }
  }

  async checkUserDetails() {
    // This would need to be implemented if needed
    throw new Error('User details check not implemented via edge function');
  }

  async buyAirtime(data: {
    network: keyof typeof NETWORK_MAPPINGS;
    amount: number;
    mobile_number: string;
    ported_number?: boolean;
  }) {
    return await this.makeEdgeFunctionRequest('buy_airtime', {
      network: data.network,
      amount: data.amount,
      phoneNumber: data.mobile_number,
    });
  }

  async buyData(data: {
    network: keyof typeof NETWORK_MAPPINGS;
    mobile_number: string;
    plan: string; // This is now the external_id from data_plans table
    ported_number?: boolean;
  }) {
    return await this.makeEdgeFunctionRequest('buy_data', {
      network: data.network,
      phoneNumber: data.mobile_number,
      plan: data.plan,
    });
  }

  async buyElectricity(data: {
    disco_name: keyof typeof DISCO_MAPPINGS;
    amount: number;
    meter_number: string;
    meter_type: 'prepaid' | 'postpaid';
  }) {
    return await this.makeEdgeFunctionRequest('buy_electricity', {
      disco: data.disco_name,
      amount: data.amount,
      meterNumber: data.meter_number,
      meterType: data.meter_type,
    });
  }

  async getDataTransactions() {
    // This would need to be implemented if needed
    throw new Error('Data transactions retrieval not implemented via edge function');
  }

  async getAirtimeTransaction(id: string) {
    // This would need to be implemented if needed
    throw new Error('Airtime transaction retrieval not implemented via edge function');
  }
}

export const maskawaAPI = new MaskawaAPI();