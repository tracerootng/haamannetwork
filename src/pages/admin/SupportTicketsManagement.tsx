import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  MessageCircle, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Send, 
  Phone, 
  Mail, 
  Calendar, 
  Tag, 
  Flag, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  UserCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { supportAPI, TicketCategory, TicketPriority, TicketStatus } from '../../lib/supportApi';
import { SupportTicket, TicketMessage } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';
import { format } from 'date-fns';

const SupportTicketsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [assigningTicket, setAssigningTicket] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchTickets();
  }, [user, navigate]);

  const fetchTickets = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const filters: {
        status?: TicketStatus;
        category?: TicketCategory;
        priority?: TicketPriority;
      } = {};

      if (statusFilter !== 'all') filters.status = statusFilter;
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;

      const allTickets = await supportAPI.getAllTickets(filters);
      setTickets(allTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      const messages = await supportAPI.getTicketMessages(ticketId);
      setTicketMessages(messages);
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
    }
  };

  const handleRefresh = () => {
    fetchTickets(true);
    if (selectedTicket) {
      fetchTicketMessages(selectedTicket.id);
    }
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    await fetchTicketMessages(ticket.id);
    setShowTicketDetails(true);
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim() || !user) return;

    setSendingMessage(true);
    try {
      await supportAPI.addMessage(
        selectedTicket.id,
        user.id,
        newMessage,
        true // isAdminReply
      );

      // Update ticket status to pending user reply
      await supportAPI.updateTicketStatus(selectedTicket.id, 'pending_user_reply');

      // Refresh messages and ticket data
      fetchTicketMessages(selectedTicket.id);
      fetchTickets();
      
      // Clear input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;

    setUpdatingStatus(true);
    try {
      await supportAPI.updateTicketStatus(selectedTicket.id, newStatus);
      
      // If closing the ticket, add a system message
      if (newStatus === 'closed' && user) {
        await supportAPI.addMessage(
          selectedTicket.id,
          user.id,
          'This ticket has been closed by an administrator. If you need further assistance, please create a new ticket.',
          true
        );
      }
      
      // Refresh data
      fetchTickets();
      if (selectedTicket) {
        const updatedTicket = await supportAPI.getTicket(selectedTicket.id);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
        fetchTicketMessages(selectedTicket.id);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePriority = async (newPriority: TicketPriority) => {
    if (!selectedTicket) return;

    setUpdatingPriority(true);
    try {
      await supportAPI.updateTicketPriority(selectedTicket.id, newPriority);
      
      // Refresh data
      fetchTickets();
      if (selectedTicket) {
        const updatedTicket = await supportAPI.getTicket(selectedTicket.id);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error) {
      console.error('Error updating ticket priority:', error);
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedTicket || !user) return;

    setAssigningTicket(true);
    try {
      await supportAPI.assignTicket(selectedTicket.id, user.id);
      
      // Refresh data
      fetchTickets();
      if (selectedTicket) {
        const updatedTicket = await supportAPI.getTicket(selectedTicket.id);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
    } finally {
      setAssigningTicket(false);
    }
  };

  const getStatusBadgeColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'pending_user_reply':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'pending_admin_reply':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityBadgeColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getCategoryBadgeColor = (category: TicketCategory) => {
    switch (category) {
      case 'transaction':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'order':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'referral':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'technical':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'general':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'pending_user_reply':
        return 'Awaiting User';
      case 'pending_admin_reply':
        return 'Awaiting Reply';
      case 'closed':
        return 'Closed';
      default:
        return status.replace('_', ' ');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    // Search in subject, user name, or user email
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.profiles?.name && ticket.profiles.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ticket.profiles?.email && ticket.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by status, category, and priority
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  // Sort tickets: critical first, then high, then by last_message_at
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    // First by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by status (pending_admin_reply first)
    if (a.status === 'pending_admin_reply' && b.status !== 'pending_admin_reply') return -1;
    if (a.status !== 'pending_admin_reply' && b.status === 'pending_admin_reply') return 1;
    
    // Then by last message time (most recent first)
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });

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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{tickets.length} total tickets</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F9D58]"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F9D58]"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="pending_admin_reply">Awaiting Reply</option>
              <option value="pending_user_reply">Awaiting User</option>
              <option value="closed">Closed</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | 'all')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F9D58]"
            >
              <option value="all">All Categories</option>
              <option value="transaction">Transaction</option>
              <option value="order">Order</option>
              <option value="referral">Referral</option>
              <option value="technical">Technical</option>
              <option value="general">General</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F9D58]"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets Column */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Tickets ({sortedTickets.length})
                </h3>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                {sortedTickets.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => handleViewTicket(ticket)}
                        className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedTicket?.id === ticket.id ? 'bg-gray-50 dark:bg-gray-700' : ''
                        }`}
                      >
                        <div className="flex items-start">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            ticket.priority === 'critical' || ticket.priority === 'high'
                              ? 'bg-red-100 dark:bg-red-900/30'
                              : 'bg-blue-100 dark:bg-blue-900/30'
                          }`}>
                            <MessageCircle className={`${
                              ticket.priority === 'critical' || ticket.priority === 'high'
                                ? 'text-red-500'
                                : 'text-blue-500'
                            }`} size={18} />
                          </div>
                          
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {ticket.subject}
                              </h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${getPriorityBadgeColor(ticket.priority as TicketPriority)}`}>
                                {ticket.priority.toUpperCase()}
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {ticket.profiles?.name || 'Unknown user'}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeColor(ticket.status as TicketStatus)}`}>
                                {getStatusLabel(ticket.status as TicketStatus)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {format(new Date(ticket.last_message_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tickets found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {tickets.length > 0 
                        ? "Try adjusting your search or filter criteria" 
                        : "No support tickets have been created yet"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Details Column */}
          <div className="lg:col-span-2">
            {selectedTicket && showTicketDetails ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col">
                {/* Ticket Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{selectedTicket.subject}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryBadgeColor(selectedTicket.category as TicketCategory)}`}>
                        {selectedTicket.category.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeColor(selectedTicket.status as TicketStatus)}`}>
                        {getStatusLabel(selectedTicket.status as TicketStatus)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadgeColor(selectedTicket.priority as TicketPriority)}`}>
                        {selectedTicket.priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {formatDate(selectedTicket.created_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTicketDetails(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {/* User Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <User className="text-blue-500" size={20} />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedTicket.profiles?.name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedTicket.profiles?.email || 'No email'}
                        </p>
                      </div>
                    </div>
                    
                    {selectedTicket.profiles?.phone && (
                      <a 
                        href={`tel:${selectedTicket.profiles.phone}`}
                        className="flex items-center text-blue-500 hover:text-blue-700"
                      >
                        <Phone size={16} className="mr-1" />
                        <span className="text-sm">{selectedTicket.profiles.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
                
                {/* Ticket Actions */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                  {/* Status Update */}
                  <div className="relative group">
                    <button
                      className="px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-sm font-medium flex items-center"
                      disabled={updatingStatus}
                    >
                      <Clock size={14} className="mr-1" />
                      {updatingStatus ? 'Updating...' : 'Update Status'}
                      <ChevronDown size={14} className="ml-1" />
                    </button>
                    
                    <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10 hidden group-hover:block">
                      <button
                        onClick={() => handleUpdateStatus('open')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        disabled={selectedTicket.status === 'open'}
                      >
                        <Clock size={14} className="mr-2 text-blue-500" />
                        Open
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('pending_user_reply')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        disabled={selectedTicket.status === 'pending_user_reply'}
                      >
                        <Clock size={14} className="mr-2 text-yellow-500" />
                        Awaiting User
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('closed')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        disabled={selectedTicket.status === 'closed'}
                      >
                        <CheckCircle size={14} className="mr-2 text-green-500" />
                        Close Ticket
                      </button>
                    </div>
                  </div>
                  
                  {/* Priority Update */}
                  <div className="relative group">
                    <button
                      className="px-3 py-1.5 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded-lg text-sm font-medium flex items-center"
                      disabled={updatingPriority}
                    >
                      <Flag size={14} className="mr-1" />
                      {updatingPriority ? 'Updating...' : 'Set Priority'}
                      <ChevronDown size={14} className="ml-1" />
                    </button>
                    
                    <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10 hidden group-hover:block">
                      <button
                        onClick={() => handleUpdatePriority('low')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        disabled={selectedTicket.priority === 'low'}
                      >
                        <Flag size={14} className="mr-2 text-green-500" />
                        Low
                      </button>
                      <button
                        onClick={() => handleUpdatePriority('medium')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        disabled={selectedTicket.priority === 'medium'}
                      >
                        <Flag size={14} className="mr-2 text-blue-500" />
                        Medium
                      </button>
                      <button
                        onClick={() => handleUpdatePriority('high')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        disabled={selectedTicket.priority === 'high'}
                      >
                        <Flag size={14} className="mr-2 text-orange-500" />
                        High
                      </button>
                      <button
                        onClick={() => handleUpdatePriority('critical')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        disabled={selectedTicket.priority === 'critical'}
                      >
                        <Flag size={14} className="mr-2 text-red-500" />
                        Critical
                      </button>
                    </div>
                  </div>
                  
                  {/* Assign to Me */}
                  <button
                    onClick={handleAssignTicket}
                    disabled={assigningTicket || selectedTicket.assigned_to === user?.id}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center ${
                      selectedTicket.assigned_to === user?.id
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    }`}
                  >
                    <UserCheck size={14} className="mr-1" />
                    {assigningTicket 
                      ? 'Assigning...' 
                      : selectedTicket.assigned_to === user?.id 
                      ? 'Assigned to You' 
                      : 'Assign to Me'}
                  </button>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {ticketMessages.length > 0 ? (
                    ticketMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.is_admin_reply ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          message.is_admin_reply 
                            ? 'bg-[#0F9D58] text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {message.is_admin_reply ? 'Admin' : message.sender_name}
                            </span>
                            <span className="text-xs opacity-75">
                              {format(new Date(message.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No messages yet</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Start the conversation by sending a message.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Reply Box */}
                {selectedTicket.status !== 'closed' && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your reply here..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F9D58] min-h-[80px]"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="px-4 py-2 bg-[#0F9D58] text-white rounded-lg hover:bg-[#0d8a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {sendingMessage ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={16} className="mr-2" />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Select a Ticket</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    Select a ticket from the list to view details and respond to customer inquiries.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketsManagement;