import { OrderEditService } from './order-edit.service';
import type { OrderPrintData } from '~/schemas/order-download.schema';
import { ErrorCatch } from '~/lib/api';

export class OrderDownloadService {
  /**
   * Fetches order and company profile for official printable layout
   */
  static async getPrintData(id: string): Promise<OrderPrintData> {
    try {
      const order = await OrderEditService.getOrderDetail(id);

      return {
        ...order,
        company: {
          name: 'KINAU STUDIO MERCHANDISE & APPAREL',
          tagline: 'Custom ID Card, Lanyard, Sablon Kaos DTF & Selempang Wisuda',
          address: 'Jl. Mayjen Haryono No. 193, Dinoyo, Lowokwaru, Kota Malang 65144',
          phone: '+62 812-3456-7890 / +62 898-7654-3210',
          email: 'official@kinau.id',
          website: 'https://kinau.id',
          bank_accounts: [
            { bank: 'BCA', account_number: '816-123-4567', holder: 'KINAU STUDIO NUSANTARA' },
            { bank: 'Mandiri', account_number: '144-00-9876543-2', holder: 'KINAU STUDIO' },
            { bank: 'BRI', account_number: '0051-01-089765-50-8', holder: 'RAYHAN DAPUTRA' },
          ],
        },
      };
    } catch (error) {
      ErrorCatch({ error, context: 'OrderDownloadService.getPrintData' });
      const fallback = await OrderEditService.getOrderDetail(id);
      return {
        ...fallback,
        company: {
          name: 'KINAU STUDIO',
          tagline: 'Merchandise & Apparel Solution',
          address: 'Kota Malang, Jawa Timur',
          phone: '+62 812-3456-7890',
          email: 'official@kinau.id',
          website: 'https://kinau.id',
          bank_accounts: [],
        },
      };
    }
  }
}
