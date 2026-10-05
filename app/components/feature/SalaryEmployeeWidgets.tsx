import React, { useState } from 'react';
import {
  Users,
  Wallet,
  TrendingUp,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  type SalaryDashboardData,
  type SalarySlipItem,
  type EmployeeItem,
} from '~/schemas/salary-employee.schema';

export interface SalaryEmployeeWidgetProps {
  data: SalaryDashboardData;
  search: string;
  onSearchChange: (search: string) => void;
  onCreateSlip: (payload: any) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isSubmitting?: boolean;
}

export function SalaryEmployeeWidget({
  data,
  search,
  onSearchChange,
  onCreateSlip,
  onUpdateStatus,
  isSubmitting = false,
}: SalaryEmployeeWidgetProps): React.ReactElement {
  const {
    employees = [],
    slips = [],
    totalEmployees = 0,
    totalPayout = 0,
    averageSalary = 0,
    monthlyTrends = [],
  } = data || {};

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string | number>(employees[0]?.id || 1);
  const [period, setPeriod] = useState<string>('Oktober 2026');
  const [baseSalary, setBaseSalary] = useState<number>(3500000);
  const [allowances, setAllowances] = useState<number>(300000);
  const [deductions, setDeductions] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleSelectEmployee = (id: string | number) => {
    setSelectedEmpId(id);
    const emp = employees.find((e) => String(e.id) === String(id));
    if (emp) {
      setBaseSalary(emp.base_salary);
    }
  };

  const netSalary = Math.max(0, baseSalary + allowances - deductions);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => String(e.id) === String(selectedEmpId));
    if (!emp) return;

    onCreateSlip({
      intent: 'create-salary-slip',
      employee_id: emp.id,
      employee_name: emp.fullname,
      role: emp.role,
      period,
      base_salary: baseSalary,
      allowances,
      deductions,
      net_salary: netSalary,
      payment_status: 'paid',
      payment_method: 'Transfer Bank',
      notes,
    });
    setIsModalOpen(false);
  };

  // Filter slips by search
  const filteredSlips = slips.filter((s) => {
    const q = (search || '').toLowerCase();
    return s.employee_name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || s.period.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] p-5 rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              Total Pegawai Aktif
            </p>
            <h3 className="text-2xl font-black text-[var(--foreground)] mt-1">
              {totalEmployees} <span className="text-xs font-normal text-[var(--muted-foreground)]">Staf</span>
            </h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-[var(--surface)] p-5 rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              Estimasi Payout Gaji
            </p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {formatRupiah(totalPayout)}
            </h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Wallet size={24} />
          </div>
        </div>

        <div className="bg-[var(--surface)] p-5 rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              Rata-rata Gaji Staf
            </p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {formatRupiah(averageSalary)}
            </h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm overflow-hidden">
        {/* Header Bar with Action & Search */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Daftar Slip Gaji Pegawai Workshop</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Rekapitulasi penggajian staf operasional dan cetak slip gaji bulanan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={14} />
              <input
                type="text"
                placeholder="Cari nama pegawai..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 whitespace-nowrap"
            >
              <Plus size={14} /> Terbitkan Slip Gaji
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--foreground)]">
            <thead className="bg-[var(--surface-subtle)] text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider border-b border-[var(--border)]">
              <tr>
                <th className="py-3.5 px-4">Nama Pegawai & Posisi</th>
                <th className="py-3.5 px-4">Periode</th>
                <th className="py-3.5 px-4">Gaji Pokok</th>
                <th className="py-3.5 px-4">Tunjangan</th>
                <th className="py-3.5 px-4">Potongan</th>
                <th className="py-3.5 px-4">Total Gaji Bersih</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[var(--muted-foreground)]">
                    Belum ada data slip gaji tercatat.
                  </td>
                </tr>
              ) : (
                filteredSlips.map((slip) => {
                  const isPaid = slip.payment_status === 'paid';
                  return (
                    <tr key={slip.id} className="hover:bg-[var(--surface-subtle)]/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--foreground)]">{slip.employee_name}</div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">{slip.role}</div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[var(--muted-foreground)]">
                        {slip.period}
                      </td>

                      <td className="py-3.5 px-4 font-medium">
                        {formatRupiah(slip.base_salary)}
                      </td>

                      <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-medium">
                        +{formatRupiah(slip.allowances)}
                      </td>

                      <td className="py-3.5 px-4 text-red-600 dark:text-red-400 font-medium">
                        -{formatRupiah(slip.deductions)}
                      </td>

                      <td className="py-3.5 px-4 font-black text-indigo-600 dark:text-indigo-400 text-sm">
                        {formatRupiah(slip.net_salary)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          {isPaid ? 'TERBAYAR' : 'PENDING'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isPaid && (
                          <button
                            onClick={() => {
                              Swal.fire({
                                title: 'Tandai Gaji Terbayar?',
                                text: `Konfirmasi pembayaran gaji ${slip.employee_name} periode ${slip.period}.`,
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonText: 'Ya, Tandai Terbayar',
                                cancelButtonText: 'Batal',
                                confirmButtonColor: '#10b981',
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  onUpdateStatus(slip.id, 'paid');
                                }
                              });
                            }}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg hover:bg-emerald-100 transition"
                          >
                            Set Terbayar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Slip Gaji */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-subtle)]">
              <div className="flex items-center gap-2">
                <Wallet className="text-indigo-600" size={18} />
                <h3 className="text-sm font-bold text-[var(--foreground)]">Terbitkan Slip Gaji Karyawan</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-[var(--muted-foreground)]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--foreground)]">Pilih Pegawai</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullname} — {e.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Periode Gaji</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                    placeholder="Oktober 2026"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Tunjangan & Lembur (Rp)</label>
                  <input
                    type="number"
                    value={allowances}
                    onChange={(e) => setAllowances(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">Potongan Kasbon / Absensi (Rp)</label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Total Gaji Bersih (Net):</span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatRupiah(netSalary)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <CheckCircle2 size={14} /> Terbitkan Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
