import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Ban as Bank, Trash2, AlertTriangle, User, Mail, Phone, CreditCard, RefreshCw, Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../lib/utils';

type VirtualAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  virtual_account_bank_name: string;
  virtual_account_number: string;
  virtual_account_reference: string;
  bvn: string;
  created_at: string;
};

const VirtualAccountManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<VirtualAccount | null>(null);
  const [showBvn, setShowBvn] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchVirtualAccounts();
  }, [user, navigate]);

  const fetchVirtualAccounts = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, phone, virtual_account_bank_name, virtual_account_number, virtual_account_reference, bvn, created_at')
        .not('virtual_account_number', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVirtualAccounts(data || []);
    } catch (error) {
      console.error('Error fetching virtual accounts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchVirtualAccounts(true);
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    try {
      // Store account details for logging
      const accountDetails = {
        user_id: selectedAccount.id,
        user_name: selectedAccount.name,
        user_email: selectedAccount.email,
        bank_name: selectedAccount.virtual_account_bank_name,
        account_number: selectedAccount.virtual_account_number.slice(-4), // Only log last 4 digits for security
      };

      // Update the profile to remove virtual account details
      const { error } = await supabase
        .from('profiles')
        .update({
          virtual_account_bank_name: null,
          virtual_account_number: null,
          virtual_account_reference: null,
          bvn: null
        })
        .eq('id', selectedAccount.id);

      if (error) throw error;

      // Log the admin action
      await supabase.from('admin_logs').insert([{
        admin_id: user?.id,
        action: 'delete_virtual_account',
        details: accountDetails,
      }]);

      // Refresh the list
      fetchVirtualAccounts();
      setShowDeleteModal(false);
      setSelectedAccount(null);
      
      // Show success message
      alert('Virtual account deleted successfully');
    } catch (error) {
      console.error('Error deleting virtual account:', error);
      alert('Error deleting virtual account. Please try again.');
    }
  };

  const toggleBvnVisibility = (id: string) => {
    setShowBvn(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredAccounts = virtualAccounts.filter(account => {
    return (
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.virtual_account_number.includes(searchQuery) ||
      (account.phone && account.phone.includes(searchQuery))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F9D58]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors mr-4"
              >
                <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Virtual Account Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{virtualAccounts.length} total virtual accounts</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name, email, or account number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F9D58]"
              />
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Filter size={16} className="mr-2" />
              {filteredAccounts.length} accounts found
            </div>
          </div>
        </div>

        {/* Virtual Accounts Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Account Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    BVN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#0F9D58] to-[#0d8a4f] rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {account.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {account.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {account.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Mail size={14} className="mr-1 text-gray-500" />
                          {account.email}
                        </div>
                        {account.phone && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <Phone size={14} className="mr-1 text-gray-500" />
                            {account.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Bank size={16} className="text-[#0F9D58] mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {account.virtual_account_bank_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                        {account.virtual_account_number}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Ref: {account.virtual_account_reference.slice(0, 10)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                          {account.bvn ? (
                            showBvn[account.id] ? 
                              account.bvn : 
                              '•'.repeat(Math.min(account.bvn.length, 11))
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Not provided</span>
                          )}
                        </div>
                        {account.bvn && (
                          <button
                            onClick={() => toggleBvnVisibility(account.id)}
                            className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            {showBvn[account.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(account.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedAccount(account);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Virtual Account"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <Bank className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No virtual accounts found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {virtualAccounts.length === 0 
                ? "No users have created virtual accounts yet." 
                : "Try adjusting your search criteria."}
            </p>
          </div>
        )}

        {/* Information Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
            <CreditCard className="mr-2" size={20} />
            Virtual Account Information
          </h3>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <p>• Virtual accounts are created through Flutterwave's API</p>
            <p>• Each user can have only one virtual account</p>
            <p>• Deleting a virtual account will require the user to create a new one</p>
            <p>• BVN is required for permanent virtual accounts and is stored securely</p>
            <p>• When a virtual account is deleted, the BVN is also removed from our database</p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <AlertTriangle className="text-red-500 mr-3" size={24} />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Virtual Account</h2>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete this virtual account? This action cannot be undone.
              </p>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
                  <div className="ml-2">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Account Details:</strong>
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      • User: {selectedAccount.name}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      • Email: {selectedAccount.email}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      • Bank: {selectedAccount.virtual_account_bank_name}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      • Account: {selectedAccount.virtual_account_number}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <Shield className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={16} />
                  <div className="ml-2">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Important Security Notice:</strong>
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Deleting this virtual account will also remove the user's BVN from our database. The user will need to provide their BVN again if they want to create a new virtual account.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualAccountManagement;