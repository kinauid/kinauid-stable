import { OrderService } from './order.service';
import { cacheData } from '~/utils/cache';

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

        if (o.status === 'completed') {
          completedPcs += Number(o.total_qty) || 0;
          completedBatchCount++;
        }

        const cat = o.category || 'Jersey';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      }

      const totalPiutang = Math.max(0, totalOrderAmount - (totalPaid + totalDp));

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
        .filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled')
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

      // Target capacity & Dynamic Monthly Breakdown (last 6 months)
      const targetMonthlyPcs = 1000;
      const capacityGoalPercent = targetMonthlyPcs > 0 ? Math.min(100, Math.round((completedPcs / targetMonthlyPcs) * 100)) : 0;

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
        totalLunasFormatted: `Rp ${totalPaid.toLocaleString('id-ID')}`,
        totalDpFormatted: `Rp ${totalDp.toLocaleString('id-ID')}`,

        completedPcs,
        completedPcsFormatted: `${completedPcs.toLocaleString('id-ID')} Pcs`,
        completedGrowth: completedPcs > 0 ? '+100%' : '0%',
        completedBatchCount,
        capacityGoalPercent,
        targetMonthlyPcs,

        highestOrder,
        nextQueues,
        categorySummaries,
        monthlyData,
      };
    }, { tags: ['dashboard', 'orders'] });
  }
}
