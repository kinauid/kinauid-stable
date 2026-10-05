import React, { useState } from 'react';
import {
  Printer,
  FileText,
  Truck,
  Wrench,
  Download,
  ArrowLeft,
  CheckCircle2,
  Building,
  CreditCard,
} from 'lucide-react';
import type { OrderPrintData, PrintDocumentType } from '~/schemas/order-download.schema';

interface OrderDownloadWidgetProps {
  data: OrderPrintData;
  activeDocType?: PrintDocumentType;
  onNavigate: (path: string) => void;
}

export const OrderDownloadWidget: React.FC<OrderDownloadWidgetProps> = ({
  data,
  activeDocType = 'nota',
  onNavigate,
}) => {
  const [docType, setDocType] = useState<PrintDocumentType>(activeDocType);

  const handlePrint = () => {
    window.print();
  };

  const totalAmount = data?.total_amount || 0;
  const dpAmount = data?.dp_amount || 0;
  const sisaTagihan = Math.max(0, totalAmount - dpAmount);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Screen Control Bar (Hidden on Print) */}
      <div className="print:hidden bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('/app/order-list')}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--background)] transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 p-1 bg-[var(--background)] rounded-xl border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setDocType('nota')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                docType === 'nota' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Nota Kwitansi
            </button>
            <button
              type="button"
              onClick={() => setDocType('surat_jalan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                docType === 'surat_jalan' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Surat Jalan
            </button>
            <button
              type="button"
              onClick={() => setDocType('spk_produksi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                docType === 'spk_produksi' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" /> SPK Workshop
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Cetak Dokumen (Print / PDF)
        </button>
      </div>

      {/* Printable Sheet (A4 format with border) */}
      <div className="bg-white text-gray-900 border border-gray-200 shadow-lg p-8 md:p-12 rounded-2xl print:border-0 print:shadow-none print:p-0 print:m-0 font-sans space-y-6">
        {/* Header Kop Surat */}
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4">
          <div className="space-y-1 max-w-md">
            <h1 className="text-xl font-black tracking-tight text-blue-950 uppercase">{data?.company?.name}</h1>
            <p className="text-xs font-semibold text-gray-600">{data?.company?.tagline}</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">{data?.company?.address}</p>
            <p className="text-[11px] text-gray-500">
              WA: {data?.company?.phone} • Email: {data?.company?.email}
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-black uppercase rounded">
              {docType === 'nota' ? 'NOTA & KWITANSI' : docType === 'surat_jalan' ? 'SURAT JALAN PENGIRIMAN' : 'SURAT PERINTAH KERJA (SPK)'}
            </span>
            <p className="font-mono text-xs font-bold text-gray-800">{data?.order_number}</p>
            <p className="text-[11px] text-gray-500">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Customer & Order Metadata */}
        <div className="grid grid-cols-2 gap-6 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Kepada Yth:</p>
            <p className="font-bold text-gray-900 text-sm">{data?.institution_name}</p>
            <p className="text-gray-600">Up. {data?.pic_name} ({data?.pic_phone})</p>
            {data?.is_kkn && (
              <p className="text-[11px] text-blue-700 font-semibold mt-1">
                Program KKN: {data?.kkn_type} Periode {data?.kkn_period}/{data?.kkn_year}
                {data?.kkn_detail ? ` (${typeof data.kkn_detail === 'object' ? (data.kkn_detail as any).value || (data.kkn_detail as any).kelompok || (data.kkn_detail as any).desa || '' : String(data.kkn_detail).replace(/^[{\[].*[}\]]$/, '') || data.kkn_detail})` : ''}
              </p>
            )}
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400">Status & Deadline:</p>
            <p className="font-bold text-gray-900">
              Status Pembayaran: <span className="uppercase text-blue-700">{data?.payment_status}</span>
            </p>
            <p className="text-gray-600">Target Selesai: {data?.deadline || 'Sesuai Antrean'}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-y border-gray-300">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-3">Item / Deskripsi Produk</th>
                <th className="py-2.5 px-3">Spesifikasi / Varian</th>
                <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                {docType === 'nota' && (
                  <>
                    <th className="py-2.5 px-3 w-28 text-right">Harga Satuan</th>
                    <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
                  </>
                )}
                {docType !== 'nota' && (
                  <th className="py-2.5 px-3 w-40 text-center">Keterangan / QC</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 text-center font-bold text-gray-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-gray-900">{item.product_name}</td>
                  <td className="py-2.5 px-3 text-gray-600">{item.variant || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-gray-900">{item.qty} pcs</td>
                  {docType === 'nota' && (
                    <>
                      <td className="py-2.5 px-3 text-right font-mono">Rp {Number(item.unit_price || 0).toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">Rp {Number(item.subtotal || 0).toLocaleString('id-ID')}</td>
                    </>
                  )}
                  {docType !== 'nota' && (
                    <td className="py-2.5 px-3 text-center text-gray-500 font-mono">[  ] Lolos QC</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Bank Information (for Nota) */}
        {docType === 'nota' && (
          <div className="grid grid-cols-2 gap-6 pt-2 border-t border-gray-200">
            {/* Bank Accounts */}
            <div className="space-y-2 text-xs bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
              <p className="font-bold text-blue-900 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Rekening Pembayaran Resmi:
              </p>
              {data?.company?.bank_accounts?.map((acc, i) => (
                <p key={i} className="text-gray-700">
                  <span className="font-semibold text-blue-950">{acc.bank}:</span> {acc.account_number} a.n. {acc.holder}
                </p>
              ))}
              <p className="text-[10px] text-gray-500 pt-1">
                *Harap konfirmasi transfer via WhatsApp dengan mencantumkan nomor order di atas.
              </p>
            </div>

            {/* Total Calculations */}
            <div className="space-y-2 text-xs text-right">
              <div className="flex justify-between text-gray-600">
                <span>Total Nilai Pesanan:</span>
                <span className="font-bold font-mono text-gray-900">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Uang Muka (DP Diterima):</span>
                <span className="font-bold font-mono text-emerald-700">Rp {dpAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-sm">
                <span className="text-gray-900">Sisa Tagihan / Pelunasan:</span>
                <span className="font-mono text-red-600">Rp {sisaTagihan.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {data?.notes && (
          <div className="text-xs p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="font-bold text-gray-700">Catatan Khusus: </span>
            <span className="text-gray-600">{data.notes}</span>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 pt-8 text-center text-xs">
          <div className="space-y-16">
            <p className="font-semibold text-gray-600">Penerima / Pemesan</p>
            <div>
              <p className="font-bold text-gray-900 underline">{data?.pic_name || '................................'}</p>
              <p className="text-gray-500">{data?.institution_name}</p>
            </div>
          </div>

          <div className="space-y-16">
            <p className="font-semibold text-gray-600">Hormat Kami, Kinau Studio</p>
            <div>
              <p className="font-bold text-gray-900 underline">Finance & Admin Kinau</p>
              <p className="text-gray-500">Kinau Studio Nusantara</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
