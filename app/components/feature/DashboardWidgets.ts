import React, { createElement } from 'react';
import { Div, Row, Col, Span, P, H2, H3, Button, Icon, Badge, Card, ui } from '~/builder';
import { ADMIN_WA, getWhatsAppLink } from '~/constants/brand';
import type { OverviewDashboardData } from '~/services/overview.service';

// ============================================================================
// 1. Dashboard Top Header Bar Widget
// ============================================================================

export interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  dateRange?: string;
  onExport?: () => void;
}

export function DashboardHeaderWidget({
  title = 'Performa Perusahaan',
  subtitle = 'Monitoring real-time omzet, antrean cetak, dan alur produksi workshop Kinau ID.',
  dateRange = '01 Juni - 30 Juni 2026',
  onExport,
}: DashboardHeaderProps = {}) {
  return ui('div')
    .class('flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none')
    .childrenOf(
      Col(
        { className: 'gap-0.5' },
        H2({ className: 'text-2xl font-black text-[#111827] tracking-tight' }, title),
        P({ className: 'text-xs text-[#6B7280] font-normal' }, subtitle)
      ),
      Row(
        { className: 'items-center gap-3 flex-wrap' },
        // Date Range Dropdown Button
        ui('button')
          .attr('type', 'button')
          .class(
            'flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-[#F9FAFB] text-[#111827] text-xs font-semibold rounded-xl border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all cursor-pointer'
          )
          .childrenOf(
            Icon('Calendar', { size: 14, className: 'text-[#6B7280]' }),
            Span({}, dateRange),
            Icon('ChevronDown', { size: 14, className: 'text-[#9CA3AF] ml-1' })
          )
          .build(),
        // Export Action Button
        ui('button')
          .attr('type', 'button')
          .on('click', () => onExport && onExport())
          .class(
            'flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F9FAFB] text-[#111827] text-xs font-semibold rounded-xl border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all cursor-pointer'
          )
          .childrenOf(
            Icon('Download', { size: 14, className: 'text-[#6B7280]' }),
            Span({}, 'Ekspor Laporan')
          )
          .build()
      )
    )
    .build();
}

// ============================================================================
// 2. Metric Card 1: Total Nilai Pesanan (with Sparkline Bars)
// ============================================================================

export interface TotalOrderAmountCardProps {
  amount?: string;
  changePercent?: string;
  subtext?: string;
  lastPeriod?: string;
}

export function TotalOrderAmountCardWidget({
  amount = 'Rp 148.500.000',
  changePercent = '8.4%',
  subtext = 'Omzet akumulatif pesanan reguler & KKN bulan ini',
  lastPeriod = '+Rp 42.000.000',
}: TotalOrderAmountCardProps = {}) {
  const bars = [35, 48, 62, 40, 55, 75, 45, 68, 85, 52, 70, 92, 60, 78, 88, 65, 82, 95, 72, 86, 90, 75, 85, 95, 68, 78];

  return Div(
    {
      className:
        'p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4 hover:border-[#D1D5DB] transition-all',
    },
    // Top Row: Title + Info + Options
    Row(
      { className: 'items-center justify-between' },
      Row(
        { className: 'items-center gap-1.5 text-xs font-bold text-[#111827]' },
        Span({}, 'Total Nilai Pesanan'),
        Icon('Info', { size: 13, className: 'text-[#9CA3AF]' })
      ),
      Icon('MoreHorizontal', { size: 16, className: 'text-[#9CA3AF] cursor-pointer hover:text-[#111827]' })
    ),
    // Middle Value + Badge
    Col(
      { className: 'gap-1' },
      Row(
        { className: 'items-center gap-2.5 flex-wrap' },
        H3({ className: 'text-2xl sm:text-3xl font-black text-[#111827] tracking-tight' }, amount),
        Span(
          {
            className:
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
          },
          `↑ ${changePercent}`
        )
      ),
      P({ className: 'text-xs text-[#6B7280]' }, subtext)
    ),
    // Sub-banner Pill
    Div(
      {
        className:
          'flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs text-[#111827] font-medium',
      },
      Icon('TrendingUp', { size: 13, className: 'text-[#103557]' }),
      Span({}, `Peningkatan dari periode lalu `),
      Span({ className: 'text-[#059669] font-bold' }, lastPeriod)
    ),
    // Sparkline Bars (Dual Gradient Navy to Mint)
    Div(
      { className: 'h-14 flex items-end gap-1 pt-2 overflow-hidden' },
      ...bars.map((h, idx) =>
        ui('div')
          .attr('key', `bar-${idx}`)
          .class('flex-1 rounded-t-xs transition-all duration-300')
          .style({
            height: `${h}%`,
            background: 'linear-gradient(180deg, #103557 0%, #10B981 100%)',
            opacity: 0.4 + (idx / bars.length) * 0.6,
          })
          .build()
      )
    )
  );
}

