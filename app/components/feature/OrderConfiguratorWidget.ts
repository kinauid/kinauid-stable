import React, { useState } from 'react';
import { Row, Col, Span, P, H3, Badge, Button, Input, Select, Form, SubmitButton, Icon, ui, UI } from '~/builder';

export interface OrderConfiguratorWidgetProps {
  onSave?: (config: any) => void;
  isSubmitting?: boolean;
}

const TEMPLATES = [
  { id: 'tmpl-cyber-neon', name: 'Cyber Neon', desc: 'Futuristic geometric angular pattern', primary: '#0a192f', secondary: '#30b29e', accent: '#dc2626' },
  { id: 'tmpl-aurora-gradient', name: 'Aurora Gradient', desc: 'Smooth flowing energy color wave', primary: '#1e1b4b', secondary: '#818cf8', accent: '#38bdf8' },
  { id: 'tmpl-classic-minimal', name: 'Classic Stripes', desc: 'Timeless vertical sporting stripes', primary: '#18181b', secondary: '#ffffff', accent: '#e11d48' },
  { id: 'tmpl-retro-camo', name: 'Tactical Camo', desc: 'Dynamic digital camouflage motif', primary: '#1c1917', secondary: '#84cc16', accent: '#ea580c' },
];

export function OrderConfiguratorWidget(props: OrderConfiguratorWidgetProps): React.ReactElement {
  const { isSubmitting = false } = props;

  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [primaryColor, setPrimaryColor] = useState(TEMPLATES[0].primary);
  const [secondaryColor, setSecondaryColor] = useState(TEMPLATES[0].secondary);
  const [accentColor, setAccentColor] = useState(TEMPLATES[0].accent);
  const [fabric, setFabric] = useState('Dryfit Milano');
  const [collar, setCollar] = useState('V-Neck');
  const [sleeve, setSleeve] = useState('Pendek');
  const [playerName, setPlayerName] = useState('KINAU SPORT');
  const [playerNumber, setPlayerNumber] = useState('10');
  const [namesetEnabled, setNamesetEnabled] = useState(true);

  const handleSelectTemplate = (t: typeof TEMPLATES[0]) => {
    setSelectedTemplate(t);
    setPrimaryColor(t.primary);
    setSecondaryColor(t.secondary);
    setAccentColor(t.accent);
  };

  return ui('div')
    .class('grid grid-cols-1 lg:grid-cols-12 gap-6')
    .childrenOf(
      // Left Column: Visual Jersey Preview (5 Cols)
      ui('div')
        .class('lg:col-span-5 flex flex-col gap-4')
        .childrenOf(
          ui('div')
            .class('relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)] p-6 flex flex-col items-center justify-center min-h-[420px] shadow-sm')
            .childrenOf(
              // Glowing backdrop effect
              ui('div')
                .class('absolute inset-0 opacity-20 filter blur-3xl pointer-events-none')
                .style({ background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 70%)` })
                .build(),

              // Badge status
              ui('div')
                .class('absolute top-4 left-4 z-10 flex items-center gap-2')
                .childrenOf(
                  Badge({ label: selectedTemplate.name, variant: 'primary' }),
                  Badge({ label: `${collar} • ${sleeve}`, variant: 'outline' })
                ),

              // Mock Jersey SVG Graphic Representation
              ui('div')
                .class('relative z-10 w-full max-w-[280px] aspect-[3/4] rounded-2xl flex flex-col items-center justify-between p-6 shadow-2xl transition-all duration-300 border-2')
                .style({
                  backgroundColor: primaryColor,
                  borderColor: accentColor,
                  backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor}99 100%)`,
                })
                .childrenOf(
                  // Collar Graphic
                  ui('div')
                    .class('w-24 h-6 rounded-b-full border-b-4 border-x-4 flex items-center justify-center font-bold text-[10px]')
                    .style({ borderColor: accentColor, backgroundColor: '#00000033', color: '#ffffff' })
                    .childrenOf(collar),

                  // Center Jersey Graphic / Nameset
                  ui('div')
                    .class('flex flex-col items-center justify-center my-auto text-center')
                    .childrenOf(
                      namesetEnabled
                        ? ui('div')
                            .class('flex flex-col items-center drop-shadow-md')
                            .childrenOf(
                              ui('span')
                                .class('font-black text-4xl tracking-tight text-white uppercase drop-shadow')
                                .style({ color: accentColor })
                                .childrenOf(playerNumber || '10'),
                              ui('span')
                                .class('font-bold text-sm tracking-widest text-white uppercase mt-1')
                                .childrenOf(playerName || 'CUSTOM')
                            )
                        : ui('div')
                            .class('text-xs text-white/60 font-medium')
                            .childrenOf('Polos Tanpa Nameset')
                    ),

                  // Bottom Hem & Tech Specs
                  ui('div')
                    .class('w-full flex items-center justify-between text-[10px] text-white/80 border-t border-white/20 pt-2')
                    .childrenOf(
                      ui('span').class('font-mono font-bold tracking-wider').childrenOf('KINAU • PRO'),
                      ui('span').class('opacity-90').childrenOf(fabric)
                    )
                ),

              // Price Calculation summary
              ui('div')
                .class('mt-4 text-center z-10')
                .childrenOf(
                  Span({ className: 'text-xs text-[var(--muted-foreground)] font-medium' }, 'Estimasi Biaya Satuan:'),
                  H3({ className: 'text-xl font-black text-[var(--primary)]' }, 'Rp 135.000 / pcs'),
                  P({ className: 'text-[11px] text-[var(--muted-foreground)]' }, 'Termasuk sublimasi full-print & nameset polyflex')
                )
            )
        ),

      // Right Column: Configuration Controls (7 Cols)
      ui('div')
        .class('lg:col-span-7')
        .childrenOf(
          Form(
            { method: 'post', className: 'space-y-4' },
            UI.input({ type: 'hidden', name: 'intent', value: 'save-config' }),
            UI.input({ type: 'hidden', name: 'template_id', value: selectedTemplate.id }),
            UI.input({ type: 'hidden', name: 'primary_color', value: primaryColor }),
            UI.input({ type: 'hidden', name: 'secondary_color', value: secondaryColor }),
            UI.input({ type: 'hidden', name: 'accent_color', value: accentColor }),
            UI.input({ type: 'hidden', name: 'fabric', value: fabric }),
            UI.input({ type: 'hidden', name: 'collar_type', value: collar }),
            UI.input({ type: 'hidden', name: 'sleeve_type', value: sleeve }),
            UI.input({ type: 'hidden', name: 'nameset_enabled', value: String(namesetEnabled) }),

            // Step 1: Template Selection Cards
            ui('div')
              .class('p-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] space-y-3')
              .childrenOf(
                Row(
                  { className: 'items-center justify-between' },
                  H3({ className: 'text-sm font-bold text-[var(--foreground)]' }, '1. Pilih Desain & Motif Dasar'),
                  Span({ className: 'text-xs text-[var(--muted-foreground)]' }, '4 Template Tersedia')
                ),
                ui('div')
                  .class('grid grid-cols-2 sm:grid-cols-4 gap-2')
                  .childrenOf(
                    ...TEMPLATES.map((t) =>
                      ui('button')
                        .attr('type', 'button')
                        .attr('key', t.id)
                        .on('click', () => handleSelectTemplate(t))
                        .class(
                          `p-2.5 text-left rounded-lg border text-xs transition-all flex flex-col gap-1.5 ${
                            selectedTemplate.id === t.id
                              ? 'border-[var(--primary)] bg-[var(--primary-subtle)] ring-1 ring-[var(--primary)]'
                              : 'border-[var(--border)] hover:bg-[var(--surface-subtle)]'
                          }`
                        )
                        .childrenOf(
                          ui('div').class('w-full h-2 rounded-full').style({
                            background: `linear-gradient(to right, ${t.primary}, ${t.secondary}, ${t.accent})`,
                          }).build(),
                          ui('span').class('font-bold text-[var(--foreground)] truncate').childrenOf(t.name),
                          ui('span').class('text-[10px] text-[var(--muted-foreground)] line-clamp-1').childrenOf(t.desc)
                        )
                    )
                  )
              ),

            // Step 2: Material & Pattern Cuts
            ui('div')
              .class('p-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] space-y-3')
              .childrenOf(
                H3({ className: 'text-sm font-bold text-[var(--foreground)]' }, '2. Spesifikasi Bahan & Pola Potongan'),
                ui('div')
                  .grid(3, 'gap-3')
                  .childrenOf(
                    Select({
                      name: 'fabric_select',
                      label: 'Jenis Kain',
                      value: fabric,
                      onChange: (e: any) => setFabric(e.target.value),
                      options: [
                        { value: 'Dryfit Milano', label: 'Dryfit Milano (Recom)' },
                        { value: 'Dryfit Benzema', label: 'Dryfit Benzema' },
                        { value: 'Dryfit Nike', label: 'Dryfit Nike Bintik' },
                        { value: 'Polyester Premium', label: 'Polyester Premium' },
                      ],
                    }),
                    Select({
                      name: 'collar_select',
                      label: 'Tipe Kerah',
                      value: collar,
                      onChange: (e: any) => setCollar(e.target.value),
                      options: [
                        { value: 'V-Neck', label: 'V-Neck Standar' },
                        { value: 'O-Neck', label: 'O-Neck Bulat' },
                        { value: 'Polo Kerah', label: 'Polo Kerah Rib' },
                        { value: 'Kerah Shanghai', label: 'Kerah Shanghai' },
                      ],
                    }),
                    Select({
                      name: 'sleeve_select',
                      label: 'Lengan',
                      value: sleeve,
                      onChange: (e: any) => setSleeve(e.target.value),
                      options: [
                        { value: 'Pendek', label: 'Lengan Pendek' },
                        { value: 'Panjang', label: 'Lengan Panjang (+15rb)' },
                      ],
                    })
                  )
              ),

            // Step 3: Colors & Nameset Personalization
            ui('div')
              .class('p-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] space-y-3')
              .childrenOf(
                H3({ className: 'text-sm font-bold text-[var(--foreground)]' }, '3. Kustomisasi Warna & Sablon Punggung'),
                ui('div')
                  .grid(3, 'gap-3')
                  .childrenOf(
                    Input({
                      name: 'primary_color_input',
                      label: 'Warna Utama',
                      type: 'color',
                      value: primaryColor,
                      onChange: (e: any) => setPrimaryColor(e.target.value),
                    }),
                    Input({
                      name: 'secondary_color_input',
                      label: 'Warna Gradasi',
                      type: 'color',
                      value: secondaryColor,
                      onChange: (e: any) => setSecondaryColor(e.target.value),
                    }),
                    Input({
                      name: 'accent_color_input',
                      label: 'Warna Aksen / Font',
                      type: 'color',
                      value: accentColor,
                      onChange: (e: any) => setAccentColor(e.target.value),
                    })
                  ),
                ui('div')
                  .grid(2, 'gap-3 pt-2')
                  .childrenOf(
                    Input({
                      name: 'nameset_name_input',
                      label: 'Nama di Punggung (Nameset)',
                      placeholder: 'misal: RAYHAN',
                      value: playerName,
                      onChange: (e: any) => setPlayerName(e.target.value.toUpperCase()),
                    }),
                    Input({
                      name: 'nameset_number_input',
                      label: 'Nomor Punggung',
                      placeholder: 'misal: 10',
                      value: playerNumber,
                      onChange: (e: any) => setPlayerNumber(e.target.value),
                    })
                  )
              ),

            // Submit Buttons
            ui('div')
              .class('pt-2 flex items-center justify-end gap-3')
              .childrenOf(
                SubmitButton({
                  label: 'Simpan & Ajukan Mockup Desain',
                  variant: 'primary',
                  isSubmitting,
                })
              )
          )
        )
    )
    .build();
}

export default OrderConfiguratorWidget;
