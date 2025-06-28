import { supabase } from './supabase';
import { SupportTicket, TicketMessage } from '../types';

export type TicketCategory = 'transaction' | 'order' | 'referral' | 'general' | 'technical';
export type TicketStatus = 'open' | 'pending_user_reply' | 'pending_admin_reply' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

class SupportAPI {
  /**
   * Create a new support ticket
   */
  async createTicket(
    userId: string,
    subject: string,
    category: TicketCategory,
    initialMessage: string
  ): Promise<SupportTicket | null> {
    try {
      // Create the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert([
          {
            user_id: userId,
            subject,
            category,
            status: 'open',
            priority: 'medium',
          },
        ])
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Add the initial message
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert([
          {
            ticket_id: ticket.id,
            sender_id: userId,
            message: initialMessage,
            is_admin_reply: false,
          },
        ]);

      if (messageError) throw messageError;

      return ticket;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      return null;
    }
  }

  /**
   * Get all tickets for a user
   */
  async getTickets(userId: string): Promise<SupportTicket[]> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  }

  /**
   * Get all tickets (admin only)
   */
  async getAllTickets(
    filters: {
      status?: TicketStatus;
      category?: TicketCategory;
      priority?: TicketPriority;
    } = {}
  ): Promise<SupportTicket[]> {
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!support_tickets_user_id_fkey (
            name,
            email,
            phone
          )
        `);

      // Apply filters if provided
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      // Order by priority (high to low) and then by last message time (most recent first)
      const { data, error } = await query
        .order('priority', { ascending: false, nullsFirst: false })
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all tickets:', error);
      return [];
    }
  }

  /**
   * Get messages for a specific ticket
   */
  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          profiles!ticket_messages_sender_id_fkey (
            name
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Format the data to include sender_name
      return (data || []).map(message => ({
        ...message,
        sender_name: message.profiles?.name || 'Unknown User'
      }));
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
      return [];
    }
  }

  /**
   * Add a message to a ticket
   */
  async addMessage(
    ticketId: string,
    senderId: string,
    message: string,
    isAdminReply: boolean
  ): Promise<TicketMessage | null> {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert([
          {
            ticket_id: ticketId,
            sender_id: senderId,
            message,
            is_admin_reply: isAdminReply,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding message to ticket:', error);
      return null;
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    ticketId: string,
    newStatus: TicketStatus
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      return false;
    }
  }

  /**
   * Update ticket priority
   */
  async updateTicketPriority(
    ticketId: string,
    newPriority: TicketPriority
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ priority: newPriority })
        .eq('id', ticketId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      return false;
    }
  }

  /**
   * Assign ticket to admin
   */
  async assignTicket(
    ticketId: string,
    adminId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: adminId })
        .eq('id', ticketId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error assigning ticket:', error);
      return false;
    }
  }

  /**
   * Close a ticket
   */
  async closeTicket(ticketId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error closing ticket:', error);
      return false;
    }
  }

  /**
   * Get a single ticket by ID
   */
  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!support_tickets_user_id_fkey (
            name,
            email,
            phone
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return null;
    }
  }
}

export const supportAPI = new SupportAPI();