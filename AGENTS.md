# AGENTS.md — kinauid-frontend-v2

## Project Overview

Aplikasi frontend utama **Kinau ID** (Sistem Percetakan & Merchandise Custom) berbasis **React Router v7 + Vite + Tailwind CSS v4** dengan arsitektur Single-File Feature & Zero-Logic Functional UI DSL yang terhubung dengan backend `https://kinauid-backend.vercel.app`.

---

## Available Skills (WAJIB load & terapkan sebelum coding)

| Skill | Trigger | File |
|-------|---------|------|
| `single-file-feature-builder` | **Setiap** pembuatan & modifikasi route/halaman, 3-Layer DDD, Proxy UI DSL, Zero-Logic Route | `.agents/skills/single-file-feature-builder/SKILL.md` |
| `frontend-dev` | Komponen, styling Tailwind, mobile responsiveness, animasi, form state, toast | `.agents/skills/frontend-dev/SKILL.md` |
| `backend-dev` | Integrasi backend API (`/select`, `/insert`, `/update`, `/bulk-insert`), loader, action, caching layer | `.agents/skills/backend-dev/SKILL.md` |

**ATURAN KERAS UNTUK AGENT:**
- **Setiap kali memodifikasi atau membuat route/halaman UI**, Agent **WAJIB** langsung mematuhi pola `single-file-feature-builder` tanpa perlu user mengetik slash command secara manual.
- Terapkan **3-Layer Domain-Driven Separation (DDD)** secara ketat di semua domain.
- Jangan pernah mengasumsikan pattern — selalu ikuti konvensi yang telah terstandarisasi.

---

## 🏛️ Arsitektur 3-Layer Domain-Driven Design (DDD)

Setiap fitur wajib terbagi rapi ke dalam 3 layer berikut:

1. **Layer 1: Schema & Types (`app/schemas/[domain].schema.ts`)**
   - Zod Validation Schemas (`CreateSchema`, `UpdateSchema`, `ActionIntentSchema`).
   - TypeScript Interfaces (`DomainItem`, `DomainState`).
   - UI Presets & Badges (`STATUS_BADGES`, `STATUS_OPTIONS`, `CATEGORY_OPTIONS`).

2. **Layer 2: Service & Business Logic (`app/services/[domain].service.ts`)**
   - Fetching DB backend, mutations, dan caching (`cacheData` dengan tag invalidasi `invalidateCacheByTag`).
   - Action Strategy Dispatcher (`handle[Domain]Action` dictionary object).
   - Validasi data internal via Zod schema.

3. **Layer 3: Feature Presentation (`app/features/[route.path].ts`)**
   - **Zero-Logic Route Orchestrator** (< 45 baris kode per file route).
   - Pure UI Functional DSL (`createPage`, `DataTableCard`, `Div`, `Row`, `Button`).
   - Action hanya satu baris delegasi: `export const action = (args) => handle[Domain]Action(args);`.

---

## 🚨 Critical Conventions & Guardrails (Quick Reference)

1. **Zero-Logic Route (< 45 baris)** — File di `app/features/` dilarang memuat `if-else` business logic, raw modal markup, atau database fetch manual.
2. **Action Strategy Dispatcher** — Semua action ditangani oleh `handle[Domain]Action` di service layer menggunakan pola objek dictionary strategies, bukan deretan `if (intent === '...')`.
3. **Unit Price Calculation Formula** — Harga satuan item wajib dihitung dari `derivedUnitPrice = Math.round(subtotal / qty)` atau `(price_rule_value || unit_price) + variant_price`. **DILARANG** hanya menampilkan `variant_price`. Kolom `price_rule_value` wajib disertakan pada include query `order_items`.
4. **Order Sorting Standar** — Query daftar pesanan wajib default ke `orderBy: ['id', 'desc']` agar order terbaru selalu berada di baris pertama (#1).
5. **Cache Invalidation** — Setiap mutasi data (create, update status, delete) wajib memanggil `invalidateCacheByTag('[domain]')`.
6. **ErrorCatch Wajib** — Setiap `catch (error)` wajib memanggil `ErrorCatch({ error, context })` di baris pertama.
7. **Form via React Router** — Mutasi data wajib melalui `<Form>`, `<fetcher.Form>`, atau `send.submit()`. Dilarang `onSubmit` + `e.preventDefault()`.
8. **Mobile View Responsiveness** — Semua elemen input/select wajib memiliki `w-full min-w-0 max-w-full truncate` dan container card `overflow-hidden` agar tidak terjadi horizontal overflow di smartphone.
9. **Standar Cetak Nota** — Template cetak nota (`PrintNotaTemplate`) wajib menggunakan kelas `.printable-nota` dengan isolasi `@media print` murni format A4 tanpa frame modal atau background situs.
10. **Feedback Pengguna (Wajib & Otomatis)** — Setiap aksi mutasi atau interaksi pengguna **WAJIB** memberikan feedback response yang jelas:
    - **Service Action Strategy**: Wajib mengembalikan `{ success: true, message: "...", data?: ... }` atau melempar `new ApiError("...", 400)`.
    - **Automated Toast Pipeline**: Runtime `builder.ts` & `FlashObserver` otomatis menangkap `resp.data?.message`, `resp.meta?.message`, atau `resp.error` dan menampilkan `toast.success` / `toast.error` (Sonner) secara konsisten tanpa perlu boilerplate manual di setiap komponen UI.
    - **Client-Only Interaction**: Aksi berbasis browser (salin tautan/rekening, export PDF/Excel lokal, toggle client) wajib memicu feedback eksplisit (`toast.success` / `toast.info` / `toast.error`).
    - **Loading & Submitting State**: Semua tombol aksi wajib menampilkan status `isSubmitting` / disabled saat proses berjalan.

---

## 🔗 Related Projects & Dependencies

| Project | Path | Role |
|---|---|---|
| **kinauid-backend** | `https://kinauid-backend.vercel.app` (`~/Workspaces/Project/portofolio/rayns-verse/kinauid-backend`) | Backend API server (Hono + PostgreSQL + Supabase Storage) |
| **reference-client** | `~/Workspaces/Project/portofolio/rayns-verse/client` | Referensi UI/UX & Nota printing flow |
| **kinauid-frontend-v2** | Current project | Frontend Core (React Router v7 + Vite) |