// ============================================================================
// 3. Metric Card 2: Terbayar (DP + Lunas) (with Breakdown)
// ============================================================================

export interface PaidRevenueCardProps {
  paidAmount?: string;
  changePercent?: string;
  piutang?: string;
  lunas?: string;
  dp?: string;
  remaining?: string;
}

export function PaidRevenueCardWidget({
  paidAmount = 'Rp 112.350.000',
  changePercent = '12.1%',
  piutang = 'Rp 36.150.000',
  lunas = 'Rp 82.500.000',
  dp = 'Rp 29.850.000',
  remaining = 'Rp 36.150.000',
}: PaidRevenueCardProps = {}) {
  return Div(
    {
      className:
        'p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4 hover:border-[#D1D5DB] transition-all',
    },
    // Top Row: Title + Info + Options
    Row(
      { className: 'items-center justify-between' },
      Row(
        { className: 'items-center gap-1.5 text-xs font-bold text-[#111827]' },
        Span({}, 'Terbayar (DP + Lunas)'),
        Icon('Info', { size: 13, className: 'text-[#9CA3AF]' })
      ),
      Icon('MoreHorizontal', { size: 16, className: 'text-[#9CA3AF] cursor-pointer hover:text-[#111827]' })
    ),
    // Middle Value + Badge
    Col(
      { className: 'gap-1' },
      Row(
        { className: 'items-center gap-2.5 flex-wrap' },
        H3({ className: 'text-2xl sm:text-3xl font-black text-[#059669] tracking-tight' }, paidAmount),
        Span(
          {
            className:
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
          },
          `↑ ${changePercent}`
        )
      )
    ),
    // Sub-banner Pill
    Div(
      {
        className:
          'flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs text-[#111827] font-medium',
      },
      Icon('Clock', { size: 13, className: 'text-[#D97706]' }),
      Span({}, `Sisa Piutang Berjalan: `),
      Span({ className: 'text-[#DC2626] font-bold' }, piutang)
    ),
    // Breakdown list & mini vertical bar column
    Row(
      { className: 'items-center justify-between pt-1' },
      Col(
        { className: 'gap-2 flex-1 text-xs' },
        Row(
          { className: 'items-center justify-between' },
          Row({ className: 'items-center gap-2' }, Div({ className: 'w-2 h-2 rounded-full bg-[#10B981]' }), Span({ className: 'text-[#6B7280]' }, 'Pelunasan Lunas')),
          Span({ className: 'font-bold text-[#111827] font-mono' }, lunas)
        ),
        Row(
          { className: 'items-center justify-between' },
          Row({ className: 'items-center gap-2' }, Div({ className: 'w-2 h-2 rounded-full bg-[#103557]' }), Span({ className: 'text-[#6B7280]' }, 'Down Payment (DP)')),
          Span({ className: 'font-bold text-[#111827] font-mono' }, dp)
        ),
        Row(
          { className: 'items-center justify-between' },
          Row({ className: 'items-center gap-2' }, Div({ className: 'w-2 h-2 rounded-full bg-[#F59E0B]' }), Span({ className: 'text-[#6B7280]' }, 'Sisa Tagihan')),
          Span({ className: 'font-bold text-[#111827] font-mono' }, remaining)
        )
      ),
      // Mini vertical bar column
      Div(
        { className: 'w-12 h-14 ml-4 flex items-end gap-1.5' },
        Div({ className: 'flex-1 h-full bg-[#10B981] rounded-t-xs opacity-80' }),
        Div({ className: 'flex-1 h-3/4 bg-[#103557] rounded-t-xs opacity-80' }),
        Div({ className: 'flex-1 h-1/2 bg-[#F59E0B] rounded-t-xs opacity-80' })
      )
    )
  );
}

// ============================================================================
// 4. Metric Card 3: Kapasitas Produksi & Antrean Selesai
// ============================================================================

