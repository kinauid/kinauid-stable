import { createElement } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createPage, Div, PageHeader, type InferLoader } from '~/builder';
import { SalaryEmployeeService } from '~/services/salary-employee.service';
import { SalaryEmployeeWidget } from '~/components/feature/SalaryEmployeeWidgets';
import type { SalaryState } from '~/schemas/salary-employee.schema';

export const meta = () => [{ title: 'Penggajian & Slip Gaji Karyawan - Kinau Studio' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  return SalaryEmployeeService.getSalaryDashboardData({ search });
};

export const action = async (args: ActionFunctionArgs) => SalaryEmployeeService.handleSalaryAction(args);

export default createPage<InferLoader<typeof loader>, any, SalaryState>((ctx) => {
  const { data, urlState, updateUrlState, send, isSubmitting } = ctx;
  const handleCreateSlip = (payload: any) => send.submit(payload, { method: 'post' });
  const handleUpdateStatus = (id: string, payment_status: string) => send.submit({ intent: 'update-salary-status', id, payment_status }, { method: 'post' });

  return Div(
    { className: 'space-y-6 max-w-7xl mx-auto pb-10' },
    PageHeader({
      title: 'Penggajian Karyawan & Slip Gaji',
      subtitle: 'Manajemen payroll, pencatatan tunjangan, potongan kasbon, dan slip gaji staf workshop.',
      breadcrumbs: [{ label: 'Keuangan', href: '/app/finance' }, { label: 'Gaji Karyawan', href: '/app/finance/salary-employee' }],
    }),
    createElement(SalaryEmployeeWidget, {
      data: data || { employees: [], slips: [], totalEmployees: 0, totalPayout: 0, averageSalary: 0, monthlyTrends: [] },
      search: urlState?.search || '',
      onSearchChange: (search: string) => updateUrlState({ search }),
      onCreateSlip: handleCreateSlip,
      onUpdateStatus: handleUpdateStatus,
      isSubmitting,
    })
  );
}, { defaultState: { search: '' } });
