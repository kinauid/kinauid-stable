import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, Div, successResponse, errorResponse, type InferLoader, type MetaAccessConfig } from '~/builder';
import { withMiddleware, withTelemetry, rateLimitMiddleware } from '~/lib/middleware.server';
import { ErrorCatch } from '~/lib/api';
import { OverviewService } from '~/services/overview.service';
import { handleFinanceAction } from '~/services/finance.service';
import {
  DashboardHeaderWidget, TotalOrderAmountCardWidget, PaidRevenueCardWidget,
  ProductionCapacityCardWidget, ProductionVolumeChartWidget, HighestOrderCardWidget,
  NextPrintQueueWidget, CustomerRankingsWidget, FloatingSupportButton,
} from '~/components/feature/DashboardWidgets';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'manager', 'staff', 'finance'], permissions: ['finance:read'] };
export const meta = createMeta({ title: 'Performa Perusahaan — Kinau ID Workshop', description: 'Monitoring alur produksi dan antrean cetak jersey/apparel.' });

export const loader = withMiddleware([withTelemetry('loader:dashboard'), rateLimitMiddleware({ limit: 120, windowMs: 60_000 })], async () => {
  try {
    return successResponse(await OverviewService.getOverviewSummary());
  } catch (error) {
    ErrorCatch({ error, context: 'loader:dashboard' });
    return errorResponse(error);
  }
});
(loader as any).metaAccess = metaAccess;
export const action = (args: ActionFunctionArgs) => handleFinanceAction(args);

export default createPage<InferLoader<typeof loader>>(({ data }) =>
  Div(
    { className: 'space-y-6 max-w-7xl mx-auto select-none' },
    DashboardHeaderWidget(),
    Div(
      { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
      TotalOrderAmountCardWidget({ amount: data?.totalOrderAmountFormatted, changePercent: data?.totalOrderGrowth, lastPeriod: data?.lastPeriodAmount }),
      PaidRevenueCardWidget({ paidAmount: data?.totalPaidFormatted, changePercent: data?.paidGrowth, piutang: data?.totalPiutangFormatted, lunas: data?.totalLunasFormatted, dp: data?.totalDpFormatted, remaining: data?.totalPiutangFormatted }),
      ProductionCapacityCardWidget({ completedQty: data?.completedPcsFormatted, changePercent: data?.completedGrowth, batchCount: `${data?.completedBatchCount} Batch Pesanan`, goalPercent: data?.capacityGoalPercent })
    ),
    Div(
      { className: 'grid grid-cols-1 lg:grid-cols-12 gap-6' },
      Div({ className: 'lg:col-span-8' }, ProductionVolumeChartWidget({ monthlyData: data?.monthlyData, categorySummaries: data?.categorySummaries })),
      Div({ className: 'lg:col-span-4 space-y-6' }, HighestOrderCardWidget({ highestOrder: data?.highestOrder }), NextPrintQueueWidget({ nextQueues: data?.nextQueues }))
    ),
    CustomerRankingsWidget({ institutionRanks: data?.institutionRanks }),
    FloatingSupportButton()
  )
);
