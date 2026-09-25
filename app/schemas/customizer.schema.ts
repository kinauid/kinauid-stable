import { z } from 'zod';

export const TShirtZoneSchema = z.object({
  frontColor: z.string().default('#0f172a'),
  backColor: z.string().default('#0f172a'),
  leftSleeveColor: z.string().default('#1e293b'),
  rightSleeveColor: z.string().default('#1e293b'),
  collarColor: z.string().default('#dc2626'),
});

export const TShirtPatternSchema = z.object({
  patternId: z.enum(['none', 'stripes', 'cyber', 'camo', 'gradient', 'dots']).default('cyber'),
  patternColor: z.string().default('#38bdf8'),
  patternOpacity: z.number().min(0).max(1).default(0.7),
  patternScale: z.number().min(0.5).max(3).default(1),
});

export const TShirtTextSchema = z.object({
  enabled: z.boolean().default(true),
  text: z.string().default('KINAU SPORT'),
  number: z.string().default('10'),
  fontFamily: z.enum(['Impact', 'Arial Black', 'Montserrat', 'Bebas Neue', 'Oswald']).default('Impact'),
  textColor: z.string().default('#ffffff'),
  numberColor: z.string().default('#38bdf8'),
  showOnFront: z.boolean().default(true),
  showOnBack: z.boolean().default(true),
});

export const TShirtLogoSchema = z.object({
  enabled: z.boolean().default(false),
  url: z.string().optional(),
  position: z.enum(['left_chest', 'center_chest', 'back_top', 'back_center']).default('left_chest'),
  scale: z.number().min(0.2).max(2).default(0.8),
});

export const TShirtDesignConfigSchema = z.object({
  id: z.string().default(() => `dsg-${Date.now()}`),
  title: z.string().default('Desain Kaos Custom'),
  fabricType: z.enum(['Dryfit Milano', 'Dryfit Nike', 'Cotton Combed 24s', 'Cotton Combed 30s']).default('Dryfit Milano'),
  collarType: z.enum(['O-Neck', 'V-Neck', 'Polo Collar', 'Rib Collar']).default('O-Neck'),
  zones: TShirtZoneSchema,
  pattern: TShirtPatternSchema,
  text: TShirtTextSchema,
  logo: TShirtLogoSchema,
  created_at: z.string().default(() => new Date().toISOString()),
});

export type TShirtZone = z.infer<typeof TShirtZoneSchema>;
export type TShirtPattern = z.infer<typeof TShirtPatternSchema>;
export type TShirtText = z.infer<typeof TShirtTextSchema>;
export type TShirtLogo = z.infer<typeof TShirtLogoSchema>;
export type TShirtDesignConfig = z.infer<typeof TShirtDesignConfigSchema>;

export const CUSTOMIZER_TEMPLATES: TShirtDesignConfig[] = [
  {
    id: 'tmpl-cyber-blue',
    title: 'Cyberpunk Neon Wave',
    fabricType: 'Dryfit Milano',
    collarType: 'V-Neck',
    zones: {
      frontColor: '#090d16',
      backColor: '#090d16',
      leftSleeveColor: '#111827',
      rightSleeveColor: '#111827',
      collarColor: '#0284c7',
    },
    pattern: {
      patternId: 'cyber',
      patternColor: '#38bdf8',
      patternOpacity: 0.85,
      patternScale: 1,
    },
    text: {
      enabled: true,
      text: 'CYBER FORCE',
      number: '07',
      fontFamily: 'Impact',
      textColor: '#ffffff',
      numberColor: '#38bdf8',
      showOnFront: true,
      showOnBack: true,
    },
    logo: {
      enabled: false,
      position: 'left_chest',
      scale: 0.8,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'tmpl-aurora-crimson',
    title: 'Aurora Crimson Flare',
    fabricType: 'Dryfit Nike',
    collarType: 'O-Neck',
    zones: {
      frontColor: '#1a050b',
      backColor: '#1a050b',
      leftSleeveColor: '#2d0a14',
      rightSleeveColor: '#2d0a14',
      collarColor: '#e11d48',
    },
    pattern: {
      patternId: 'gradient',
      patternColor: '#f43f5e',
      patternOpacity: 0.75,
      patternScale: 1.2,
    },
    text: {
      enabled: true,
      text: 'RED DRAGONS',
      number: '99',
      fontFamily: 'Bebas Neue',
      textColor: '#ffffff',
      numberColor: '#fb7185',
      showOnFront: true,
      showOnBack: true,
    },
    logo: {
      enabled: false,
      position: 'left_chest',
      scale: 0.8,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'tmpl-classic-monochrome',
    title: 'Classic Minimalist Stripes',
    fabricType: 'Cotton Combed 24s',
    collarType: 'Rib Collar',
    zones: {
      frontColor: '#18181b',
      backColor: '#18181b',
      leftSleeveColor: '#27272a',
      rightSleeveColor: '#27272a',
      collarColor: '#ffffff',
    },
    pattern: {
      patternId: 'stripes',
      patternColor: '#ffffff',
      patternOpacity: 0.6,
      patternScale: 1,
    },
    text: {
      enabled: true,
      text: 'KINAU APPAREL',
      number: '24',
      fontFamily: 'Montserrat',
      textColor: '#ffffff',
      numberColor: '#e4e4e7',
      showOnFront: true,
      showOnBack: true,
    },
    logo: {
      enabled: false,
      position: 'center_chest',
      scale: 0.8,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'tmpl-tactical-camo',
    title: 'Tactical Urban Camo',
    fabricType: 'Dryfit Milano',
    collarType: 'O-Neck',
    zones: {
      frontColor: '#142017',
      backColor: '#142017',
      leftSleeveColor: '#1c2e22',
      rightSleeveColor: '#1c2e22',
      collarColor: '#4ade80',
    },
    pattern: {
      patternId: 'camo',
      patternColor: '#22c55e',
      patternOpacity: 0.65,
      patternScale: 1.4,
    },
    text: {
      enabled: true,
      text: 'OUTDOOR TEAM',
      number: '01',
      fontFamily: 'Impact',
      textColor: '#ffffff',
      numberColor: '#4ade80',
      showOnFront: true,
      showOnBack: true,
    },
    logo: {
      enabled: false,
      position: 'left_chest',
      scale: 0.8,
    },
    created_at: new Date().toISOString(),
  },
];
