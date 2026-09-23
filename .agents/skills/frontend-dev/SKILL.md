---
name: frontend-dev
description: "Use when building, modifying, or reviewing any frontend code in the rayeen-app-gateway monorepo — including the landing page, feature apps (CRM, NuraFin, EIS, Campus ERP), shared UI packages, or any new module. Covers component creation, routing, styling, animations, state management, and monorepo conventions."
---

# Skill: frontend-dev

You are a senior frontend engineer working inside the **rayeen-app-gateway** monorepo. This skill defines every standard, convention, and pattern you MUST follow. Read this fully before writing a single line of code.

---

## PRE-FLIGHT CHECKLIST (WAJIB BACA SEBELUM CODING)

**STOP.** Sebelum menulis code apapun, baca checklist ini:

1. **Baca skill ini SAMPAI HABIS** — jangan skip section manapun
2. **Cek existing patterns** — baca file sejenis yang sudah ada, ikuti pattern yang sama
3. **Tidak ada bare `catch {}`** — semua catch block WAJIB `catch (error)` + `ErrorCatch()`
4. **Tidak ada hardcode warna** — semua warna dari CSS variable
5. **Tidak ada hardcode brand** — semua dari `constants/brand.ts`
6. **Form submission HARUS via React Router** — gunakan `<Form>` atau `<fetcher.Form>`, BUKAN `<form onSubmit>` + `e.preventDefault()`
7. **Tombol aksi destruktif WAJIB konfirmasi** — SweetAlert2 sebelum delete/logout/archive
8. **API data SELALU lewat server-side** — loader/action, bukan client-side fetch
9. **Server-only code tidak boleh di-client bundle** — `process.env`, `api.ts`, dan server-only modules tidak boleh di-import dari `useEffect`/event handler client. Buat `client-api.ts` terpisah untuk client-side fetch. Lihat section [Client-Safe API Fetch](#client-safe-api-fetch-🚫-no-process-env-di-client).
10. **Loader jangan block pada slow API calls** — React Router v7 tidak punya `defer()`. Untuk data lambat (channels per project, dsb), load critical data dulu di loader, lalu sisanya via `useEffect` + `clientFetch`. Lihat section [Non-Blocking Data Loading](#non-blocking-data-loading).
11. **Setiap tombol submit WAJIB punya fallback loading** — disable + spinner saat request berjalan agar user tidak bisa klik 2x (double-submit). Pakai `SubmitButton` (nurafin) atau pattern inline `fetcher.state` + `disabled` (wms). Lihat section [Loading & Skeleton States](#loading--skeleton-states-wajib).
12. **Setiap halaman/data list WAJIB punya skeleton** — tidak boleh layar kosong/hang saat memuat. Pakai `PageSkeleton` (route navigation, wms), `LoadingState` (data list, nurafin), dan `NavigationProgress` (progress bar top). Lihat section [Loading & Skeleton States](#loading--skeleton-states-wajib).

### Form Submission Rule (PENTING)

**DILARANG** menggunakan plain `<form onSubmit={handler}>` dengan `e.preventDefault()` untuk operasi yang butuh server-side processing (create, update, delete). Pattern ini membuat form tidak submit ke route `action()`.

```tsx
// ❌ SALAH — form tidak sampai ke action()
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  onSave({ name, description }); // hanya client-side callback
}
<form onSubmit={handleSubmit}>...</form>

// ✅ BENAR — submit ke route action via React Router
<fetcher.Form method="post">
  <input type="hidden" name="intent" value="create-project" />
  <input name="name" ... />
  <button type="submit">Create</button>
</fetcher.Form>
```

**Kapan pakai `<fetcher.Form>`:** Modal/form yang tidak perlu navigasi (tetap di halaman yang sama)
**Kapan pakai `<Form>`:** Form yang perlu redirect setelah submit

**WAJIB pasang fallback loading pada tombol submit** — lihat [Loading & Skeleton States](#loading--skeleton-states-wajib). Jangan pernah biarkan tombol submit tanpa `disabled` + spinner saat request berjalan (double-submit).

### Client-Safe API Fetch (🚫 No `process.env` di Client)

**DILARANG** mengimpor server-only modules (`api.ts`, `process.env`) dari client component atau `useEffect`. `process.env` tidak ada di browser → `ReferenceError: process is not defined`.

```ts
// ❌ SALAH — ChannelService.list() internally imports api.ts → process.env crash
useEffect(() => {
  const res = await ChannelService.list(token, projectId); // crash!
}, []);

// ✅ BENAR — buat client-api.ts terpisah, tanpa process.env
// app/lib/client-api.ts
const API_BASE = "https://api.rayeen.web.id";

export async function clientFetch<T>(path: string, options = {}) {
  const { token, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...rest,
  });
  return res.json() as Promise<ApiResponse<T>>;
}

// ✅ BENAR — pake clientFetch di useEffect
useEffect(() => {
  const res = await clientFetch(`/projects/${projectId}/channels`, { token });
}, []);
```

**Aturan:** Jika sebuah file dipanggil dari client (`useEffect`, event handler), import dari `~/lib/client-api`. Jika dari server (`loader`/`action`), import dari `~/lib/api`.

### Non-Blocking Data Loading

React Router v7 **tidak punya `defer()`**. Loader harus resolve penuh sebelum render. Untuk menghindari blocking:

1. **Loader hanya load critical data** (workspace, projects)
2. **Deferred data** (channels per project, comments, stats) di-load via `useEffect` + `clientFetch` setelah mount
3. **Store update** saat deferred data tiba → UI automatis re-render

```tsx
// ✅ BENAR — non-blocking pattern
export async function loader({ params }: LoaderFunctionArgs) {
  const projects = await loadProjects(token); // critical — ditunggu
  return { projects, token }; // token dikirim untuk clientFetch
}

export default function Page() {
  const { projects, token } = useLoaderData<typeof loader>();
  const setProjects = useSidebarNavStore((s) => s.setProjects);

  useEffect(() => { setProjects(projects); }, [projects]);

  useEffect(() => {
    // channels load di background — sidebar jadi cepat
    const res = await clientFetch(`/projects/${p.uid}/channels`, { token });
    setProjects(prev => /* merge channels */);
  }, [token]);

  return <Outlet />; // render langsung, nunggu channels
}
```

**Prinsip:** Critical data → blocking loader. Non-critical data → client-side useEffect. Jangan block render untuk data yang belum perlu saat mount.

---

## Project Identity

**rayeen-app-gateway** is a personal portfolio + monorepo housing multiple independently deployable web applications. The landing page showcases Rayhan's work and links to each product. Each product lives in its own `apps/` folder and is deployed to its own subdomain.

**Deployed apps:**

| App | Subdomain | Description |
|---|---|---|
| `apps/landing` | `rayeen.web.id` | Personal portfolio landing page |
| `apps/wms` | `wms.rayeen.web.id` | Work Management System |
| `apps/nurafin` | `nurafin.rayeen.web.id` | Rayeen NuraFin Budgeting |
| `apps/eis` | `eis.rayeen.web.id` | EIS Accounting |
| `apps/campus-erp` | `campus.rayeen.web.id` | Campus Education ERP |
| `apps/creatify` | `creatify.rayeen.web.id` | AI Creative Tools (Logo, Palette Generator) |
| `apps/admin` | `admin.rayeen.web.id` | Platform Administrator Dashboard |

---

## Monorepo Structure

```
rayeen-app-gateway/
├── apps/
│   ├── landing/
│   ├── wms/
│   ├── logofy/
│   ├── nurafin/
│   ├── eis/
│   └── campus-erp/
├── packages/
│   ├── ui/           # @rayeen/ui — shared component library
│   ├── config/       # @rayeen/config — shared tsconfig, eslint, tailwind base
│   └── types/        # @rayeen/types — shared TypeScript interfaces
└── package.json      # npm workspaces
```

**npm workspaces config** (`package.json` root):
```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

---

## Prinsip Modularitas (WAJIB)

Setiap `apps/[nama-app]` adalah **unit yang self-contained dan bisa dipisahkan** dari monorepo kapan saja. Ini bukan sekadar organisasi folder — ini prinsip arsitektur.

### Aturan Modular

1. **Setiap app harus bisa berjalan standalone**
   - Jika folder `apps/crm` di-copy keluar monorepo, hanya perlu mengganti import `@rayeen/*` dengan package lokal — dan langsung bisa `npm install && npm run dev`.
   - Tidak boleh ada import lintas `apps/` — `apps/crm` tidak boleh import dari `apps/landing`.

2. **Shared code hanya via `packages/`**
   - Jika dua atau lebih apps butuh logic/type/component yang sama → masuk ke `packages/`.
   - Jika hanya satu app yang butuh → tetap lokal di `apps/[nama-app]/`.
   - Jangan premature extract ke packages — extract hanya ketika re-use nyata terjadi.

3. **Tidak ada state sharing antar apps**
   - Setiap app punya Zustand store sendiri, tidak berbagi state runtime.
   - `packages/types` berbagi *interface/type* saja, bukan state.

4. **Setiap app punya config sendiri**
   - `package.json` sendiri (nama: `@rayeen/[nama-app]`)
   - `tsconfig.json` sendiri (extends base)
   - `vite.config.ts` sendiri
   - `react-router.config.ts` sendiri
   - `vercel.json` sendiri (deploy terpisah)
   - `app/index.css` sendiri (dengan theme token yang bisa berbeda per app)

5. **Deploy secara independen**
   - Setiap app di-deploy ke subdomain-nya sendiri.
   - Build satu app tidak boleh gagal karena app lain error.
   - CI/CD per-app: hanya build ulang app yang berubah.

6. **Dependency isolation**
   - App-specific deps (Firebase, ApexCharts, dll) hanya di app yang butuh.
   - Shared tooling deps (eslint, tsconfig) di `packages/config`.
   - JANGAN install app-specific dep di root `package.json`.

### Boleh di-share (via packages/)

| Package | Isi | Contoh |
|---|---|---|
| `@rayeen/types` | TypeScript interfaces yang dipakai >1 app | `ProjectItem`, `NavItem` |
| `@rayeen/ui` | Komponen generik yang dipakai >1 app | `Button`, `Badge`, `Card` |
| `@rayeen/config` | Base config (tsconfig, eslint) | `tsconfig.base.json` |

### Tidak boleh di-share

| Hal | Alasan |
|---|---|
| Zustand stores | State runtime harus lokal per app |
| Route files | Setiap app punya routing sendiri |
| Feature components | Spesifik domain per app |
| API services | Endpoint dan auth bisa berbeda per app |
| `app/index.css` | Theme token bisa custom per app |

```
apps/[nama-app]/
├── app/
│   ├── index.css                    # Tailwind v4 @theme + CSS variables
│   ├── root.tsx                     # Root layout + error boundary
│   ├── routes.ts                    # flatRoutes() config
│   ├── routes/                      # File-system based flat routes
│   │   ├── _index.tsx               # / (index)
│   │   └── [feature].[page].tsx     # /feature/page
│   └── components/
│       ├── ui/                      # shadcn primitives — JANGAN edit manual
│       ├── shared/
│       │   ├── components/          # Reusable UI wrappers (Button, Card, Modal)
│       │   ├── layouts/             # Shell layouts (AdminLayout, PublicLayout)
│       │   ├── store/               # Global UI Zustand store
│       │   └── widgets/             # Stateful mount-once (RouteGuard, GlobalLoader, ThemeToggle)
│       └── features/
│           └── [feature-name]/
│               ├── types.ts         # TypeScript interfaces untuk fitur ini
│               ├── store.ts         # Zustand feature store
│               ├── services.ts      # Data service layer
│               └── widgets/         # Feature-scoped components
├── lib/
│   └── utils.ts                     # cn() utility
├── constants/                       # Brand constants, nav config
├── store/                           # Domain-level stores (jika ada)
├── public/
├── package.json                     # name: "@rayeen/[nama-app]"
├── vite.config.ts
├── tsconfig.json                    # extends @rayeen/config/tsconfig.base.json
└── react-router.config.ts
```

---

## Tech Stack (Wajib per app)

| Kategori | Package | Versi |
|---|---|---|
| Framework | `react-router` | ^7.x |
| UI Primitives | `@base-ui/react` via shadcn `base-nova` style | latest |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` | ^4.x |
| Icons | `lucide-react` | ^0.546.0+ |
| State | `zustand` | ^5.x |
| Animations | `framer-motion` / `motion` | latest |
| Smooth scroll | `@studio-freight/lenis` + `gsap` | ^1.0.42 + ^3.x (landing only) |
| Toast | `sonner` | ^2.x |
| Alert/Confirm | `sweetalert2` | ^11.x |
| Validation | `zod` | ^4.x |
| Class utility | `clsx` + `tailwind-merge` via `cn()` | latest |
| Routing | `@react-router/fs-routes` | ^7.x |

**shadcn config:**
- Style: `base-nova`
- Primitives: `@base-ui/react` (bukan Radix UI)
- Icon library: `lucide`
- CSS variables: `true`

---

## Styling Conventions

### Tailwind v4 — @theme di CSS

Tidak ada `tailwind.config.js`. Semua token didefinisikan di `app/index.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme {
  /* Typography */
  --font-sans: 'Inter', 'Geist', sans-serif;
  --font-mono: 'Geist Mono', monospace;
  --font-display: var(--font-sans);

  /* Map Tailwind tokens ke CSS vars */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

### CSS Custom Properties (light mode)

```css
:root {
  /* Backgrounds */
  --background: #ffffff;
  --surface: rgba(237, 237, 237, 0.64);
  --surface-subtle: rgba(237, 237, 237, 0.10);
  --card: #ffffff;

  /* Text */
  --foreground: #141414;
  --muted: #717171;
  --muted-foreground: #adadad;

  /* Accent */
  --accent: #0065ff;
  --accent-hover: #0047f0;
  --primary: oklch(0.44 0.04 240);

  /* Borders */
  --border: rgba(64, 64, 64, 0.08);
  --border-strong: rgba(65, 65, 65, 0.16);

  /* Radius */
  --radius: 0.75rem;
  --radius-pill: 1000px;
  --radius-card: 24px;
  --radius-card-sm: 16px;
  --radius-nav: 30px;

  /* Shadow */
  --shadow-card: 0 8px 40px rgba(0, 0, 0, 0.039);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
}
```

### Aturan Styling

- **WAJIB** gunakan semantic token: `bg-background`, `text-foreground`, `border-border`
- **DILARANG** hardcode warna: jangan tulis `bg-gray-100`, `#ffffff`, `text-[#71717A]`, atau hex/rgb apapun langsung di className. **Semua warna harus melalui CSS variable** di `index.css`. Ini agar rebranding cukup ganti di satu file (`index.css`), bukan cari-replace di ratusan komponen.

  ```tsx
  // ❌ SALAH
  className="text-[#71717A] bg-[#FAFAFB] border-[#EEEEF0]"
  
  // ✅ BENAR
  className="text-[var(--muted-foreground)] bg-[var(--sidebar)] border-[var(--sidebar-border)]"
  ```

  Jika butuh warna baru yang belum ada di palette, **tambahkan dulu** sebagai CSS variable di `index.css` (light + dark), baru gunakan di component.

- Feature-scoped color: gunakan CSS var `bg-[var(--crm-bg)]`, `text-[var(--nurafin-accent)]`
- Dark mode: class-based, toggle via Zustand store
- Transition dark mode: `transition-colors duration-300` pada container utama
- Font: gunakan utility `font-sans`, `font-display`, `font-mono` — bukan hardcode font name
- **DILARANG** `scroll-behavior: smooth` di CSS — Lenis yang handle smooth scrolling
- **DILARANG** `scrollIntoView({ behavior: "smooth" })` — gunakan `behavior: "instant"` agar tidak konflik dengan Lenis

### Aturan Branding — Rebranding-Ready

**DILARANG** hardcode nama brand (seperti "Rayeen WMS", "Rayeen", dll) langsung di JSX/component. Semua referensi brand **WAJIB** melalui constants di `app/constants/brand.ts`:

```ts
// app/constants/brand.ts
export const BRAND_NAME = "Rayeen WMS";
export const BRAND_TAGLINE = "Work Management System";
export const BRAND_DESCRIPTION = "Manage your work, tasks, and team — all in one place.";
export const BRAND_AUTHOR = "Rayhan";
export const BRAND_DOMAIN = "rayeen.web.id";
```

```tsx
// ❌ SALAH
<span>Rayeen WMS</span>
<title>Dashboard — Rayeen WMS</title>

// ✅ BENAR
import { BRAND_NAME } from "~/constants/brand";
<span>{BRAND_NAME}</span>
<title>Dashboard — {BRAND_NAME}</title>
```

**Alasan:** Jika ada mitra yang ingin rebranding, cukup ganti nilai di `brand.ts` — tidak perlu cari-replace di seluruh codebase. Ini termasuk: nama app, tagline, deskripsi, domain, author name.

---

## UI Density & Information Design (WAJIB)

Prinsip utama: **padat, kecil, informatif, minimal wasted space.**

### Rules

1. **Hindari collapse/accordion untuk data list** — data harus visible langsung tanpa klik extra. Collapse hanya untuk grouping navigasi (sidebar sections), bukan untuk konten utama.

2. **Prefer flat table/grid layout** — Daftar item (tasks, projects, members, logs) ditampilkan sebagai **compact rows** layaknya tabel, bukan card besar dengan banyak whitespace. Setiap row menampilkan semua info penting dalam satu baris.

3. **Informasi padat dalam satu pandangan** — User harus bisa scan 20-30 item tanpa scroll. Jika hanya terlihat 5-8 item di viewport, layout terlalu longgar.

4. **Small font + tight spacing untuk data list** — Gunakan `text-xs` (12px) atau `text-[11px]` untuk list items, `py-1.5` hingga `py-2` untuk row padding. Jangan `py-4` atau `p-6` untuk item list.

5. **Section label, bukan collapse header** — Gunakan label kecil uppercase (`text-[10px] font-bold uppercase tracking-widest`) sebagai pemisah group, bukan collapsible header yang menyembunyikan konten.

6. **Status/priority/meta sebagai inline badge** — Informasi sekunder (status, priority, assignee, date) ditampilkan sebagai badge/pill kecil di samping judul dalam satu baris, bukan di baris terpisah.

7. **No card sprawl** — Jangan bungkus setiap item dalam card terpisah jika items banyak (>5). Gunakan `divide-y` pada container, atau `border-b` per row tanpa padding berlebihan.

### Contoh — Task List

```tsx
// ❌ SALAH — card per item, spacing besar, banyak ruang terbuang
<div className="space-y-3">
  {tasks.map(task => (
    <div className="bg-card rounded-xl p-5 border space-y-2">
      <h3 className="text-lg font-bold">{task.title}</h3>
      <p className="text-sm text-muted">{task.description}</p>
      <div className="flex gap-2 mt-3">
        <Badge>{task.status}</Badge>
        <Badge>{task.priority}</Badge>
      </div>
    </div>
  ))}
</div>

// ✅ BENAR — compact rows, semua info satu baris, dense
<div className="border border-[var(--border)] rounded-[var(--radius-card-sm)] divide-y divide-[var(--border)]">
  {tasks.map(task => (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--surface-subtle)]">
      <StatusDot status={task.status} />
      <span className="font-medium text-[var(--foreground)] truncate flex-1">{task.title}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500">{task.priority}</span>
      <span className="text-[10px] text-[var(--muted-foreground)]">{task.dueDate}</span>
      <Avatar size={18} name={task.assignee} />
    </div>
  ))}
</div>
```

### Referensi density: Sidebar

Sidebar WMS adalah benchmark density yang ideal — gunakan spacing dan font size yang sama untuk semua data list di main content area.

---

## Component Conventions

### Penamaan

- **PascalCase** untuk semua file dan nama component: `ProjectCard.tsx`, `HeroSection.tsx`
- **Named exports** untuk semua shared dan feature components
- **Default exports** HANYA untuk route files

### Struktur per component

```tsx
// 1. Imports (urutan wajib — lihat bagian Import Order)
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~/lib/utils";

// 2. Type/interface definition
interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

// 3. Component (forwardRef untuk DOM-exposed primitives)
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(variantMap[variant], sizeMap[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// 4. Named export
export { Button };
export type { ButtonProps };
```

### Compound component pattern (untuk Card, Dialog, Table)

```tsx
function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("rounded-[var(--radius-card)] bg-card", className)} {...props} />;
}

function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("flex flex-col gap-2 p-6", className)} {...props} />;
}

Card.Header = CardHeader;
export { Card };
```

### Tidak ada barrel files

**DILARANG** membuat `index.ts` di dalam `components/`. Selalu import langsung ke file:

```ts
// BENAR
import { Button } from "~/components/shared/components/Button";
import { useUIStore } from "~/components/shared/store/ui";

// SALAH
import { Button } from "~/components/shared/components"; // ← tidak ada barrel
```

---

## Icon Conventions (lucide-react)

Import langsung by name — tidak ada re-export:

```tsx
import { ArrowRight, Github, Linkedin, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
```

**Sizing standard:**

| Konteks | Class | Size prop |
|---|---|---|
| Sidebar / nav | `w-5 h-5` | — |
| Inline kecil | `w-4 h-4` | — |
| Header action | — | `size={20}` |
| Empty state | — | `size={28}` |
| Mobile bottom nav | — | `size={18}` + `strokeWidth={2.5}` |
| Hero decorative | `w-10 h-10` | — |

---

## State Management (Zustand only)

**Tidak ada** React Context untuk state, tidak ada Redux, tidak ada React Query sebagai primary store. TanStack Query **hanya** boleh dipakai sebagai *server-state cache layer* untuk data fetching (lihat [Navigation Performance — TanStack Query](#navigation-performance--transisi-route-cepat-wajib)) — UI/global state tetap Zustand 100%.

### Aturan Anti-Boilerplate State

**DILARANG** membuat banyak individual boolean state untuk modal/dialog/panel:

```tsx
// ❌ SALAH — state terpencar, susah maintain
const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
const [editingTask, setEditingTask] = useState<Task | null>(null);
```

**WAJIB** gunakan satu state object yang mengelompokkan modal/dialog terkait:

```tsx
// ✅ BENAR — satu state terstruktur, scalable
interface ModalState {
  task: { open: boolean; mode: "create" | "edit"; data: Task | null };
  project: { open: boolean; mode: "create" | "edit"; data: Project | null };
  confirm: { open: boolean; action: string; targetId: string | null };
}

const [modals, setModals] = useState<ModalState>({
  task: { open: false, mode: "create", data: null },
  project: { open: false, mode: "create", data: null },
  confirm: { open: false, action: "", targetId: null },
});

// Buka modal task edit:
setModals(prev => ({ ...prev, task: { open: true, mode: "edit", data: selectedTask } }));

// Tutup:
setModals(prev => ({ ...prev, task: { ...prev.task, open: false } }));
```

**Prinsip:** Satu halaman route harus bisa dipahami state-nya dalam satu pandangan. Jika ada lebih dari 3 `useState` di satu file, pertimbangkan:
1. Gabungkan ke satu object state (pattern di atas)
2. Pindahkan ke Zustand feature store jika state dipakai lintas komponen
3. Gunakan `useReducer` jika transisi state kompleks

**Tiga layer store:**

1. **Global UI store** — `app/components/shared/store/ui.ts`
   - sidebar open/close, loading, theme, alert/toast trigger
   
2. **Feature store** — `app/components/features/[feature]/store.ts`
   - scoped ke satu feature
   
3. **Domain store** — `app/store/use[Domain]Store.ts`
   - bridges realtime data (Firebase/SSE) dengan Zustand

```ts
// Pattern wajib
import { create } from "zustand";

interface UIState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  setTheme: (theme: "light" | "dark") => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: "light",
  sidebarOpen: false,
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
```

---

## Toast & Flash Message Management

### Prinsip Utama

**Server-side `action()` → cookie flash → parent Layout → client-side toast/alert.**

Tidak pakai `useActionData`. Flash message di-set di server, dibaca di root `loader()`, dan di-trigger oleh `FlashObserver` widget di client Layout. Ini lebih clean karena:
- Tidak coupling toast ke route spesifik
- Works across redirects (cookie-based)
- Parent Layout handle semua notifikasi — child routes tidak perlu tahu

### Kapan pakai apa

| Jenis | Library | Use case |
|---|---|---|
| Feedback ringan | `sonner` (toast) | Success, info, warning — auto-dismiss |
| Feedback berat | `sweetalert2` (modal) | Error kritis dengan title, konfirmasi user |
| Konfirmasi | `sweetalert2` (confirm) | "Yakin hapus?" sebelum action destruktif |

### Server-side: `flash.server.ts`

```ts
// app/lib/flash.server.ts
import { createCookieSessionStorage } from "react-router";

export type FlashType = "success" | "error" | "info" | "warning" | "confirm";

export interface FlashMessage {
  type: FlashType;
  title?: string;
  message: string;
}

// setFlashMessage(request, { type, message }) → returns Set-Cookie header string
// getFlashMessage(request) → returns { flash, headers }
// flashRedirect(url, setCookieHeader) → Response redirect dengan flash
```

### Pemakaian di action()

```ts
// app/routes/api.contact.ts
import type { ActionFunctionArgs } from "react-router";
import { setFlashMessage, flashRedirect } from "~/lib/flash.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  
  try {
    // ... process form
    const cookie = await setFlashMessage(request, {
      type: "success",
      message: "Pesan berhasil dikirim!",
    });
    return flashRedirect("/", cookie);
  } catch (err) {
    const cookie = await setFlashMessage(request, {
      type: "error",
      title: "Gagal mengirim",
      message: "Silakan coba lagi nanti.",
    });
    return flashRedirect("/contact", cookie);
  }
}
```

### Client-side: `FlashObserver` widget

```tsx
// app/components/shared/widgets/FlashObserver.tsx
// - Menerima prop `flash: FlashMessage | null` dari root loader
// - type "success" | "info" | "warning" → sonner toast
// - type "error" (dengan title) atau "confirm" → sweetalert2 modal
```

### Root loader + App component

```tsx
// root.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const { flash, headers } = await getFlashMessage(request);
  return Response.json({ flash }, { headers });
}

export default function App() {
  const { flash } = useLoaderData<typeof loader>();
  return (
    <>
      <FlashObserver flash={flash} />
      <Outlet />
    </>
  );
}
```

### SweetAlert2 Styling — sesuai design system

```ts
// Custom class agar SweetAlert2 ikut theme
Swal.fire({
  customClass: {
    popup: "!rounded-[24px] !bg-[var(--card)] !text-[var(--foreground)]",
    confirmButton: "!rounded-[1000px] !bg-[var(--accent)] !text-white !px-6 !py-2",
  },
});
```

### Client-side only toast (tanpa server)

Untuk feedback instan yang tidak perlu melewati server (validasi client, copy to clipboard, dll):

```ts
import { toast } from "sonner";

// Langsung panggil di event handler
toast.success("Copied to clipboard!");
toast.error("Validasi gagal");
toast.info("Loading data...");
```

### Konfirmasi Wajib untuk Single-Action Buttons

**WAJIB:** Setiap tombol aksi destruktif atau ireversibel (logout, delete, archive, submit, dll) harus dikonfirmasi dengan SweetAlert2 **sebelum** menjalankan action. Tidak boleh langsung execute tanpa konfirmasi user.

```tsx
import Swal from "sweetalert2";

// Contoh: tombol logout
async function handleLogout() {
  const result = await Swal.fire({
    title: "Keluar dari akun?",
    text: "Sesi kamu akan diakhiri.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, keluar",
    cancelButtonText: "Batal",
    customClass: {
      popup: "!rounded-[24px] !bg-[var(--card)] !text-[var(--foreground)]",
      confirmButton: "!rounded-[1000px] !bg-red-500 !text-white !px-6 !py-2",
      cancelButton: "!rounded-[1000px] !bg-[var(--muted)] !text-[var(--foreground)] !px-6 !py-2",
    },
  });

  if (result.isConfirmed) {
    // baru execute action (submit form, fetch API, dll)
  }
}
```

**Kapan wajib konfirmasi:**
- Logout
- Delete / remove (task, project, member, file)
- Archive / deactivate
- Bulk actions (select all → delete)
- Form submit yang tidak bisa di-undo

**Kapan TIDAK perlu konfirmasi:**
- Navigasi biasa (link, tab switch)
- Toggle state (dark mode, sidebar open/close)
- Save / update yang bisa di-edit lagi
- Filter / sort

---

## Loading & Skeleton States (WAJIB)

Prinsip: **tidak boleh ada layar kosong/hang, dan tidak boleh ada double-submit.** Setiap aksi async dan setiap muat data wajib punya feedback visual.

### Aturan Umum

| Situasi | Komponen / Pattern | Lokasi |
|---|---|---|
| Navigasi antar route | `NavigationProgress` (progress bar 2px di top) + `PageSkeleton` saat `navigation.state === "loading"` | `apps/wms/app/components/shared/widgets/` |
| Data list client-side (TanStack Query) | `LoadingState` (skeleton rows) saat `isLoading`, `ErrorState` saat `isError` | `apps/nurafin/app/components/shared/components/` |
| Submit `<Form>` / `<fetcher.Form>` | `SubmitButton` (disable + spinner otomatis dari `useNavigation`/`useFetchers`) | `apps/nurafin/app/components/shared/components/SubmitButton.tsx` |
| Submit inline tanpa `SubmitButton` | pattern manual `disabled={isSubmitting}` + teks berubah saat `fetcher.state !== "idle"` | wms modals (`TaskModal`, `ProjectModal`, `ChannelModal`, `CreateWorkspaceModal`) |

### 1. Submit Button — Anti Double-Submit (WAJIB)

**Setiap tombol submit WAJIB di-disable + spinner saat request berjalan.** Jangan pernah biarkan tombol aktif selama `submitting` — user bisa klik 2x dan membuat data ganda.

**Opsi A — `SubmitButton` (nurafin):** auto-detect `useNavigation()` / `useFetchers()` state, jadi tidak perlu manual.

```tsx
// apps/nurafin/app/components/shared/components/SubmitButton.tsx
import { useNavigation, useFetchers } from "react-router";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends ComponentPropsWithoutRef<"button"> {
  submittingText?: string;
  /** Scope: "navigation" (default) untuk <Form> browser submit, "fetcher" untuk <fetcher.Form> */
  scope?: "navigation" | "fetcher";
  loading?: boolean;
}
```

Pemakaian di route:
```tsx
import { SubmitButton } from "~/components/shared/components/SubmitButton";

// Untuk <fetcher.Form> — scope="fetcher"
<SubmitButton scope="fetcher" submittingText="Menyimpan...">
  Simpan
</SubmitButton>

// Untuk <Form> — scope="navigation" (default)
<SubmitButton submittingText="Membuat...">Buat</SubmitButton>
```

**Opsi B — pattern inline (wms):** untuk tombol submit di modal yang memakai `useFetcher`.

```tsx
const fetcher = useFetcher();
const isSubmitting = fetcher.state !== "idle";

<fetcher.Form method="post">
  <button
    type="submit"
    disabled={isSubmitting || !name.trim()}
    className="... disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
    {isSubmitting ? "Creating..." : "Create Project"}
  </button>
</fetcher.Form>
```

**Aturan tambahan:**
- Jangan hanya disable — tampilkan juga indikator (spinner `Loader2` + `animate-spin`) dan ganti label ke state progress (`submittingText`).
- Kombinasikan dengan validasi: `disabled={isSubmitting || !formValid}` — jangan izinkan submit form tidak valid.
- `SubmitButton` ada di **nurafin**. App lain tanpa `SubmitButton` **harus** pakai pattern inline Opsi B — jangan pernah menulis tombol submit tanpa `disabled`/spinner.

### 2. Data List Skeleton — `LoadingState` (nurafin)

Saat data list di-fetch client-side (TanStack Query), tampilkan skeleton rows, bukan spinner kosong atau layar hang.

```tsx
// apps/nurafin/app/components/shared/components/LoadingState.tsx
function LoadingState({ rows = 3, className }: { rows?: number; className?: string }) {
  // render N baris skeleton: avatar circle + 2 text lines + badge placeholder
  // bg-[var(--muted)] animate-pulse
}
```

Pemakaian — pola ternary `isError → isLoading → data`:
```tsx
const list = journals.isError ? (
  <ErrorState
    title="Gagal memuat transaksi"
    message={journals.error instanceof Error ? journals.error.message : "Terjadi kendala koneksi."}
    onRetry={() => journals.refetch()}
  />
) : journals.isLoading ? (
  <LoadingState rows={5} />
) : (
  <div className="divide-y divide-[var(--border)]">
    {items.map(item => <Row key={item.uid} item={item} />)}
  </div>
);
```

### 3. Page Navigation Skeleton — `PageSkeleton` (wms)

Saat navigasi antar route, layout container harus menampilkan skeleton halaman, bukan overlay spinner yang memblokir layar.

```tsx
// apps/wms/app/routes/_authenticated.workspace.$workspaceSlug.tsx
const navigation = useNavigation();
const isNavigating = navigation.state === "loading";

<WorkspaceLayout sidebar={<WorkspaceSidebar />}>
  {isNavigating ? <PageSkeleton /> : <Outlet />}
</WorkspaceLayout>
```

`PageSkeleton` (di `apps/wms/app/components/shared/widgets/PageSkeleton.tsx`) juga mengekspor `SkeletonLine` dan `SkeletonBlock` — reusable primitives untuk membangun skeleton custom:

```tsx
import { SkeletonLine, SkeletonBlock } from "~/components/shared/widgets/PageSkeleton";

<SkeletonLine className="w-24 h-4" />
<SkeletonBlock className="h-20" />
```

### 4. NavigationProgress — Progress Bar Top

Setiap app wajib mount `NavigationProgress` di `root.tsx` — bar 2px di atas yang aktif saat `navigation.state === "loading"`, menggantikan GlobalLoader overlay.

```tsx
// apps/wms/app/root.tsx & apps/nurafin/app/root.tsx
<NavigationProgress />
```

**Aturan anti-freeze:**
- Navigasi route → **progress bar + skeleton**, bukan overlay spinner full-screen.
- `GlobalLoader` (overlay `inset-0`) HANYA untuk aksi yang benar-benar blocking & singkat (submit upload besar), dipicu via `useUIStore().setLoading(true)`.
- `LoadingState` untuk data list in-page (skeleton), `PageSkeleton` untuk transisi route (skeleton layout).

---

## Error Handling — ErrorCatch (WAJIB)

**DILARANG** menulis bare `catch {}` atau `catch { ... }` tanpa logging. Setiap `try/catch` di `loader()` dan `action()` **WAJIB** memanggil `ErrorCatch()` dari `~/lib/api`.

### Pattern Wajib

```ts
import { ErrorCatch } from "~/lib/api";

export async function action({ request }: ActionFunctionArgs) {
  try {
    // ... API call
  } catch (error) {
    ErrorCatch({ error, context: "action:create-workspace" });
    const message = error instanceof Error ? error.message : "Unknown error";
    const cookie = await setFlashMessage(request, { type: "error", message });
    return flashRedirect("/fallback-url", cookie);
  }
}
```

### Rules

1. **Selalu tangkap `error`** — tulis `catch (error)`, bukan `catch {` atau `catch (e)`
2. **Selalu panggil `ErrorCatch()`** sebagai baris pertama di dalam catch
3. **Context string harus deskriptif** — format: `"loader:fitur-name"` atau `"action:operation-name"`
4. **Flash message harus include error message asli** — jangan generic "Please try again", tapi sertakan `error.message` agar user/developer tahu masalahnya
5. **Jangan re-throw** kecuali memang butuh error boundary — handle gracefully dengan flash + redirect

### ErrorCatch function (`~/lib/api.ts`)

```ts
export function ErrorCatch({
  error,
  context,
}: {
  error: unknown;
  context: string;
}) {
  // Re-throw Response objects (redirect dari 401 handler)
  if (error instanceof Response) throw error;

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const statusCode = error instanceof ApiError ? error.statusCode : undefined;

  console.error(`[ErrorCatch] ${context}`, {
    message,
    statusCode,
    stack,
    timestamp: new Date().toISOString(),
  });

  // TODO: send to Telegram bot for real-time alerts
  // await sendTelegramAlert({ context, message, statusCode });
}
```

**PENTING:** `if (error instanceof Response) throw error;` — ini memastikan redirect dari 401 handler tidak tertangkap catch block dan tetap propagate ke framework.

### Auto-redirect pada 401 (Token Expired)

`apiFetch()` otomatis throw `redirect("/auth/login")` jika API mengembalikan HTTP 401. Ini terjadi di level paling rendah sehingga **semua** API call yang token-nya expired akan otomatis mental ke halaman login.

**Mekanisme:**
1. `apiFetch()` terima HTTP 401 dari API → throw `redirect("/auth/login")`
2. `ErrorCatch()` di catch block → deteksi `error instanceof Response` → re-throw
3. React Router menangkap Response → user di-redirect ke login

**Aturan:**
- Jangan handle 401 secara manual di loader/action — `apiFetch` sudah handle
- Jangan cek `res.status === 401` di service layer — biarkan `apiFetch` yang handle
- Pastikan `ErrorCatch()` selalu dipanggil pertama di catch block — dia yang re-throw redirect

### Kapan `ErrorCatch` dipanggil

| Lokasi | Context format | Contoh |
|---|---|---|
| `loader()` | `"loader:page-name"` | `"loader:workspace-overview"` |
| `action()` | `"action:operation"` | `"action:create-workspace"` |
| Service layer | `"service:method"` | `"service:workspace.create"` |

---

## Routing Conventions

**WAJIB** gunakan file-system flat routes via `@react-router/fs-routes`. Jangan pernah daftarkan route manual di `routes.ts` — setiap route file baru otomatis terdaftar berdasarkan nama file.

```ts
// app/routes.ts — ini satu-satunya isi yang diperbolehkan
import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default flatRoutes() satisfies RouteConfig;
```

**Penamaan file routes — titik (`.`) sebagai pemisah segmen URL:**

| File | Route |
|---|---|
| `_index.tsx` | `/` |
| `about.tsx` | `/about` |
| `projects._index.tsx` | `/projects` (index) |
| `projects.$slug.tsx` | `/projects/:slug` |
| `tools.logo._index.tsx` | `/tools/logo` (index) |
| `tools.logo.how.tsx` | `/tools/logo/how` |
| `tools.palette._index.tsx` | `/tools/palette` |
| `api.contact.ts` | `/api/contact` (API route, no JSX) |

### Aturan Semantik Route — Analisa Konteks, Bukan Asal Taruh

**WAJIB** analisa konteks dan domain saat menentukan route path. Route harus merepresentasikan **siapa/apa yang memiliki** halaman tersebut, bukan sekadar nama fitur.

```
❌ SALAH — "Settings" langsung di bawah workspace, padahal ini setting akun user
/workspace/settings

✅ BENAR — Settings ada di bawah konteks "account" karena yang di-setting adalah akun user
/workspace/account/settings
```

**Panduan analisa:**

| Pertanyaan | Implikasi Route |
|---|---|
| Halaman ini tentang **akun user** (profile, password, preferences)? | `/workspace/account/...` |
| Halaman ini tentang **workspace itu sendiri** (rename, billing, delete)? | `/workspace/:id/settings` |
| Halaman ini tentang **project tertentu** (members, integrations)? | `/workspace/:wid/projects/:pid/settings` |
| Halaman ini tentang **konten di dalam project** (tasks, files)? | `/workspace/:wid/projects/:pid/...` |

**Prinsip:** Route path = breadcrumb mental. User harus bisa **membaca URL** dan langsung paham konteks halaman tanpa melihat UI.

**Contoh lain:**
- Menu "Logout" di popover user → action ke `/auth/logout` (bukan `/workspace/logout`)
- Menu "Notifications" di popover user → `/workspace/account/notifications`
- Menu "Workspace Settings" di workspace header → `/workspace/:id/settings`
- Menu "Billing" → `/workspace/:id/billing` (milik workspace, bukan user)

**Aturan:**
- Titik (`.`) dalam nama file = slash (`/`) dalam URL
- `_index` = index route untuk segment tersebut
- `$param` = dynamic segment (`:param`)
- Semua file dalam `app/routes/` — tidak ada subfolder, semuanya flat
- `export const ssr = false` untuk route yang pure client-side (gunakan browser APIs)

**Import dari `"react-router"` — bukan `"react-router-dom"`:**

```ts
import { Link, useNavigate, useLocation } from "react-router";
```

---

## Navigation Performance — Transisi Route Cepat (WAJIB)

Keluhan paling sering: **transisi navigate antar route selalu lemot**. Dua penyebab utama: (1) loader menunggu semua data selesai sebelum render, dan (2) GlobalLoader overlay memblokir seluruh layar sehingga halaman terasa "freeze". Section ini berisi aturan wajib untuk setiap navigasi antar route.

### Decision Matrix — Pilih Solusi Sesuai Skenario

| Skenario | Solusi Terbaik |
|---|---|
| Navigasi halaman utama → halaman lain | `<Link prefetch="intent">` + Streaming Suspense |
| App penuh data dinamis / butuh offline cache | Integrasi TanStack Query + loader |
| Aksi tanpa ubah URL (like, polling, search) | `useFetcher` |
| Cegah halaman terasa "freeze" saat koneksi lambat | `useNavigation()` global loader |

### 1. `<Link prefetch="intent">` — Navigasi Instant

```tsx
<Link prefetch="intent" to="/workspace/projects">Projects</Link>
```

- `prefetch="intent"` → module route + data loader di-fetch saat user hover/focus link (deteksi niat klik). Saat link diklik, navigasi terasa instant karena data sudah siap.
- Mode lain: `viewport` (saat link masuk viewport), `render` (saat link di-render), `none` (default).
- **Wajib** untuk: navbar, sidebar, dan semua link ke halaman yang sering dikunjungi.
- **Jangan** untuk: link ke halaman jarang dibuka / datanya berubah-ubah (prefetch sia-sia, boros bandwidth).

### 2. Streaming Suspense — Non-Critical Data Tidak Menahan Render

**React Router v7 sudah menghapus `defer()`.** Streaming dilakukan dengan mengembalikan **raw promise** dari loader, lalu di-render dengan `<Await>` + `<Suspense>`.

```tsx
// ✅ BENAR — critical data di-await, non-critical dikembalikan sebagai promise (tidak di-await)
export async function loader({ params }: LoaderFunctionArgs) {
  const workspace = await getWorkspace(params.slug); // critical — ditunggu
  const stats = getStats(params.slug);               // non-critical — return promise
  return { workspace, stats };
}

export default function WorkspacePage() {
  const { workspace, stats } = useLoaderData<typeof loader>();
  return (
    <main>
      <WorkspaceHeader workspace={workspace} />
      <React.Suspense fallback={<StatsSkeleton />}>
        <Await resolve={stats}>
          {(data) => <StatsGrid data={data} />}
        </Await>
      </React.Suspense>
    </main>
  );
}
```

- **Aturan:** data di atas fold → `await` di loader. Data sekunder (stats, sidebar channels, comments) → return promise, render dengan skeleton.
- Loader yang `await` semua data adalah sumber utama navigasi lemot.
- Default timeout promise streamed = 4950ms. Jika butuh lebih lama, export `streamTimeout` di `entry.server.tsx`.

### 3. `useFetcher` — Aksi Tanpa Navigasi

Like, polling, search, update status — semua aksi yang **tidak mengubah URL** wajib pakai `useFetcher` / `<fetcher.Form>`, bukan `useNavigate` + state manual.

```tsx
const fetcher = useFetcher();

<fetcher.Form method="post" action="/api/task/status">
  <input type="hidden" name="id" value={task.id} />
  <input type="hidden" name="status" value="done" />
  <button type="submit" disabled={fetcher.state === "submitting"}>
    {fetcher.state === "submitting" ? "Menyimpan..." : "Tandai Selesai"}
  </button>
</fetcher.Form>
```

- Tidak reload halaman, tidak memblockir navigasi lain.
- `fetcher.state` untuk status button, `fetcher.data` untuk hasil action.

### 4. `useNavigation()` Global Loader — Anti-Freeze (WAJIB)

**Jangan pernah memblokir seluruh layar dengan overlay spinner saat navigasi** — itu yang membuat halaman terasa "freeze". Standar yang benar: **progress bar tipis 2-3px di atas** (`NavigationProgress`) + **skeleton layout** (`PageSkeleton`), seperti di `apps/wms` dan `apps/nurafin`. Lihat juga [Loading & Skeleton States](#loading--skeleton-states-wajib).

```tsx
// ✅ BENAR — progress bar tipis di top + skeleton konten saat navigasi
const navigation = useNavigation();
const isNavigating = navigation.state === "loading";
// render bar 2px di top, width = progress
// {isNavigating ? <PageSkeleton /> : <Outlet />}

// ❌ SALAH — overlay inset-0 yang memblockir semua interaksi saat navigasi
// (GlobalLoader full-screen hanya untuk submit yang benar-benar blocking, bukan navigasi route)
```

Aturan:
- `navigation.state === "loading"` → navigasi antar route berjalan.
- `navigation.location` → path tujuan; gunakan untuk highlight nav item aktif / skeleton per-section.
- `GlobalLoader` overlay hanya untuk aksi submit yang benar-benar blocking (upload file besar), **bukan** untuk navigasi route.
- Prefer **skeleton per-section** daripada spinner full-screen.
- Setiap data list yang di-fetch client-side (TanStack Query) harus render `LoadingState` saat `isLoading` dan `ErrorState` saat `isError` — jangan pernah layar kosong.

### 5. TanStack Query + Loader — Efeknya ke Navigasi

TanStack Query **bukan pengganti Zustand** (UI/global state tetap Zustand), tapi layer **server-state cache** untuk data API. Efeknya ke navigasi:

- **Kunjungan ulang jadi instant** — data yang pernah di-fetch tersimpan di cache, render tanpa menunggu server.
- **Back-navigation instan** — kembali ke halaman sebelumnya tidak perlu fetch ulang.
- **Polling & background refetch** tanpa memblockir UI.
- **Offline-friendly** — data tersimpan di memory cache (atau `persistQueryClient` untuk storage).

Integrasi dasar (tanpa double-fetch) — `initialData` dari loader:

```tsx
export async function loader({ params }: LoaderFunctionArgs) {
  const channels = await getChannels(params.projectId);
  return { channels };
}

export default function ChannelList() {
  const { channels: initialChannels } = useLoaderData<typeof loader>();
  const { data: channels, refetch } = useQuery({
    queryKey: ["channels", params.projectId],
    queryFn: () => clientFetch(`/projects/${params.projectId}/channels`),
    initialData: initialChannels,
    staleTime: 30_000,
  });
  // render dari `channels` — navigasi balik instant, refetch di background
}
```

Integrasi lanjutan untuk cache penuh di client navigation — `clientLoader` + `ensureQueryData`:

```ts
export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  const queryClient = getQueryClient();
  return queryClient.ensureQueryData({
    queryKey: ["channels", params.projectId],
    queryFn: () => clientFetch(`/projects/${params.projectId}/channels`),
  });
};
```

Catatan penting:
- TanStack Query **belum terpasang** di monorepo. Sebelum pakai, tambahkan `@tanstack/react-query` ke `package.json` **app yang butuh** (jangan di root).
- **Jangan install** untuk app yang hanya menampilkan data statis — loader biasa + `prefetch="intent"` sudah cukup.
- Install hanya untuk app dengan data dinamis berat: polling, banyak list yang dibuka berulang, butuh offline cache.
- Data critical tetap di loader (lihat [Non-Blocking Data Loading](#non-blocking-data-loading)); TanStack Query untuk data dinamis di dalam halaman.

---

## Import Order (Wajib)

```ts
// 1. React / framework
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

// 2. Third-party
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Github } from "lucide-react";
import { create } from "zustand";

// 3. Internal — absolute via ~/
import { cn } from "~/lib/utils";
import { BRAND_NAME } from "~/constants/brand";
import { Button } from "~/components/shared/components/Button";
import { useUIStore } from "~/components/shared/store/ui";

// 4. Relative (hanya dalam feature yang sama)
import { useProjectStore } from "../store";
import type { ProjectCardProps } from "./types";
```

---

## TypeScript Conventions

```json
// tsconfig.json (extend dari @rayeen/config/tsconfig.base.json)
{
  "extends": "../../packages/config/tsconfig.base.json",
  "compilerOptions": {
    "paths": { "~/*": ["./app/*"] }
  }
}
```

**Penamaan:**

| Pola | Konvensi |
|---|---|
| Component props | `interface ButtonProps` |
| Zustand state | `interface UIState` |
| DB record types | `DbUser`, `DbProject` |
| API result types | `ApiListResult<T>`, `ApiInsertResult` |
| Domain enums | `type ProjectStatus = "active" \| "archived"` |
| Derived types | `type NewProject = Omit<Project, "id" \| "createdAt">` |

**Path alias:** `~/` → `./app/` (dikonfigurasi di `tsconfig.json` dan di-resolve oleh `vite-tsconfig-paths`)

---

## `cn()` utility (wajib ada di setiap app)

```ts
// app/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Animation Conventions (Framer Motion)

Gunakan `motion/react` (bukan `framer-motion` langsung untuk tree-shaking):

```ts
import { motion, AnimatePresence } from "motion/react";
```

**Spring presets standar (dari Mobbin):**

```ts
// Fade-up on scroll — default untuk semua section heading
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", bounce: 0, delay: 0.2, duration: 0.8 },
};

// Hero H1 — dramatic entrance
const heroEntrance = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", bounce: 0, duration: 1.2 },
};

// Card hover — scale subtle
const cardHover = {
  whileHover: { scale: 1.02, y: -4 },
  transition: { type: "spring", bounce: 0, duration: 0.3 },
};

// Stagger children
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};
```

**Aturan:**
- Semua spring: `bounce: 0` (critically damped, tidak overshoot)
- `will-change: transform` hanya pada elemen yang akan di-animate
- Gunakan `AnimatePresence` untuk enter/exit transitions
- Scroll-triggered: gunakan `whileInView` + `viewport={{ once: true }}`

---

## Smooth Scroll (Lenis + GSAP) — Landing App Only

`apps/landing` menggunakan **Lenis** untuk smooth scroll, di-sync dengan **GSAP ScrollTrigger**.

### Setup di `root.tsx` (Layout component)

**PENTING:** GSAP dan Lenis adalah client-only. WAJIB dynamic import di dalam `useEffect` — jangan top-level import, akan crash di server (Vercel SSR).

```tsx
import type Lenis from "@studio-freight/lenis";

useEffect(() => {
  let lenis: Lenis | null = null;
  let ticker: ((time: number) => void) | null = null;
  let gsapInstance: typeof import("gsap")["gsap"] | null = null;

  async function init() {
    const [{ default: LenisClass }, gsapModule, { ScrollTrigger }] =
      await Promise.all([
        import("@studio-freight/lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

    gsapInstance = gsapModule.gsap;
    gsapInstance.registerPlugin(ScrollTrigger);

    lenis = new LenisClass({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on("scroll", ScrollTrigger.update);

    ticker = (time: number) => lenis!.raf(time * 1000);
    gsapInstance.ticker.add(ticker);
    gsapInstance.ticker.lagSmoothing(0);
  }

  init();

  return () => {
    if (lenis) lenis.destroy();
    if (gsapInstance && ticker) gsapInstance.ticker.remove(ticker);
  };
}, []);
```

### Aturan Lenis — WAJIB diikuti

| Hal | Yang benar | Yang salah |
|---|---|---|
| GSAP/Lenis import | `import()` di dalam `useEffect` (dynamic) | Top-level `import { gsap } from "gsap"` (crash di SSR) |
| CSS scroll | Tidak ada `scroll-behavior` di CSS | `scroll-behavior: smooth` |
| Programmatic scroll | `el.scrollIntoView({ behavior: "instant" })` | `behavior: "smooth"` |
| Ticker cleanup | Simpan `const ticker = ...` lalu `remove(ticker)` | `gsap.ticker.remove(lenis.raf)` |

> **Mengapa?** Lenis dan `scroll-behavior: smooth` / `scrollIntoView smooth` berebut kontrol scroll position di setiap frame. Hasilnya scroll terasa berat dan patah-patah. Lenis harus menjadi **satu-satunya** yang menganimasikan scroll.

### isHydrated Pattern

Wrap konten dalam `Layout` dengan guard ini untuk mencegah hydration flash:

```tsx
const [isHydrated, setIsHydrated] = useState(false);

useEffect(() => {
  const frame = requestAnimationFrame(() => setIsHydrated(true));
  return () => cancelAnimationFrame(frame);
}, []);

// Di JSX:
<div className={!isHydrated ? "opacity-0" : "opacity-100 transition-opacity duration-500"}>
  {children}
</div>
```

---

## Landing Page root.tsx — Full Widget Stack

`Layout` di `root.tsx` harus memiliki semua widget ini:

```tsx
<body>
  <div className={!isHydrated ? "opacity-0" : "opacity-100 transition-opacity duration-500"}>
    <Navbar />
    {children}
  </div>
  <GlobalLoader />                                           {/* overlay spinner */}
  <Toaster position="top-right" expand={false} richColors /> {/* sonner toast */}
  <ScrollRestoration />
  <Scripts />
</body>
```

---

## Landing Page (apps/landing) — Design System

### Visual Philosophy (terinspirasi Mobbin)

- **Tipografi dominan** — heading besar, letter-spacing negatif, font berat
- **Rounded agresif** — tidak ada sudut sharp, semua pill atau card radius besar
- **Flat + glassmorphism selektif** — shadow sangat subtle, glass hanya untuk nav
- **Animasi spring-based** — smooth, no overshoot, entrance-on-scroll
- **Color minimal** — dominan hitam/putih, satu accent color saja

### Sections

| Section | Component File | Pattern |
|---|---|---|
| Navbar | `shared/layouts/Navbar.tsx` | Floating glassmorphism pill, fixed centered |
| Hero | `features/home/widgets/HeroSection.tsx` | Layered, scattered project previews, dramatic H1 |
| About | `features/home/widgets/AboutSection.tsx` | Clean typography, bio + foto |
| Skills | `features/home/widgets/SkillsSection.tsx` | Infinite marquee 2-3 rows, alternating direction |
| Projects | `features/home/widgets/ProjectsSection.tsx` | Card grid, fade mask bottom |
| Contact | `features/home/widgets/ContactSection.tsx` | CTA + social links |

### Navbar Pattern

```tsx
// Floating pill — fixed, centered, glassmorphism
<nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50
  w-[584px] h-[60px] px-6
  flex items-center gap-4
  rounded-[30px]
  bg-[rgba(237,237,237,0.64)]
  backdrop-blur-[48px]
  border border-[var(--border)]">
```

### Hero Structure (layered)

```
Layer 1: bg-background (putih)
Layer 2: Decorative diagonal panels — opacity-10, rotate-45, animate slide-in
Layer 3: Scattered project screenshot cards — absolute positioned, animate from center
Layer 4: Text block — centered, max-w-[1024px], pt-[156px] pb-[180px]
          ├── Eyebrow label (24px)
          ├── H1 (80px desktop / 44px mobile, dramatic spring entrance)
          ├── Subtitle (20px, muted)
          └── CTA buttons (pill shape, rounded-[1000px])
```

### Project Card

```tsx
// Standard project card untuk showcase
<div className="rounded-[var(--radius-card)] bg-card border border-[var(--border)]
  shadow-[var(--shadow-card)] overflow-hidden
  transition-transform duration-300 hover:-translate-y-1">
  {/* Screenshot preview */}
  {/* Project name + description */}
  {/* Tech stack badges */}
  {/* Links: subdomain + subpath */}
</div>
```

### Infinite Marquee

```tsx
// 3 rows, alternating direction
// Row 1: kanan  →
// Row 2: kiri   ←
// Row 3: kanan  →
// Fade mask: mask: linear-gradient(#000 85%, transparent 100%)
```

### Screenshot/Preview Grid

```css
/* Fade mask di bawah grid */
mask: linear-gradient(#000 95%, transparent 100%);
-webkit-mask: linear-gradient(#000 95%, transparent 100%);
```

---

## Project Card Data Structure

```ts
// packages/types/src/project.ts
export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  subdomain: string;          // "crm.rayeen.dev"
  subpath: string;            // "/projects/crm"
  techStack: string[];        // ["React", "TypeScript", "Tailwind"]
  status: "live" | "wip" | "coming-soon";
  screenshotUrl?: string;
  accentColor?: string;       // CSS var name: "--crm-accent"
}
```

---

## Deployment

Setiap app di-deploy secara **independen** ke Vercel dari folder `apps/[nama-app]/`:

```json
// apps/[nama-app]/vercel.json
{
  "framework": "react-router",
  "buildCommand": "cd ../.. && npx turbo build --filter=@rayeen/[nama-app]",
  "outputDirectory": "build"
}
```

**Environment variables** didefinisikan per-app di Vercel dashboard, tidak di root monorepo.

---

## Maintainability — Agar Mudah di-Maintain Developer Manusia

Code yang ditulis AI tetap harus **readable, navigable, dan debuggable** oleh developer manusia non-AI. Ikuti prinsip berikut:

### 1. Naming yang Self-Documenting

- Nama file = apa yang dikandung: `HeroSection.tsx` bukan `Section1.tsx`
- Nama variable/function deskriptif: `handleNavClick`, `useUIStore`, `TECH_STACK_ROWS`
- **DILARANG** nama generik: `data`, `temp`, `helper`, `stuff`, `Component1`
- Prop interface selalu dekat dengan component — developer tidak perlu buka file lain untuk tahu prop apa yang tersedia

### 2. Struktur Folder = Peta Mental

Folder hierarchy harus bisa dijawab tanpa membaca kode:
- "Di mana button custom?" → `app/components/shared/components/Button.tsx`
- "Di mana logic fitur X?" → `app/components/features/[x]/`
- "Di mana routes?" → `app/routes/`
- "Di mana theme/warna?" → `app/index.css`
- "Di mana global state?" → `app/components/shared/store/`

> **Tes: developer baru bisa menemukan file yang dicari dalam < 5 detik** hanya dari nama folder.

### 3. Satu File = Satu Tanggung Jawab

- Satu component per file (kecuali compound component — Card, CardHeader, CardTitle boleh satu file)
- File > 200 baris → pertimbangkan split
- Jangan campur concern: styling logic di CSS token, state di store, UI di component
- Route file hanya orchestrate — logika berat di service/store

### 4. Predictable Patterns

Setiap developer yang sudah lihat 1 feature folder bisa **prediksi struktur** feature lainnya:

```
features/[apapun]/
├── types.ts       ← selalu ada, selalu nama ini
├── store.ts       ← selalu Zustand, selalu pattern yang sama
├── services.ts    ← selalu object dengan async methods
└── widgets/       ← selalu folder ini untuk components
```

Jangan buat variasi — konsistensi > kreativitas dalam struktur.

### 5. Explicit over Clever

- Pilih kode yang jelas dibaca daripada kode yang pintar tapi susah di-trace
- **DILARANG** ternary bersarang > 1 level
- **DILARANG** abstraksi yang memaksa developer buka 3+ file untuk pahami 1 behavior
- Utility/helper harus punya nama yang menjelaskan *apa* bukan *bagaimana*: `cn()` bukan `mergeClassNames()`... tapi ini sudah convention — baru boleh jika sudah standar komunitas

### 6. Dependency yang Familiar

- Gunakan library yang **komunitas besar** dan **well-documented**: React, Tailwind, Zustand, Framer Motion, Lucide
- Jangan introduce library niche tanpa alasan kuat — developer selanjutnya harus bisa googling solusi
- Versi di-pin: `^major.x` — jangan floating `latest` di production

### 7. Error States yang Jelas

- Setiap form punya validasi dengan pesan error yang deskriptif
- API call harus handle loading, success, dan error — bukan hanya happy path. Wajib pakai `LoadingState` (skeleton saat `isLoading`) + `ErrorState` (dengan `onRetry`) untuk data list client-side, dan `SubmitButton`/pattern inline untuk tombol submit. Lihat [Loading & Skeleton States](#loading--skeleton-states-wajib).
- Console.log boleh di dev, tapi gunakan structured approach — jangan random `console.log("here")`
- ErrorBoundary di root menangkap crash dan tampilkan recovery UI

### 8. Komentar Strategis — Bukan di Mana-mana

Secara default: **kode tidak perlu komentar jika penamaan sudah jelas**. Tapi WAJIB ada komentar di:

- Logic bisnis yang non-obvious: `// soft delete — set timestamp, bukan hapus row`
- Workaround/hack: `// Lenis conflict — pakai instant scroll, lihat root.tsx`  
- Config values yang butuh konteks: `// 1.2s duration — sesuai feel scroll erhand-project`
- `// TODO:` untuk hal yang belum selesai (harus ada nama dan tanggal)

### 9. Quick Start di README per App

Setiap `apps/[nama-app]/` WAJIB punya `README.md` minimal berisi:

```markdown
# @rayeen/[nama-app]

## Dev
npm run dev

## Struktur
app/
├── routes/       → pages
├── components/   → UI components
├── constants/    → config & data
└── lib/          → utilities

## Deploy
Vercel — [subdomain].rayeen.dev
```

> Developer baru bisa start tanpa tanya siapapun.

---

## Menambah App Baru — Gunakan sot-sync untuk Boilerplate

Sebelum membuat app baru dari scratch, **selalu minta boilerplate lewat sot-sync** terlebih dahulu. Tool `get_app_boilerplate` akan mengekstrak semua 13 file skeleton dari app referensi dalam satu call — tidak perlu baca file satu per satu.

```
Tool: get_app_boilerplate
  source      → "apps/wms"         (app referensi yang sudah mature)
  target_name → "[nama-app-baru]"  (nama app yang akan dibuat)
  format      → "text"             (markdown dengan code blocks, siap tulis)
```

Output berisi: `package.json`, `tsconfig.json`, `vite.config.ts`, `react-router.config.ts`, `vercel.json`, `app/index.css`, `app/root.tsx`, `app/routes.ts`, `app/lib/utils.ts`, `app/lib/flash.server.ts`, `shared/store/ui.ts`, `GlobalLoader.tsx`, `FlashObserver.tsx` — plus instruksi adaptasi (ganti nama, update accent color, update cookie name, dll).

Setelah boilerplate ditulis, lakukan adaptasi sesuai kebutuhan app baru.

---

## Menambah App Baru — Wajib Update Landing Page

Setiap kali **app baru** ditambahkan ke monorepo, ada dua sisi yang harus diupdate secara bersamaan:

### 1. Tambah entri ke `apps/landing/app/constants/projects.ts`

File ini adalah sumber kebenaran tunggal (single source of truth) yang menampilkan semua project di landing page. Wajib menambah `ProjectItem` baru:

```ts
// apps/landing/app/constants/projects.ts
{
  id: "[nama-app]",          // slug unik, sama dengan nama folder di apps/
  name: "Nama Tampilan",     // nama panjang yang ditampilkan di UI
  slug: "[nama-app]",        // URL-safe identifier
  description: "...",        // deskripsi singkat 1-2 kalimat
  subdomain: "[nama].rayeen.web.id",   // subdomain production
  subpath: "/projects/[nama-app]",     // path untuk link di landing
  techStack: ["React", "TypeScript"],  // daftar teknologi yang dipakai
  status: "wip",             // "live" | "wip" | "coming-soon"
  accentColor: "--[nama]-accent",      // CSS var untuk warna aksen
  order: N,                  // urutan tampil di grid (increment dari yang ada)
}
```

### 2. Tambah port ke `DEV_PORTS` di file yang sama

Agar dev local bisa resolve ke app yang benar:

```ts
export const DEV_PORTS: Record<string, number> = {
  wms: 5200,
  nurafin: 5201,
  eis: 5202,
  "campus-erp": 5203,
  "[nama-app]": 5204,  // ← tambah port baru (increment)
};
```

### 3. Update agent-docs constants jika ada perubahan konteks agent

Jika perubahan melibatkan konten skill/agent, update juga `apps/landing/app/components/features/agent-docs/constants.ts` agar UI agent-docs di landing page tetap sinkron dengan SKILL.md yang baru.

> **Aturan:** jangan tunggu sampai diminta — setiap kali menambah app baru, langsung update `projects.ts` dan `DEV_PORTS` dalam commit yang sama.

---

## Integrasi AI — Cara Mendapatkan API Key untuk Testing

Jika kamu membutuhkan integrasi AI (generasi gambar, teks, LLM, dll) untuk sebuah fitur dan butuh API key default untuk mencoba, **cek terlebih dahulu** file `.env` di:

```
~/Workspaces/Developments/opencode-cli/.env
```

File ini berisi API key yang sudah tersedia untuk dipakai:

| Key | Provider |
|---|---|
| `GEMINI_API_KEY` | Google Gemini (image + text generation) |
| `NVIDIA_API_KEY` | NVIDIA AI APIs |
| `CLOUDFLARE_API_KEY` + `CLOUDFLARE_ACCOUNT_ID` | Cloudflare AI Workers |
| `CUSTOM_OPENAI_API_KEY` + `CUSTOM_OPENAI_BASE_URL` | Custom OpenAI-compatible endpoint |
| `CUSTOM_OPENAI_MODELS` | Daftar model yang tersedia di custom endpoint |

### Cara pakai di app

Jangan hardcode API key langsung di kode. Pakai environment variable di app:

```ts
// 1. Buat .env.local di folder app (tidak di-commit)
// apps/[nama-app]/.env.local
VITE_GEMINI_API_KEY=...      // untuk Vite client-side (hati-hati: exposed ke browser)
GEMINI_API_KEY=...           // untuk server-side loader/action

// 2. Akses dari kode
// Server-side (loader/action) — aman
const apiKey = process.env.GEMINI_API_KEY;

// Client-side — hanya untuk prototype/demo, jangan di production
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

### Panduan memilih provider

| Use case | Provider yang direkomendasikan |
|---|---|
| Logo/image generation | `GEMINI_API_KEY` (Imagen) atau `CLOUDFLARE_API_KEY` (Stable Diffusion) |
| Text generation / chat | `CUSTOM_OPENAI_API_KEY` dengan `CUSTOM_OPENAI_BASE_URL` |
| Embedding / similarity | `NVIDIA_API_KEY` |

> **Catatan keamanan:** API key dari `opencode-cli/.env` hanya untuk development dan prototyping. Sebelum production, gunakan API key project sendiri yang disimpan di Vercel environment variables, bukan yang di-hardcode di `.env.local`.

---

## Checklist Sebelum Commit

Sebelum selesai mengerjakan task apapun, verifikasi:

- [ ] Tidak ada hardcode warna / hex di className — semua pakai CSS token
- [ ] Tidak ada barrel `index.ts` baru di `components/`
- [ ] Import order sudah sesuai (React → third-party → internal `~/` → relative)
- [ ] Semua component baru pakai named export (kecuali route files)
- [ ] TypeScript: tidak ada `any` yang tidak disengaja
- [ ] Icon sizing mengikuti standar tabel di atas
- [ ] Animasi menggunakan `bounce: 0` spring
- [ ] `cn()` digunakan untuk semua className yang dinamis
- [ ] Tidak ada font hardcode — gunakan utility class `font-sans`, `font-display`
- [ ] Tidak ada `scroll-behavior: smooth` atau `scrollIntoView({ behavior: "smooth" })`
- [ ] **Loading:** tombol submit punya fallback (disable + spinner) — tidak bisa double-submit
- [ ] **Loading:** data list menampilkan skeleton (`LoadingState` / `PageSkeleton`) saat memuat
- [ ] **Loading:** `NavigationProgress` ter-mount di `root.tsx` untuk navigasi antar route
- [ ] **Modular:** tidak ada import lintas `apps/` — hanya via `packages/`
- [ ] **Modular:** app-specific deps tidak di root `package.json`
- [ ] **Modular:** shared code sudah nyata dipakai di 2+ apps sebelum di-extract ke packages

---

## sot-sync MCP — Kapan Minta Bantuan dan Tool Mana

sot-sync adalah MCP server lokal yang berjalan bersamaan. Ia bisa membaca codebase, parse AST, query graph, dan menyimpan memory — **jauh lebih efisien daripada membaca file satu per satu**. Gunakan sebelum membuka file apapun.

### Decision Table — Situasi → Tool

| Situasi | Tool sot-sync | Kenapa lebih efisien |
|---|---|---|
| Mau scaffold app baru | `get_app_boilerplate(source="apps/wms", target_name="nama-app")` | 1 call = 13 file boilerplate sekaligus, vs 13 file reads manual |
| Mau tahu struktur/fungsi di sebuah file | `parse_file(file="apps/wms/app/root.tsx")` | Return semua function signatures + body + imports, vs membaca raw file |
| Mau tahu semua fungsi di sebuah modul/feature | `list_functions(filter="keyword")` | Return `file:line` semua fungsi yang match, vs grep manual |
| Mau tahu signature satu fungsi spesifik | `get_function_signature(name="useUIStore")` | Return signature + lokasi langsung, tanpa buka file |
| Mau pahami cara kerja sebuah fungsi secara mendalam | `get_context_explain(function_name="Layout")` | AST-based explanation dengan context relasi antar fungsi |
| Mau tahu alur call dari fungsi A ke fungsi B | `trace_code_path(from="loader", to="getFlashMessage")` | Trace dependency graph, vs baca manual satu per satu |
| Mau cek file apa yang ada di app X tapi belum di app Y | `project_diff(source="apps/wms", target="apps/logofy")` | Diff komponen, routes, form fields sekaligus |
| Mau tahu konteks project saat ini (graph stats, SOT) | `get_context_summary(namespace="apps/logofy", detail="normal")` | Satu call lihat semua tools yang sudah dibangun di project |
| Mau query keputusan atau pattern yang pernah dibuat | `memory_query(query="flash message pattern", project="rayeen-app-gateway")` | Semantic search ke persistent memory lintas sesi |
| Mau simpan keputusan arsitektur penting | `memory_store(content="...", type="decision", project="rayeen-app-gateway")` | Tersimpan permanen, bisa di-query sesi berikutnya |
| Perlu analisis deep pada konteks besar (>10k token) | `power_analyze(query="...", context="...")` | Pakai model kuat dengan auto-compress, hemat context window |
| Tidak tahu tool mana yang tepat untuk task ini | `suggest_tools(query="deskripsi task kamu")` | AI merekomendasikan tool yang paling relevan |

### Aturan penggunaan

**1. Selalu cek sot-sync dulu sebelum `Read` file**

```
// URUTAN YANG BENAR saat butuh context:
1. get_app_boilerplate    ← scaffold app baru
2. parse_file             ← pahami isi satu file
3. list_functions         ← cari lokasi fungsi
4. Read (file tool)       ← hanya jika sot-sync tidak cukup
```

**2. Jangan gunakan sot-sync untuk hal yang lebih cepat tanpa dia**

- Menulis/edit file → tetap pakai `Write`/`Edit` tool langsung
- Command shell (npm install, tsc) → tetap pakai `Bash`
- File yang sangat kecil dan sudah diketahui path-nya → `Read` langsung fine

**3. `get_app_boilerplate` adalah entry point wajib untuk app baru**

Setiap kali ada instruksi "buat app baru", panggil ini dulu. Output-nya sudah berisi adaptasi instructions — tidak perlu tanya lagi file mana yang perlu diubah.

**4. Gunakan `memory_store` untuk keputusan yang akan berulang**

Pattern atau keputusan arsitektur yang kemungkinan besar muncul di sesi lain (misal: kenapa pakai cookie flash vs useActionData, kenapa scroll harus `instant`) — simpan ke memory agar sesi berikutnya tidak perlu rediscover.

**5. `power_analyze` untuk analisis kompleks multi-file**

Jika perlu memahami flow lintas 5+ file atau merangkum seluruh feature — berikan context sebagai string, biarkan power_analyze yang handle kompresi dan analisis.

---

## Reference Files

Lihat file referensi lanjutan di direktori skill ini:

- `conventions.md` — aturan coding detail dengan contoh kode lengkap
- `design-system.md` — token warna, tipografi, spacing, dan komponen UI lengkap
- `monorepo.md` — setup workspace, scripts, dan cara menambah app baru

Base directory for this skill: /home/rayhan/Workspaces/Project/bullseye-ecosystem/rayeen-app-gateway/.agents/skills/frontend-dev
