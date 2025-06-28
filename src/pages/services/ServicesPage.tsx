import React, { useEffect } from 'react';
import { Phone, Wifi, Zap, BookOpen, ShoppingBag, Package, Tv, Gift, MessageCircle, Users } from 'lucide-react';
import ServiceCard from '../../components/home/ServiceCard';
import { useServiceConfigStore } from '../../store/serviceConfigStore';

const ServicesPage: React.FC = () => {
  const { config: serviceConfig, fetchConfig } = useServiceConfigStore();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const getServiceStatus = (serviceId: string) => {
    return serviceConfig[serviceId] || 'active';
  };

  const digitalServices = [
    {
      title: 'Airtime Recharge',
      description: 'Buy airtime for any network instantly',
      icon: <Phone size={24} />,
      path: '/services/airtime',
      color: 'bg-blue-500',
      id: 'airtime'
    },
    {
      title: 'Data Bundles',
      description: 'Purchase data plans for any network',
      icon: <Wifi size={24} />,
      path: '/services/data',
      color: 'bg-green-500',
      id: 'data'
    },
    {
      title: 'Electricity Bills',
      description: 'Pay electricity bills for any DISCO',
      icon: <Zap size={24} />,
      path: '/services/electricity',
      color: 'bg-amber-500',
      id: 'electricity'
    },
    {
      title: 'TV Subscriptions',
      description: 'Pay for DSTV, GOTV, and Startimes',
      icon: <Tv size={24} />,
      path: '/services/tv',
      color: 'bg-purple-500',
      id: 'tv'
    },
    {
      title: 'WAEC Scratch Cards',
      description: 'Purchase WAEC scratch cards instantly',
      icon: <BookOpen size={24} />,
      path: '/services/waec',
      color: 'bg-purple-500',
      id: 'waec'
    },
    {
      title: 'Redeem Voucher',
      description: 'Redeem vouchers and gift cards',
      icon: <Gift size={24} />,
      path: '/voucher',
      color: 'bg-pink-500',
      id: 'voucher'
    },
    {
      title: 'Support',
      description: 'Get help with any issues',
      icon: <MessageCircle size={24} />,
      path: '/support',
      color: 'bg-red-500',
      id: 'support'
    },
    {
      title: 'Refer & Earn',
      description: 'Invite friends and earn rewards',
      icon: <Users size={24} />,
      path: '/refer',
      color: 'bg-indigo-500',
      id: 'refer'
    }
  ];

  const ecommerceServices = [
    {
      title: 'Online Store',
      description: 'Shop from our wide range of electronics and gadgets',
      icon: <ShoppingBag size={24} />,
      path: '/store',
      color: 'bg-[#0F9D58]',
      id: 'store'
    },
    {
      title: 'Product Delivery',
      description: 'Fast and reliable delivery to your doorstep',
      icon: <Package size={24} />,
      path: '/store',
      color: 'bg-orange-500',
      id: 'store'
    },
  ];

  // Filter services based on their status
  const filteredDigitalServices = digitalServices.filter(service => {
    const status = getServiceStatus(service.id);
    return status !== 'disabled';
  }).map(service => {
    const status = getServiceStatus(service.id);
    return {
      ...service,
      path: status === 'coming_soon' ? '/coming-soon' : service.path,
      state: status === 'coming_soon' ? { 
        serviceName: service.title, 
        serviceDescription: service.description 
      } : undefined
    };
  });

  const filteredEcommerceServices = ecommerceServices.filter(service => {
    const status = getServiceStatus(service.id);
    return status !== 'disabled';
  }).map(service => {
    const status = getServiceStatus(service.id);
    return {
      ...service,
      path: status === 'coming_soon' ? '/coming-soon' : service.path,
      state: status === 'coming_soon' ? { 
        serviceName: service.title, 
        serviceDescription: service.description 
      } : undefined
    };
  });

  return (
    <div className="py-6 animate-fade-in">
      <h1 className="text-2xl font-semibold mb-6">Our Services</h1>
      
      {/* Digital Services Section */}
      {filteredDigitalServices.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-[#0F9D58]">Digital Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDigitalServices.map((service) => (
              <ServiceCard
                key={service.title}
                title={service.title}
                description={service.description}
                icon={service.icon}
                path={service.path}
                color={service.color}
                className="h-full"
                state={service.state}
              />
            ))}
          </div>
        </div>
      )}

      {/* E-commerce Services Section */}
      {filteredEcommerceServices.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-[#0F9D58]">E-commerce Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredEcommerceServices.map((service) => (
              <ServiceCard
                key={service.title}
                title={service.title}
                description={service.description}
                icon={service.icon}
                path={service.path}
                color={service.color}
                className="h-full"
                state={service.state}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-4">
          <ol className="space-y-4">
            <li className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#0F9D58] flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="ml-4">
                <h3 className="font-medium">Select a Service</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose from our range of digital services or browse our e-commerce store
                </p>
              </div>
            </li>
            
            <li className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#0F9D58] flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="ml-4">
                <h3 className="font-medium">Fill in Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter the required information for your selected service or add items to cart
                </p>
              </div>
            </li>
            
            <li className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#0F9D58] flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="ml-4">
                <h3 className="font-medium">Make Payment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pay using your wallet or other payment methods
                </p>
              </div>
            </li>
            
            <li className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#0F9D58] flex items-center justify-center text-white font-bold">
                4
              </div>
              <div className="ml-4">
                <h3 className="font-medium">Get Value Instantly</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your service is processed immediately or your products are delivered to you
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      {/* Service Categories Info */}
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3 text-[#0F9D58]">Digital Services</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Pay all your bills instantly with our comprehensive digital services platform. 
            From airtime and data to electricity bills and educational payments, we've got you covered.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3 text-[#0F9D58]">E-commerce Store</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Shop from our curated collection of electronics, gadgets, and accessories. 
            Enjoy fast delivery, secure payments, and quality products at competitive prices.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;