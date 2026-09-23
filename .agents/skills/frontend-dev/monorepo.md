# Monorepo Setup & Conventions

Panduan setup workspace, scripts, dan cara menambah app baru ke rayeen-app-gateway.

---

## Struktur Root

```
rayeen-app-gateway/
├── apps/
│   ├── landing/
│   ├── crm/
│   ├── nurafin/
│   ├── eis/
│   └── campus-erp/
├── packages/
│   ├── ui/              # @rayeen/ui
│   ├── config/          # @rayeen/config
│   └── types/           # @rayeen/types
├── package.json         # npm workspaces root
└── .npmrc
```

---

## Root package.json

```json
{
  "name": "rayeen-app-gateway",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:landing": "npm run dev --workspace=apps/landing",
    "dev:crm": "npm run dev --workspace=apps/crm",
    "dev:nurafin": "npm run dev --workspace=apps/nurafin",
    "dev:eis": "npm run dev --workspace=apps/eis",
    "dev:campus": "npm run dev --workspace=apps/campus-erp",
    "build:all": "npm run build --workspaces",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  }
}
```

---

## packages/config — Shared Tooling

### tsconfig.base.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "react-jsx",
    "allowJs": true,
    "allowImportingTsExtensions": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true
  }
}
```

### eslint.base.js

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  { ignores: ["dist", "build", ".react-router"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: { ecmaVersion: 2022 },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  }
);
```

### tailwind.base.ts

```ts
// packages/config/tailwind.base.ts
import type { Config } from "tailwindcss";

export const tailwindBase = {
  darkMode: ["class"],
  content: [],   // setiap app override ini
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "Fira Code", "monospace"],
      },
    },
  },
} satisfies Partial<Config>;
```

---

## packages/types — Shared Types

```ts
// packages/types/src/project.ts
export interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  subdomain: string;          // "crm.rayeen.dev"
  subpath: string;            // "/projects/crm"
  techStack: string[];
  status: "live" | "wip" | "coming-soon";
  screenshotUrl?: string;
  accentColor?: string;       // CSS var: "--crm-accent"
  order: number;
}

export type NewProject = Omit<ProjectItem, "id">;

// packages/types/src/nav.ts
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  external?: boolean;
}

// packages/types/src/index.ts
export type * from "./project";
export type * from "./nav";
```

