import React, { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Eraser,
  FolderOpen,
  Plus,
  Check,
  AlertCircle,
  Copy,
  Trash2,
  Palette,
  Printer,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
  type PrintCategory,
  type PrintSlot,
  type PrintOrder,
  type PrintOrderFolder,
} from '~/schemas/print-area.schema';

export interface PrintAreaWidgetProps {
  orders: PrintOrder[];
  initialCategory?: PrintCategory;
  onUpdateStatus: (id: string, status: string) => void;
  isSubmitting?: boolean;
}

export function PrintAreaWidget({
  orders = [],
  initialCategory = 'idcard',
  onUpdateStatus,
  isSubmitting = false,
}: PrintAreaWidgetProps): React.ReactElement {
  const [category, setCategory] = useState<PrintCategory>(initialCategory);
  const [slots, setSlots] = useState<PrintSlot[]>([]);
  const [lanyardSlots, setLanyardSlots] = useState<PrintSlot[]>([]);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Add folder's files to active slots
  const handleAddFolder = (folder: PrintOrderFolder, orderNum: string) => {
    const files = folder.files || [];
    if (files.length === 0) {
      toast.error('Folder ini tidak berisi file desain yang valid!');
      return;
    }

    const isBelakang = folder.folder_name?.toLowerCase().includes('belakang');

    const newSlots: PrintSlot[] = files.map((f, idx) => ({
      id: `${f.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileId: f.id,
      fileName: f.name,
      order_number: orderNum,
      parentId: folder.id,
      data: f.file_url,
      qtyNeeded: 1,
      hookColor: '#0a0a0a',
      isMasterColor: idx === 0,
      side: 1,
      isBack: isBelakang,
    }));

    if (category === 'lanyard') {
      setLanyardSlots((prev) => [...prev, ...newSlots]);
      toast.success(`${files.length} desain lanyard ditambahkan ke antrean cetak`);
    } else {
      setSlots((prev) => [...prev, ...newSlots]);
      toast.success(`${files.length} desain ID Card ditambahkan ke antrean cetak`);
    }
  };

  // Remove single slot
  const handleRemoveSlot = (index: number, isLanyard: boolean) => {
    if (isLanyard) {
      setLanyardSlots((prev) => {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });
    } else {
      setSlots((prev) => {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });
    }
  };

  // Duplicate single slot
  const handleCloneSlot = (index: number, isLanyard: boolean) => {
    if (isLanyard) {
      setLanyardSlots((prev) => {
        const next = [...prev];
        const source = next[index];
        next.splice(index + 1, 0, {
          ...source,
          id: `${source.fileId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isMasterColor: false,
        });
        return next;
      });
    } else {
      setSlots((prev) => {
        const next = [...prev];
        const source = next[index];
        next.splice(index + 1, 0, {
          ...source,
          id: `${source.fileId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });
        return next;
      });
    }
  };

  // Duplicate lanyard slots based on card count
  const handleCopyByCard = (index: number) => {
    const source = lanyardSlots[index];
    const order = orders.find((o) => o.order_number === source.order_number);
    if (!order) return;

    const allFolders = order.order_upload_folders || [];
    const cardFolder = allFolders.find(
      (f) =>
        f.folder_name.toLowerCase().includes('id card') ||
        f.folder_name.toLowerCase().includes('idcard') ||
        f.folder_name.toLowerCase().includes('depan')
    );

    const cardFilesCount = cardFolder?.files?.length || 10;
    const copies: PrintSlot[] = [];

    for (let i = 0; i < cardFilesCount; i++) {
      copies.push({
        ...source,
        id: `${source.fileId}-s1-${i}-${Date.now()}`,
        isMasterColor: false,
        side: 1,
      });
    }

    setLanyardSlots((prev) => {
      const next = [...prev];
      next.splice(index, 1, ...copies);
      return next;
    });

    toast.success(`Berhasil mengalikan ${cardFilesCount} slot lanyard sesuai kuantiti ID Card`);
  };

  // Update hook/strip color
  const handleUpdateColor = (slotId: string, color: string) => {
    setLanyardSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, hookColor: color } : s))
    );
  };

  // Clear all slots
  const handleClearSlots = () => {
    Swal.fire({
      title: 'Kosongkan Antrean?',
      text: `Semua susunan cetak pada kategori ${category.toUpperCase()} akan dibersihkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Kosongkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
    }).then((result) => {
      if (result.isConfirmed) {
        if (category === 'lanyard') setLanyardSlots([]);
        else setSlots([]);
        toast.info('Antrean cetak telah dikosongkan.');
      }
    });
  };

  // Chunking for sheets
  const chunkedIDPages = useMemo(() => {
    const pages: PrintSlot[][] = [];
    for (let i = 0; i < slots.length; i += 9) {
      pages.push(slots.slice(i, i + 9));
    }
    return pages.length > 0 ? pages : [[]];
  }, [slots]);

  const chunkedLanyardPages = useMemo(() => {
    const pages: PrintSlot[][] = [];
    for (let i = 0; i < lanyardSlots.length; i += 8) {
      pages.push(lanyardSlots.slice(i, i + 8));
    }
    return pages.length > 0 ? pages : [[]];
  }, [lanyardSlots]);

  const activeQueueCount = category === 'lanyard' ? lanyardSlots.length : slots.length;

  // Print execution handler
  const handleTriggerPrint = () => {
    if (activeQueueCount === 0) {
      toast.error('Antrean cetak masih kosong!');
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Print Styles for exact millimetric fidelity */}
      <style>{`
        @media print {
          @page {
            size: ${category === 'lanyard' ? '210mm 1032mm' : 'A4'};
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, aside, nav, button, .kinau-nav, .kinau-header {
            display: none !important;
          }
          .print-area-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
          }
          .a4-sheet-container {
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            background: white !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .lanyard-sheet-container {
            width: 210mm !important;
            height: 1032mm !important;
            page-break-after: always !important;
            break-after: page !important;
            background: white !important;
            margin: 0 !important;
            overflow: hidden !important;
            box-shadow: none !important;
            border: none !important;
          }
          .category-idcard .lanyard-sheet-container { display: none !important; }
          .category-lanyard .a4-sheet-container { display: none !important; }
        }
      `}</style>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 overflow-hidden">
        {/* Left Sidebar: Source & Queue Control (No Print) */}
        <aside className="no-print w-full lg:w-84 bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-sm flex flex-col flex-shrink-0 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-subtle)]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">Sumber Cetak</h3>
                <p className="text-[11px] text-[var(--muted-foreground)]">Antrean Pesanan Siap Cetak</p>
              </div>
            </div>
            <button
              onClick={handleClearSlots}
              disabled={activeQueueCount === 0}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition disabled:opacity-40"
              title="Kosongkan Antrean Cetak"
            >
              <Eraser size={16} />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex p-2 bg-[var(--surface-subtle)] border-b border-[var(--border)] gap-1">
            {(['idcard', 'lanyard', 'prod3'] as PrintCategory[]).map((cat) => {
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition uppercase flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {cat === 'idcard' ? 'ID Card' : cat === 'lanyard' ? 'Lanyard' : 'Prod 3'}
                </button>
              );
            })}
          </div>

          {/* Orders List / Queue Source */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {category === 'prod3' ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--muted-foreground)] space-y-2">
                <AlertCircle size={32} className="text-[var(--muted-foreground)] opacity-40" />
                <p className="text-xs font-semibold">Produk 3 Dalam Pengembangan</p>
                <p className="text-[10px]">Modul cetak untuk merchandise custom lainnya segera hadir.</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 px-4 text-[var(--muted-foreground)] space-y-2">
                <Sparkles size={24} className="mx-auto text-[var(--muted-foreground)] opacity-40" />
                <p className="text-xs font-bold">Tidak ada antrean pesanan</p>
                <p className="text-[11px]">Semua file pesanan telah selesai dicetak atau belum ada upload baru.</p>
              </div>
            ) : (
              orders.map((order) => {
                const folders = order.order_upload_folders || [];
                return (
                  <div
                    key={order.id}
                    className="p-3 border border-[var(--border)] rounded-xl bg-[var(--surface-subtle)] space-y-2.5 transition hover:border-blue-400"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                          {order.order_number}
                        </span>
                        <h4 className="text-xs font-bold text-[var(--foreground)] mt-1 truncate max-w-[170px]" title={order.institution_name}>
                          {order.institution_name}
                        </h4>
                      </div>
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: 'Tandai Selesai Cetak?',
                            text: `Pesanan ${order.order_number} (${order.institution_name}) akan ditandai selesai dicetak.`,
                            icon: 'question',
                            showCancelButton: true,
                            confirmButtonText: 'Ya, Tandai Selesai',
                            cancelButtonText: 'Batal',
                            confirmButtonColor: '#10b981',
                          }).then((result) => {
                            if (result.isConfirmed) {
                              onUpdateStatus(order.id, 'done');
                            }
                          });
                        }}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
                        title="Tandai Selesai Cetak (Printed)"
                      >
                        <Check size={14} />
                      </button>
                    </div>

                    {/* Subfolders for this order */}
                    <div className="space-y-1 pt-1">
                      {folders.length === 0 ? (
                        <p className="text-[10px] italic text-[var(--muted-foreground)]">Belum ada folder upload</p>
                      ) : (
                        folders.map((folder) => (
                          <button
                            key={folder.id}
                            onClick={() => handleAddFolder(folder, order.order_number)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-between border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 transition group"
                          >
                            <span className="truncate flex items-center gap-1.5">
                              <FolderOpen size={13} className="text-amber-500 flex-shrink-0" />
                              <span className="truncate">{folder.folder_name}</span>
                              <span className="text-[10px] text-[var(--muted-foreground)] font-bold">
                                ({folder.files?.length || 0})
                              </span>
                            </span>
                            <Plus size={13} className="text-[var(--muted-foreground)] group-hover:text-blue-600 transition" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer / Print CTA */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-subtle)] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--muted-foreground)] font-medium">Antrean Siap Cetak:</span>
              <span className="font-extrabold text-[var(--foreground)] px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                {activeQueueCount} Desain
              </span>
            </div>
            <button
              onClick={handleTriggerPrint}
              disabled={activeQueueCount === 0 || isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Printer size={16} /> CETAK {category.toUpperCase()}
            </button>
          </div>
        </aside>

        {/* Main Work Area: Visual Sheet Preview */}
        <main className="flex-1 bg-[var(--surface-subtle)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-inner overflow-y-auto p-4 lg:p-8 flex flex-col items-center custom-scrollbar print-area-wrapper">
          <div ref={printAreaRef} className={`flex flex-col items-center category-${category}`}>
            {category === 'lanyard' ? (
              // Lanyard Sheet Preview (210mm x 1032mm)
              chunkedLanyardPages.map((page, pageIdx) => (
                <div
                  key={pageIdx}
                  className="lanyard-sheet-container bg-white shadow-2xl mx-auto border border-gray-200 relative mb-16 overflow-hidden print:shadow-none print:border-0 print:m-0 print:mb-0"
                  style={{
                    width: '210mm',
                    height: '1032mm',
                    breakAfter: 'always',
                    boxSizing: 'border-box',
                  }}
                >
                  <div className="absolute top-[11mm] left-1/2 -translate-x-1/2 text-black font-extrabold text-[9px] no-print uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full border border-gray-300">
                    LEMBAR LANYARD #{pageIdx + 1}
                  </div>

                  {/* Alignment reference lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[
                      { color: '#000000', top: 'calc(15mm + 50mm)' },
                      { color: '#FFFF00', top: 'calc(15mm + 350mm)' },
                      { color: '#FF00FF', top: 'calc(15mm + 650mm)' },
                      { color: '#00FFFF', top: 'calc(15mm + 950mm)' },
                    ].map((line, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0"
                        style={{
                          top: line.top,
                          height: '0.2mm',
                          backgroundColor: line.color,
                          opacity: 0.5,
                        }}
                      />
                    ))}
                    <div
                      className="absolute left-0 right-0"
                      style={{
                        top: 'calc(15mm + 500mm)',
                        height: '0.5mm',
                        background: 'linear-gradient(to right, #000, #ff0, #f0f, #0ff)',
                      }}
                    />
                  </div>

                  {/* 8 Columns of Lanyard */}
                  <div
                    className="flex justify-center relative z-10"
                    style={{ width: '210mm', gap: '2mm', paddingTop: '15mm' }}
                  >
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const globalIdx = pageIdx * 8 + idx;
                      const slot = page[idx];

                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <div
                            className="relative group flex flex-col items-center"
                            style={{
                              width: '22mm',
                              height: '1000mm',
                              backgroundColor: slot ? 'white' : 'transparent',
                              outline: '0.1mm solid #e5e7eb',
                              boxSizing: 'content-box',
                            }}
                          >
                            {slot ? (
                              <>
                                <div
                                  className="relative overflow-hidden"
                                  style={{ width: '22mm', height: '900mm' }}
                                >
                                  {slot.data && (
                                    <img
                                      src={slot.data}
                                      alt="Lanyard"
                                      className="absolute"
                                      style={{
                                        width: '900mm',
                                        height: '22mm',
                                        left: '22mm',
                                        top: '0',
                                        transform: 'rotate(90deg)',
                                        transformOrigin: '0 0',
                                        maxWidth: 'none',
                                        objectFit: 'fill',
                                      }}
                                    />
                                  )}
                                </div>

                                <div
                                  style={{
                                    width: '100%',
                                    height: '0.2mm',
                                    backgroundColor: '#fff',
                                    zIndex: 5,
                                  }}
                                />

                                <div
                                  className="w-full flex-1"
                                  style={{ backgroundColor: slot.hookColor }}
                                />

                                {/* Interactive Hover Controls (No Print) */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition no-print flex flex-col items-center justify-start pt-8 gap-3 z-30">
                                  <button
                                    onClick={() => handleCopyByCard(globalIdx)}
                                    className="bg-blue-600 text-white p-3 rounded-full shadow-xl hover:scale-110 transition"
                                    title="Salin sesuai kuantiti ID Card"
                                  >
                                    <Copy size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleCloneSlot(globalIdx, true)}
                                    className="bg-emerald-600 text-white p-3 rounded-full shadow-xl hover:scale-110 transition"
                                    title="Duplikat Slot"
                                  >
                                    <Plus size={16} />
                                  </button>
                                  {slot.isMasterColor && (
                                    <div className="relative">
                                      <button className="bg-purple-600 text-white p-3 rounded-full shadow-xl hover:scale-110 transition">
                                        <Palette size={16} />
                                      </button>
                                      <input
                                        type="color"
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        value={slot.hookColor}
                                        onChange={(e) => handleUpdateColor(slot.id, e.target.value)}
                                        title="Ubah warna ujung lanyard"
                                      />
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleRemoveSlot(globalIdx, true)}
                                    className="bg-red-600 text-white p-3 rounded-full shadow-xl hover:scale-110 transition mt-4"
                                    title="Hapus Slot"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="text-[10px] text-gray-300 font-bold rotate-90 h-full flex items-center justify-center no-print uppercase tracking-widest">
                                KOSONG
                              </div>
                            )}
                          </div>
                          <div className="mt-2 font-black text-[10px] text-gray-400 no-print">
                            #{globalIdx + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              // A4 Sheet Preview for ID Card (210mm x 297mm, 3x3 grid)
              chunkedIDPages.map((page, pageIdx) => (
                <div
                  key={pageIdx}
                  className="a4-sheet-container bg-white shadow-2xl mx-auto border border-gray-200 relative mb-12 overflow-hidden print:shadow-none print:border-0 print:m-0 print:mb-0"
                  style={{
                    width: '210mm',
                    height: '297mm',
                    breakAfter: 'always',
                    imageRendering: '-webkit-optimize-contrast',
                    boxSizing: 'border-box',
                  }}
                >
                  <div className="absolute top-[3.8mm] left-1/2 -translate-x-1/2 text-black font-extrabold text-[8px] no-print uppercase tracking-widest bg-gray-100 px-3 py-0.5 rounded-full border border-gray-300">
                    LEMBAR A4 #{pageIdx + 1}
                  </div>

                  <div
                    className="grid grid-cols-3 h-full w-full"
                    style={{
                      paddingTop: '7.2mm',
                      paddingLeft: '15mm',
                      paddingRight: '15mm',
                      columnGap: '6mm',
                      rowGap: '6mm',
                    }}
                  >
                    {Array.from({ length: 9 }).map((_, localIdx) => {
                      const slot = page[localIdx];
                      const globalIdx = pageIdx * 9 + localIdx;
                      const colIdx = localIdx % 3;
                      const rowIdx = Math.floor(localIdx / 3);

                      return (
                        <div
                          key={localIdx}
                          className="flex flex-col items-center justify-start"
                          style={{
                            position: 'relative',
                            top: rowIdx === 1 ? '-7.2mm' : rowIdx === 2 ? '-14.4mm' : '0',
                            left: colIdx === 0 ? '-9.6mm' : colIdx === 2 ? '9.6mm' : '0',
                          }}
                        >
                          <div
                            className={`relative group flex items-center justify-center overflow-hidden ${
                              slot
                                ? 'bg-white border border-gray-200'
                                : 'bg-gray-50 border border-dashed border-gray-200'
                            }`}
                            style={{
                              width: '56mm',
                              height: '88mm',
                              boxSizing: 'border-box',
                            }}
                          >
                            {slot?.data && (
                              <img
                                src={slot.data}
                                alt={slot.fileName}
                                className="w-full h-full object-cover"
                              />
                            )}

                            {slot && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition no-print flex flex-col items-center justify-center gap-2 z-20">
                                <button
                                  onClick={() => handleCloneSlot(globalIdx, false)}
                                  className="bg-emerald-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition"
                                  title="Duplikat Desain"
                                >
                                  <Plus size={14} />
                                </button>
                                <button
                                  onClick={() => handleRemoveSlot(globalIdx, false)}
                                  className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition"
                                  title="Hapus Desain"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          <div
                            className="font-black text-black text-[9px] mt-[-0.5mm]"
                          >
                            {slot ? globalIdx + 1 : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 text-center text-[var(--muted-foreground)] text-[11px] font-medium max-w-md pb-8 no-print leading-relaxed">
            <span className="font-bold">Tips Operasional:</span> Klik tombol <span className="text-emerald-600 font-bold">✓ (Centang)</span> pada sidebar setelah mencetak untuk memperbarui status pesanan menjadi Selesai Cetak.
          </div>
        </main>
      </div>
    </div>
  );
}