export interface ProductionCapacityCardProps {
  completedQty?: string;
  changePercent?: string;
  subtext?: string;
  batchCount?: string;
  goalPercent?: number;
  targetLabel?: string;
}

export function ProductionCapacityCardWidget({
  completedQty = '3.420 Pcs',
  changePercent = '14.2%',
  subtext = 'Target produksi cetak & konveksi bulanan on-track',
  batchCount = '48 Batch Pesanan',
  goalPercent = 85,
  targetLabel = 'Target Workshop: 4.000 Pcs/Bulan',
}: ProductionCapacityCardProps = {}) {
  return Div(
    {
      className:
        'p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4 hover:border-[#D1D5DB] transition-all',
    },
    // Top Row: Title + Info + Options
    Row(
      { className: 'items-center justify-between' },
      Row(
        { className: 'items-center gap-1.5 text-xs font-bold text-[#111827]' },
        Span({}, 'Kapasitas & Pesanan Selesai'),
        Icon('Info', { size: 13, className: 'text-[#9CA3AF]' })
      ),
      Icon('MoreHorizontal', { size: 16, className: 'text-[#9CA3AF] cursor-pointer hover:text-[#111827]' })
    ),
    // Middle Value + Badge
    Col(
      { className: 'gap-1' },
      Row(
        { className: 'items-center gap-2.5 flex-wrap' },
        H3({ className: 'text-2xl sm:text-3xl font-black text-[#111827] tracking-tight' }, completedQty),
        Span(
          {
            className:
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
          },
          `↑ ${changePercent}`
        )
      ),
      P({ className: 'text-xs text-[#6B7280]' }, subtext)
    ),
    // Sub-banner Pill
    Div(
      {
        className:
          'flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs text-[#111827] font-medium',
      },
      Icon('CheckCircle2', { size: 13, className: 'text-[#10B981]' }),
      Span({}, `Pesanan Selesai: `),
      Span({ className: 'text-[#059669] font-bold' }, batchCount)
    ),
    // Progress Bar + Goal
    Col(
      { className: 'gap-2 pt-1' },
      Row(
        { className: 'justify-between text-xs font-semibold text-[#111827]' },
        Span({}, `${goalPercent}% → ${completedQty}`),
        Span({ className: 'text-[#6B7280]' }, '100%')
      ),
      Div(
        { className: 'w-full h-3.5 bg-[#E5E7EB] rounded-full overflow-hidden p-0.5' },
        Div({
          className: 'h-full rounded-full bg-gradient-to-r from-[#103557] to-[#10B981] transition-all',
          style: { width: `${goalPercent}%` },
        })
      ),
      Row(
        { className: 'justify-between items-center text-xs text-[#6B7280]' },
        Span({}, 'Juni 2026'),
        Row(
          { className: 'items-center gap-1 text-[#059669] font-semibold' },
          Icon('Zap', { size: 13, className: 'fill-[#10B981] text-[#10B981]' }),
          Span({}, targetLabel)
        )
      )
    )
  );
}

// ============================================================================
// 5. Money Flow / Production Volume Capsule Column Chart Widget
// ============================================================================

export interface ProductionVolumeChartProps {
  monthlyData?: Array<{
    label: string;
    h: number;
    idcard: number;
    jersey: number;
    kaos: number;
    active?: boolean;
  }>;
  categorySummaries?: Array<{
    label: string;
    value: string;
    growth: string;
    isUp: boolean;
  }>;
}

export function ProductionVolumeChartWidget({
  monthlyData = [
    { label: 'Jan', h: 65, idcard: 28, jersey: 22, kaos: 15 },
    { label: 'Feb', h: 40, idcard: 18, jersey: 14, kaos: 8 },
    { label: 'Mar', h: 75, idcard: 32, jersey: 26, kaos: 17 },
    { label: 'Apr', h: 48, idcard: 20, jersey: 18, kaos: 10 },
    { label: 'May', h: 70, idcard: 30, jersey: 24, kaos: 16 },
    { label: 'Jun', h: 95, idcard: 64.2, jersey: 52.8, kaos: 31.5, active: true },
  ],
  categorySummaries = [
    { label: 'ID Card & Lanyard', value: 'Rp 64.200.000', growth: '+14.2%', isUp: true },
    { label: 'Jersey Sublimasi', value: 'Rp 52.800.000', growth: '+8.5%', isUp: true },
    { label: 'Kaos & Kemeja Event', value: 'Rp 31.500.000', growth: '+4.1%', isUp: true },
  ],
}: ProductionVolumeChartProps = {}) {
  return Div(
    {
      className:
        'p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-6',
    },
    // Header Row
    Row(
      { className: 'items-center justify-between' },
      Row(
        { className: 'items-center gap-2' },
        H3({ className: 'text-sm font-bold text-[#111827]' }, 'Omzet & Volume Produksi 6 Bulan Terakhir'),
        Icon('Info', { size: 13, className: 'text-[#9CA3AF]' })
      ),
      Icon('MoreHorizontal', { size: 16, className: 'text-[#9CA3AF] cursor-pointer hover:text-[#111827]' })
    ),
    // Chart Area
    Div(
      { className: 'relative h-56 flex items-end justify-between gap-2 pt-8 pb-4' },
      // Y-Axis Labels
      Div(
        { className: 'absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] text-[#9CA3AF] pointer-events-none' },
        Span({}, 'Rp 150jt'),
        Span({}, 'Rp 100jt'),
        Span({}, 'Rp 75jt'),
        Span({}, 'Rp 50jt'),
        Span({}, 'Rp 0jt')
      ),
      // Columns
      Div(
        { className: 'flex-1 pl-14 h-full flex items-end justify-between gap-2.5 relative' },
        ...monthlyData.map((m) =>
          Div(
            { key: m.label, className: 'flex-1 flex flex-col items-center gap-2 group relative h-full justify-end' },
            // Floating Tooltip on Active Month (Juni 2026)
            m.active
              ? Div(
                  {
                    className:
                      'absolute -top-14 z-20 bg-white border border-[#E5E7EB] rounded-xl p-2.5 shadow-lg text-[11px] min-w-[150px] animate-in fade-in',
                  },
                  P({ className: 'font-bold text-[#111827] text-[10px] pb-1 border-b border-[#F3F4F6]' }, 'Puncak Periode KKN'),
                  Row({ className: 'justify-between py-0.5 text-[#6B7280]' }, Row({ className: 'items-center gap-1' }, Div({ className: 'w-1.5 h-1.5 rounded-full bg-[#103557]' }), Span({}, 'ID Card & Lanyard')), Span({ className: 'font-bold font-mono text-[#111827]' }, `Rp ${m.idcard}jt`)),
                  Row({ className: 'justify-between py-0.5 text-[#6B7280]' }, Row({ className: 'items-center gap-1' }, Div({ className: 'w-1.5 h-1.5 rounded-full bg-[#10B981]' }), Span({}, 'Jersey Sublim')), Span({ className: 'font-bold font-mono text-[#111827]' }, `Rp ${m.jersey}jt`)),
                  Row({ className: 'justify-between py-0.5 text-[#6B7280]' }, Row({ className: 'items-center gap-1' }, Div({ className: 'w-1.5 h-1.5 rounded-full bg-[#F59E0B]' }), Span({}, 'Kaos & Kemeja')), Span({ className: 'font-bold font-mono text-[#111827]' }, `Rp ${m.kaos}jt`))
                )
              : null,
            // Stacked Capsule Bar
            Div(
              {
                className: `w-full max-w-[28px] rounded-xl overflow-hidden flex flex-col justify-end transition-all ${
                  m.active ? 'ring-2 ring-[#103557]/40 shadow-xs' : 'opacity-85 hover:opacity-100'
                }`,
                style: { height: `${m.h}%` },
              },
              Div({ className: 'w-full h-1/3 bg-[#F59E0B]' }),
              Div({ className: 'w-full h-1/3 bg-[#10B981]' }),
              Div({ className: 'w-full h-1/3 bg-[#103557]' })
            ),
            // Month Label
            Span({ className: `text-[11px] font-semibold ${m.active ? 'text-[#103557] font-bold' : 'text-[#6B7280]'}` }, m.label)
          )
        )
      )
    ),
    // Chart Legends
    Row(
      { className: 'justify-center items-center gap-6 pt-2 text-xs text-[#6B7280]' },
      Row({ className: 'items-center gap-2' }, Div({ className: 'w-2.5 h-2.5 rounded-full bg-[#103557]' }), Span({}, 'ID Card & Lanyard')),
      Row({ className: 'items-center gap-2' }, Div({ className: 'w-2.5 h-2.5 rounded-full bg-[#10B981]' }), Span({}, 'Jersey Sublimasi')),
      Row({ className: 'items-center gap-2' }, Div({ className: 'w-2.5 h-2.5 rounded-full bg-[#F59E0B]' }), Span({}, 'Kaos & Kemeja'))
    ),
    // 3 Sub-Metric Category Cards
    Div(
      { className: 'grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2' },
      categorySummaries.map((sub) =>
        Div(
          {
            key: sub.label,
            className:
              'p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between shadow-2xs hover:border-[#D1D5DB] transition-all',
          },
          Col(
            { className: 'gap-0.5' },
            Row(
              { className: 'items-center justify-between' },
              Span({ className: 'text-xs text-[#6B7280] font-medium' }, sub.label),
              Icon('ArrowUpRight', { size: 12, className: 'text-[#9CA3AF]' })
            ),
            Span({ className: 'text-sm font-black text-[#111827] tracking-tight font-mono' }, sub.value),
            Span(
              { className: `text-[10px] font-bold ${sub.isUp ? 'text-[#059669]' : 'text-[#DC2626]'}` },
              `${sub.growth} dari bulan lalu`
            )
          ),
          // Mini Vertical Sparkline
          Div(
            { className: 'w-8 h-8 flex items-end gap-0.5' },
            Div({ className: 'flex-1 h-2/4 bg-[#103557]/50 rounded-xs' }),
            Div({ className: 'flex-1 h-3/4 bg-[#103557]/70 rounded-xs' }),
            Div({ className: 'flex-1 h-full bg-[#103557] rounded-xs' })
          )
        )
      )
    )
  );
}

