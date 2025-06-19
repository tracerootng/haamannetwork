import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Bell, Gift, Ticket, BookOpen } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const ComingSoonPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the service name from the URL or state
  const getServiceInfo = () => {
    const path = location.pathname;
    const state = location.state as { serviceName?: string; serviceDescription?: string } | null;
    
    if (state?.serviceName) {
      return {
        name: state.serviceName,
        description: state.serviceDescription || 'This feature will be available soon.',
        icon: <Gift size={48} />
      };
    }
    
    // Default based on path
    if (path.includes('voucher')) {
      return {
        name: 'Redeem Voucher',
        description: 'Redeem your vouchers and gift cards for amazing rewards and discounts.',
        icon: <Gift size={48} />
      };
    } else if (path.includes('ticket')) {
      return {
        name: 'Support Ticket',
        description: 'Create and manage support tickets for quick assistance from our team.',
        icon: <Ticket size={48} />
      };
    } else if (path.includes('education')) {
      return {
        name: 'Education Services',
        description: 'Access educational services, course payments, and academic resources.',
        icon: <BookOpen size={48} />
      };
    }
    
    return {
      name: 'New Feature',
      description: 'This exciting new feature will be available soon.',
      icon: <Clock size={48} />
    };
  };

  const serviceInfo = getServiceInfo();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 py-4 flex items-center border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">{serviceInfo.name}</h1>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <Card className="max-w-md w-full text-center p-8">
          {/* Animated Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#0F9D58] to-[#0d8a4f] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <div className="text-white">
                {serviceInfo.icon}
              </div>
            </div>
            
            {/* Floating notification bell */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
              <Bell size={16} className="text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Coming Soon
              </h2>
              <h3 className="text-xl font-semibold text-[#0F9D58] mb-4">
                {serviceInfo.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {serviceInfo.description}
              </p>
            </div>

            {/* Features Preview */}
            <div className="bg-gradient-to-r from-[#0F9D58]/10 to-[#0d8a4f]/10 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">What to Expect:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[#0F9D58] rounded-full mr-3"></div>
                  Fast and secure processing
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[#0F9D58] rounded-full mr-3"></div>
                  User-friendly interface
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[#0F9D58] rounded-full mr-3"></div>
                  24/7 customer support
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[#0F9D58] rounded-full mr-3"></div>
                  Competitive pricing
                </li>
              </ul>
            </div>

            {/* Notification Signup */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Get Notified</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Be the first to know when this feature launches!
              </p>
              <div className="flex space-x-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D58]"
                />
                <Button
                  className="bg-[#0F9D58] hover:bg-[#0d8a4f] text-white px-4 py-2 rounded-lg text-sm"
                >
                  Notify Me
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Back to Home
              </Button>
              <Button
                onClick={() => navigate('/services')}
                className="flex-1 bg-[#0F9D58] hover:bg-[#0d8a4f] text-white"
              >
                Explore Services
              </Button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock size={16} />
              <span>Expected launch: Q2 2024</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ComingSoonPage;