import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, TrendingUp, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const navigationItems = [
  {
    name: 'Home',
    path: '/',
    icon: Home,
  },
  {
    name: 'Shop',
    path: '/store',
    icon: ShoppingBag,
  },
  {
    name: 'Refer & Earn',
    path: '/refer',
    icon: TrendingUp,
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: User,
  },
];

const BottomNavigation: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  // Only show bottom navigation when user is authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around z-50 px-2 sm:px-6 safe-area-pb">
      {navigationItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              'bottom-nav-item flex flex-col items-center justify-center text-center pt-2 pb-1 w-full min-h-[3rem]',
              isActive ? 'bottom-nav-item-active' : 'bottom-nav-item-inactive'
            )
          }
          end
        >
          {({ isActive }) => {
            const IconComponent = item.icon;
            return (
              <>
                <IconComponent
                  size={20}
                  className={cn(
                    'mb-1',
                    isActive ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'
                  )}
                />
                <span className={cn(
                  'text-xs leading-tight',
                  isActive ? 'text-green-500 font-medium' : 'text-gray-500 dark:text-gray-400'
                )}>
                  {item.name}
                </span>
              </>
            );
          }}
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNavigation;