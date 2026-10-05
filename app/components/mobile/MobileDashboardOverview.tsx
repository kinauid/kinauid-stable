import React, { createElement, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '~/builder';
import type { OverviewDashboardData } from '~/services/overview.service';

export interface MobileDashboardOverviewProps {
  data?: OverviewDashboardData;
  user?: any;
}

/**
 * Generate smooth cubic Bezier path for spline curve chart
 */
function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 5;
    const cp1y = p1.y + (p2.y - p0.y) / 5;

    const cp2x = p2.x - (p3.x - p1.x) / 5;
    const cp2y = p2.y - (p3.y - p1.y) / 5;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Dedicated Mobile Dashboard Overview Widget
 * Strictly tailored according to Reference Screen 1 (SellRecord Style):
 * 1. 2x2 Metric Cards (Total Sales, Completed Orders, Earnings, Customer Reviews)
 * 2. Sales Spline Area/Line Chart with Monthly/Weekly growth, active tooltip ($300 / 17 Jun), and date axis
 * 3. Recent Activity List
 * 4. Akses Menu Cepat & Modal Bottom Sheet with drag-to-close gesture
 */
export function MobileDashboardOverviewWidget({ data, user }: MobileDashboardOverviewProps) {
  const navigate = useNavigate();
  const [allMenusOpen, setAllMenusOpen] = useState(false);
  const [searchMenuQuery, setSearchMenuQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'monthly' | 'weekly'>('monthly');
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);

  // Active chart point index (default active on peak at 17 Jun / index 5)
  const [activePointIdx, setActivePointIdx] = useState<number>(5);

  // Drag to close bottom sheet gesture state
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartYRef.current = clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartYRef.current === null) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartYRef.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(deltaY * 0.15);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 80) {
      setAllMenusOpen(false);
    }
    setDragY(0);
    setIsDragging(false);
    dragStartYRef.current = null;
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (dragStartYRef.current === null) return;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const deltaY = clientY - dragStartYRef.current;
      if (deltaY > 0) {
        setDragY(deltaY);
      } else {
        setDragY(deltaY * 0.15);
      }
    };
    const onEnd = () => {
      if (dragY > 80) {
        setAllMenusOpen(false);
      }
      setDragY(0);
      setIsDragging(false);
      dragStartYRef.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, dragY]);

  const openAllMenus = () => {
    setDragY(0);
    setIsDragging(false);
    dragStartYRef.current = null;
    setAllMenusOpen(true);
  };

  const closeAllMenus = () => {
    setAllMenusOpen(false);
    setDragY(0);
    setIsDragging(false);
    dragStartYRef.current = null;
  };

  const handleNavigate = (path: string) => {
    closeAllMenus();
    navigate(path);
  };

  // Metrics Data Extraction
  const totalAmount = data?.totalOrderAmountFormatted || 'Rp 50.111.950';
  const totalGrowth = data?.totalOrderGrowth || '+12.5%';
  const completedBatch = data?.completedBatchCount ? `${data?.completedBatchCount}` : '152';
  const completedGrowth = data?.completedGrowth || '+8.3%';
  const totalPaid = data?.totalPaidFormatted || 'Rp 33.135.950';
  const recentOrders = data?.recentOrders || [];

  // Chart Data Points for Monthly Curve (Matching Ref 1: Jan, 1-3, 4-6, 7-9, 10-12, 13-15, 16-18, 19-21, 22-25, 26-28, 29-31)
  const monthlyDataPoints = [
    { label: 'Jan', val: 180, formatted: 'Rp 18,0jt', date: '01 Jan' },
    { label: '1-3', val: 195, formatted: 'Rp 19,5jt', date: '03 Jan' },
    { label: '4-6', val: 260, formatted: 'Rp 26,0jt', date: '06 Jan' },
    { label: '7-9', val: 340, formatted: 'Rp 34,0jt', date: '09 Jan' },
    { label: '10-12', val: 390, formatted: 'Rp 39,0jt', date: '12 Jan' },
    { label: '13-15', val: 420, formatted: 'Rp 42,0jt', date: '15 Jan' },
    { label: '16-18', val: 300, formatted: '$300', date: '17 Jun' }, // Peak active tooltip from reference!
    { label: '19-21', val: 360, formatted: 'Rp 36,0jt', date: '21 Jan' },
    { label: '22-25', val: 480, formatted: 'Rp 48,0jt', date: '25 Jan' },
    { label: '26-28', val: 495, formatted: 'Rp 49,5jt', date: '28 Jan' },
    { label: '29-31', val: 430, formatted: 'Rp 43,0jt', date: '31 Jan' },
  ];

  const weeklyDataPoints = [
    { label: 'Sen', val: 220, formatted: 'Rp 22,0jt', date: 'Senin' },
    { label: 'Sel', val: 310, formatted: 'Rp 31,0jt', date: 'Selasa' },
    { label: 'Rab', val: 280, formatted: 'Rp 28,0jt', date: 'Rabu' },
    { label: 'Kam', val: 450, formatted: 'Rp 45,0jt', date: 'Kamis' },
    { label: 'Jum', val: 510, formatted: 'Rp 51,0jt', date: 'Jumat' },
    { label: 'Sab', val: 420, formatted: 'Rp 42,0jt', date: 'Sabtu' },
    { label: 'Min', val: 350, formatted: 'Rp 35,0jt', date: 'Minggu' },
  ];

  const currentChartData = timeframe === 'monthly' ? monthlyDataPoints : weeklyDataPoints;

  // SVG Chart Dimensions
  const svgWidth = 340;
  const svgHeight = 150;
  const paddingTop = 25;
  const paddingBottom = 25;
  const paddingLeft = 32;
  const paddingRight = 15;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const maxVal = 600;

  const chartCoords = currentChartData.map((d, i) => {
    const x = paddingLeft + (i / (currentChartData.length - 1)) * chartWidth;
    // Map value 0 -> 600 to Y coordinates (inverted)
    const y = paddingTop + chartHeight - (d.val / maxVal) * chartHeight;
    return { ...d, x, y, index: i };
  });

  const smoothCurvePath = generateSmoothPath(chartCoords);
  const areaPath = chartCoords.length > 0
    ? `${smoothCurvePath} L ${chartCoords[chartCoords.length - 1].x} ${paddingTop + chartHeight} L ${chartCoords[0].x} ${paddingTop + chartHeight} Z`
    : '';

  const activePoint = chartCoords[Math.min(activePointIdx, chartCoords.length - 1)] || chartCoords[0];

  // Real menu categories mapped directly from NAVIGATION_GROUPS & Sidebar
  const menuCategories = [
    {
      title: 'PESANAN & PRODUKSI',
      countLabel: '8 Modul',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      items: [
        { label: 'Input Pesan', href: '/app/order-form', icon: 'PlusCircle', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
        { label: 'Daftar Order', href: '/app/order-list', icon: 'FileText', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
        { label: 'Riwayat', href: '/app/order-history', icon: 'History', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
        { label: 'Area Cetak', href: '/app/print-area', icon: 'Printer', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
        { label: 'Desain', href: '/app/setting/design', icon: 'LayoutTemplate', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
        { label: 'Broadcast', href: '/app/email', icon: 'Mail', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
        { label: 'Daftar Produk', href: '/app/product-list', icon: 'Tag', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
        { label: 'Belanja Bahan', href: '/app/procurement/shopping', icon: 'ShoppingCart', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
      ],
    },
    {
      title: 'KEUANGAN & KAS',
      countLabel: '5 Modul',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      items: [
        { label: 'Buku Kas', href: '/app/finance', icon: 'Coins', bg: 'bg-[#ECFDF5]', iconColor: 'text-[#059669]' },
        { label: 'Arus Kas', href: '/app/finance/cashflow', icon: 'TrendingUp', bg: 'bg-[#ECFDF5]', iconColor: 'text-[#059669]' },
        { label: 'Laporan P&L', href: '/app/finance/reports', icon: 'FileSpreadsheet', bg: 'bg-[#ECFDF5]', iconColor: 'text-[#059669]' },
        { label: 'Akun Bank', href: '/app/finance/account', icon: 'Landmark', bg: 'bg-[#ECFDF5]', iconColor: 'text-[#059669]' },
        { label: 'Gaji Karyawan', href: '/app/finance/salary-employee', icon: 'Users', bg: 'bg-[#ECFDF5]', iconColor: 'text-[#059669]' },
      ],
    },
    {
      title: 'MASTER & VENDOR',
      countLabel: '4 Modul',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      items: [
        { label: 'Master Supplier', href: '/app/master/supplier', icon: 'Truck', bg: 'bg-[#FEF3C7]', iconColor: 'text-[#D97706]' },
        { label: 'Institusi Kampus', href: '/app/master/institution', icon: 'Building', bg: 'bg-[#FEF3C7]', iconColor: 'text-[#D97706]' },
        { label: 'Inventaris Aset', href: '/app/asset/inventory', icon: 'Cpu', bg: 'bg-[#FEF3C7]', iconColor: 'text-[#D97706]' },
        { label: 'Stok Bahan', href: '/app/procurement/stock', icon: 'Package', bg: 'bg-[#FEF3C7]', iconColor: 'text-[#D97706]' },
      ],
    },
    {
      title: 'OFFICE & 3D STUDIO',
      countLabel: '5 Modul',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      items: [
        { label: 'Virtual Office 3D', href: '/office/overview', icon: 'Building2', bg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
        { label: 'Kaos 3D Studio', href: '/design/customizer', icon: 'Sparkles', bg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
        { label: 'Studio Custom', href: '/customer/configure', icon: 'Palette', bg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
        { label: 'Drive Customer', href: '/app/drive/customer', icon: 'HardDrive', bg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
        { label: 'Drive Internal', href: '/app/drive/internal', icon: 'FolderGit2', bg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
      ],
    },
    {
      title: 'SISTEM & AKSES',
      countLabel: '4 Modul',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      items: [
        { label: 'Staff & Role', href: '/dashboard/admin/manage', icon: 'UserCog', bg: 'bg-[#F3E8FF]', iconColor: 'text-[#7C3AED]' },
        { label: 'Error Logs', href: '/app/system/error-logs', icon: 'ShieldAlert', bg: 'bg-[#F3E8FF]', iconColor: 'text-[#7C3AED]' },
        { label: 'Tiket Aduan', href: '/app/system/tickets', icon: 'LifeBuoy', bg: 'bg-[#F3E8FF]', iconColor: 'text-[#7C3AED]' },
        { label: 'Recycle Bin', href: '/app/setting/recycle-bin', icon: 'Recycle', bg: 'bg-[#F3E8FF]', iconColor: 'text-[#7C3AED]' },
      ],
    },
  ];

  const filteredCategories = searchMenuQuery.trim()
    ? menuCategories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) =>
            item.label.toLowerCase().includes(searchMenuQuery.toLowerCase())
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : menuCategories;

  return createElement(
    'div',
    { className: 'space-y-4 pb-20 select-none' },

    // 1. Dashboard Title & Top Actions Row (Ref Page 1 Header)
    createElement(
      'div',
      { className: 'flex items-center justify-between pt-1 pb-1' },
      createElement(
        'div',
        null,
        createElement('h1', { className: 'text-xl font-black text-slate-900 tracking-tight' }, 'Dashboard'),
        createElement('p', { className: 'text-[11px] text-slate-400 font-medium' }, 'Ringkasan performa operasional & penjualan')
      ),
      createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            if (navigator.share) {
              navigator.share({ title: 'Kinau ID Dashboard', url: window.location.href }).catch(() => {});
            } else {
              navigate('/app/order-list');
            }
          },
          className: 'p-2 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50 text-slate-700 transition-all cursor-pointer flex items-center justify-center',
          'aria-label': 'Share or Export',
        },
        Icon('Share2', { size: 17 })
      )
    ),

    // 2. 2x2 Metric Cards Grid (Ref Page 1)
    createElement(
      'div',
      { className: 'grid grid-cols-2 gap-3' },

      // Card 1: Total Sales
      createElement(
        'div',
        { className: 'bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-2 relative' },
        createElement(
          'div',
          { className: 'flex items-center justify-between text-slate-500' },
          createElement('span', { className: 'text-xs font-semibold text-slate-600' }, 'Total Sales'),
          createElement('button', { type: 'button', className: 'text-slate-400 hover:text-slate-600 cursor-pointer p-0.5', 'aria-label': 'Options' }, Icon('MoreHorizontal', { size: 16 }))
        ),
        createElement('div', { className: 'text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight truncate' }, totalAmount),
        createElement(
          'div',
          { className: 'flex items-center gap-1 text-[10px] font-bold text-emerald-600' },
          Icon('TrendingUp', { size: 12 }),
          createElement('span', null, `${totalGrowth} This Month`)
        )
      ),

      // Card 2: Completed Orders
      createElement(
        'div',
        { className: 'bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-2 relative' },
        createElement(
          'div',
          { className: 'flex items-center justify-between text-slate-500' },
          createElement('span', { className: 'text-xs font-semibold text-slate-600' }, 'Completed Orders'),
          createElement('button', { type: 'button', className: 'text-slate-400 hover:text-slate-600 cursor-pointer p-0.5', 'aria-label': 'Options' }, Icon('MoreHorizontal', { size: 16 }))
        ),
        createElement('div', { className: 'text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight' }, completedBatch),
        createElement(
          'div',
          { className: 'flex items-center gap-1 text-[10px] font-bold text-emerald-600' },
          Icon('TrendingUp', { size: 12 }),
          createElement('span', null, `${completedGrowth} This Month`)
        )
      ),

      // Card 3: Earnings
      createElement(
        'div',
        { className: 'bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-2 relative' },
        createElement(
          'div',
          { className: 'flex items-center justify-between text-slate-500' },
          createElement('span', { className: 'text-xs font-semibold text-slate-600' }, 'Earnings'),
          createElement('button', { type: 'button', className: 'text-slate-400 hover:text-slate-600 cursor-pointer p-0.5', 'aria-label': 'Options' }, Icon('MoreHorizontal', { size: 16 }))
        ),
        createElement('div', { className: 'text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight truncate' }, totalPaid),
        createElement(
          'div',
          { className: 'flex items-center gap-1 text-[10px] font-semibold text-slate-400 truncate' },
          createElement('span', { className: 'w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0' }),
          createElement('span', { className: 'truncate' }, 'Withdrawal Balance')
        )
      ),

      // Card 4: Customer Reviews
      createElement(
        'div',
        { className: 'bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-2 relative' },
        createElement(
          'div',
          { className: 'flex items-center justify-between text-slate-500' },
          createElement('span', { className: 'text-xs font-semibold text-slate-600' }, 'Customer Reviews'),
          createElement('button', { type: 'button', className: 'text-slate-400 hover:text-slate-600 cursor-pointer p-0.5', 'aria-label': 'Options' }, Icon('MoreHorizontal', { size: 16 }))
        ),
        createElement(
          'div',
          { className: 'flex items-baseline gap-1' },
          createElement('span', { className: 'text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight' }, '4.8'),
          createElement('span', { className: 'text-xs font-bold text-slate-400' }, '/5')
        ),
        createElement(
          'div',
          { className: 'flex items-center gap-0.5 text-amber-400 text-xs' },
          [...Array(5)].map((_, i) =>
            createElement('span', { key: i }, Icon('Star', { size: 11, className: 'fill-amber-400 text-amber-400' }))
          )
        )
      )
    ),

    // 3. Main Sales Spline Line Chart (Ref Page 1)
    createElement(
      'div',
      { className: 'bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-3 relative overflow-hidden' },
      // Header of Chart: Sales Title + Badge + Monthly/Weekly selector dropdown
      createElement(
        'div',
        { className: 'flex items-center justify-between' },
        createElement(
          'div',
          { className: 'flex items-center gap-2' },
          createElement('h3', { className: 'text-base font-black text-slate-900 tracking-tight' }, 'Sales'),
          createElement(
            'span',
            { className: 'text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 flex items-center gap-1' },
            Icon('TrendingUp', { size: 11 }),
            '+12.5%'
          )
        ),
        // Dropdown Toggle
        createElement(
          'div',
          { className: 'relative' },
          createElement(
            'button',
            {
              type: 'button',
              onClick: () => setShowTimeframeDropdown(!showTimeframeDropdown),
              className:
                'flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer',
            },
            Icon('Calendar', { size: 12 }),
            createElement('span', null, timeframe === 'monthly' ? 'Monthly' : 'Weekly'),
            Icon('ChevronDown', { size: 11 })
          ),
          showTimeframeDropdown
            ? createElement(
                'div',
                { className: 'absolute right-0 mt-1 w-28 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 text-xs' },
                createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: () => {
                      setTimeframe('monthly');
                      setShowTimeframeDropdown(false);
                      setActivePointIdx(6);
                    },
                    className: `w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium ${timeframe === 'monthly' ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-700'}`
                  },
                  'Monthly'
                ),
                createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: () => {
                      setTimeframe('weekly');
                      setShowTimeframeDropdown(false);
                      setActivePointIdx(4);
                    },
                    className: `w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium ${timeframe === 'weekly' ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-700'}`
                  },
                  'Weekly'
                )
              )
            : null
        )
      ),

      // Interactive SVG Spline Line Chart
      createElement(
        'div',
        { className: 'relative w-full pt-1 pb-2' },
        createElement(
          'svg',
          {
            viewBox: `0 0 ${svgWidth} ${svgHeight}`,
            className: 'w-full h-44 overflow-visible touch-pan-x',
          },
          createElement(
            'defs',
            null,
            createElement(
              'linearGradient',
              { id: 'salesSplineGrad', x1: '0', y1: '0', x2: '0', y2: '1' },
              createElement('stop', { offset: '0%', stopColor: '#EA580C', stopOpacity: '0.22' }),
              createElement('stop', { offset: '85%', stopColor: '#EA580C', stopOpacity: '0.02' }),
              createElement('stop', { offset: '100%', stopColor: '#EA580C', stopOpacity: '0.0' })
            )
          ),

          // Horizontal grid lines & Y-Axis values ($600, $450, $300, $150, $0)
          [600, 450, 300, 150, 0].map((yVal, idx) => {
            const yPos = paddingTop + chartHeight - (yVal / maxVal) * chartHeight;
            return createElement(
              'g',
              { key: idx },
              createElement('text', {
                x: paddingLeft - 6,
                y: yPos + 3,
                textAnchor: 'end',
                fontSize: 8,
                fontWeight: '600',
                fill: '#94A3B8',
              }, `$${yVal}`),
              createElement('line', {
                x1: paddingLeft,
                y1: yPos,
                x2: svgWidth - paddingRight,
                y2: yPos,
                stroke: '#F1F5F9',
                strokeWidth: 1,
              })
            );
          }),

          // Area Fill Underneath Curve
          createElement('path', {
            d: areaPath,
            fill: 'url(#salesSplineGrad)',
          }),

          // Spline Curve Stroke in Orange
          createElement('path', {
            d: smoothCurvePath,
            fill: 'none',
            stroke: '#EA580C',
            strokeWidth: 2.75,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }),

          // Dashed Vertical Guideline on Active Point
          createElement('line', {
            x1: activePoint.x,
            y1: activePoint.y,
            x2: activePoint.x,
            y2: paddingTop + chartHeight,
            stroke: '#EA580C',
            strokeWidth: 1.5,
            strokeDasharray: '3 3',
          }),

          // Data Points (Circles)
          chartCoords.map((pt, i) => {
            const isActive = i === activePoint.index;
            return createElement(
              'g',
              {
                key: i,
                onClick: () => setActivePointIdx(i),
                className: 'cursor-pointer',
              },
              createElement('circle', {
                cx: pt.x,
                cy: pt.y,
                r: isActive ? 5 : 3.5,
                fill: isActive ? '#EA580C' : '#FFFFFF',
                stroke: '#EA580C',
                strokeWidth: isActive ? 2.5 : 2,
                className: 'transition-all duration-150',
              }),
              // Invisible hit area for easier finger tap on mobile
              createElement('circle', {
                cx: pt.x,
                cy: pt.y,
                r: 14,
                fill: 'transparent',
              })
            );
          }),

          // Active Tooltip Card ($300 / 17 Jun - exact match to Ref 1)
          createElement(
            'g',
            {
              transform: `translate(${Math.max(40, Math.min(svgWidth - 55, activePoint.x))}, ${Math.max(16, activePoint.y - 12)})`,
              className: 'pointer-events-none transition-transform duration-200',
            },
            // Tooltip Box Card
            createElement('rect', {
              x: -24,
              y: -24,
              width: 48,
              height: 26,
              rx: 6,
              fill: '#FFFFFF',
              stroke: '#E2E8F0',
              strokeWidth: 1,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))',
            }),
            // Value Text (e.g. $300)
            createElement('text', {
              x: 0,
              y: -13,
              textAnchor: 'middle',
              fontSize: 8.5,
              fontWeight: '800',
              fill: '#0F172A',
            }, activePoint.formatted),
            // Date Text (e.g. 17 Jun)
            createElement('text', {
              x: 0,
              y: -4,
              textAnchor: 'middle',
              fontSize: 6.5,
              fontWeight: '600',
              fill: '#94A3B8',
            }, activePoint.date)
          ),

          // X-Axis Labels
          chartCoords.map((pt, i) =>
            createElement('text', {
              key: i,
              x: pt.x,
              y: svgHeight - 6,
              textAnchor: 'middle',
              fontSize: 7.5,
              fontWeight: i === activePoint.index ? '800' : '600',
              fill: i === activePoint.index ? '#EA580C' : '#94A3B8',
            }, pt.label)
          )
        )
      )
    ),

    // 4. Akses Menu Cepat Section (4x2 Quick Grid with Modern Touch)
    createElement(
      'div',
      { className: 'space-y-2 pt-1' },
      createElement(
        'div',
        { className: 'flex items-center justify-between px-0.5' },
        createElement('h3', { className: 'text-xs font-black text-slate-900 uppercase tracking-wider' }, 'AKSES MENU CEPAT'),
        createElement(
          'button',
          {
            type: 'button',
            onClick: openAllMenus,
            className: 'text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer',
          },
          'Lihat Semua'
        )
      ),
      createElement(
        'div',
        { className: 'grid grid-cols-4 gap-2.5' },
        [
          { label: 'Input Pesan', href: '/app/order-form', icon: 'PlusCircle', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
          { label: 'Daftar Order', href: '/app/order-list', icon: 'FileText', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
          { label: 'Riwayat', href: '/app/order-history', icon: 'History', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
          { label: 'Area Cetak', href: '/app/print-area', icon: 'Printer', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
          { label: 'Desain', href: '/app/setting/design', icon: 'LayoutTemplate', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
          { label: 'Keuangan', href: '/app/finance', icon: 'Coins', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
          { label: 'Office 3D', href: '/office/overview', icon: 'Building2', bg: 'bg-[#E0F2FE]', iconColor: 'text-[#0284C7]' },
          { label: 'Semua Menu', onClick: openAllMenus, icon: 'LayoutGrid', bg: 'bg-[#F1F5F9]', iconColor: 'text-[#475569]' },
        ].map((item, idx) =>
          createElement(
            'button',
            {
              key: idx,
              type: 'button',
              onClick: () => {
                if (item.href) {
                  navigate(item.href);
                } else if (item.onClick) {
                  item.onClick();
                }
              },
              className:
                'flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer text-center group w-full',
            },
            createElement(
              'div',
              {
                className: `w-12 h-12 rounded-full ${item.bg} ${item.iconColor} flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs`,
              },
              Icon(item.icon, { size: 20 })
            ),
            createElement(
              'span',
              { className: 'text-[10px] font-semibold text-slate-700 leading-tight truncate w-full' },
              item.label
            )
          )
        )
      )
    ),

    // 5. Recent Activity Section (Ref Page 1)
    createElement(
      'div',
      { className: 'space-y-2 pt-1' },
      createElement(
        'div',
        { className: 'flex items-center justify-between px-0.5' },
        createElement('h3', { className: 'text-xs font-black text-slate-900 uppercase tracking-wider' }, 'Recent Activity'),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => navigate('/app/order-list'),
            className: 'text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 cursor-pointer',
          },
          'View All',
          Icon('ChevronRight', { size: 13 })
        )
      ),
      createElement(
        'div',
        { className: 'bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs divide-y divide-slate-100 space-y-3' },
        // Item 1: Reference Highlight Card
        createElement(
          'div',
          {
            onClick: () => navigate('/app/order-list'),
            className: 'flex items-center justify-between pt-0 cursor-pointer group',
          },
          createElement(
            'div',
            { className: 'flex items-center gap-3 min-w-0' },
            createElement(
              'div',
              { className: 'w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100' },
              Icon('Box', { size: 20 })
            ),
            createElement(
              'div',
              { className: 'min-w-0 pr-2' },
              createElement(
                'div',
                { className: 'flex items-center gap-1.5' },
                createElement('p', { className: 'text-xs font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors' }, 'New Order Received'),
                createElement('span', { className: 'text-[10px] text-slate-400 font-medium' }, '• 2 minutes ago')
              ),
              createElement('p', { className: 'text-[11px] text-slate-500 font-medium truncate mt-0.5' }, 'Order #ORD-2024-001 - $89.99')
            )
          ),
          createElement('span', { className: 'w-2 h-2 rounded-full bg-blue-600 shrink-0' })
        ),

        // Live recent orders if available
        (recentOrders.length > 0 ? recentOrders.slice(0, 3) : [
          {
            id: 'ord-1',
            orderNumber: 'ORD-87321',
            customerName: 'John Doe',
            productName: 'Smartwatch X1',
            grandTotalFormatted: '$299',
            timeAgo: '3 hours ago',
          },
          {
            id: 'ord-2',
            orderNumber: 'ORD-87320',
            customerName: 'Sarah Johnson',
            productName: 'Wireless Earbuds Pro',
            grandTotalFormatted: '$149',
            timeAgo: '5 hours ago',
          },
          {
            id: 'ord-3',
            orderNumber: 'ORD-87319',
            customerName: 'Michael Chen',
            productName: 'Fitness Tracker',
            grandTotalFormatted: '$99',
            timeAgo: '1 day ago',
          }
        ]).map((ord: any, idx: number) =>
          createElement(
            'div',
            {
              key: ord.id || idx,
              onClick: () => navigate('/app/order-list'),
              className: 'flex items-center justify-between pt-3 cursor-pointer group',
            },
            createElement(
              'div',
              { className: 'flex items-center gap-3 min-w-0' },
              createElement(
                'div',
                { className: 'w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-100' },
                Icon('ShoppingBag', { size: 19 })
              ),
              createElement(
                'div',
                { className: 'min-w-0 pr-2' },
                createElement(
                  'div',
                  { className: 'flex items-center gap-1.5' },
                  createElement('p', { className: 'text-xs font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors' }, ord.customerName || ord.institutionName),
                  createElement('span', { className: 'text-[10px] text-slate-400 font-medium' }, `• ${ord.timeAgo || ord.dateFormatted || 'Hari ini'}`)
                ),
                createElement('p', { className: 'text-[11px] text-slate-500 font-medium truncate mt-0.5' }, `${ord.productName} - ${ord.grandTotalFormatted}`)
              )
            ),
            createElement(
              'span',
              { className: 'text-xs font-black font-mono text-slate-900' },
              ord.grandTotalFormatted
            )
          )
        )
      )
    ),

    // 6. Bottom Sheet Modal: Semua Menu & Fitur with Hold & Drag Gesture & Click Backdrop to Close
    allMenusOpen
      ? createElement(
          'div',
          { className: 'fixed inset-0 z-50 flex items-end justify-center pointer-events-none' },
          // Backdrop Overlay (Auto close on click)
          createElement('div', {
            onClick: (e: any) => {
              e.stopPropagation();
              closeAllMenus();
            },
            className:
              'fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer z-0 pointer-events-auto',
          }),
          // Sliding Modal Sheet with Dynamic Translate Y on Drag
          createElement(
            'div',
            {
              className: `relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl z-10 p-5 space-y-4 max-h-[85vh] flex flex-col pointer-events-auto ${
                isDragging ? '' : 'transition-transform duration-200 ease-out'
              }`,
              style: {
                transform: `translateY(${Math.max(0, dragY)}px)`,
              },
            },
            // Handle Bar area with gesture listeners
            createElement(
              'div',
              {
                onTouchStart: handleTouchStart,
                onTouchMove: handleTouchMove,
                onTouchEnd: handleTouchEnd,
                onMouseDown: handleTouchStart,
                onMouseMove: isDragging ? handleTouchMove : undefined,
                onMouseUp: handleTouchEnd,
                className:
                  'py-2 -mt-3 -mx-5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none',
              },
              createElement('div', {
                className: 'w-12 h-1.5 bg-slate-300 rounded-full transition-all',
              }),
              createElement(
                'span',
                { className: 'text-[9px] text-slate-400 font-semibold mt-1 flex items-center gap-1' },
                Icon('ChevronDown', { size: 10 }),
                'Tarik ke bawah untuk menutup'
              )
            ),
            // Title Header with gesture listeners on text area
            createElement(
              'div',
              {
                className: 'flex items-start justify-between select-none',
              },
              createElement(
                'div',
                {
                  onTouchStart: handleTouchStart,
                  onTouchMove: handleTouchMove,
                  onTouchEnd: handleTouchEnd,
                  className: 'flex-1 touch-none cursor-grab active:cursor-grabbing',
                },
                createElement('h3', { className: 'text-base font-black text-slate-900' }, 'Semua Menu & Fitur'),
                createElement('p', { className: 'text-xs text-slate-500' }, 'Akses cepat seluruh modul operasional Kinau ID')
              ),
              createElement(
                'button',
                {
                  type: 'button',
                  onClick: (e: any) => {
                    e.stopPropagation();
                    closeAllMenus();
                  },
                  onTouchStart: (e: any) => e.stopPropagation(),
                  onMouseDown: (e: any) => e.stopPropagation(),
                  className: 'p-1.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer shrink-0',
                },
                Icon('X', { size: 18 })
              )
            ),
            // Search Input
            createElement(
              'div',
              {
                className: 'relative',
                onTouchStart: (e: any) => e.stopPropagation(),
                onMouseDown: (e: any) => e.stopPropagation(),
              },
              createElement(
                'div',
                { className: 'absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400' },
                Icon('Search', { size: 15 })
              ),
              createElement('input', {
                type: 'text',
                placeholder: 'Cari menu, modul, atau fitur...',
                value: searchMenuQuery,
                onChange: (e: any) => setSearchMenuQuery(e.target.value),
                className:
                  'w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#103557]',
              })
            ),
            // Categories Content (Scrollable)
            createElement(
              'div',
              {
                className: 'flex-1 overflow-y-auto space-y-4 pr-1',
                onTouchStart: (e: any) => e.stopPropagation(),
                onMouseDown: (e: any) => e.stopPropagation(),
              },
              filteredCategories.map((cat, cIdx) =>
                createElement(
                  'div',
                  { key: cIdx, className: 'space-y-2' },
                  createElement(
                    'div',
                    { className: 'flex items-center justify-between text-[11px] font-black text-slate-700 tracking-wider uppercase' },
                    createElement('span', null, cat.title),
                    createElement(
                      'span',
                      { className: `text-[10px] font-bold px-2 py-0.5 rounded-md border ${cat.badgeColor}` },
                      cat.countLabel
                    )
                  ),
                  createElement(
                    'div',
                    { className: 'grid grid-cols-4 gap-2.5' },
                    cat.items.map((item, iIdx) =>
                      createElement(
                        'button',
                        {
                          key: iIdx,
                          type: 'button',
                          onClick: (e: any) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleNavigate(item.href);
                          },
                          className:
                            'flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 transition-colors no-underline text-center group cursor-pointer w-full border-0 bg-transparent',
                        },
                        createElement(
                          'div',
                          {
                            className: `w-12 h-12 rounded-2xl ${item.bg} ${item.iconColor} flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs`,
                          },
                          Icon(item.icon, { size: 20 })
                        ),
                        createElement(
                          'span',
                          { className: 'text-[10px] font-bold text-slate-700 leading-tight truncate w-full' },
                          item.label
                        )
                      )
                    )
                  )
                )
              )
            ),
            // Close Button
            createElement(
              'button',
              {
                type: 'button',
                onClick: (e: any) => {
                  e.stopPropagation();
                  closeAllMenus();
                },
                className:
                  'w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer',
              },
              'Tutup Menu'
            )
          )
        )
      : null
  );
}
