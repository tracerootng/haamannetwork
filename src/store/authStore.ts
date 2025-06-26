import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { supabase } from '../lib/supabase';

type AuthUser = User;

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  realtimeSubscription: any | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone?: string, referralCode?: string, bvn?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => Promise<void>;
  updateWalletBalance: (newBalance: number) => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  createVirtualAccount: (userId: string, email: string, firstName: string, lastName: string, phoneNumber?: string, bvn?: string) => Promise<void>;
  initRealtimeSubscription: () => void;
  cleanupRealtimeSubscription: () => void;
  verifyReferralCode: (code: string) => Promise<boolean>;
};

// Function to generate a random alphanumeric string for referral codes
const generateRandomReferralCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HN-${result}`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      realtimeSubscription: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            // Get user profile from database
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError) {
              // Only create profile if it doesn't exist (PGRST116 error code)
              if (profileError.code === 'PGRST116') {
                // Generate a unique referral code
                const referralCode = generateRandomReferralCode();
                
                const newProfile = {
                  id: data.user.id,
                  name: data.user.user_metadata?.name || 'User',
                  email: data.user.email!,
                  phone: data.user.user_metadata?.phone || '',
                  wallet_balance: 0,
                  is_admin: false,
                  referral_code: referralCode,
                  referred_by: null,
                  total_referrals: 0,
                  referral_earnings: 0,
                  created_at: new Date().toISOString(),
                };

                const { data: insertedProfile, error: insertError } = await supabase
                  .from('profiles')
                  .insert([newProfile])
                  .select()
                  .single();

                if (insertError) {
                  // If insert fails due to duplicate key, try to fetch the existing profile
                  if (insertError.code === '23505') {
                    const { data: existingProfile, error: fetchError } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('id', data.user.id)
                      .single();

                    if (fetchError) throw fetchError;
                    
                    set({
                      user: {
                        id: existingProfile.id,
                        name: existingProfile.name,
                        email: existingProfile.email,
                        phone: existingProfile.phone,
                        walletBalance: existingProfile.wallet_balance,
                        isAdmin: existingProfile.is_admin,
                        referralCode: existingProfile.referral_code,
                        referredBy: existingProfile.referred_by,
                        totalReferrals: existingProfile.total_referrals,
                        referralEarnings: existingProfile.referral_earnings,
                        createdAt: existingProfile.created_at,
                        virtualAccountBankName: existingProfile.virtual_account_bank_name,
                        virtualAccountNumber: existingProfile.virtual_account_number,
                        virtualAccountReference: existingProfile.virtual_account_reference,
                        bvn: existingProfile.bvn,
                      },
                      isAuthenticated: true,
                      isLoading: false,
                    });
                    
                    // Initialize realtime subscription
                    get().initRealtimeSubscription();
                  } else {
                    throw insertError;
                  }
                } else {
                  set({
                    user: {
                      id: insertedProfile.id,
                      name: insertedProfile.name,
                      email: insertedProfile.email,
                      phone: insertedProfile.phone,
                      walletBalance: insertedProfile.wallet_balance,
                      isAdmin: insertedProfile.is_admin,
                      referralCode: insertedProfile.referral_code,
                      referredBy: insertedProfile.referred_by,
                      totalReferrals: insertedProfile.total_referrals,
                      referralEarnings: insertedProfile.referral_earnings,
                      createdAt: insertedProfile.created_at,
                      virtualAccountBankName: insertedProfile.virtual_account_bank_name,
                      virtualAccountNumber: insertedProfile.virtual_account_number,
                      virtualAccountReference: insertedProfile.virtual_account_reference,
                      bvn: insertedProfile.bvn,
                    },
                    isAuthenticated: true,
                    isLoading: false,
                  });
                  
                  // Initialize realtime subscription
                  get().initRealtimeSubscription();
                }
              } else {
                // For other errors, throw them
                throw profileError;
              }
            } else {
              set({
                user: {
                  id: profile.id,
                  name: profile.name,
                  email: profile.email,
                  phone: profile.phone,
                  walletBalance: profile.wallet_balance,
                  isAdmin: profile.is_admin,
                  referralCode: profile.referral_code,
                  referredBy: profile.referred_by,
                  totalReferrals: profile.total_referrals,
                  referralEarnings: profile.referral_earnings,
                  createdAt: profile.created_at,
                  virtualAccountBankName: profile.virtual_account_bank_name,
                  virtualAccountNumber: profile.virtual_account_number,
                  virtualAccountReference: profile.virtual_account_reference,
                  bvn: profile.bvn,
                },
                isAuthenticated: true,
                isLoading: false,
              });
              
              // Initialize realtime subscription
              get().initRealtimeSubscription();
            }
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Login failed');
        }
      },

      signup: async (email: string, password: string, name: string, phone?: string, referralCode?: string, bvn?: string) => {
        set({ isLoading: true });
        try {
          // Verify referral code if provided
          let referrerProfile = null;
          if (referralCode && referralCode.trim() !== '') {
            console.log('Verifying referral code:', referralCode);
            
            // Format the referral code properly before querying
            const formattedReferralCode = referralCode.trim();
            
            const { data: referrer, error: referrerError } = await supabase
              .from('profiles')
              .select('*')
              .eq('referral_code', formattedReferralCode)
              .maybeSingle();
              
            if (referrerError) {
              console.error('Error getting referrer profile:', referrerError);
              // Don't throw an error, just log it and continue with signup
            } else if (referrer) {
              console.log('Referrer found:', referrer);
              referrerProfile = referrer;
            } else {
              console.log('No referrer found for code:', formattedReferralCode);
              throw new Error('Invalid referral code. Please check and try again.');
            }
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                phone,
                referralCode,
                bvn,
              },
            },
          });

          if (error) throw error;

          if (data.user) {
            // Generate unique random referral code
            const userReferralCode = generateRandomReferralCode();
            
            // Create user profile
            const profile = {
              id: data.user.id,
              name,
              email,
              phone: phone || '',
              wallet_balance: 0,
              is_admin: false,
              referral_code: userReferralCode,
              referred_by: referrerProfile?.id || null,
              total_referrals: 0,
              referral_earnings: 0,
              created_at: new Date().toISOString(),
              bvn: bvn || null,
            };

            console.log('Creating profile with data:', { ...profile, referred_by: referrerProfile?.id || 'null' });

            const { data: insertedProfile, error: profileError } = await supabase
              .from('profiles')
              .insert([profile])
              .select()
              .single();

            if (profileError) {
              // If profile creation fails due to duplicate key, fetch existing profile
              if (profileError.code === '23505') {
                const { data: existingProfile, error: fetchError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', data.user.id)
                  .single();

                if (fetchError) throw fetchError;

                set({
                  user: {
                    id: existingProfile.id,
                    name: existingProfile.name,
                    email: existingProfile.email,
                    phone: existingProfile.phone,
                    walletBalance: existingProfile.wallet_balance,
                    isAdmin: existingProfile.is_admin,
                    referralCode: existingProfile.referral_code,
                    referredBy: existingProfile.referred_by,
                    totalReferrals: existingProfile.total_referrals,
                    referralEarnings: existingProfile.referral_earnings,
                    createdAt: existingProfile.created_at,
                    virtualAccountBankName: existingProfile.virtual_account_bank_name,
                    virtualAccountNumber: existingProfile.virtual_account_number,
                    virtualAccountReference: existingProfile.virtual_account_reference,
                    bvn: existingProfile.bvn,
                  },
                  isAuthenticated: true,
                  isLoading: false,
                });
                
                // Initialize realtime subscription
                get().initRealtimeSubscription();
                return;
              } else {
                throw profileError;
              }
            }

            // Update referrer's total referrals count
            if (referrerProfile) {
              console.log('Updating referrer profile:', referrerProfile.id);
              const newTotalReferrals = (referrerProfile.total_referrals || 0) + 1;
              
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                  total_referrals: newTotalReferrals
                })
                .eq('id', referrerProfile.id);
                
              if (updateError) {
                console.error('Error updating referrer profile:', updateError);
              } else {
                console.log('Successfully updated referrer profile with new total:', newTotalReferrals);
              }
                
              // Log the referral
              await supabase.from('admin_logs').insert([{
                admin_id: null,
                action: 'new_referral',
                details: { 
                  referrer_id: referrerProfile.id,
                  referrer_name: referrerProfile.name,
                  referred_user_id: data.user.id,
                  referred_user_name: name,
                  referral_code: referralCode
                },
              }]);
            }

            // Set user in state
            const user = {
              id: insertedProfile.id,
              name: insertedProfile.name,
              email: insertedProfile.email,
              phone: insertedProfile.phone,
              walletBalance: insertedProfile.wallet_balance,
              isAdmin: insertedProfile.is_admin,
              referralCode: insertedProfile.referral_code,
              referredBy: insertedProfile.referred_by,
              totalReferrals: insertedProfile.total_referrals,
              referralEarnings: insertedProfile.referral_earnings,
              createdAt: insertedProfile.created_at,
              virtualAccountBankName: insertedProfile.virtual_account_bank_name,
              virtualAccountNumber: insertedProfile.virtual_account_number,
              virtualAccountReference: insertedProfile.virtual_account_reference,
              bvn: insertedProfile.bvn,
            };

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
            
            // Initialize realtime subscription
            get().initRealtimeSubscription();

            // Create virtual account if BVN is provided
            if (bvn) {
              try {
                // Split name into first and last name
                const nameParts = name.split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                
                await get().createVirtualAccount(
                  user.id,
                  email,
                  firstName,
                  lastName,
                  phone,
                  bvn
                );
              } catch (error) {
                console.error('Error creating virtual account:', error);
                // Don't throw here, as the signup was successful
              }
            }
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Signup failed');
        }
      },

      logout: async () => {
        // Clean up realtime subscription
        get().cleanupRealtimeSubscription();
        
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },

      updateUser: async (data) => {
        const state = get();
        if (!state.user) return;

        try {
          // Update in database
          const { error } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', state.user.id);

          if (error) throw error;

          // Update local state
          set((state) => ({
            user: state.user ? { ...state.user, ...data } : null,
          }));
        } catch (error) {
          console.error('Error updating user:', error);
          throw error;
        }
      },

      updateWalletBalance: async (newBalance) => {
        const state = get();
        if (!state.user) return;

        try {
          // Update in database
          const { error } = await supabase
            .from('profiles')
            .update({ wallet_balance: newBalance })
            .eq('id', state.user.id);

          if (error) throw error;

          // Update local state
          set((state) => ({
            user: state.user ? { ...state.user, walletBalance: newBalance } : null,
          }));
        } catch (error) {
          console.error('Error updating wallet balance:', error);
          throw error;
        }
      },

      refreshUserData: async () => {
        const state = get();
        if (!state.user) return;

        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', state.user.id)
            .single();

          if (error) throw error;

          if (profile) {
            set({
              user: {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                walletBalance: profile.wallet_balance,
                isAdmin: profile.is_admin,
                referralCode: profile.referral_code,
                referredBy: profile.referred_by,
                totalReferrals: profile.total_referrals,
                referralEarnings: profile.referral_earnings,
                createdAt: profile.created_at,
                virtualAccountBankName: profile.virtual_account_bank_name,
                virtualAccountNumber: profile.virtual_account_number,
                virtualAccountReference: profile.virtual_account_reference,
                bvn: profile.bvn,
              },
            });
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      },

      checkAuth: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            const referralCode = generateRandomReferralCode();
            
            const newProfile = {
              id: session.user.id,
              name: session.user.user_metadata?.name || 'User',
              email: session.user.email!,
              phone: session.user.user_metadata?.phone || '',
              wallet_balance: 0,
              is_admin: false,
              referral_code: referralCode,
              referred_by: null,
              total_referrals: 0,
              referral_earnings: 0,
              created_at: new Date().toISOString(),
            };

            const { data: insertedProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single();

            if (insertError) {
              // If insert fails due to duplicate key, try to fetch the existing profile
              if (insertError.code === '23505') {
                const { data: existingProfile, error: fetchError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();

                if (!fetchError && existingProfile) {
                  set({
                    user: {
                      id: existingProfile.id,
                      name: existingProfile.name,
                      email: existingProfile.email,
                      phone: existingProfile.phone,
                      walletBalance: existingProfile.wallet_balance,
                      isAdmin: existingProfile.is_admin,
                      referralCode: existingProfile.referral_code,
                      referredBy: existingProfile.referred_by,
                      totalReferrals: existingProfile.total_referrals,
                      referralEarnings: existingProfile.referral_earnings,
                      createdAt: existingProfile.created_at,
                      virtualAccountBankName: existingProfile.virtual_account_bank_name,
                      virtualAccountNumber: existingProfile.virtual_account_number,
                      virtualAccountReference: existingProfile.virtual_account_reference,
                      bvn: existingProfile.bvn,
                    },
                    isAuthenticated: true,
                  });
                  
                  // Initialize realtime subscription
                  get().initRealtimeSubscription();
                }
              }
            } else if (insertedProfile) {
              set({
                user: {
                  id: insertedProfile.id,
                  name: insertedProfile.name,
                  email: insertedProfile.email,
                  phone: insertedProfile.phone,
                  walletBalance: insertedProfile.wallet_balance,
                  isAdmin: insertedProfile.is_admin,
                  referralCode: insertedProfile.referral_code,
                  referredBy: insertedProfile.referred_by,
                  totalReferrals: insertedProfile.total_referrals,
                  referralEarnings: insertedProfile.referral_earnings,
                  createdAt: insertedProfile.created_at,
                  virtualAccountBankName: insertedProfile.virtual_account_bank_name,
                  virtualAccountNumber: insertedProfile.virtual_account_number,
                  virtualAccountReference: insertedProfile.virtual_account_reference,
                  bvn: insertedProfile.bvn,
                },
                isAuthenticated: true,
              });
              
              // Initialize realtime subscription
              get().initRealtimeSubscription();
            }
          } else if (profile) {
            set({
              user: {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                walletBalance: profile.wallet_balance,
                isAdmin: profile.is_admin,
                referralCode: profile.referral_code,
                referredBy: profile.referred_by,
                totalReferrals: profile.total_referrals,
                referralEarnings: profile.referral_earnings,
                createdAt: profile.created_at,
                virtualAccountBankName: profile.virtual_account_bank_name,
                virtualAccountNumber: profile.virtual_account_number,
                virtualAccountReference: profile.virtual_account_reference,
                bvn: profile.bvn,
              },
              isAuthenticated: true,
            });
            
            // Initialize realtime subscription
            get().initRealtimeSubscription();
          }
        } else {
          set({ user: null, isAuthenticated: false });
          // Clean up any existing subscription
          get().cleanupRealtimeSubscription();
        }
      },

      createVirtualAccount: async (userId, email, firstName, lastName, phoneNumber, bvn) => {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          if (!supabaseUrl) {
            throw new Error('Supabase URL not configured');
          }

          const response = await fetch(`${supabaseUrl}/functions/v1/create-virtual-account`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              userId,
              email,
              firstName,
              lastName,
              phoneNumber,
              bvn,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create virtual account: ${errorText}`);
          }

          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to create virtual account');
          }

          // Update user state with virtual account details
          set((state) => ({
            user: state.user ? {
              ...state.user,
              virtualAccountBankName: result.data.bank_name,
              virtualAccountNumber: result.data.account_number,
              virtualAccountReference: result.data.reference,
              bvn: bvn,
            } : null,
          }));

          return result.data;
        } catch (error) {
          console.error('Error creating virtual account:', error);
          throw error;
        }
      },
      
      // New function to initialize realtime subscription
      initRealtimeSubscription: () => {
        const state = get();
        
        // Clean up any existing subscription first
        get().cleanupRealtimeSubscription();
        
        if (!state.user) return;
        
        try {
          console.log('Initializing realtime subscription for user:', state.user.id);
          
          // Subscribe to changes in the profiles table for the current user
          const subscription = supabase
            .channel('profile-changes')
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${state.user.id}`,
              },
              (payload) => {
                console.log('Received realtime update:', payload);
                
                // Update the user's wallet balance in the local state
                if (payload.new && payload.new.wallet_balance !== undefined) {
                  console.log('Updating wallet balance from realtime event:', payload.new.wallet_balance);
                  
                  set((state) => ({
                    user: state.user ? {
                      ...state.user,
                      walletBalance: payload.new.wallet_balance,
                    } : null,
                  }));
                }
              }
            )
            .subscribe();
          
          // Store the subscription for later cleanup
          set({ realtimeSubscription: subscription });
          
        } catch (error) {
          console.error('Error setting up realtime subscription:', error);
        }
      },
      
      // Function to clean up realtime subscription
      cleanupRealtimeSubscription: () => {
        const { realtimeSubscription } = get();
        
        if (realtimeSubscription) {
          console.log('Cleaning up realtime subscription');
          supabase.removeChannel(realtimeSubscription);
          set({ realtimeSubscription: null });
        }
      },

      // Function to verify a referral code
      verifyReferralCode: async (code: string) => {
        try {
          // Check if code is empty
          if (!code.trim()) {
            return false;
          }
          
          console.log('Verifying referral code:', code);
          
          // Format the code properly before checking
          const formattedCode = code.trim();
          
          // Check if the referral code exists in the database
          const { data, error } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('referral_code', formattedCode)
            .maybeSingle();
          
          if (error) {
            console.error('Error verifying referral code:', error);
            return false;
          }
          
          console.log('Verification result:', data ? 'Valid' : 'Invalid');
          return !!data; // Return true if data exists, false otherwise
        } catch (error) {
          console.error('Error verifying referral code:', error);
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);