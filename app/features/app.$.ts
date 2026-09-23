import { createElement } from 'react';
import { useNavigate } from 'react-router';
import { createPage, createMeta, Div, type MetaAccessConfig } from '~/builder';
import { UI } from '~/builder';

export const metaAccess: MetaAccessConfig = { roles: ['admin', 'manager', 'staff'], permissions: [] };
export const meta = createMeta({ title: 'Halaman Tidak Ditemukan — Kinau ID', description: 'Rute ini belum tersedia atau sedang dalam pengembangan.' });

// No loader needed – this is a purely client-side stub
export const loader = async () => null;
(loader as any).metaAccess = metaAccess;

export default createPage(
  ({ isNavigating }) => {
    const navigate = useNavigate();

    return Div(
      { className: 'flex flex-col items-center justify-center min-h-[55vh] p-8 text-center space-y-5 select-none font-sans' },

      // Icon area
      createElement(
        'div',
        { className: 'w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-xs' },
        UI.Icon('Construction', { size: 36, className: 'text-amber-500' })
      ),

      // Title & description
      createElement(
        'div',
        { className: 'space-y-2 max-w-sm' },
        createElement('h2', { className: 'text-xl font-extrabold text-slate-900 tracking-tight' }, 'Modul Sedang Dikembangkan'),
        createElement(
          'p',
          { className: 'text-sm text-slate-500 leading-relaxed' },
          'Halaman atau fitur ini belum tersedia di versi saat ini. Tim sedang membangunnya dan akan segera dirilis.'
        )
      ),

      // Status badge
      createElement(
        'div',
        { className: 'flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-700' },
        UI.Icon('Clock', { size: 13, className: 'text-blue-500' }),
        'Dalam Pengembangan (Coming Soon)'
      ),

      // Action buttons
      createElement(
        'div',
        { className: 'flex items-center gap-3 pt-2' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => navigate(-1),
            className:
              'px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer',
          },
          UI.Icon('ArrowLeft', { size: 13 }),
          'Kembali'
        ),
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => navigate('/app/dashboard'),
            className:
              'px-4 py-2 bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer',
          },
          UI.Icon('LayoutDashboard', { size: 13 }),
          'Ke Dashboard'
        )
      )
    );
  },
  { defaultState: {} }
);
