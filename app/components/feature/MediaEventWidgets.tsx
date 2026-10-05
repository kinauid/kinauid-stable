import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Eye,
} from 'lucide-react';
import type { MediaEventData } from '~/schemas/media-event.schema';

interface MediaEventWidgetProps {
  data: MediaEventData;
  onRecordDownload: () => void;
}

export const MediaEventWidget: React.FC<MediaEventWidgetProps> = ({
  data,
  onRecordDownload,
}) => {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [participantName, setParticipantName] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load and render composite canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = 1000;
    const canvasHeight = 1000;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw user photo first (underneath)
    if (userPhoto) {
      const userImg = new Image();
      userImg.crossOrigin = 'anonymous';
      userImg.src = userPhoto;
      userImg.onload = () => {
        ctx.save();
        ctx.translate(canvasWidth / 2 + posX, canvasHeight / 2 + posY);
        ctx.scale(scale, scale);

        // Aspect ratio cover calculation
        const imgAspect = userImg.width / userImg.height;
        let drawW = canvasWidth;
        let drawH = canvasHeight;
        if (imgAspect > 1) {
          drawW = canvasHeight * imgAspect;
        } else {
          drawH = canvasWidth / imgAspect;
        }

        ctx.drawImage(userImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Draw Twibbon Frame on top
        drawTwibbonFrame(ctx, canvasWidth, canvasHeight);
      };
    } else {
      // Draw placeholder guide
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(100, 100, 800, 800);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Klik tombol "Pilih Foto" di bawah', canvasWidth / 2, canvasHeight / 2);

      // Draw frame on top
      drawTwibbonFrame(ctx, canvasWidth, canvasHeight);
    }
  }, [userPhoto, scale, posX, posY, data?.frame_url]);

  const drawTwibbonFrame = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // If custom image frame provided
    if (data?.frame_url && !data.frame_url.includes('sample-twibbon-frame')) {
      const frameImg = new Image();
      frameImg.crossOrigin = 'anonymous';
      frameImg.src = data.frame_url;
      frameImg.onload = () => {
        ctx.drawImage(frameImg, 0, 0, w, h);
      };
    } else {
      // Procedural modern default twibbon frame overlay
      // Top header gradient badge
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#1d4ed8');
      grad.addColorStop(1, '#0284c7');

      // Top banner
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, 140);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data?.title || 'TWIBBON RESMI EVENT', w / 2, 85);

      // Outer border styling
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 24;
      ctx.strokeRect(12, 12, w - 24, h - 24);

      // Bottom footer banner
      ctx.fillStyle = grad;
      ctx.fillRect(0, h - 180, w, 180);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(data?.organization || 'KINAU STUDIO APPAREL', w / 2, h - 110);

      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#93c5fd';
      ctx.fillText(data?.hashtags?.join(' ') || '#Event2026', w / 2, h - 60);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUserPhoto(event.target?.result as string);
      setScale(1);
      setPosX(0);
      setPosY(0);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - posX, y: e.clientY - posY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosX(e.clientX - dragStart.x);
    setPosY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `twibbon-${data.slug || 'event'}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    onRecordDownload();
  };

  const formattedCaption = (data?.caption_template || '')
    .replace('[Nama Lengkap]', participantName || '(Nama Saya)')
    .replace('[Nomor]', '01');

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(formattedCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Event Header Banner */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm space-y-3 text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 text-xs font-bold rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          Twibbon & Media Campaign Generator
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text)] tracking-tight">
          {data?.title}
        </h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {data?.description}
        </p>
        <div className="pt-2 flex items-center justify-center gap-4 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            {data?.total_downloads || 0} partisipasi
          </span>
          <span>•</span>
          <span>{data?.organization}</span>
        </div>
      </div>

      {/* Twibbon Interactive Canvas Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Canvas Preview & Controls */}
        <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="relative aspect-square max-w-[460px] mx-auto bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-[var(--border)] cursor-move select-none shadow-inner">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Photo Adjustment Toolbar */}
          <div className="space-y-4 max-w-[460px] mx-auto">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[var(--primary)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Upload className="w-4 h-4" />
                {userPhoto ? 'Ganti Foto' : 'Pilih Foto Anda'}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                Unduh Twibbon HD
              </button>
            </div>

            {userPhoto && (
              <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>Zoom / Skala Foto</span>
                  <span className="font-mono font-bold text-[var(--text)]">
                    {Math.round(scale * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full accent-[var(--primary)]"
                  />
                  <ZoomIn className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <p className="text-[10px] text-center text-[var(--text-muted)] pt-1">
                  Tip: Geser / drag langsung foto pada frame di atas untuk menyesuaikan posisi wajah.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Caption Generator & Share */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <Copy className="w-4 h-4 text-[var(--primary)]" />
                Caption Media Sosial
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Salin teks caption siap pakai untuk postingan Instagram feed, WhatsApp Story, atau TikTok.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nama Anda (Otomatis Isi Caption)</label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Tulis nama lengkap Anda..."
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <div className="relative">
              <textarea
                readOnly
                rows={8}
                value={formattedCaption}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl p-3.5 text-[var(--text)] focus:outline-none leading-relaxed resize-none font-mono"
              />
              <button
                type="button"
                onClick={handleCopyCaption}
                className="absolute right-3 bottom-3 flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition shadow-xs"
              >
                {copiedCaption ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Salin Caption
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 flex flex-wrap gap-1.5">
              {data?.hashtags?.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-blue-500/10 text-blue-600 rounded-lg text-[11px] font-bold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
