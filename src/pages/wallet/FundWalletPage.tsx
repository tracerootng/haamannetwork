import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Copy } from 'lucide-react';
import Button from '../../components/ui/Button';

const FundWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 py-4 flex items-center border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">Account Details</h1>
      </div>

      <div className="p-4 space-y-8">
        {/* Bank Icon */}
        <div className="flex justify-center py-8">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Building size={32} className="text-gray-600 dark:text-gray-400" />
          </div>
        </div>

        {/* Account Details */}
        <div className="space-y-8">
          {/* Account Number */}
          <div>
            <label className="block text-lg font-medium text-gray-900 dark:text-white mb-3">
              BillPoint Account Number
            </label>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                6023449398
              </span>
              <Button
                onClick={() => copyToClipboard('6023449398')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  copied 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="mt-2 h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-lg font-medium text-gray-900 dark:text-white mb-3">
              Bank Name
            </label>
            <div className="pb-2">
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Safe Haven MFB
              </span>
            </div>
            <div className="h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-lg font-medium text-gray-900 dark:text-white mb-3">
              Account Name
            </label>
            <div className="pb-2">
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Billpoint Checkout
              </span>
            </div>
            <div className="h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-lg">
            How to Fund Your Wallet
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <li>• Transfer any amount to the account details above</li>
            <li>• Your wallet will be credited automatically within 5-10 minutes</li>
            <li>• Use your registered phone number or email as transfer narration</li>
            <li>• Keep your transfer receipt for reference</li>
            <li>• Contact support if your wallet is not credited after 15 minutes</li>
          </ul>
        </div>

        {/* Support Contact */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Need Help?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Contact our support team if you have any issues with funding your wallet.
          </p>
          <p className="text-sm text-[#0F9D58] font-medium mt-1">
            support@haamannetwork.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default FundWalletPage;