import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type ServiceStatus = 'active' | 'disabled' | 'coming_soon';

export type ServiceConfig = {
  [key: string]: ServiceStatus;
};

type ServiceConfigState = {
  config: ServiceConfig;
  isLoading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  updateServiceStatus: (service: string, status: ServiceStatus) => Promise<void>;
  getServiceStatus: (service: string) => ServiceStatus;
};

export const useServiceConfigStore = create<ServiceConfigState>((set, get) => ({
  config: {},
  isLoading: false,
  error: null,

  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value')
        .like('key', 'service_%_status');

      if (error) throw error;

      const config: ServiceConfig = {};
      data?.forEach(item => {
        // Extract service name from key (e.g., service_airtime_status -> airtime)
        const serviceName = item.key.replace('service_', '').replace('_status', '');
        config[serviceName] = item.value as ServiceStatus;
      });

      set({ config, isLoading: false });
    } catch (error) {
      console.error('Error fetching service configuration:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  updateServiceStatus: async (service: string, status: ServiceStatus) => {
    try {
      const key = `service_${service}_status`;
      
      // Check if the setting already exists
      const { data: existingSetting, error: checkError } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingSetting) {
        // Update existing setting
        const { error } = await supabase
          .from('admin_settings')
          .update({ value: status })
          .eq('key', key);
          
        if (error) throw error;
      } else {
        // Insert new setting
        const { error } = await supabase
          .from('admin_settings')
          .insert([{ 
            key, 
            value: status,
            description: `Status for ${service} service: active, disabled, or coming_soon`
          }]);
          
        if (error) throw error;
      }
      
      // Update local state
      set(state => ({
        config: {
          ...state.config,
          [service]: status
        }
      }));
    } catch (error) {
      console.error(`Error updating ${service} status:`, error);
      throw error;
    }
  },

  getServiceStatus: (service: string) => {
    const { config } = get();
    return config[service] || 'active'; // Default to active if not found
  }
}));