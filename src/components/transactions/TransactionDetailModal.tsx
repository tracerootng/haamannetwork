import React from 'react';
import { Download, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDateTime, getStatusColor } from '../../lib/utils';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

type Transaction = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  details: any;
  created_at: string;
};

type TransactionDetailModalProps = {
  transaction: Transaction | null;
  onClose: () => void;
  onDownload: (transaction: Transaction) => void;
};

const getTransactionLabel = (type: string, details: any) => {
  switch (type) {
    case 'airtime':
      return `${details.network} Airtime - ${details.phone}`;
    case 'data':
      return `${details.network} ${details.plan} - ${details.phone}`;
    case 'electricity':
      return `${details.disco} - ${details.meterNumber}`;
    case 'waec':
      return 'WAEC Card';
    case 'wallet_funding':
      // Check if this is a bank transfer with originator info
      if (details.flutterwave_data?.meta_data?.originatorname) {
        return `Wallet Funding from ${details.flutterwave_data.meta_data.originatorname} (${details.payment_method || 'bank_transfer'})`;
      }
      return `Wallet Funding (${details.method || details.payment_method || 'wallet'})`;
    case 'product_purchase':
      return `Product Purchase - ${details.product_name || 'Product'}`;
    case 'referral_reward':
      return `Referral Reward - ${details.reward_type || 'Bonus'}`;
    default:
      return 'Transaction';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="text-green-500" size={20} />;
    case 'pending':
      return <Clock className="text-yellow-500" size={20} />;
    case 'failed':
      return <XCircle className="text-red-500" size={20} />;
    default:
      return <Clock className="text-gray-500" size={20} />;
  }
};

const isDebit = (type: string) => {
  return ['airtime', 'data', 'electricity', 'waec', 'product_purchase'].includes(type);
};

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onDownload,
}) => {
  if (!transaction) return null;

  // Format details for display
  const formatDetails = (details: any) => {
    if (!details) return 'No details available';
    
    // Handle specific transaction types
    if (transaction.type === 'airtime') {
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Network:</span>
            <span className="font-medium capitalize">{details.network}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Phone Number:</span>
            <span className="font-medium">{details.phone}</span>
          </div>
          {details.service_provider && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Provider:</span>
              <span className="font-medium capitalize">{details.service_provider}</span>
            </div>
          )}
        </div>
      );
    }
    
    if (transaction.type === 'data') {
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Network:</span>
            <span className="font-medium capitalize">{details.network}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Phone Number:</span>
            <span className="font-medium">{details.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Plan:</span>
            <span className="font-medium">{details.plan}</span>
          </div>
          {details.service_provider && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Provider:</span>
              <span className="font-medium capitalize">{details.service_provider}</span>
            </div>
          )}
        </div>
      );
    }
    
    if (transaction.type === 'electricity') {
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Disco:</span>
            <span className="font-medium capitalize">{details.disco}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Meter Number:</span>
            <span className="font-medium">{details.meterNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Meter Type:</span>
            <span className="font-medium capitalize">{details.meterType}</span>
          </div>
        </div>
      );
    }
    
    if (transaction.type === 'wallet_funding') {
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Method:</span>
            <span className="font-medium capitalize">{details.method || details.payment_method || 'wallet'}</span>
          </div>
          {details.flutterwave_data?.meta_data?.originatorname && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">From:</span>
              <span className="font-medium">{details.flutterwave_data.meta_data.originatorname}</span>
            </div>
          )}
          {details.service_charge && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Service Charge:</span>
              <span className="font-medium text-red-500">{formatCurrency(details.service_charge.amount)}</span>
            </div>
          )}
          {details.note && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Note:</span>
              <span className="font-medium">{details.note}</span>
            </div>
          )}
        </div>
      );
    }
    
    if (transaction.type === 'product_purchase') {
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Product:</span>
            <span className="font-medium">{details.product_name || 'Product'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
            <span className="font-medium">{details.quantity || 1}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
            <span className="font-medium capitalize">{details.payment_method || 'wallet'}</span>
          </div>
          {details.order_id && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
              <span className="font-medium">{details.order_id}</span>
            </div>
          )}
        </div>
      );
    }
    
    if (transaction.type === 'referral_reward') {
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Reward Type:</span>
            <span className="font-medium capitalize">{details.reward_type || 'Bonus'}</span>
          </div>
          {details.data_size && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Data Size:</span>
              <span className="font-medium">{details.data_size}</span>
            </div>
          )}
          {details.network && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Network:</span>
              <span className="font-medium capitalize">{details.network}</span>
            </div>
          )}
          {details.note && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Note:</span>
              <span className="font-medium">{details.note}</span>
            </div>
          )}
        </div>
      );
    }
    
    // For other transaction types or complex details, show a formatted JSON
    try {
      // Filter out sensitive information
      const filteredDetails = { ...details };
      if (filteredDetails.api_response) {
        filteredDetails.api_response = '(API response data)';
      }
      
      return (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 overflow-auto max-h-40">
          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(filteredDetails, null, 2)}
          </pre>
        </div>
      );
    } catch (e) {
      return 'Unable to display details';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDebit(transaction.type) ? 'bg-error-500 bg-opacity-10' : 'bg-success-500 bg-opacity-10'
          }`}>
            {getStatusIcon(transaction.status)}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction Details</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDateTime(transaction.created_at)}
            </p>
          </div>
        </div>
        
        {/* Transaction Info */}
        <div className="space-y-6">
          {/* Status and Amount */}
          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <Badge variant={getStatusColor(transaction.status) as any} className="mt-1">
                {transaction.status.toUpperCase()}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
              <p className={`text-xl font-bold ${
                isDebit(transaction.type) ? 'text-error-500' : 'text-success-500'
              }`}>
                {isDebit(transaction.type) ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
          
          {/* Transaction Type */}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Transaction Type</p>
            <p className="text-base font-semibold text-gray-900 dark:text-white capitalize">
              {transaction.type.replace('_', ' ')}
            </p>
          </div>
          
          {/* Description */}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {getTransactionLabel(transaction.type, transaction.details)}
            </p>
          </div>
          
          {/* Reference */}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Reference</p>
            <p className="text-base font-mono text-gray-900 dark:text-white">
              {transaction.reference}
            </p>
          </div>
          
          {/* Transaction ID */}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Transaction ID</p>
            <p className="text-base font-mono text-gray-900 dark:text-white">
              {transaction.id}
            </p>
          </div>
          
          {/* Details */}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Details</p>
            {formatDetails(transaction.details)}
          </div>
        </div>
        
        {/* Download Button */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="primary"
            onClick={() => onDownload(transaction)}
            icon={<Download size={16} />}
            fullWidth
          >
            Download Receipt
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;