```json
// packages/types/package.json
{
  "name": "@rayeen/types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

---

## packages/ui — Shared Component Library

```json
// packages/ui/package.json
{
  "name": "@rayeen/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "@base-ui/react": "latest",
    "clsx": "latest",
    "lucide-react": "^0.546.0",
    "tailwind-merge": "latest",
    "motion": "latest"
  }
}
```

```ts
// packages/ui/src/index.ts — named exports only, no barrel default
export { Button } from "./components/Button";
export type { ButtonProps } from "./components/Button";
export { Card } from "./components/Card";
export { Badge } from "./components/Badge";
export { Marquee } from "./components/Marquee";
export { cn } from "./utils";
```

Import di app:
```ts
import { Button, Card, Badge } from "@rayeen/ui";
```

---

## Per-App Setup

### package.json (setiap app)

```json
{
  "name": "@rayeen/landing",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "react-router dev",
    "build": "react-router build",
    "start": "react-router-serve ./build/server/index.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@rayeen/types": "*",
    "@rayeen/ui": "*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0",
    "@react-router/node": "^7.0.0",
    "@react-router/fs-routes": "^7.0.0",
    "@base-ui/react": "latest",
    "zustand": "^5.0.0",
    "motion": "latest",
    "sonner": "^2.0.0",
    "zod": "^4.0.0",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "^0.546.0"
  },
  "devDependencies": {
    "@rayeen/config": "*",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^5.0.0",
    "vite-tsconfig-paths": "^5.0.0",
    "@react-router/dev": "^7.0.0"
  }
}
```

### tsconfig.json (setiap app)

```json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "include": ["**/*.ts", "**/*.tsx", ".react-router/types/**/*"],
  "compilerOptions": {
    "paths": {
      "~/*": ["./app/*"]
    }
  }
}
```

### vite.config.ts (setiap app)

```ts
import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
});
```

### react-router.config.ts (setiap app)

```ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
} satisfies Config;
```

### vercel.json (setiap app)

```json
{
  "framework": null,
  "buildCommand": "cd ../.. && npm run build --workspace=apps/[nama-app]",
  "outputDirectory": "build/client",
  "installCommand": "cd ../.. && npm install"
}
```

---

## Menambah App Baru

1. **Buat folder** `apps/[nama-app]/` dengan struktur standar (lihat SKILL.md)

2. **Copy template** dari app yang sudah ada, update nama di `package.json`:
   ```json
   { "name": "@rayeen/[nama-app]" }
   ```

3. **Install dependencies** dari root:
   ```bash
   npm install
   ```

4. **Tambah script** di root `package.json`:
   ```json
   "dev:[nama-app]": "npm run dev --workspace=apps/[nama-app]"
   ```

5. **Buat `vercel.json`** di app folder dengan buildCommand yang tepat

6. **Deploy** ke Vercel sebagai project terpisah, pointing ke folder `apps/[nama-app]/`

7. **Update `ProjectItem`** di `apps/landing` untuk menampilkan app baru di showcase

---

## .npmrc

```
# Pastikan workspaces bekerja dengan benar
legacy-peer-deps=false
```

---

## Dependency Management Rules

- **Jangan install** dependency yang sama di root DAN di app — pilih salah satu sesuai scope
- Dependencies yang dipakai semua app (React, TypeScript) → install di masing-masing app, bukan root
- Shared tooling (eslint config, tsconfig base) → di `packages/config`
- Shared types → di `packages/types`
- Shared UI components → di `packages/ui`
- App-specific deps (Firebase, ApexCharts, dll) → hanya di app yang butuh

---

## Git Structure

```
.gitignore        # root — ignore node_modules, build, .react-router dari semua apps
```

Root `.gitignore`:
```
node_modules/
apps/*/build/
apps/*/.react-router/
packages/*/dist/
.env
.env.local
```

Setiap app boleh punya `.env.local` sendiri yang tidak di-commit.

---

## Prinsip Modular — Checklist Validasi

Sebelum merge PR yang menambah/mengubah app atau package, verifikasi:

### Per-app isolation check

- [ ] App tidak import apapun dari `apps/` lain (hanya dari `packages/` dan `node_modules`)
- [ ] App bisa `npm run dev` standalone tanpa app lain aktif
- [ ] App punya `package.json`, `tsconfig.json`, `vite.config.ts` sendiri
- [ ] App-specific deps tidak bocor ke root `package.json`
- [ ] CSS theme token berdiri sendiri di `app/index.css` — tidak depend file CSS app lain

### Kapan extract ke packages/

| Trigger | Tindakan |
|---|---|
| 2+ apps butuh component yang **identik** | → Extract ke `@rayeen/ui` |
| 2+ apps butuh type/interface yang sama | → Extract ke `@rayeen/types` |
| Hanya 1 app butuh sesuatu | → Tetap lokal di app |
| "Mungkin nanti dipakai" | → **Jangan extract** — tunggu kebutuhan nyata |

### Boundary rules

```
apps/landing  ──→  packages/types  ✅
apps/landing  ──→  packages/ui    ✅
apps/landing  ──→  apps/crm       ❌ DILARANG
apps/crm      ──→  apps/eis       ❌ DILARANG
packages/ui   ──→  packages/types ✅
packages/ui   ──→  apps/landing   ❌ DILARANG (package tidak boleh depend ke app)
```

### Tes mental "bisa dicabut"

> Jika besok `apps/crm` perlu dipindahkan ke repo lain:
> 1. Copy folder `apps/crm/`
> 2. Copy `packages/types/` dan `packages/ui/` (atau inline-kan)
> 3. Jalankan `npm install && npm run dev`
> 4. Selesai — tanpa perlu file dari `apps/landing/`, `apps/eis/`, dll.
>
> Jika ada step tambahan yang diperlukan, berarti ada coupling yang harus diperbaiki.