// ============================================================================
// 6. Highest Order Card Widget (Right Column)
// ============================================================================

export interface HighestOrderCardProps {
  highestOrder?: OverviewDashboardData['highestOrder'];
}

export function HighestOrderCardWidget({ highestOrder }: HighestOrderCardProps = {}) {
  const orderNumber = highestOrder?.orderNumber || 'KNU-2026-089';
  const instName = highestOrder?.institutionName || 'Universitas Negeri Malang (Panitia KKN)';
  const amountFormatted = highestOrder?.totalAmountFormatted || 'Rp 34.800.000';
  const productDetail = highestOrder?.productDetail || '850 pcs Lanyard Glossy + Jersey Full Sublim';

  return Div(
    {
      className:
        'p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-5',
    },
    // Header
    Row(
      { className: 'items-center justify-between' },
      Row(
        { className: 'items-center gap-1.5 text-xs font-bold text-[#111827]' },
        Span({}, 'Pesanan Terbesar Bulan Ini'),
        Icon('Crown', { size: 14, className: 'text-[#D97706]' })
      ),
      Icon('MoreHorizontal', { size: 16, className: 'text-[#9CA3AF] cursor-pointer hover:text-[#111827]' })
    ),
    // Highlight Card
    Div(
      {
        className:
          'w-full rounded-2xl p-5 text-white shadow-md transition-all bg-gradient-to-br from-[#103557] via-[#164e78] to-[#002660] relative overflow-hidden',
      },
      // Decorative Background Icon
      Div(
        { className: 'absolute right-[-10px] bottom-[-10px] text-white/10 pointer-events-none' },
        Icon('Crown', { size: 110 })
      ),
      Col(
        { className: 'gap-3 relative z-10' },
        Row(
          { className: 'justify-between items-center' },
          Span(
            {
              className:
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF9C3] text-[#854D0E] border border-[#FEF08A]',
            },
            'Top Instansi'
          ),
          Span({ className: 'text-[11px] text-white/80 font-mono' }, orderNumber)
        ),
        Col(
          { className: 'gap-0.5 pt-1' },
          H3({ className: 'text-2xl font-black text-white tracking-tight font-mono' }, amountFormatted),
          P({ className: 'text-xs text-white/90 font-semibold truncate' }, instName),
          P({ className: 'text-[11px] text-white/70 truncate' }, productDetail)
        )
      )
    ),
    // 3 Quick Action Buttons
    Row(
      { className: 'grid grid-cols-3 gap-2 pt-1' },
      ui('a')
        .attr('href', '/app/order-list')
        .class(
          'flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white hover:bg-[#F9FAFB] text-[#111827] text-[11px] font-semibold border border-[#E5E7EB] shadow-2xs transition-all cursor-pointer no-underline'
        )
        .childrenOf(Icon('FileText', { size: 14, className: 'text-[#6B7280]' }), Span({}, 'Lihat Nota'))
        .build(),
      ui('a')
        .attr('href', '/app/order-list')
        .class(
          'flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white hover:bg-[#F9FAFB] text-[#111827] text-[11px] font-semibold border border-[#E5E7EB] shadow-2xs transition-all cursor-pointer no-underline'
        )
        .childrenOf(Icon('Layers', { size: 14, className: 'text-[#6B7280]' }), Span({}, 'Status Cetak'))
        .build(),
      ui('a')
        .attr('href', getWhatsAppLink(ADMIN_WA, `Halo CS Kinau, cek update pesanan ${instName}...`))
        .attr('target', '_blank')
        .class(
          'flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white hover:bg-[#F9FAFB] text-emerald-700 text-[11px] font-semibold border border-[#E5E7EB] shadow-2xs transition-all cursor-pointer no-underline'
        )
        .childrenOf(Icon('MessageCircle', { size: 14, className: 'text-emerald-600' }), Span({}, 'Chat PIC'))
        .build()
    )
  );
}

