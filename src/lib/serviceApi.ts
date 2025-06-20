import { maskawaAPI } from './maskawaApi';
import { supabase } from './supabase';
import { generateTransactionReference } from './utils';

export type ServiceType = 'airtime' | 'data' | 'electricity';

export interface ServiceTransaction {
  id: string;
  user_id: string;
  type: ServiceType;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  reference: string;
  details: any;
  external_reference?: string;
  created_at: string;
}

class ServiceAPI {
  async processAirtimeTransaction(
    userId: string,
    data: {
      network: string;
      amount: number;
      phoneNumber: string;
    }
  ): Promise<ServiceTransaction> {
    const reference = generateTransactionReference();
    
    // Create pending transaction
    const transaction = {
      user_id: userId,
      type: 'airtime' as ServiceType,
      amount: data.amount,
      status: 'pending' as const,
      reference,
      details: {
        network: data.network,
        phone: data.phoneNumber,
        service_provider: 'maskawa',
      },
    };

    const { data: dbTransaction, error: dbError } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (dbError) throw dbError;

    try {
      // Call MASKAWA API
      const apiResponse = await maskawaAPI.buyAirtime({
        network: data.network as any,
        amount: data.amount,
        mobile_number: data.phoneNumber,
      });

      // Update transaction as successful
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'success',
          details: {
            ...transaction.details,
            api_response: apiResponse,
            external_reference: apiResponse?.reference || apiResponse?.id,
          },
        })
        .eq('id', dbTransaction.id);

      if (updateError) throw updateError;

      return {
        ...dbTransaction,
        status: 'success',
      };
    } catch (error) {
      // Update transaction as failed
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          details: {
            ...transaction.details,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
        .eq('id', dbTransaction.id);

      throw error;
    }
  }

  async processDataTransaction(
    userId: string,
    data: {
      network: string;
      plan: string;
      phoneNumber: string;
      amount: number;
    }
  ): Promise<ServiceTransaction> {
    const reference = generateTransactionReference();
    
    // Create pending transaction
    const transaction = {
      user_id: userId,
      type: 'data' as ServiceType,
      amount: data.amount,
      status: 'pending' as const,
      reference,
      details: {
        network: data.network,
        plan: data.plan,
        phone: data.phoneNumber,
        service_provider: 'maskawa',
      },
    };

    const { data: dbTransaction, error: dbError } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (dbError) throw dbError;

    try {
      // Call MASKAWA API
      const apiResponse = await maskawaAPI.buyData({
        network: data.network as any,
        mobile_number: data.phoneNumber,
        plan: data.plan as any,
      });

      // Update transaction as successful
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'success',
          details: {
            ...transaction.details,
            api_response: apiResponse,
            external_reference: apiResponse?.reference || apiResponse?.id,
          },
        })
        .eq('id', dbTransaction.id);

      if (updateError) throw updateError;

      return {
        ...dbTransaction,
        status: 'success',
      };
    } catch (error) {
      // Update transaction as failed
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          details: {
            ...transaction.details,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
        .eq('id', dbTransaction.id);

      throw error;
    }
  }

  async processElectricityTransaction(
    userId: string,
    data: {
      disco: string;
      amount: number;
      meterNumber: string;
      meterType: string;
    }
  ): Promise<ServiceTransaction> {
    const reference = generateTransactionReference();
    
    // Create pending transaction
    const transaction = {
      user_id: userId,
      type: 'electricity' as ServiceType,
      amount: data.amount,
      status: 'pending' as const,
      reference,
      details: {
        disco: data.disco,
        meterNumber: data.meterNumber,
        meterType: data.meterType,
        service_provider: 'maskawa',
      },
    };

    const { data: dbTransaction, error: dbError } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (dbError) throw dbError;

    try {
      // Call MASKAWA API
      const apiResponse = await maskawaAPI.buyElectricity({
        disco_name: data.disco as any,
        amount: data.amount,
        meter_number: data.meterNumber,
        meter_type: data.meterType as any,
      });

      // Update transaction as successful
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'success',
          details: {
            ...transaction.details,
            api_response: apiResponse,
            external_reference: apiResponse?.reference || apiResponse?.id,
          },
        })
        .eq('id', dbTransaction.id);

      if (updateError) throw updateError;

      return {
        ...dbTransaction,
        status: 'success',
      };
    } catch (error) {
      // Update transaction as failed
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          details: {
            ...transaction.details,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
        .eq('id', dbTransaction.id);

      throw error;
    }
  }
}

export const serviceAPI = new ServiceAPI();