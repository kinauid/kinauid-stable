import { z } from 'zod';
import type { OrderDetailData } from './order-edit.schema';

export type PrintDocumentType = 'nota' | 'surat_jalan' | 'spk_produksi';

export interface OrderPrintData extends OrderDetailData {
  company: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    bank_accounts: { bank: string; account_number: string; holder: string }[];
  };
}

export interface OrderDownloadState {
  docType?: PrintDocumentType;
}
