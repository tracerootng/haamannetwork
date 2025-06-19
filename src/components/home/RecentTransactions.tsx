import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { formatCurrency, getStatusColor } from '../../lib/utils';

// Mock data for recent transactions
const mockTransactions = [
  {
    id: '1',
    type: 'airtime',
    amount: 1000,
    status: 'success',
    details: { network: 'MTN', phone: '08012345678' },
    createdAt: '2023-09-15T10:30:00Z',
  },
  {
    id: '2',
    type: 'data',
    amount: 2500,
    status: 'success',
    details: { network: 'Airtel', plan: '5GB', phone: '09087654321' },
    createdAt: '2023-09-14T16:45:00Z',
  },
  {
    id: '3',
    type: 'electricity',
    amount: 5000,
    status: 'pending',
    details: { disco: 'Ikeja Electric', meterNumber: '54321678901' },
    createdAt: '2023-09-14T09:15:00Z',
  },
  {
    id: '4',
    type: 'wallet_funding',
    amount: 10000,
    status: 'success',
    details: { method: 'card', reference: 'TRX-9876543' },
    createdAt: '2023-09-13T14:20:00Z',
  },
];

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
      return `Wallet Funding (${details.method})`;
    case 'product_purchase':
      return 'Product Purchase';
    default:
      return 'Transaction';
  }
};

const isDebit = (type: string) => {
  return ['airtime', 'data', 'electricity', 'waec', 'product_purchase'].includes(type);
};

const RecentTransactions: React.FC = () => {
  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        <a href="/transactions" className="text-primary-500 text-sm">View All</a>
      </div>
      
      <Card>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {mockTransactions.map((transaction) => (
            <li key={transaction.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isDebit(transaction.type) ? 'bg-error-500 bg-opacity-10' : 'bg-success-500 bg-opacity-10'
                }`}>
                  {isDebit(transaction.type) ? (
                    <ArrowUpRight className={isDebit(transaction.type) ? 'text-error-500' : 'text-success-500'} size={20} />
                  ) : (
                    <ArrowDownRight className="text-success-500" size={20} />
                  )}
                </div>
                
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium">
                    {getTransactionLabel(transaction.type, transaction.details)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    isDebit(transaction.type) ? 'text-error-500' : 'text-success-500'
                  }`}>
                    {isDebit(transaction.type) ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </p>
                  <Badge variant={getStatusColor(transaction.status) as any}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default RecentTransactions;