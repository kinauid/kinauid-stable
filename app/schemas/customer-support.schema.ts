import { z } from 'zod';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'order' | 'payment' | 'shipping' | 'design';
}

export interface SupportTicketItem {
  id: string;
  ticket_number: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
}

export interface CustomerSupportData {
  faqs: FaqItem[];
  recentTickets: SupportTicketItem[];
  csContacts: {
    name: string;
    role: string;
    whatsapp: string;
    available_hours: string;
  }[];
}

export interface CustomerSupportState {
  category?: string;
  search?: string;
}

export const CreateSupportTicketSchema = z.object({
  intent: z.literal('create-ticket').or(z.literal('create_ticket')),
  subject: z.string().min(3, 'Subjek bantuan wajib diisi'),
  category: z.enum(['order', 'payment', 'shipping', 'design', 'other']).default('order'),
  order_number: z.string().optional().default(''),
  message: z.string().min(5, 'Isi pesan kendala wajib diisi'),
});
