import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Share2, Users, Gift, TrendingUp, Award } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../lib/utils';

const ReferEarnPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  
  // Generate referral code based on user info
  const referralCode = user ? `haaman-${user.name.replace(/\s+/g, '').toUpperCase()}${user.id.slice(-3)}` : 'haaman-USER123';
  const referralRewards = 0; // This would come from the database
  const totalReferrals = 0; // This would come from the database

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralCode = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Haaman Network',
        text: `Join me on Haaman Network and get amazing rewards! Use my referral code: ${referralCode}`,
        url: `https://haamannetwork.com/signup?ref=${referralCode}`
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      copyReferralCode();
    }
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
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white ml-4">Refer & Earn</h1>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#0F9D58] to-[#0d8a4f] rounded-2xl p-6 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white rounded-full"></div>
          </div>
          
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift size={32} className="text-white" />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              Invite friends to Haaman Network
            </h2>
            <p className="text-base sm:text-lg opacity-90 mb-4">
              Earn rewards for every successful referral!
            </p>
            
            {/* Bonus Badge */}
            <div className="inline-block bg-white text-[#0F9D58] px-6 py-3 rounded-2xl font-bold text-xl">
              6% Bonus
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-[#0F9D58]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-[#0F9D58]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">{totalReferrals}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Referrals</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-[#0F9D58]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award size={24} className="text-[#0F9D58]" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-[#0F9D58] mb-1">{formatCurrency(referralRewards)}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Earned</div>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="text-[#0F9D58] mr-2" size={20} />
            How it Works
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-[#0F9D58] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Share your referral code</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Send your unique code to friends and family
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-[#0F9D58] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">They sign up and deposit</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your friend creates an account and makes their first deposit of ₦1,000+
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-[#0F9D58] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">You both earn rewards</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Get 6% bonus on their first deposit, credited instantly to your wallet
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Actions */}
        <div className="space-y-4">
          {/* Share Button */}
          <button
            onClick={shareReferralCode}
            className="w-full bg-[#0F9D58] hover:bg-[#0d8a4f] text-white py-4 rounded-2xl font-semibold text-base sm:text-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Share2 size={20} />
            <span>Refer a Friend</span>
          </button>

          {/* Referral Code Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Your Referral Code
            </h3>
            
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-[#0F9D58]/10 rounded-xl px-3 sm:px-4 py-3 border border-[#0F9D58]/20 min-w-0">
                <span className="text-[#0F9D58] font-bold text-sm sm:text-lg break-all">
                  {referralCode}
                </span>
              </div>
              
              <button
                onClick={copyReferralCode}
                className={`px-4 sm:px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 flex-shrink-0 ${
                  copied 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white'
                }`}
              >
                <Copy size={16} />
                <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4">
            Recent Referrals
          </h3>
          
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No referrals yet. Start sharing your code to earn rewards!
            </p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center text-sm sm:text-base">
            <Gift size={16} className="mr-2" />
            Terms & Conditions
          </h4>
          <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Referral bonus is paid only on the first deposit of ₦1,000 or more</li>
            <li>• Bonus is credited within 24 hours of successful deposit</li>
            <li>• Referred user must complete account verification</li>
            <li>• Self-referrals and fake accounts are strictly prohibited</li>
            <li>• Haaman Network reserves the right to modify terms at any time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReferEarnPage;