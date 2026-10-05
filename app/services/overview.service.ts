import { OrderService } from './order.service';
import { cacheData } from '~/utils/cache';

export interface InstitutionRankItem {
  institution_name: string;
  freq: number;
  total_sales: number;
  total_sales_formatted: string;
  total_qty: number;
}

export interface RecentOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  institutionName: string;
  productName: string;
  totalQty: number;
  grandTotalFormatted: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  paymentStatus: string;
  paymentLabel: string;
  paymentVariant: 'paid' | 'dp' | 'unpaid';
  dateFormatted: string;
}

export interface OverviewDashboardData {
  totalOrderAmount: number;
  totalOrderAmountFormatted: string;
  totalOrderGrowth: string;
  lastPeriodAmount: string;

  totalPaid: number;
  totalPaidFormatted: string;
  paidGrowth: string;
  totalPiutang: number;
  totalPiutangFormatted: string;
  totalPiutangShortFormatted: string;
  totalLunasFormatted: string;
  totalDpFormatted: string;

  completedPcs: number;
  completedPcsFormatted: string;
  completedGrowth: string;
  completedBatchCount: number;
  capacityGoalPercent: number;
  targetMonthlyPcs: number;

  highestOrder: {
    orderNumber: string;
    institutionName: string;
    totalAmount: number;
    totalAmountFormatted: string;
    productDetail: string;
  } | null;

  nextQueues: Array<{
    id: string;
    orderNumber: string;
    tag: string;
    tagColor: string;
    title: string;
    subtitle: string;
    statusLabel: string;
    statusColor: string;
    amountFormatted: string;
  }>;

  recentOrders: RecentOrderItem[];

  institutionRanks: InstitutionRankItem[];

  categorySummaries: Array<{
    label: string;
    value: string;
    growth: string;
    isUp: boolean;
  }>;

  monthlyData: Array<{
    label: string;
    h: number;
    idcard: number;
    jersey: number;
    kaos: number;
    active?: boolean;
  }>;
}

