import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Icon } from '~/builder';
import type { TShirtDesignConfig, TShirtZone, TShirtPattern, TShirtText, TShirtLogo } from '~/schemas/customizer.schema';
import { CUSTOMIZER_TEMPLATES } from '~/schemas/customizer.schema';

export interface TShirtCanvas2DProps {
  config: TShirtDesignConfig;
  onChange: (newConfig: TShirtDesignConfig) => void;
  onTextureChange: (canvas: HTMLCanvasElement) => void;
}

const COLOR_PRESETS = [
  '#090d16', '#0f172a', '#18181b', '#1e293b', '#334155',
  '#dc2626', '#ef4444', '#f43f5e', '#ea580c', '#f59e0b',
  '#16a34a', '#22c55e', '#10b981', '#06b6d4', '#0284c7',
  '#2563eb', '#6366f1', '#8b5cf6', '#d946ef', '#ffffff',
];

export function TShirtCanvas2D({
  config,
  onChange,
  onTextureChange,
}: TShirtCanvas2DProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<'colors' | 'text' | 'logo' | 'presets' | 'upload'>('colors');
  const [logoImageObj, setLogoImageObj] = useState<HTMLImageElement | null>(null);
  const [uploadedDesignImg, setUploadedDesignImg] = useState<HTMLImageElement | null>(null);
  const [uploadedDesignPreview, setUploadedDesignPreview] = useState<string | null>(null);
  const [uploadZone, setUploadZone] = useState<'full' | 'front' | 'back'>('full');
  const [uploadOpacity, setUploadOpacity] = useState(1.0);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load logo image object when url changes
  useEffect(() => {
    if (config.logo.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLogoImageObj(img);
      };
      img.src = config.logo.url;
    } else {
      setLogoImageObj(null);
    }
  }, [config.logo.url]);

  // Draw 2D UV Texture onto Canvas
  const drawTexture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const halfW = W / 2;
    const halfH = H / 2;

    ctx.clearRect(0, 0, W, H);

    // 1. Fill Zones: Front (Top-Left), Back (Top-Right), Left Sleeve (Bottom-Left), Right Sleeve (Bottom-Right)
    // Front Zone (0, 0, halfW, halfH)
    ctx.fillStyle = config.zones.frontColor;
    ctx.fillRect(0, 0, halfW, halfH);

    // Back Zone (halfW, 0, halfW, halfH)
    ctx.fillStyle = config.zones.backColor;
    ctx.fillRect(halfW, 0, halfW, halfH);

    // Left Sleeve (0, halfH, halfW, halfH)
    ctx.fillStyle = config.zones.leftSleeveColor;
    ctx.fillRect(0, halfH, halfW, halfH);

    // Right Sleeve (halfW, halfH, halfW, halfH)
    ctx.fillStyle = config.zones.rightSleeveColor;
    ctx.fillRect(halfW, halfH, halfW, halfH);

    // 2. Draw Patterns on Front and Back
    if (config.pattern.patternId !== 'none') {
      ctx.save();
      ctx.globalAlpha = config.pattern.patternOpacity;
      ctx.fillStyle = config.pattern.patternColor;
      ctx.strokeStyle = config.pattern.patternColor;

      const { patternId, patternScale } = config.pattern;

      if (patternId === 'stripes') {
        const stripeWidth = 24 * patternScale;
        const gap = 36 * patternScale;
        // Front stripes
        for (let x = 30; x < halfW; x += stripeWidth + gap) {
          ctx.fillRect(x, 0, stripeWidth, halfH);
        }
        // Back stripes
        for (let x = halfW + 30; x < W; x += stripeWidth + gap) {
          ctx.fillRect(x, 0, stripeWidth, halfH);
        }
      } else if (patternId === 'cyber') {
        ctx.lineWidth = 4 * patternScale;
        // Cyber diagonals and angles
        for (let i = 0; i < 6; i++) {
          const offset = i * 80 * patternScale;
          // Front
          ctx.beginPath();
          ctx.moveTo(0, offset);
          ctx.lineTo(halfW, offset + 120 * patternScale);
          ctx.lineTo(halfW, offset + 160 * patternScale);
          ctx.lineTo(0, offset + 40 * patternScale);
          ctx.fill();

          // Back
          ctx.beginPath();
          ctx.moveTo(halfW, offset);
          ctx.lineTo(W, offset + 120 * patternScale);
          ctx.lineTo(W, offset + 160 * patternScale);
          ctx.lineTo(halfW, offset + 40 * patternScale);
          ctx.fill();
        }
      } else if (patternId === 'gradient') {
        const gradFront = ctx.createLinearGradient(0, 0, 0, halfH);
        gradFront.addColorStop(0, config.pattern.patternColor);
        gradFront.addColorStop(1, 'transparent');
        ctx.fillStyle = gradFront;
        ctx.fillRect(0, 0, halfW, halfH);

        const gradBack = ctx.createLinearGradient(halfW, 0, halfW, halfH);
        gradBack.addColorStop(0, config.pattern.patternColor);
        gradBack.addColorStop(1, 'transparent');
        ctx.fillStyle = gradBack;
        ctx.fillRect(halfW, 0, halfW, halfH);
      } else if (patternId === 'camo') {
        // Digital camo blocks
        const size = 32 * patternScale;
        for (let y = 0; y < halfH; y += size) {
          for (let x = 0; x < W; x += size) {
            if ((Math.sin(x * 13 + y * 7) > 0.3)) {
              ctx.fillRect(x, y, size, size);
            }
          }
        }
      } else if (patternId === 'dots') {
        const rad = 8 * patternScale;
        const spacing = 40 * patternScale;
        for (let y = 30; y < halfH; y += spacing) {
          for (let x = 30; x < W; x += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, rad, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    // 3. Collar trim banner
    ctx.fillStyle = config.zones.collarColor;
    ctx.fillRect(0, 0, halfW, 30); // Front collar top edge
    ctx.fillRect(halfW, 0, halfW, 20); // Back collar top edge

    // 4. Draw Logo if present
    if (config.logo.enabled && logoImageObj) {
      ctx.save();
      const scale = config.logo.scale;
      const logoW = 120 * scale;
      const logoH = 120 * scale;

      let lx = 0;
      let ly = 0;
      if (config.logo.position === 'left_chest') {
        lx = halfW * 0.7 - logoW / 2;
        ly = halfH * 0.3 - logoH / 2;
      } else if (config.logo.position === 'center_chest') {
        lx = halfW * 0.5 - logoW / 2;
        ly = halfH * 0.35 - logoH / 2;
      } else if (config.logo.position === 'back_top') {
        lx = halfW + halfW * 0.5 - logoW / 2;
        ly = halfH * 0.25 - logoH / 2;
      } else if (config.logo.position === 'back_center') {
        lx = halfW + halfW * 0.5 - logoW / 2;
        ly = halfH * 0.45 - logoH / 2;
      }

      ctx.drawImage(logoImageObj, lx, ly, logoW, logoH);
      ctx.restore();
    }

    // 5. Draw Nameset & Numbers
    if (config.text.enabled) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // FRONT TEXT / CHEST SPONSOR
      if (config.text.showOnFront && config.text.text) {
        ctx.font = `bold 42px ${config.text.fontFamily}`;
        ctx.fillStyle = config.text.textColor;
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.fillText(config.text.text.toUpperCase(), halfW * 0.5, halfH * 0.55);
      }

      // BACK NAMESET & NUMBER
      if (config.text.showOnBack) {
        // Name
        if (config.text.text) {
          ctx.font = `bold 36px ${config.text.fontFamily}`;
          ctx.fillStyle = config.text.textColor;
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 6;
          ctx.fillText(config.text.text.toUpperCase(), halfW + halfW * 0.5, halfH * 0.28);
        }

        // Big Number
        if (config.text.number) {
          ctx.font = `900 130px ${config.text.fontFamily}`;
          ctx.fillStyle = config.text.numberColor;
          ctx.shadowColor = 'rgba(0,0,0,0.7)';
          ctx.shadowBlur = 10;
          ctx.fillText(config.text.number, halfW + halfW * 0.5, halfH * 0.58);
        }
      }

      ctx.restore();
    }

    // 6. Draw uploaded design image
    if (uploadedDesignImg) {
      ctx.save();
      ctx.globalAlpha = uploadOpacity;
      if (uploadZone === 'full') {
        ctx.drawImage(uploadedDesignImg, 0, 0, W, H);
      } else if (uploadZone === 'front') {
        ctx.drawImage(uploadedDesignImg, 0, 0, halfW, halfH);
      } else if (uploadZone === 'back') {
        ctx.drawImage(uploadedDesignImg, halfW, 0, halfW, halfH);
      }
      ctx.restore();
    }

    // 7. Notify 3D engine
    onTextureChange(canvas);
  }, [config, logoImageObj, onTextureChange, uploadedDesignImg, uploadZone, uploadOpacity]);

  // Trigger redraw on mount & config changes
  useEffect(() => {
    drawTexture();
  }, [drawTexture]);

  // Handle logo image upload (for logo tab)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({
            ...config,
            logo: { ...config.logo, enabled: true, url: String(event.target?.result) },
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle full design upload
  const processDesignFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result);
      setUploadedDesignPreview(dataUrl);
      const img = new Image();
      img.onload = () => setUploadedDesignImg(img);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDesignFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processDesignFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processDesignFile(file);
  };

  const clearDesign = () => {
    setUploadedDesignImg(null);
    setUploadedDesignPreview(null);
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const updateZoneColor = (zoneKey: keyof TShirtZone, color: string) => {
    onChange({
      ...config,
      zones: {
        ...config.zones,
        [zoneKey]: color,
      },
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Hidden 2D Canvas for Texture Generation */}
      <canvas
        ref={canvasRef}
        width={1024}
        height={1024}
        className="hidden"
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'colors' ? 'bg-[#103557] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {Icon('Palette', { className: 'w-3.5 h-3.5' })}
          <span>Warna & Pola</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'text' ? 'bg-[#103557] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {Icon('Type', { className: 'w-3.5 h-3.5' })}
          <span>Teks & Nameset</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logo')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'logo' ? 'bg-[#103557] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {Icon('Image', { className: 'w-3.5 h-3.5' })}
          <span>{'Logo & Sponsor'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 relative ${
            activeTab === 'upload' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {Icon('Upload', { className: 'w-3.5 h-3.5' })}
          <span>Upload Desain</span>
          {uploadedDesignImg && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'presets' ? 'bg-[#103557] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {Icon('Sparkles', { className: 'w-3.5 h-3.5' })}
          <span>Template Desain</span>
        </button>
      </div>


      {/* TAB 1: WARNA & POLA */}
      {activeTab === 'colors' && (
        <div className="space-y-4">
          {/* Zone Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Badan Depan (Front)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.zones.frontColor}
                  onChange={(e) => updateZoneColor('frontColor', e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                />
                <span className="text-xs font-mono text-slate-600 uppercase">{config.zones.frontColor}</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Badan Belakang (Back)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.zones.backColor}
                  onChange={(e) => updateZoneColor('backColor', e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                />
                <span className="text-xs font-mono text-slate-600 uppercase">{config.zones.backColor}</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Lengan (Sleeves)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.zones.leftSleeveColor}
                  onChange={(e) => {
                    updateZoneColor('leftSleeveColor', e.target.value);
                    updateZoneColor('rightSleeveColor', e.target.value);
                  }}
                  className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                />
                <span className="text-xs font-mono text-slate-600 uppercase">{config.zones.leftSleeveColor}</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Kerah & Rib (Collar)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.zones.collarColor}
                  onChange={(e) => updateZoneColor('collarColor', e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                />
                <span className="text-xs font-mono text-slate-600 uppercase">{config.zones.collarColor}</span>
              </div>
            </div>
          </div>

          {/* Color Palettes Quick Select */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 block mb-1.5">Preset Warna Cepat:</span>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    onChange({
                      ...config,
                      zones: {
                        ...config.zones,
                        frontColor: hex,
                        backColor: hex,
                      },
                    });
                  }}
                  style={{ backgroundColor: hex }}
                  className="w-6 h-6 rounded-md border border-slate-200 shadow-2xs hover:scale-110 transition-transform"
                />
              ))}
            </div>
          </div>

          {/* Pattern Selector */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="text-[11px] font-bold text-slate-700 block">Motif & Grafis Sublim</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'Polos (Solid)' },
                { id: 'cyber', label: 'Cyber Waves' },
                { id: 'stripes', label: 'Stripes' },
                { id: 'gradient', label: 'Gradient Flare' },
                { id: 'camo', label: 'Digital Camo' },
                { id: 'dots', label: 'Matrix Dots' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...config,
                      pattern: { ...config.pattern, patternId: p.id as any },
                    })
                  }
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    config.pattern.patternId === p.id
                      ? 'border-[#103557] bg-blue-50/80 text-[#103557] font-bold shadow-2xs'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {config.pattern.patternId !== 'none' && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-600 font-medium">Warna Motif:</span>
                  <input
                    type="color"
                    value={config.pattern.patternColor}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        pattern: { ...config.pattern, patternColor: e.target.value },
                      })
                    }
                    className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                  />
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Transparansi:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={config.pattern.patternOpacity}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        pattern: { ...config.pattern, patternOpacity: Number(e.target.value) },
                      })
                    }
                    className="flex-1 accent-[#103557]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TEKS & NAMESET */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Personalisasi Teks / Nameset</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.text.enabled}
                onChange={(e) =>
                  onChange({
                    ...config,
                    text: { ...config.text, enabled: e.target.checked },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#103557]" />
            </label>
          </div>

          {config.text.enabled && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama / Teks Dada & Punggung</label>
                <input
                  type="text"
                  value={config.text.text}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      text: { ...config.text, text: e.target.value },
                    })
                  }
                  placeholder="Contoh: KINAU SPORT"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none font-bold uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nomor Punggung (0-99)</label>
                <input
                  type="text"
                  value={config.text.number}
                  maxLength={3}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      text: { ...config.text, number: e.target.value },
                    })
                  }
                  placeholder="10"
                  className="w-28 border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-[#103557] outline-none font-mono font-bold text-center text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Jenis Font</label>
                  <select
                    value={config.text.fontFamily}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        text: { ...config.text, fontFamily: e.target.value as any },
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    <option value="Impact">Impact (Sport Bold)</option>
                    <option value="Bebas Neue">Bebas Neue (Tall)</option>
                    <option value="Montserrat">Montserrat (Modern)</option>
                    <option value="Arial Black">Arial Black (Heavy)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Warna Nomor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.text.numberColor}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          text: { ...config.text, numberColor: e.target.value },
                        })
                      }
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-mono text-slate-600 uppercase">{config.text.numberColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LOGO & GAMBAR */}
      {activeTab === 'logo' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
            {Icon('UploadCloud', { className: 'w-8 h-8 mx-auto text-slate-400 mb-2' })}
            <p className="text-xs font-bold text-slate-700">Upload Logo / Sponsor (PNG Transparan)</p>
            <p className="text-[11px] text-slate-500 mb-3">Mendukung format PNG / JPG resolusi tinggi</p>
            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#103557] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors shadow-xs">
              <span>Pilih File Gambar</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />

            </label>
          </div>

          {config.logo.url && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <img src={config.logo.url} alt="Logo" className="w-10 h-10 object-contain rounded-lg bg-white border border-slate-200" />
                  <span className="text-xs font-semibold text-slate-800">Logo Aktif</span>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...config, logo: { ...config.logo, url: undefined, enabled: false } })}
                  className="text-rose-600 hover:text-rose-700 text-xs font-bold"
                >
                  Hapus
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Posisi Logo</label>
                <select
                  value={config.logo.position}
                  onChange={(e) => onChange({ ...config, logo: { ...config.logo, position: e.target.value as any } })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                >
                  <option value="left_chest">Dada Kiri (Logo Klub / Badge)</option>
                  <option value="center_chest">Tengah Dada (Sponsor Utama)</option>
                  <option value="back_top">Punggung Atas (Leher Belakang)</option>
                  <option value="back_center">Punggung Tengah</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Ukuran Logo Scale</label>
                <input
                  type="range"
                  min="0.3"
                  max="2.0"
                  step="0.1"
                  value={config.logo.scale}
                  onChange={(e) => onChange({ ...config, logo: { ...config.logo, scale: Number(e.target.value) } })}
                  className="w-full accent-[#103557]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TEMPLATE PRESETS */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-2 gap-3">
          {CUSTOMIZER_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onChange({ ...tmpl, id: `dsg-${Date.now()}` })}
              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#103557] transition-all text-left space-y-2 shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tmpl.zones.frontColor }} />
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tmpl.pattern.patternColor }} />
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tmpl.zones.collarColor }} />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 group-hover:text-[#103557]">{tmpl.title}</div>
                <div className="text-[10px] text-slate-500">{tmpl.fabricType} · {tmpl.collarType}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* TAB 5: UPLOAD DESAIN */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => uploadInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all select-none ${
              isDragOver
                ? 'border-emerald-400 bg-emerald-50 scale-[0.99]'
                : uploadedDesignPreview
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40'
            }`}
          >
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleDesignFileInput}
            />
            {uploadedDesignPreview ? (
              <div className="flex items-center gap-4">
                <img
                  src={uploadedDesignPreview}
                  alt="Preview desain"
                  className="w-20 h-20 object-contain rounded-xl border border-slate-200 bg-white shadow-xs flex-shrink-0"
                />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-1.5 mb-1">
                    {Icon('CheckCircle2', { className: 'w-4 h-4 text-emerald-500' })}
                    <span className="text-xs font-bold text-emerald-700">Desain Diupload</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Klik atau drag gambar baru untuk mengganti</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDragOver ? 'bg-emerald-400' : 'bg-slate-200'}`}>
                  {Icon('Upload', { className: `w-6 h-6 ${isDragOver ? 'text-white' : 'text-slate-500'}` })}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Drag &amp; drop atau klik untuk upload</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP, SVG · Maks. 10MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls: only show if image uploaded */}
          {uploadedDesignImg && (
            <div className="space-y-3 pt-1">
              {/* Zone Target */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Terapkan Ke Area:</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'full', label: 'Full Wrap', desc: 'Seluruh kaos' },
                    { id: 'front', label: 'Depan Saja', desc: 'Badan depan' },
                    { id: 'back', label: 'Belakang', desc: 'Badan belakang' },
                  ] as const).map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setUploadZone(z.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        uploadZone === z.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{z.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{z.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700">Opasitas Desain</label>
                  <span className="text-xs font-mono text-slate-500">{Math.round(uploadOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={uploadOpacity}
                  onChange={(e) => setUploadOpacity(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                  <span>Transparan</span>
                  <span>Solid</span>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  {Icon('Lightbulb', { className: 'w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0' })}
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    Gunakan gambar <strong>1024×1024 px</strong> atau <strong>PNG transparan</strong> agar hasil sublimasi lebih presisi. Untuk full wrap, gunakan template UV layout yang bisa didownload di atas.
                  </p>
                </div>
              </div>

              {/* Clear Button */}
              <button
                type="button"
                onClick={clearDesign}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
              >
                {Icon('Trash2', { className: 'w-3.5 h-3.5' })}
                Hapus Desain Upload
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