// ============================================================================
// 7. Next Print Queue Widget (Right Column)
// ============================================================================

export interface NextPrintQueueProps {
  nextQueues?: OverviewDashboardData['nextQueues'];
}

export function NextPrintQueueWidget({ nextQueues }: NextPrintQueueProps = {}) {
  const queues =
    nextQueues && nextQueues.length > 0
      ? nextQueues
      : [
          {
            id: 'q-1',
            orderNumber: 'KNU-2026-089',
            tag: 'ID',
            tagColor: '#103557',
            title: 'BEM UNISMA - Lanyard 2cm',
            subtitle: 'Target: 24 Juni 2026 • 450 pcs',
            statusLabel: 'Proses Cetak',
            statusColor: '#059669',
            amountFormatted: 'Rp 5.625.000',
          },
          {
            id: 'q-2',
            orderNumber: 'KNU-2026-090',
            tag: 'JY',
            tagColor: '#D97706',
            title: 'KKN PPM UGM - Jersey Sublim',
            subtitle: 'Target: 26 Juni 2026 • 35 pcs',
            statusLabel: 'Antrean Jahit',
            statusColor: '#D97706',
            amountFormatted: 'Rp 4.375.000',
          },
        ];

  return Div(
    {
      className:
        'p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-4',
    },
    Row(
      { className: 'items-center justify-between' },
      H3({ className: 'text-sm font-bold text-[#111827]' }, 'Antrean Cetak Berikutnya'),
      Icon('MoreHorizontal', { size: 16, className: 'text-[#9CA3AF] cursor-pointer hover:text-[#111827]' })
    ),
    ...queues.map((item) =>
      Row(
        {
          key: item.id || item.orderNumber,
          className:
            'p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] items-center justify-between shadow-2xs hover:border-[#D1D5DB] transition-all',
        },
        Row(
          { className: 'items-center gap-3' },
          Div(
            {
              className:
                'w-9 h-9 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#103557] shrink-0 font-black text-xs',
            },
            item.tag
          ),
          Col(
            { className: 'gap-0.5' },
            Span({ className: 'text-xs font-bold text-[#111827] truncate max-w-[140px]' }, item.title),
            Span({ className: 'text-[11px] text-[#6B7280] truncate max-w-[140px]' }, item.subtitle)
          )
        ),
        Col(
          { className: 'items-end gap-0.5' },
          Span(
            {
              className:
                'text-[10px] font-bold bg-[#ECFDF5] text-[#059669] px-1.5 py-0.5 rounded-md border border-[#A7F3D0]',
            },
            item.statusLabel
          ),
          Span({ className: 'text-xs font-black text-[#111827] font-mono' }, item.amountFormatted)
        )
      )
    )
  );
}

// ============================================================================
// 8. Floating WhatsApp Support CTA Button
// ============================================================================

export function FloatingSupportButton() {
  const waUrl = getWhatsAppLink(ADMIN_WA, 'Halo Admin Kinau ID, saya butuh bantuan terkait alur produksi...');

  return ui('a')
    .attr('href', waUrl)
    .attr('target', '_blank')
    .attr('aria-label', 'Konsultasi WhatsApp')
    .class(
      'fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-[#103557] hover:bg-[#164e78] text-white shadow-lg shadow-[#103557]/30 transition-all flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 no-underline'
    )
    .childrenOf(Icon('MessageCircle', { size: 20 }))
    .build();
}

