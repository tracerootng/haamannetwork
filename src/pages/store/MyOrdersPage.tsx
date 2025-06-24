import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';

type Order = {
  id: string;
  products: Array<{
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
  }>;
  total_amount: number;
  payment_method: string;
  status: string;
  shipping_address: {
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string;
  };
  estimated_delivery_date: string;
  tracking_number: string;
  created_at: string;
  updated_at: string;
};

type TrackingEvent = {
  id: string;
  order_id: string;
  status: string;
  title: string;
  description: string;
  event_date: string;
  created_by: string;
  created_at: string;
};

const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async (showRefreshIndicator = false) => {
    if (!user) return;

    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTrackingEvents = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_tracking_events')
        .select('*')
        .eq('order_id', orderId)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setTrackingEvents(data || []);
    } catch (error) {
      console.error('Error fetching tracking events:', error);
    }
  };

  const handleRefresh = () => {
    fetchOrders(true);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    fetchTrackingEvents(order.id);
    setShowOrderModal(true);
  };

  const handleTrackOrder = (order: Order) => {
    setSelectedOrder(order);
    fetchTrackingEvents(order.id);
    setShowTrackingModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      case 'processing':
        return <Package className="text-blue-500" size={20} />;
      case 'shipped':
        return <Truck className="text-purple-500" size={20} />;
      case 'delivered':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'cancelled':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order is being reviewed';
      case 'processing':
        return 'Order is being prepared';
      case 'shipped':
        return 'Order is on the way';
      case 'delivered':
        return 'Order has been delivered';
      case 'cancelled':
        return 'Order has been cancelled';
      default:
        return 'Order status unknown';
    }
  };

  const getDeliveryStatus = (status: string, estimatedDate: string) => {
    const now = new Date();
    const estimated = new Date(estimatedDate);
    const diffHours = Math.ceil((estimated.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (status === 'delivered') {
      return 'Delivered';
    } else if (status === 'cancelled') {
      return 'Cancelled';
    } else if (diffHours <= 0) {
      return 'Expected today';
    } else if (diffHours <= 24) {
      return `Expected in ${diffHours} hours`;
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      return `Expected in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

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
      <div className="bg-white dark:bg-gray-800 px-4 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/store')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">My Orders</h1>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title="Refresh orders"
        >
          <RefreshCw 
            size={20} 
            className={`text-gray-700 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>

      <div className="p-4">
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Order #{order.tracking_number}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(order.created_at)}
                      </p>
                      {order.updated_at !== order.created_at && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Updated: {formatDate(order.updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(order.status) as any}>
                    {order.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Status Message */}
                <div className={`mb-4 p-3 rounded-lg ${
                  order.status === 'cancelled' 
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : order.status === 'delivered'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                }`}>
                  <p className={`text-sm font-medium ${
                    order.status === 'cancelled' 
                      ? 'text-red-800 dark:text-red-200'
                      : order.status === 'delivered'
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-blue-800 dark:text-blue-200'
                  }`}>
                    {getStatusMessage(order.status)}
                  </p>
                  {order.status === 'cancelled' && (
                    <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                      If you have any questions about this cancellation, please contact our support team.
                    </p>
                  )}
                </div>

                {/* Products */}
                <div className="space-y-3 mb-4">
                  {order.products.map((product, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Qty: {product.quantity} × {formatCurrency(product.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                    <p className="font-bold text-[#0F9D58]">{formatCurrency(order.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.payment_method === 'wallet' ? 'Wallet' : 'Pay on Delivery'}
                    </p>
                  </div>
                </div>

                {/* Delivery Status - Only show if not cancelled */}
                {order.status !== 'cancelled' && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Truck className="text-[#0F9D58]" size={16} />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getDeliveryStatus(order.status, order.estimated_delivery_date)}
                        </span>
                      </div>
                      {order.status !== 'delivered' && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Est. {formatDate(order.estimated_delivery_date)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewOrder(order)}
                    icon={<Eye size={16} />}
                  >
                    View Details
                  </Button>
                  {order.status === 'shipped' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTrackOrder(order)}
                      icon={<MapPin size={16} />}
                    >
                      Track Order
                    </Button>
                  )}
                  {order.status === 'cancelled' && order.payment_method === 'wallet' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/store')}
                      className="text-[#0F9D58] border-[#0F9D58] hover:bg-[#0F9D58] hover:text-white"
                    >
                      Shop Again
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start shopping to see your orders here
            </p>
            <Button onClick={() => navigate('/store')}>
              Browse Products
            </Button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Status Alert */}
              <div className={`p-4 rounded-lg ${
                selectedOrder.status === 'cancelled' 
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : selectedOrder.status === 'delivered'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-center">
                  {getStatusIcon(selectedOrder.status)}
                  <div className="ml-3">
                    <h3 className={`font-semibold ${
                      selectedOrder.status === 'cancelled' 
                        ? 'text-red-800 dark:text-red-200'
                        : selectedOrder.status === 'delivered'
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-blue-800 dark:text-blue-200'
                    }`}>
                      {getStatusMessage(selectedOrder.status)}
                    </h3>
                    {selectedOrder.status === 'cancelled' && (
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        This order has been cancelled. If you paid via wallet, the refund will be processed within 24 hours.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order Number</label>
                    <p className="text-gray-900 dark:text-white font-mono">{selectedOrder.tracking_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <Badge variant={getStatusColor(selectedOrder.status) as any}>
                      {selectedOrder.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order Date</label>
                    <p className="text-gray-900 dark:text-white">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedOrder.payment_method === 'wallet' ? 'Wallet' : 'Pay on Delivery'}
                    </p>
                  </div>
                  {selectedOrder.updated_at !== selectedOrder.created_at && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
                      <p className="text-gray-900 dark:text-white">{formatDate(selectedOrder.updated_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Timeline - Only show if not cancelled */}
              {selectedOrder.status !== 'cancelled' && trackingEvents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery Timeline</h3>
                  <div className="space-y-4">
                    {trackingEvents.map((event, index) => (
                      <div key={event.id} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {getStatusIcon(event.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(event.event_date)}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Products</h3>
                <div className="space-y-4">
                  {selectedOrder.products.map((product, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Quantity: {product.quantity}
                        </p>
                        <p className="text-sm font-medium text-[#0F9D58]">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(product.price * product.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
                    <span className="text-xl font-bold text-[#0F9D58]">
                      {formatCurrency(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address - Only show if not cancelled */}
              {selectedOrder.status !== 'cancelled' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shipping Address</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="text-[#0F9D58] mt-1" size={20} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.shipping_address.name}</p>
                        <p className="text-gray-600 dark:text-gray-400">{selectedOrder.shipping_address.address}</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">{selectedOrder.shipping_address.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Tracking Modal */}
      {showTrackingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Track Order</h2>
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Order Number</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.tracking_number}</p>
                </div>
                <Badge variant={getStatusColor(selectedOrder.status) as any}>
                  {selectedOrder.status.toUpperCase()}
                </Badge>
              </div>
              
              {trackingEvents.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                  
                  {/* Timeline events */}
                  <div className="space-y-8">
                    {trackingEvents.map((event, index) => (
                      <div key={event.id} className="relative pl-10">
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 z-10">
                          {getStatusIcon(event.status)}
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(event.event_date)}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tracking events yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Tracking information will appear here once your order is processed.
                  </p>
                </div>
              )}
              
              <div className="mt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Estimated Delivery Date:
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(selectedOrder.estimated_delivery_date)}
                </p>
              </div>
              
              <Button
                variant="primary"
                onClick={() => setShowTrackingModal(false)}
                className="w-full mt-6"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;