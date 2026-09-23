import React from 'react';
import { Card, Chart } from '~/builder';

// ============================================================================
// User Growth Chart Component (Feature Specific: Analytics & Admin Dashboard)
// ============================================================================

export interface UserGrowthChartProps {
  title?: string;
  subtitle?: string;
  height?: number;
  series?: { name: string; data: number[] }[];
  categories?: string[];
}

export function UserGrowthChart(props: UserGrowthChartProps = {}): React.ReactElement {
  const {
    title = 'Statistik & Analisis Pengguna',
    subtitle = 'Visualisasi pertumbuhan akun & rasio aktivitas mingguan',
    height = 220,
    series = [
      { name: 'Pengguna Terdaftar', data: [25, 40, 55, 70, 90, 110, 135] },
      { name: 'Pengguna Aktif', data: [20, 32, 45, 58, 75, 92, 120] },
    ],
    categories = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
  } = props;

  return Card(
    {
      className: 'p-4 space-y-3',
      title,
      subtitle,
    },
    Chart({
      type: 'area',
      height,
      series,
      options: {
        xaxis: {
          categories,
          labels: { style: { fontSize: '11px', colors: 'var(--muted-foreground)' } },
        },
        colors: ['#6366f1', '#10b981'],
        stroke: { curve: 'smooth', width: 2 },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.45,
            opacityTo: 0.05,
          },
        },
        dataLabels: { enabled: false },
        legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px' },
      },
    })
  );
}

export default UserGrowthChart;
