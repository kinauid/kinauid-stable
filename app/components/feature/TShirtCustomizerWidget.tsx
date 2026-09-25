import React, { useState, useCallback } from 'react';
import { Icon, Button, Badge } from '~/builder';
import type { TShirtDesignConfig } from '~/schemas/customizer.schema';
import { CUSTOMIZER_TEMPLATES } from '~/schemas/customizer.schema';
import { TShirtCanvas2D } from './TShirtCanvas2D';
import { TShirtPreview3D } from './TShirtPreview3D';

export interface TShirtCustomizerWidgetProps {
  initialConfig?: TShirtDesignConfig;
  onSave?: (config: TShirtDesignConfig) => void;
  onOrder?: (config: TShirtDesignConfig) => void;
  isSubmitting?: boolean;
}

export function TShirtCustomizerWidget({
  initialConfig,
  onSave,
  onOrder,
  isSubmitting = false,
}: TShirtCustomizerWidgetProps): React.ReactElement {
  const [config, setConfig] = useState<TShirtDesignConfig>(
    initialConfig || CUSTOMIZER_TEMPLATES[0]
  );
  const [canvasTextureSource, setCanvasTextureSource] = useState<HTMLCanvasElement | null>(null);
  const [textureVersion, setTextureVersion] = useState(0);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Canvas element ref is stable — increment version to force 3D update
  const handleTextureChange = useCallback((canvas: HTMLCanvasElement) => {
    setCanvasTextureSource(canvas);
    setTextureVersion((v) => v + 1);
  }, []);

  const handleSaveDraft = () => {
    if (onSave) {
      onSave(config);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDownloadUV = () => {
    if (!canvasTextureSource) return;
    const link = document.createElement('a');
    link.download = `pola-uv-kaos-${config.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvasTextureSource.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Design Overview Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{config.title}</h2>
            <Badge label="3D Live Sync" variant="primary" />
            <Badge label={config.fabricType} variant="outline" />
          </div>
          <p className="text-xs text-slate-500">
            Kustomisasi pola warna, nameset, logo, dan lihat hasil 3D secara realtime 360 derajat.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            label="Download UV Pola"
            icon="Download"
            variant="outline"
            size="sm"
            onClick={handleDownloadUV}
          />
          <Button
            label={savedSuccess ? 'Tersimpan!' : 'Simpan Draft'}
            icon={savedSuccess ? 'Check' : 'Save'}
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
            onClick={handleSaveDraft}
          />
          <Button
            label="Pesan Desain Ini"
            icon="ShoppingCart"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            onClick={() => onOrder && onOrder(config)}
          />
        </div>
      </div>

      {/* Split-Screen: 3D Viewport (Left) + 2D Canvas Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3D Interactive Viewport (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <TShirtPreview3D canvasSource={canvasTextureSource} textureVersion={textureVersion} autoRotateDefault={false} />


          {/* Quick Info & Tech Specs Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shadow-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">MATERIAL KAIN</span>
              <span className="font-semibold text-slate-200">{config.fabricType}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">TIPE KERAH</span>
              <span className="font-semibold text-slate-200">{config.collarType}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">TEKNOLOGI CETAK</span>
              <span className="font-semibold text-emerald-400">Sublim Fullprint HD</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">MINIMAL PESANAN</span>
              <span className="font-semibold text-slate-200">12 Pcs / Tim</span>
            </div>
          </div>
        </div>

        {/* Right Column: 2D Canvas UV Controller (5 Cols) */}
        <div className="lg:col-span-5">
          <TShirtCanvas2D
            config={config}
            onChange={setConfig}
            onTextureChange={handleTextureChange}
          />
        </div>
      </div>
    </div>
  );
}
