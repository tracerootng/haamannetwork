import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, LogIn } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (items.length === 0) {
      return;
    }

    // For now, navigate to the first product's detail page for checkout
    // In a real app, you'd have a dedicated checkout flow
    navigate(`/store/product/${items[0].product.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 py-4 flex items-center border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate('/store')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">Shopping Cart</h1>
      </div>

      <div className="p-4">
        {items.length > 0 ? (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.product.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.product.price)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-[#0F9D58]">
                        {formatCurrency(item.product.price * item.quantity)}
                      </p>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-red-500 hover:text-red-700 mt-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Authentication Notice */}
            {!isAuthenticated && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center">
                  <LogIn className="text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0" size={20} />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Please <a href="/login" className="font-medium underline">login</a> to proceed with checkout
                  </p>
                </div>
              </div>
            )}

            {/* Cart Summary */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-[#0F9D58] text-xl">
                    {formatCurrency(getTotalPrice())}
                  </span>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="flex-1"
                  >
                    Clear Cart
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCheckout}
                    className="flex-1"
                    disabled={!isAuthenticated || items.length === 0}
                  >
                    {isAuthenticated ? 'Checkout' : 'Login to Checkout'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start shopping to add items to your cart
            </p>
            <Button onClick={() => navigate('/store')}>
              Continue Shopping
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;