// ─── Customer / Institution Rankings Widget (Exact Match with rayns-verse/client) ───
export function CustomerRankingsWidget({
  institutionRanks = [],
}: {
  institutionRanks?: Array<{
    institution_name: string;
    freq: number;
    total_sales: number;
    total_sales_formatted: string;
    total_qty: number;
  }>;
}) {
  const top5 = institutionRanks.slice(0, 5);
  const maxFreq = Math.max(1, ...top5.map((t) => t.freq));

  return Div(
    { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
    // Left: Top 5 Kategori / Instansi Bar Chart
    Div(
      { className: 'bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4' },
      Div(
        { className: 'flex items-center justify-between' },
        Div(
          null,
          H3({ className: 'text-base font-extrabold text-slate-900 tracking-tight' }, 'Top 5 Kategori / Instansi'),
          P({ className: 'text-xs text-slate-500' }, 'Frekuensi pemesanan produk per institusi')
        ),
        Icon('TrendingUp', { className: 'w-5 h-5 text-indigo-600' })
      ),
      Div(
        { className: 'space-y-3.5 pt-2' },
        ...top5.map((item, idx) => {
          const widthPct = Math.min(100, Math.max(8, Math.round((item.freq / maxFreq) * 100)));
          return Div(
            { key: idx, className: 'space-y-1' },
            Div(
              { className: 'flex justify-between items-center text-xs' },
              Span({ className: 'font-bold text-slate-800 truncate max-w-[240px]', title: item.institution_name }, `${idx + 1}. ${item.institution_name}`),
              Span({ className: 'font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-[11px]' }, `${item.freq} Order`)
            ),
            Div(
              { className: 'w-full h-3 bg-slate-100 rounded-full overflow-hidden' },
              Div({
                className: 'h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500',
                style: { width: `${widthPct}%` },
              })
            )
          );
        }),
        top5.length === 0
          ? Div({ className: 'text-center py-10 text-xs text-slate-400' }, 'Belum ada data pemesanan institusi')
          : null
      )
    ),

    // Right: Ranking Customer Table
    Div(
      { className: 'bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col' },
      Div(
        { className: 'p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center' },
        Div(
          null,
          H3({ className: 'text-base font-extrabold text-slate-900 flex items-center gap-2 tracking-tight' },
            Icon('BarChart2', { className: 'w-4 h-4 text-blue-600' }),
            Span({}, 'Ranking Customer / Institusi')
          ),
          P({ className: 'text-xs text-slate-500' }, 'Urutan volume pesanan dan total nilai omzet')
        )
      ),
      Div(
        { className: 'overflow-y-auto max-h-[300px]' },
        createElement(
          'table',
          { className: 'w-full text-xs text-left' },
          createElement(
            'thead',
            { className: 'text-[11px] font-bold text-slate-500 uppercase bg-slate-50/80 sticky top-0 border-b border-slate-100' },
            createElement(
              'tr',
              null,
              createElement('th', { className: 'px-5 py-3' }, 'Nama Instansi / Pemesan'),
              createElement('th', { className: 'px-4 py-3 text-center' }, 'Freq'),
              createElement('th', { className: 'px-5 py-3 text-right' }, 'Total Omzet')
            )
          ),
          createElement(
            'tbody',
            { className: 'divide-y divide-slate-100' },
            ...institutionRanks.map((item, idx) =>
              createElement(
                'tr',
                { key: idx, className: 'hover:bg-slate-50/60 transition-colors' },
                createElement(
                  'td',
                  { className: 'px-5 py-3 font-semibold text-slate-800 truncate max-w-[220px]', title: item.institution_name },
                  `${idx + 1}. ${item.institution_name}`
                ),
                createElement(
                  'td',
                  { className: 'px-4 py-3 text-center' },
                  createElement('span', { className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200' }, `${item.freq}x`)
                ),
                createElement(
                  'td',
                  { className: 'px-5 py-3 text-right font-mono font-bold text-slate-900' },
                  item.total_sales_formatted
                )
              )
            ),
            institutionRanks.length === 0
              ? createElement('tr', null, createElement('td', { colSpan: 3, className: 'text-center py-10 text-xs text-slate-400' }, 'Belum ada data customer'))
              : null
          )
        )
      )
    )
  );
}