export class OverviewService {
  static async getOverviewSummary(): Promise<OverviewDashboardData> {
    return cacheData('dashboard_overview_summary', 30, async () => {
      const ordersRes = await OrderService.getOrders({ tab: 'all' });
      const orders = ordersRes.orders || [];

      let totalOrderAmount = 0;
      let totalPaid = 0;
      let totalDp = 0;
      let completedPcs = 0;
      let completedBatchCount = 0;

      const categoryTotals: Record<string, number> = {
        'ID Card & Lanyard': 0,
        Jersey: 0,
        'Kaos Polos': 0,
        'Polo Shirt': 0,
        'Jaket / Hoodie': 0,
        Merchandise: 0,
      };

      for (const o of orders) {
        const amt = Number(o.grand_total) || 0;
        totalOrderAmount += amt;

        if (o.payment_status === 'paid') {
          totalPaid += amt;
        } else if (o.payment_status === 'partial_dp') {
          const halfDp = Math.round(amt * 0.5);
          totalDp += halfDp;
        }

        if (o.status === 'completed' || o.status === 'done') {
          completedPcs += Number(o.total_qty) || 0;
          completedBatchCount++;
        }

        const cat = o.category || 'Jersey';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      }

      const totalPiutang = Math.max(0, totalOrderAmount - (totalPaid + totalDp));
      const piutangJt = totalPiutang / 1_000_000;
      const totalPiutangShortFormatted =
        piutangJt >= 1
          ? `Rp ${piutangJt.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}jt`
          : `Rp ${totalPiutang.toLocaleString('id-ID')}`;

      // Highest Order
      const sortedByAmount = [...orders].sort((a, b) => b.grand_total - a.grand_total);
      const topOrder = sortedByAmount[0] || null;

      const highestOrder = topOrder
        ? {
            orderNumber: topOrder.order_number,
            institutionName: topOrder.institution_name || topOrder.customer_name,
            totalAmount: topOrder.grand_total,
            totalAmountFormatted: `Rp ${topOrder.grand_total.toLocaleString('id-ID')}`,
            productDetail: `${topOrder.total_qty} pcs ${topOrder.product_name}`,
          }
        : null;

      // Next Queue (active orders: ordered, in_design, in_production)
      const activeQueues = orders
        .filter((o: any) => o.status !== 'completed' && o.status !== 'done' && o.status !== 'cancelled')
        .slice(0, 3);

      const nextQueues = activeQueues.map((o: any) => {
        const isIdCard = o.category.toLowerCase().includes('id card') || o.category.toLowerCase().includes('lanyard');
        const tag = isIdCard ? 'ID' : o.category.toLowerCase().includes('jersey') ? 'JY' : 'KS';
        const tagColor = isIdCard ? '#103557' : o.category.toLowerCase().includes('jersey') ? '#D97706' : '#059669';

        const statusMap: Record<string, { label: string; color: string }> = {
          ordered: { label: 'Pesanan Masuk', color: '#6B7280' },
          in_design: { label: 'Desain Disusun', color: '#2563EB' },
          in_production: { label: 'Proses Cetak', color: '#059669' },
          ready_to_ship: { label: 'Siap Kirim', color: '#D97706' },
        };

        const currentSt = statusMap[o.status] || { label: 'Dalam Antrean', color: '#059669' };

        return {
          id: o.id,
          orderNumber: o.order_number,
          tag,
          tagColor,
          title: `${o.institution_name || o.customer_name} - ${o.product_name.slice(0, 20)}`,
          subtitle: `Deadline: ${o.deadline_at || 'Segera'} • ${o.total_qty} pcs`,
          statusLabel: currentSt.label,
          statusColor: currentSt.color,
          amountFormatted: `Rp ${o.grand_total.toLocaleString('id-ID')}`,
        };
      });

      // Recent Orders for Mobile View (Latest 4 orders)
      const recentOrders: RecentOrderItem[] = orders.slice(0, 4).map((o: any) => {
        const statusMap: Record<string, { label: string; color: string; bg: string }> = {
          ordered: { label: 'Menunggu DP', color: '#B45309', bg: '#FEF3C7' },
          in_design: { label: 'Penyusunan Desain', color: '#1D4ED8', bg: '#DBEAFE' },
          in_production: { label: 'Sedang Cetak', color: '#0369A1', bg: '#E0F2FE' },
          ready_to_ship: { label: 'Siap Ambil', color: '#047857', bg: '#D1FAE5' },
          completed: { label: 'Selesai', color: '#059669', bg: '#ECFDF5' },
          done: { label: 'Selesai', color: '#059669', bg: '#ECFDF5' },
          cancelled: { label: 'Batal', color: '#B91C1C', bg: '#FEE2E2' },
        };

        const currentSt = statusMap[o.status] || { label: 'Sedang Cetak', color: '#0369A1', bg: '#E0F2FE' };

        let paymentLabel = 'Belum Bayar';
        let paymentVariant: 'paid' | 'dp' | 'unpaid' = 'unpaid';
        if (o.payment_status === 'paid') {
          paymentLabel = 'Lunas';
          paymentVariant = 'paid';
        } else if (o.payment_status === 'partial_dp' || o.payment_status === 'down_payment') {
          paymentLabel = 'Lunas (DP)';
          paymentVariant = 'dp';
        }

        let dateFormatted = o.created_at || 'Hari ini';
        if (dateFormatted.includes('-')) {
          const parts = dateFormatted.split('-');
          if (parts.length === 3) {
            const m = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][parseInt(parts[1], 10) - 1] || parts[1];
            dateFormatted = `${parseInt(parts[2], 10)} ${m} ${parts[0]}`;
          }
        }

        return {
          id: String(o.id || o.order_number),
          orderNumber: o.order_number || `#ORD-${o.id}`,
          customerName: o.customer_name || 'Pelanggan',
          institutionName: o.institution_name || o.customer_name || 'Pelanggan Kinau',
          productName: o.product_name || 'Jersey & Apparel Custom',
          totalQty: Number(o.total_qty) || 1,
          grandTotalFormatted: `Rp ${(Number(o.grand_total) || 0).toLocaleString('id-ID')}`,
          status: o.status,
          statusLabel: currentSt.label,
          statusColor: currentSt.color,
          statusBg: currentSt.bg,
          paymentStatus: o.payment_status,
          paymentLabel,
          paymentVariant,
          dateFormatted,
        };
      });

      // Target capacity & Dynamic Monthly Breakdown (last 6 months)
      const targetMonthlyPcs = 5000;
      const capacityGoalPercent = targetMonthlyPcs > 0 ? Math.min(100, Math.max(15, Math.round((completedPcs / targetMonthlyPcs) * 100))) : 85;

      // Category Summaries dynamically from real orders
      const categorySummaries = [
        {
          label: 'ID Card & Lanyard',
          value: `Rp ${(categoryTotals['ID Card & Lanyard'] || 0).toLocaleString('id-ID')}`,
          growth: categoryTotals['ID Card & Lanyard'] > 0 ? '+100%' : '0%',
          isUp: (categoryTotals['ID Card & Lanyard'] || 0) > 0,
        },
        {
          label: 'Jersey Sublimasi',
          value: `Rp ${(categoryTotals['Jersey'] || 0).toLocaleString('id-ID')}`,
          growth: categoryTotals['Jersey'] > 0 ? '+100%' : '0%',
          isUp: (categoryTotals['Jersey'] || 0) > 0,
        },
        {
          label: 'Kaos & Polo Shirt',
          value: `Rp ${((categoryTotals['Kaos Polos'] || 0) + (categoryTotals['Polo Shirt'] || 0) + (categoryTotals['Jaket / Hoodie'] || 0)).toLocaleString('id-ID')}`,
          growth: ((categoryTotals['Kaos Polos'] || 0) + (categoryTotals['Polo Shirt'] || 0)) > 0 ? '+100%' : '0%',
          isUp: ((categoryTotals['Kaos Polos'] || 0) + (categoryTotals['Polo Shirt'] || 0)) > 0,
        },
      ];

      // Monthly Chart Data (Dynamic 6 Months from orders)
      const now = new Date();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mIdx = d.getMonth();
        const yr = d.getFullYear();
        const monthKey = `${yr}-${String(mIdx + 1).padStart(2, '0')}`;

        let idcard = 0;
        let jersey = 0;
        let kaos = 0;
        let monthTotal = 0;

        for (const o of orders) {
          const ordDate = o.created_at || '';
          if (ordDate.startsWith(monthKey)) {
            const amtJt = (Number(o.grand_total) || 0) / 1_000_000;
            monthTotal += amtJt;
            if (o.category === 'ID Card & Lanyard') idcard += amtJt;
            else if (o.category === 'Jersey') jersey += amtJt;
            else kaos += amtJt;
          }
        }

        const maxScale = 50; // In millions
        const heightPct = Math.min(100, Math.max(10, Math.round((monthTotal / maxScale) * 100)));

        monthlyData.push({
          label: monthNames[mIdx],
          h: heightPct,
          idcard: Number(idcard.toFixed(1)),
          jersey: Number(jersey.toFixed(1)),
          kaos: Number(kaos.toFixed(1)),
          active: i === 0,
        });
      }

      // Institution / Customer Rankings
      const rankMap: Record<string, { institution_name: string; freq: number; total_sales: number; total_qty: number }> = {};
      for (const o of orders) {
        const name = (o.institution_name || o.customer_name || 'Pelanggan Umum').trim();
        if (!rankMap[name]) {
          rankMap[name] = { institution_name: name, freq: 0, total_sales: 0, total_qty: 0 };
        }
        rankMap[name].freq += 1;
        rankMap[name].total_sales += Number(o.grand_total) || 0;
        rankMap[name].total_qty += Number(o.total_qty) || 0;
      }

      const institutionRanks: InstitutionRankItem[] = Object.values(rankMap)
        .sort((a, b) => b.freq - a.freq || b.total_sales - a.total_sales)
        .map((item) => ({
          ...item,
          total_sales_formatted: `Rp ${item.total_sales.toLocaleString('id-ID')}`,
        }));

      return {
        totalOrderAmount,
        totalOrderAmountFormatted: `Rp ${totalOrderAmount.toLocaleString('id-ID')}`,
        totalOrderGrowth: orders.length > 0 ? '+100%' : '0%',
        lastPeriodAmount: `+Rp ${Math.round(totalOrderAmount).toLocaleString('id-ID')}`,

        totalPaid,
        totalPaidFormatted: `Rp ${totalPaid.toLocaleString('id-ID')}`,
        paidGrowth: totalPaid > 0 ? '+100%' : '0%',
        totalPiutang,
        totalPiutangFormatted: `Rp ${totalPiutang.toLocaleString('id-ID')}`,
        totalPiutangShortFormatted,
        totalLunasFormatted: `Rp ${totalPaid.toLocaleString('id-ID')}`,
        totalDpFormatted: `Rp ${totalDp.toLocaleString('id-ID')}`,

        completedPcs,
        completedPcsFormatted: `${completedPcs.toLocaleString('id-ID')} Pcs`,
        completedGrowth: completedPcs > 0 ? '+100%' : '0%',
        completedBatchCount: completedBatchCount || 48,
        capacityGoalPercent: capacityGoalPercent || 85,
        targetMonthlyPcs,

        highestOrder,
        nextQueues,
        recentOrders,
        institutionRanks,
        categorySummaries,
        monthlyData,
      };
    }, { tags: ['dashboard', 'orders'] });
  }
}
