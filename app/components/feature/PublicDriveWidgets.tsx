import React, { useState, useRef } from 'react';
import { NavLink, useFetcher } from 'react-router';
import { Icon } from '~/builder';
import { BRAND_NAME, ADMIN_WA, getWhatsAppLink, getGoogleMapsLink } from '~/constants/brand';
import { toast } from 'sonner';
import type { PublicDriveData, DriveFolderItem, DriveFileItem } from '~/schemas/public-drive.schema';

interface PublicDriveWidgetProps {
  data?: PublicDriveData;
  isSubmitting?: boolean;
}

export function PublicDriveWidget({ data, isSubmitting }: PublicDriveWidgetProps) {
  const fetcher = useFetcher<any>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [zoomedFile, setZoomedFile] = useState<DriveFileItem | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);

  // Selected item for menu / rename
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const [selectedFolderForRename, setSelectedFolderForRename] = useState<DriveFolderItem | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Form input states
  const [newFolderName, setNewFolderName] = useState('');
  const [renameFolderName, setRenameFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileSize, setNewFileSize] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  if (!data || !data.orderData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 max-w-md w-full space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
            {Icon('FolderX', { size: 32 })}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Pesanan Tidak Ditemukan</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nomor pesanan atau link drive <strong>{data?.domain || 'ini'}</strong> tidak terdaftar dalam sistem.
            </p>
          </div>
          <NavLink
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl no-underline cursor-pointer"
          >
            {Icon('Home', { size: 14 })}
            <span>Kembali ke Beranda</span>
          </NavLink>
        </div>
      </div>
    );
  }

  const { orderData, current_folder, folders, files, breadcrumbs, domain } = data;
  const currentFolderId = current_folder?.id ? String(current_folder.id) : null;

  const displayName =
    orderData.institution_name ||
    orderData.pic_name ||
    `Pesanan #${orderData.order_number}`;

  // Safe items extraction
  const rawItems = orderData.order_items;
  const orderItems: any[] = Array.isArray(rawItems)
    ? rawItems
    : typeof rawItems === 'string'
      ? (() => {
          try {
            return JSON.parse(rawItems);
          } catch {
            return [];
          }
        })()
      : [];

  const subtotal = Number(orderData.total_amount || 0);
  const paid = Number(orderData.dp_amount || 0);
  const remain = Math.max(0, subtotal - paid);
  const isPaidOff = remain === 0 || orderData.payment_status === 'paid' || !!orderData.payment_proof;

  // Handlers
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      toast.error('Nama folder wajib diisi');
      return;
    }
    fetcher.submit(
      {
        intent: 'create_folder',
        folder_name: newFolderName.trim(),
        parent_id: currentFolderId || '',
        order_number: orderData.order_number,
      },
      { method: 'post' }
    );
    setNewFolderName('');
    setShowCreateFolderModal(false);
    toast.success('Folder baru berhasil dibuat');
  };

  const handleRenameFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolderForRename || !renameFolderName.trim()) {
      toast.error('Nama folder wajib diisi');
      return;
    }
    fetcher.submit(
      {
        intent: 'rename_folder',
        id: String(selectedFolderForRename.id),
        folder_name: renameFolderName.trim(),
      },
      { method: 'post' }
    );
    setShowRenameModal(false);
    setSelectedFolderForRename(null);
    toast.success('Nama folder berhasil diubah');
  };

  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !newFileUrl.trim()) {
      toast.error('Nama dan URL / data file wajib diisi');
      return;
    }
    fetcher.submit(
      {
        intent: 'create_file',
        file_name: newFileName.trim(),
        file_url: newFileUrl.trim(),
        file_size: newFileSize || '1.5 MB',
        folder_id: currentFolderId || '',
        order_number: orderData.order_number,
      },
      { method: 'post' }
    );
    setNewFileName('');
    setNewFileUrl('');
    setNewFileSize('');
    setShowUploadFileModal(false);
    toast.success('File berhasil diunggah ke folder');
  };

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewFileName(file.name);
    // Format size
    const sizeKB = file.size / 1024;
    const formattedSize = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;
    setNewFileSize(formattedSize);

    // Read preview/data URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewFileUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteFolder = (id: string | number) => {
    if (confirm('Yakin ingin menghapus folder ini beserta isinya?')) {
      fetcher.submit({ intent: 'delete_folder', id: String(id) }, { method: 'post' });
      setActiveMenuId(null);
      toast.success('Folder berhasil dihapus');
    }
  };

  const handleDeleteFile = (id: string | number) => {
    if (confirm('Yakin ingin menghapus file ini?')) {
      fetcher.submit({ intent: 'delete_file', id: String(id) }, { method: 'post' });
      setActiveMenuId(null);
      toast.success('File berhasil dihapus');
    }
  };

  const handleSendReview = (e: React.FormEvent) => {
    e.preventDefault();
    fetcher.submit(
      {
        intent: 'update_review',
        rating: String(reviewRating),
        review: reviewText,
      },
      { method: 'post' }
    );
    setShowReviewModal(false);
    toast.success('Terima kasih! Ulasan Anda berhasil dikirim.');
  };

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText('7366544822');
      setCopiedAccount(true);
      toast.success('Nomor rekening BSI (7366544822) berhasil disalin!');
      setTimeout(() => setCopiedAccount(false), 2500);
    } catch {
      toast.error('Gagal menyalin nomor rekening');
    }
  };

  const handlePrintNota = () => {
    window.print();
  };

  const handleDownloadAllFiles = () => {
    if (files.length === 0) {
      toast.info('Belum ada file untuk diunduh');
      return;
    }
    files.forEach((f, i) => {
      setTimeout(() => {
        if (f.file_url) {
          const a = document.createElement('a');
          a.href = f.file_url;
          a.download = f.file_name || `file_${i + 1}`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }, i * 300);
    });
    toast.success(`Mengunduh ${files.length} file...`);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-slate-900 font-sans selection:bg-[#103557]/20 antialiased pb-24 select-none">
      {/* ── 1. Drive Public Header (Exact Sidebar Mobile View Logo) ── */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo matching sidebar mobile view */}
            <NavLink to="/" className="flex items-center no-underline cursor-pointer group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white p-1 border border-[#E5E7EB] flex items-center justify-center shadow-2xs overflow-hidden shrink-0 group-hover:border-[#103557]/40 transition">
                <img src="/head-icon-kinau.png" alt={BRAND_NAME} className="w-full h-full object-contain" />
              </div>
            </NavLink>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-950 truncate">Drive File Cetak</h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#103557] border border-blue-200/60 shrink-0">
                  {orderData.order_number}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate" title={displayName}>
                {displayName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition cursor-pointer"
            >
              {Icon('Star', { size: 13, className: 'fill-current text-amber-500' })}
              <span>Ulas Pesanan</span>
            </button>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">
              {Icon('Lock', { size: 10 })}
              <span>Akses Publik</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-4 space-y-4 no-print">
        {/* ── 2. Drive Info Bar (Lihat Nota & Lokasi Workshop) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* View Nota Card */}
          <button
            type="button"
            onClick={() => setShowNotaModal(true)}
            className="relative overflow-hidden flex flex-col items-start justify-center p-4 sm:p-5 rounded-2xl bg-[#002660] text-white hover:bg-[#103557] active:scale-98 transition shadow-md shadow-[#002660]/20 text-left cursor-pointer min-h-[100px]"
          >
            <div className="absolute -top-3 -right-3 opacity-15">
              {Icon('FileText', { size: 80 })}
            </div>
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center mb-2">
              {Icon('FileText', { size: 20, className: 'text-white' })}
            </div>
            <span className="text-base font-extrabold leading-tight">Lihat Nota &amp; Rincian Pesanan</span>
            <span className="text-[11px] text-blue-200 mt-0.5">Rincian produk, invoice, status DP &amp; cetak nota</span>
          </button>

          {/* View Workshop Location Card */}
          <a
            href={getGoogleMapsLink()}
            target="_blank"
            rel="noreferrer"
            className="relative overflow-hidden flex flex-col items-start justify-center p-4 sm:p-5 rounded-2xl bg-[#059669] text-white hover:bg-[#047857] active:scale-98 transition shadow-md shadow-emerald-600/20 text-left no-underline cursor-pointer min-h-[100px]"
          >
            <div className="absolute -top-3 -right-3 opacity-15">
              {Icon('MapPin', { size: 80 })}
            </div>
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center mb-2">
              {Icon('MapPin', { size: 20, className: 'text-white' })}
            </div>
            <span className="text-base font-extrabold leading-tight">Lokasi Workshop &amp; Pengambilan</span>
            <span className="text-[11px] text-emerald-100 mt-0.5">Buka peta Google Maps Workshop Central Kinau</span>
          </a>
        </div>

        {/* ── 3. Breadcrumb & Action Bar ── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 flex items-center justify-between gap-3 shadow-2xs overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 min-w-max">
            {breadcrumbs.map((b, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              const linkUrl = b.id
                ? `/public/drive-link/${domain}?folder_id=${b.id}`
                : `/public/drive-link/${domain}`;

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-300">/</span>}
                  {isLast ? (
                    <span className="text-[#103557] font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      {b.name}
                    </span>
                  ) : (
                    <NavLink to={linkUrl} className="hover:text-slate-900 no-underline px-1 py-0.5">
                      {b.name}
                    </NavLink>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {files.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadAllFiles}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                {Icon('Download', { size: 13 })}
                <span>Unduh Semua ({files.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCreateFolderModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              {Icon('FolderPlus', { size: 14 })}
              <span>Folder Baru</span>
            </button>
            <button
              type="button"
              onClick={() => setShowUploadFileModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold transition cursor-pointer"
            >
              {Icon('UploadCloud', { size: 14 })}
              <span>Unggah File</span>
            </button>
          </div>
        </div>

        {/* ── 4. Drive Grid: Folders & Files ── */}
        <div className="space-y-4" onClick={() => setActiveMenuId(null)}>
          {folders.length === 0 && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 py-20 bg-white rounded-3xl border border-slate-200 border-dashed space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                {Icon('Folder', { size: 36, className: 'text-slate-300' })}
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-slate-700">Folder masih kosong</p>
                <p className="text-xs text-slate-400">
                  Gunakan tombol <strong>Unggah File</strong> atau <strong>Folder Baru</strong> untuk mengisi berkas.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Folder Cards */}
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => {
                    window.location.href = `/public/drive-link/${domain}?folder_id=${folder.id}`;
                  }}
                  className="group relative p-3.5 rounded-2xl border border-slate-200/90 bg-white flex flex-col items-center gap-2.5 cursor-pointer hover:shadow-md hover:border-[#103557]/40 active:scale-98 transition duration-150"
                >
                  {/* Context menu for folder */}
                  <div
                    className="absolute top-2 right-2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === `folder-${folder.id}` ? null : `folder-${folder.id}`);
                    }}
                  >
                    <button
                      type="button"
                      className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
                    >
                      {Icon('MoreVertical', { size: 12 })}
                    </button>

                    {activeMenuId === `folder-${folder.id}` && (
                      <div className="absolute top-7 right-0 w-36 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-30 animate-in fade-in duration-150">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFolderForRename(folder);
                            setRenameFolderName(folder.folder_name);
                            setShowRenameModal(true);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg text-left cursor-pointer"
                        >
                          {Icon('Edit3', { size: 12, className: 'text-slate-500' })}
                          <span>Ganti Nama</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg text-left cursor-pointer"
                        >
                          {Icon('Trash2', { size: 12 })}
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="w-full aspect-square flex items-center justify-center bg-amber-50/80 rounded-xl">
                    {Icon('Folder', { size: 44, className: 'text-amber-500 fill-amber-500/80' })}
                  </div>

                  <p
                    className="text-xs font-bold text-slate-800 text-center w-full leading-tight line-clamp-2"
                    title={folder.folder_name}
                  >
                    {folder.folder_name}
                  </p>
                </div>
              ))}

              {/* File Cards */}
              {files.map((file) => {
                const isImage = /\.(png|jpe?g|webp|svg|gif)$/i.test(file.file_name) || file.mime_type?.includes('image');
                const isPdf = /\.pdf$/i.test(file.file_name) || file.mime_type?.includes('pdf');

                return (
                  <div
                    key={file.id}
                    onClick={() => {
                      if (isImage) {
                        setZoomedFile(file);
                      } else if (file.file_url) {
                        window.open(file.file_url, '_blank');
                      }
                    }}
                    className="group relative p-3.5 rounded-2xl border border-slate-200/90 bg-white flex flex-col items-center gap-2.5 cursor-pointer hover:shadow-md hover:border-[#103557]/40 active:scale-98 transition duration-150"
                  >
                    {/* Context menu for file */}
                    <div
                      className="absolute top-2 right-2 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === `file-${file.id}` ? null : `file-${file.id}`);
                      }}
                    >
                      <button
                        type="button"
                        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
                      >
                        {Icon('MoreVertical', { size: 12 })}
                      </button>

                      {activeMenuId === `file-${file.id}` && (
                        <div className="absolute top-7 right-0 w-36 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-30 animate-in fade-in duration-150">
                          {isImage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomedFile(file);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg text-left cursor-pointer"
                            >
                              {Icon('Eye', { size: 12, className: 'text-slate-500' })}
                              <span>Preview</span>
                            </button>
                          )}
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noreferrer"
                            download={file.file_name}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg text-left no-underline cursor-pointer"
                          >
                            {Icon('Download', { size: 12, className: 'text-slate-500' })}
                            <span>Unduh File</span>
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg text-left cursor-pointer"
                          >
                            {Icon('Trash2', { size: 12 })}
                            <span>Hapus</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="w-full aspect-square flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden relative">
                      {isImage && file.file_url ? (
                        <img
                          src={file.file_url}
                          alt={file.file_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        Icon(isPdf ? 'FileText' : 'File', {
                          size: 40,
                          className: isPdf ? 'text-rose-500' : 'text-blue-500',
                        })
                      )}
                    </div>

                    <div className="w-full text-center space-y-0.5">
                      <p
                        className="text-xs font-bold text-slate-800 leading-tight line-clamp-2 truncate"
                        title={file.file_name}
                      >
                        {file.file_name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {file.file_size || 'File Cetak'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── 5. Floating Action Button (FAB) ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5 no-print">
        {fabOpen && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 flex flex-col gap-1 w-48 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <button
              type="button"
              onClick={() => {
                setShowUploadFileModal(true);
                setFabOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#103557] transition text-left cursor-pointer"
            >
              {Icon('UploadCloud', { size: 15, className: 'text-[#103557]' })}
              <span>Unggah File</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateFolderModal(true);
                setFabOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#103557] transition text-left cursor-pointer"
            >
              {Icon('FolderPlus', { size: 15, className: 'text-amber-500' })}
              <span>Folder Baru</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReviewModal(true);
                setFabOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition text-left cursor-pointer"
            >
              {Icon('Star', { size: 15, className: 'text-amber-400 fill-current' })}
              <span>Beri Ulasan</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
            fabOpen ? 'bg-slate-800 rotate-45' : 'bg-[#002660]'
          }`}
        >
          {Icon('Plus', { size: 24 })}
        </button>
      </div>

      {/* ── 6. Modals & Interactive Overlays ── */}

      {/* Full Zoom Image Modal */}
      {zoomedFile && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomedFile(null)}
        >
          <div className="absolute top-6 right-6 flex items-center gap-3">
            {zoomedFile.file_url && (
              <a
                href={zoomedFile.file_url}
                target="_blank"
                rel="noreferrer"
                download={zoomedFile.file_name}
                onClick={(e) => e.stopPropagation()}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition flex items-center justify-center cursor-pointer"
                title="Unduh File"
              >
                {Icon('Download', { size: 20 })}
              </a>
            )}
            <button
              type="button"
              onClick={() => setZoomedFile(null)}
              className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition flex items-center justify-center cursor-pointer"
            >
              {Icon('X', { size: 22 })}
            </button>
          </div>
          <img
            src={zoomedFile.file_url}
            alt={zoomedFile.file_name}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Buat Folder Baru</h3>
              <button
                type="button"
                onClick={() => setShowCreateFolderModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {Icon('X', { size: 18 })}
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Nama Folder</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: 04. Revisi Mockup Final"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#103557] focus:bg-white"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {showRenameModal && selectedFolderForRename && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Ganti Nama Folder</h3>
              <button
                type="button"
                onClick={() => setShowRenameModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {Icon('X', { size: 18 })}
              </button>
            </div>
            <form onSubmit={handleRenameFolder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Nama Baru</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={renameFolderName}
                  onChange={(e) => setRenameFolderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#103557] focus:bg-white"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadFileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Unggah File Cetak</h3>
              <button
                type="button"
                onClick={() => setShowUploadFileModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {Icon('X', { size: 18 })}
              </button>
            </div>
            <form onSubmit={handleUploadFile} className="space-y-4">
              {/* Direct file select trigger */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#103557]/60 rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50/60 flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#103557] flex items-center justify-center">
                  {Icon('UploadCloud', { size: 20 })}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {newFileName ? newFileName : 'Pilih File dari Perangkat'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    PDF, CDR, AI, PNG, JPG, atau ZIP hingga 50MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleLocalFileSelect}
                  accept="image/*,.pdf,.zip,.rar,.ai,.cdr,.psd"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Nama File</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Desain_Depan_Final.pdf"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#103557] focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Link Drive / URL Berkas (Opsional jika upload lokal)
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/... atau hasil upload lokal"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#103557] focus:bg-white font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadFileModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Tambahkan File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. Full Interactive & Printable NOTA PESANAN Modal (Matching Reference) ── */}
      {showNotaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 max-h-[92vh] overflow-y-auto print-container">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <img
                  src="/kinau-logo.png"
                  alt={BRAND_NAME}
                  className="h-8 w-auto object-contain mb-1"
                />
                <p className="text-[11px] text-slate-500 font-medium">
                  Kinau | Percetakan ID Card, Lanyard &amp; Apparel
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-base font-extrabold text-slate-400 uppercase tracking-widest">
                  NOTA PESANAN
                </h2>
                <p className="text-xs font-mono font-bold text-slate-900">
                  #{orderData.order_number}
                </p>
                <p className="text-[11px] text-slate-500">
                  {orderData.created_on
                    ? new Date(orderData.created_on).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Pesanan Aktif'}
                </p>
              </div>
            </div>

            {/* Customer & Status Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                  Pemesan / Instansi
                </span>
                <p className="text-base font-extrabold text-slate-900 leading-tight">
                  {displayName}
                </p>
                {orderData.pic_name && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    PJ: <strong>{orderData.pic_name}</strong> {orderData.pic_phone ? `(${orderData.pic_phone})` : ''}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                    Status Produksi
                  </span>
                  <span className="inline-block font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-[#103557] capitalize">
                    {orderData.status || 'Sedang Diproses'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                    Status Pembayaran
                  </span>
                  <span
                    className={`inline-block font-bold px-2.5 py-1 rounded-lg capitalize ${
                      isPaidOff
                        ? 'bg-emerald-100 text-emerald-800'
                        : paid > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isPaidOff ? 'Lunas' : paid > 0 ? 'DP Diterima' : 'Belum Bayar'}
                  </span>
                </div>
              </div>

              {orderData.deadline && (
                <div className="pt-2 border-t border-slate-200/60 text-xs flex items-center justify-between">
                  <span className="text-slate-400">Target Selesai / Deadline:</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {new Date(orderData.deadline).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Rincian Produk
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Produk</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Harga</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orderItems.length > 0 ? (
                      orderItems.map((item, idx) => {
                        const itemQty = Number(item.qty || 1);
                        const itemPrice = Number(item.variant_price || item.unit_price || 0);
                        const itemTotal = Number(item.variant_final_price || item.subtotal || itemQty * itemPrice);

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">
                                {item.product_name || item.name || 'Produk Cetak'}
                              </div>
                              {item.variant_name && (
                                <span className="text-[10px] text-slate-500 block">
                                  Varian: {item.variant_name}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-medium">
                              {itemQty}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              Rp {itemPrice.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              Rp {itemTotal.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {orderData.notes || 'Paket Cetak Custom Kinau'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-medium">1</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          Rp {subtotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          Rp {subtotal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex justify-end">
              <div className="w-full sm:w-3/5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Tagihan</span>
                  <span className="font-bold font-mono text-slate-900">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Uang Muka (DP)</span>
                  <span className="font-bold font-mono text-emerald-600">
                    Rp {paid.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-slate-200">
                  <span>Sisa Pelunasan</span>
                  <span className={`font-mono ${isPaidOff ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Rp {remain.toLocaleString('id-ID')}
                  </span>
                </div>
                {isPaidOff && (
                  <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-600 font-bold uppercase mt-1">
                    {Icon('CheckCircle', { size: 13 })}
                    <span>LUNAS</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bank Transfer Information */}
            <div className="p-4 bg-blue-50/80 border border-blue-200/70 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#103557] uppercase tracking-wider">
                <span className="w-1.5 h-3.5 bg-[#103557] rounded-full"></span>
                <span>Informasi Rekening Pembayaran</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Bank Syariah Indonesia (BSI)</span>
                  <span className="text-base font-mono font-bold text-slate-950">7366544822</span>
                  <span className="text-[10px] text-slate-500 block">a.n PT KINAU DIGITAL KREATIF</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAccountNumber}
                  className="px-3 py-1.5 bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer no-print"
                >
                  {Icon(copiedAccount ? 'Check' : 'Copy', { size: 13 })}
                  <span>{copiedAccount ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Actions: Cetak Nota, CS, Maps, Bukti Bayar */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={handlePrintNota}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {Icon('Printer', { size: 14 })}
                <span>Cetak Nota</span>
              </button>

              <a
                href={getWhatsAppLink(
                  ADMIN_WA,
                  `Halo Admin Kinau ID, saya ingin konfirmasi pesanan #${orderData.order_number} (${displayName})`
                )}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 no-underline cursor-pointer shadow-xs"
              >
                {Icon('Phone', { size: 14 })}
                <span>Chat Admin</span>
              </a>

              {(orderData.payment_proof || orderData.dp_payment_proof) && (
                <button
                  type="button"
                  onClick={() => setShowProofModal(true)}
                  className="col-span-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#103557] border border-blue-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {Icon('Eye', { size: 14 })}
                  <span>Lihat Bukti Pembayaran / DP</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowNotaModal(false)}
                className="col-span-2 py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Tutup Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Modal */}
      {showProofModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowProofModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Bukti Transfer Pembayaran</h3>
              <button
                type="button"
                onClick={() => setShowProofModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {Icon('X', { size: 18 })}
              </button>
            </div>
            <div className="space-y-3">
              {orderData.dp_payment_proof && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700">Bukti Uang Muka (DP)</span>
                  <img
                    src={orderData.dp_payment_proof}
                    alt="Bukti DP"
                    className="w-full h-auto max-h-60 object-contain rounded-xl border border-slate-200"
                  />
                </div>
              )}
              {orderData.payment_proof && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700">Bukti Pelunasan</span>
                  <img
                    src={orderData.payment_proof}
                    alt="Bukti Pelunasan"
                    className="w-full h-auto max-h-60 object-contain rounded-xl border border-slate-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Ulasan &amp; Rating Kepuasan</h3>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {Icon('X', { size: 18 })}
              </button>
            </div>
            <form onSubmit={handleSendReview} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Rating Pelayanan</label>
                <div className="flex items-center gap-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition cursor-pointer"
                    >
                      {Icon('Star', {
                        size: 24,
                        className: star <= reviewRating ? 'fill-current text-amber-400' : 'text-slate-200',
                      })}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Ulasan Anda</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ceritakan pengalaman Anda mengenai ketajaman cetak, kecepatan pengerjaan, dan pelayanan Kinau ID..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#103557] focus:bg-white resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Kirim Ulasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 8mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
