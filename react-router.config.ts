import { vercelPreset } from "@vercel/react-router/vite";
import type { Config as BaseConfig } from "@react-router/dev/config";

interface ExtraConfig {
  tailwind?: boolean;
  postcss?: boolean;
  ssr?: boolean;
}

type Config = BaseConfig & ExtraConfig;

export default {
  tailwind: true,
  postcss: true,
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;
