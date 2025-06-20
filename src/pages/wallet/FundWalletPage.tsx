import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';

const FundWalletPage: React.FC = () => {
  const navigate = useNavigate();

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
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">Fund Wallet</h1>
      </div>

      <div className="p-4 space-y-8">
        {/* Verification Message */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-800/30 rounded-full flex items-center justify-center">
              <Clock size={32} className="text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-3">Verification in Progress</h2>
          
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            We're currently waiting for verification from our payment partner Flutterwave. This process typically takes 48-72 hours to complete.
          </p>
          
          <div className="flex items-start space-x-3 bg-white dark:bg-gray-800 p-4 rounded-lg text-left">
            <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Once verification is complete, you'll be able to fund your wallet directly through bank transfer or card payment. We'll notify you when this feature becomes available.
              </p>
            </div>
          </div>
        </div>

        {/* Alternative Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Alternative Funding Methods
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Contact Support</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please contact our support team to arrange a manual wallet funding during this verification period.
              </p>
              <p className="text-sm font-medium text-[#0F9D58] mt-2">
                support@haamannetwork.com
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Bank Transfer</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can make a bank transfer to our account and send the receipt to our support team for manual crediting.
              </p>
            </div>
          </div>
        </div>

        {/* Support Contact */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Need Help?
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            If you have any questions about funding your wallet, please contact our support team.
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