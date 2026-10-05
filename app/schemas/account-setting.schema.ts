import { z } from 'zod';

export interface BankAccountItem {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_active: boolean;
}

export interface WorkspaceSettingData {
  company_name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  wa_gateway_key?: string;
  wa_sender_number?: string;
  auto_notify_dp: boolean;
  auto_notify_delivery: boolean;
  bank_accounts: BankAccountItem[];
}

export interface AccountSettingState {
  tab?: 'general' | 'banking' | 'whatsapp';
}

export const UpdateWorkspaceGeneralSchema = z.object({
  intent: z.literal('update-general').or(z.literal('update_general')),
  company_name: z.string().min(2, 'Nama workshop/perusahaan wajib diisi'),
  tagline: z.string().optional().default(''),
  address: z.string().min(5, 'Alamat workshop wajib diisi'),
  phone: z.string().min(8, 'Nomor telepon/WA wajib diisi'),
  email: z.string().email('Email tidak valid'),
  website: z.string().optional().default(''),
});

export const SaveBankAccountSchema = z.object({
  intent: z.literal('save-bank').or(z.literal('save_bank')),
  id: z.string().optional().nullable(),
  bank_name: z.string().min(2, 'Nama bank wajib diisi'),
  account_number: z.string().min(4, 'Nomor rekening wajib diisi'),
  account_holder: z.string().min(2, 'Nama pemilik rekening wajib diisi'),
  is_active: z.coerce.boolean().default(true),
});

export const DeleteBankAccountSchema = z.object({
  intent: z.literal('delete-bank').or(z.literal('delete_bank')),
  id: z.string().min(1),
});

export const UpdateWhatsAppGatewaySchema = z.object({
  intent: z.literal('update-wa-gateway').or(z.literal('update_wa_gateway')),
  wa_gateway_key: z.string().optional().default(''),
  wa_sender_number: z.string().optional().default(''),
  auto_notify_dp: z.coerce.boolean().default(true),
  auto_notify_delivery: z.coerce.boolean().default(true),
});
