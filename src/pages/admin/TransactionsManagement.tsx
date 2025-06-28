import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, formatDate } from '../../lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type Transaction = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  details: any;
  created_at: string;
  user_name?: string;
  user_email?: string;
};

const TransactionsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchTransactions();
  }, [user, navigate]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles!transactions_user_id_fkey (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTransactions = data?.map(transaction => ({
        ...transaction,
        user_name: transaction.profiles?.name,
        user_email: transaction.profiles?.email,
      })) || [];

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (transactionId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this transaction as ${newStatus}?`)) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', transactionId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_logs').insert([{
        admin_id: user?.id,
        action: 'update_transaction_status',
        details: { transaction_id: transactionId, new_status: newStatus },
      }]);

      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'wallet_funding':
        return <TrendingUp className="text-green-500" size={20} />;
      case 'airtime':
      case 'data':
      case 'electricity':
      case 'waec':
      case 'product_purchase':
        return <TrendingDown className="text-red-500" size={20} />;
      default:
        return <DollarSign className="text-gray-500" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
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

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = getTransactionLabel(transaction.type, transaction.details)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalTransactions = transactions.length;
  const successfulTransactions = transactions.filter(t => t.status === 'success').length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
  const totalRevenue = transactions
    .filter(t => t.status === 'success')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const transactionTypes = ['all', ...Array.from(new Set(transactions.map(t => t.type)))];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
  ];

  // Export to PDF function
  const handleExportPdf = async () => {
    setExportLoading(true);
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.setTextColor(15, 157, 88); // Primary color #0F9D58
      doc.text('Haaman Network - Transaction Report', 105, 15, { align: 'center' });
      
      // Add filters info
      doc.setFontSize(10);
      doc.setTextColor(100);
      let filterText = `Status: ${statusFilter === 'all' ? 'All' : statusFilter}, Type: ${typeFilter === 'all' ? 'All' : typeFilter}`;
      if (searchQuery) filterText += `, Search: "${searchQuery}"`;
      doc.text(filterText, 105, 22, { align: 'center' });
      
      // Add date
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 27, { align: 'center' });
      
      // Add summary
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Summary:', 14, 35);
      
      doc.setFontSize(10);
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 42);
      doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 14, 48);
      doc.text(`Successful: ${successfulTransactions}`, 14, 54);
      doc.text(`Pending: ${pendingTransactions}`, 14, 60);
      doc.text(`Failed: ${transactions.length - successfulTransactions - pendingTransactions}`, 14, 66);
      
      // Add table
      const tableColumn = ["Date", "Reference", "Type", "Description", "Amount", "Status"];
      const tableRows = filteredTransactions.map(transaction => [
        formatDate(transaction.created_at),
        transaction.reference,
        transaction.type.replace('_', ' ').toUpperCase(),
        getTransactionLabel(transaction.type, transaction.details),
        formatCurrency(transaction.amount),
        transaction.status.toUpperCase()
      ]);
      
      // @ts-ignore - jspdf-autotable types are not included
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [15, 157, 88], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        columnStyles: {
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 30 }, // Reference
          2: { cellWidth: 25 }, // Type
          3: { cellWidth: 'auto' }, // Description
          4: { cellWidth: 25, halign: 'right' }, // Amount
          5: { cellWidth: 20, halign: 'center' } // Status
        },
      });
      
      // Save the PDF
      doc.save(`haaman-transactions-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Export to CSV function
  const handleExportCsv = () => {
    setExportLoading(true);
    try {
      // Create CSV content
      const headers = ['Date', 'Reference', 'Type', 'Description', 'User', 'Amount', 'Status'];
      
      const rows = filteredTransactions.map(transaction => [
        formatDate(transaction.created_at),
        transaction.reference,
        transaction.type.replace('_', ' '),
        getTransactionLabel(transaction.type, transaction.details),
        transaction.user_name || 'Unknown',
        transaction.amount.toString(),
        transaction.status
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `haaman-transactions-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Failed to generate CSV. Please try again.');
    } finally {
      setExportLoading(false);
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
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors mr-4"
              >
                <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{totalTransactions} total transactions</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleExportPdf}
                disabled={exportLoading || filteredTransactions.length === 0}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <FileText size={16} className="mr-2" />
                Export PDF
              </button>
              <button
                onClick={handleExportCsv}
                disabled={exportLoading || filteredTransactions.length === 0}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Download size={16} className="mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTransactions}</p>
              </div>
              <DollarSign className="text-blue-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Successful</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{successfulTransactions}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingTransactions}</p>
              </div>
              <Clock className="text-yellow-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
              </div>
              <TrendingUp className="text-purple-500" size={24} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F9D58]"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F9D58]"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F9D58]"
            >
              {transactionTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Filter size={16} className="mr-2" />
              {filteredTransactions.length} transactions found
            </div>
          </div>
        </div>

        {/* Transaction Type Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transactionTypes.filter(type => type !== 'all').map(type => {
              const typeTransactions = transactions.filter(t => t.type === type && t.status === 'success');
              const typeTotal = typeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
              const typeCount = typeTransactions.length;
              const typePercentage = totalRevenue > 0 ? (typeTotal / totalRevenue) * 100 : 0;
              
              return (
                <div key={type} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {typeCount} transactions
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {typePercentage.toFixed(1)}% of revenue
                    </span>
                    <span className="font-bold text-[#0F9D58]">
                      {formatCurrency(typeTotal)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-[#0F9D58] h-2 rounded-full" 
                      style={{ width: `${Math.min(100, typePercentage)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTransactionIcon(transaction.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.reference}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {transaction.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{transaction.user_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{transaction.user_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {transaction.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(transaction.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(transaction.status)}`}>
                        {transaction.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewTransaction(transaction)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Eye size={16} />
                      </button>
                      {transaction.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(transaction.id, 'success')}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(transaction.id, 'failed')}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction Details</h2>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference</label>
                  <p className="text-gray-900 dark:text-white font-mono">{selectedTransaction.reference}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedTransaction.status)}`}>
                    {selectedTransaction.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <p className="text-gray-900 dark:text-white">{selectedTransaction.type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                  <p className="text-2xl font-bold text-[#0F9D58]">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                  <p className="text-gray-900 dark:text-white">{selectedTransaction.user_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedTransaction.user_email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                  <p className="text-gray-900 dark:text-white">{formatDate(selectedTransaction.created_at)}</p>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <p className="text-gray-900 dark:text-white">
                  {getTransactionLabel(selectedTransaction.type, selectedTransaction.details)}
                </p>
              </div>
              
              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction ID</label>
                <p className="text-gray-900 dark:text-white font-mono">
                  {selectedTransaction.id}
                </p>
              </div>
              
              {/* Details */}
              {selectedTransaction.details && Object.keys(selectedTransaction.details).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details</label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {JSON.stringify(selectedTransaction.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              {selectedTransaction.status === 'pending' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedTransaction.id, 'success');
                      setShowTransactionModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Mark as Success
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedTransaction.id, 'failed');
                      setShowTransactionModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Mark as Failed
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsManagement;