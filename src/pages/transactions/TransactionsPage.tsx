import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Download, Search, Filter } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { jsPDF } from 'jspdf';

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

const transactionTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'wallet_funding', label: 'Wallet Funding' },
  { value: 'airtime', label: 'Airtime' },
  { value: 'data', label: 'Data' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'waec', label: 'WAEC' },
  { value: 'product_purchase', label: 'Product Purchase' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
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
      return `Product Purchase - ${details.product_name || 'Product'}`;
    default:
      return 'Transaction';
  }
};

const isDebit = (type: string) => {
  return ['airtime', 'data', 'electricity', 'waec', 'product_purchase'].includes(type);
};

const downloadReceipt = (transaction: any) => {
  const doc = new jsPDF();
  
  // Add logo (using text as placeholder)
  doc.setFontSize(24);
  doc.setTextColor(15, 157, 88); // Primary color #0F9D58
  doc.text('HAAMAN NETWORK', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('Digital Services & E-commerce Platform', 105, 30, { align: 'center' });
  
  // Add line separator
  doc.setDrawColor(200);
  doc.line(20, 35, 190, 35);
  
  // Transaction details
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('TRANSACTION RECEIPT', 105, 45, { align: 'center' });
  
  doc.setFontSize(10);
  const startY = 60;
  const lineHeight = 7;
  
  // Details grid
  const details = [
    ['Date:', formatDate(transaction.created_at)],
    ['Reference:', transaction.reference || transaction.id],
    ['Type:', transaction.type.toUpperCase()],
    ['Description:', getTransactionLabel(transaction.type, transaction.details)],
    ['Amount:', formatCurrency(transaction.amount)],
    ['Status:', transaction.status.toUpperCase()],
  ];
  
  details.forEach(([label, value], index) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 40, startY + (lineHeight * index));
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, startY + (lineHeight * index));
  });
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Thank you for choosing Haaman Network!', 105, 120, { align: 'center' });
  
  // Save the PDF
  doc.save(`receipt-${transaction.reference || transaction.id}.pdf`);
};

const TransactionsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTransactions();
    }
  }, [isAuthenticated, user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = getTransactionLabel(transaction.type, transaction.details)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (!isAuthenticated) {
    return (
      <div className="py-6 animate-fade-in max-w-md mx-auto px-4">
        <Card className="text-center p-6 sm:p-8">
          <h2 className="text-xl font-semibold mb-4">Login Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Please login to view your transactions.
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/login'}>
            Login
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-6 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F9D58]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 animate-fade-in max-w-4xl mx-auto px-4 pb-20">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Transaction History</h1>
      
      <Card className="mb-4 sm:mb-6 p-4">
        <div className="space-y-4">
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
            className="w-full"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              options={transactionTypes}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              leftIcon={<Filter size={16} />}
            />
            
            <Select
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        {filteredTransactions.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start sm:items-center">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isDebit(transaction.type) ? 'bg-error-500 bg-opacity-10' : 'bg-success-500 bg-opacity-10'
                  }`}>
                    {isDebit(transaction.type) ? (
                      <ArrowUpRight className={isDebit(transaction.type) ? 'text-error-500' : 'text-success-500'} size={20} />
                    ) : (
                      <ArrowDownRight className="text-success-500" size={20} />
                    )}
                  </div>
                  
                  <div className="ml-4 flex-1 min-w-0">
                    <p className="text-sm font-medium break-words">
                      {getTransactionLabel(transaction.type, transaction.details)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                  
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className={`text-sm font-medium ${
                      isDebit(transaction.type) ? 'text-error-500' : 'text-success-500'
                    }`}>
                      {isDebit(transaction.type) ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={getStatusColor(transaction.status) as any} className="text-xs">
                        {transaction.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => downloadReceipt(transaction)}
                      >
                        <Download size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">
              {transactions.length === 0 
                ? "You haven't made any transactions yet."
                : "No transactions found matching your filters."
              }
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TransactionsPage;