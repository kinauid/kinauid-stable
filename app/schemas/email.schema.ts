import { z } from 'zod';

export type EmailFolder = 'inbox' | 'spam' | 'sent';

export interface EmailItem {
  id: number | string;
  folder: string;
  subject: string;
  from: string;
  date: string;
  seen: boolean;
  uid: number | string;
  body?: string;
  sender: string;
  senderEmail: string;
  preview: string;
  time: string;
  initials: string;
  color: string;
  rawDate: string;
}

export interface SentEmailRecord {
  id: string;
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
}

export interface MailboxData {
  inbox: EmailItem[];
  spam: EmailItem[];
  sent: EmailItem[];
  unreadCount: number;
  selectedAccount: string;
  isCEO: boolean;
  accounts: { value: string; label: string }[];
  error?: string | null;
}

export interface EmailState {
  folder?: EmailFolder;
  account?: string;
  search?: string;
}

export const SendEmailSchema = z.object({
  intent: z.literal('send-email').or(z.literal('send_email')),
  to: z.string().min(3, 'Email tujuan tidak valid'),
  subject: z.string().min(1, 'Subjek email wajib diisi'),
  body: z.string().min(1, 'Isi pesan email wajib diisi'),
  fromName: z.string().optional().default(''),
  account: z.string().optional().default('official@kinau.id'),
});

export const ReadEmailSchema = z.object({
  intent: z.literal('read-email').or(z.literal('read_email')),
  read_uid: z.string().min(1, 'UID email wajib diisi'),
  folder: z.string().default('INBOX'),
  account: z.string().optional().default('official@kinau.id'),
});

export const BroadcastCampaignSchema = z.object({
  intent: z.literal('broadcast-campaign').or(z.literal('broadcast_campaign')),
  subject: z.string().min(1, 'Subjek broadcast wajib diisi'),
  body: z.string().min(1, 'Template pesan wajib diisi'),
  targetAudience: z.enum(['all_customers', 'resellers', 'students_kkn', 'vip']).default('all_customers'),
  fromName: z.string().optional().default('Kinau Studio Broadcast'),
});
