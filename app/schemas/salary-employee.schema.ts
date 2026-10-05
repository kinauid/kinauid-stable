import { z } from 'zod';

export interface EmployeeItem {
  id: string | number;
  fullname: string;
  role: string;
  phone?: string;
  base_salary: number;
  bank_name?: string;
  bank_account?: string;
  status: 'active' | 'inactive';
}

export interface SalarySlipItem {
  id: string;
  employee_id: string | number;
  employee_name: string;
  role: string;
  period: string; // e.g. "Oktober 2026"
  base_salary: number;
  allowances: number; // Tunjangan & Lembur
  deductions: number; // Potongan Kasbon / Absensi
  net_salary: number;
  payment_status: 'paid' | 'pending';
  payment_date?: string;
  payment_method?: string;
  notes?: string;
  created_on: string;
}

export interface SalaryDashboardData {
  employees: EmployeeItem[];
  slips: SalarySlipItem[];
  totalEmployees: number;
  totalPayout: number;
  averageSalary: number;
  monthlyTrends: Array<{ month: string; amount: number }>;
}

export interface SalaryState {
  search?: string;
  period?: string;
  status?: string;
  page?: number;
}

export const CreateSalarySlipSchema = z.object({
  intent: z.literal('create-salary-slip').or(z.literal('create_salary_slip')),
  employee_id: z.coerce.string().min(1, 'Pegawai wajib dipilih'),
  employee_name: z.string().min(1, 'Nama pegawai wajib diisi'),
  role: z.string().default('Staff'),
  period: z.string().min(1, 'Periode wajib diisi'),
  base_salary: z.coerce.number().min(0, 'Gaji pokok minimal 0'),
  allowances: z.coerce.number().default(0),
  deductions: z.coerce.number().default(0),
  net_salary: z.coerce.number().min(0),
  payment_status: z.enum(['paid', 'pending']).default('paid'),
  payment_method: z.string().default('Transfer Bank'),
  notes: z.string().optional().default(''),
});

export const UpdateSalaryStatusSchema = z.object({
  intent: z.literal('update-salary-status').or(z.literal('update_status')),
  id: z.string().min(1, 'ID Slip wajib diisi'),
  payment_status: z.enum(['paid', 'pending']).default('paid'),
});
