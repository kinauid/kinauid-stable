---
name: single-file-feature-builder
description: "Use when creating, modifying, or reviewing single-file features, 3-Layer DDD architecture, and 3 Component Wrappers (core/shared/feature) in React Router v7 apps (boilerplate). Enforces zero-logic route orchestration, Proxy UI DSL, Service Strategy Dispatchers, End-to-End Contract Alignment, and sub-45 line route files."
---

# Skill: Single-File Route & 3-Layer DDD Feature Builder

## 🚨 MANDATORY PRE-FLIGHT CHECK (BACA TERLEBIH DAHULU!)
Sebelum kamu menghasilkan atau meretrukturisasi kode apa pun, kamu **WAJIB** mengeksekusi langkah-langkah berikut secara berurutan:

1. **BACA DOKUMENTASI & CONTEXT (WAJIB):**
   - **Baca `PROJECT_DOCUMENTATION.md`** di root repository untuk memahami seluruh standar teknis terbaru:
     - **Larangan Keras Warna Hardcode**: Zero hardcoded hex/rgb policy (`var(--primary)`, semantic tokens).
     - **Konsumsi Komponen Siap Pakai**: Gunakan presets table (`tablePresets.ts`), atomic core, dan composite components yang sudah ada — DILARANG membuat ulang komponen dari nol jika sudah tersedia.
     - **Sentralisasi Navigasi**: Gunakan `app/constants/navigation.ts`.
     - **Live Versioning & Bug Diagnostics**: Integrasi `APP_VERSION` dan `FloatingBugReportWidget`.
   - **Baca `PROJECT_CONTEXT.md`** untuk gambaran arsitektur umum dan spesifikasi teknis.
2. **VALIDASI ARSITEKTUR:** Pastikan kamu memahami aturan:
   - **3-Layer DDD**: Schema Layer (`app/schemas/`) $\rightarrow$ Service Layer (`app/services/`) $\rightarrow$ Feature Route (`app/features/`).
   - **3 Component Wrappers**:
     - `app/components/core/` $\rightarrow$ Atomic UI Primitives (`Button.ts`, `Input.ts`, `Select.ts`, `Card.ts`, `Table.ts`, `Modal.ts`, `Badge.ts`).
     - `app/components/shared/` $\rightarrow$ Global Composite Components (`PageHeader`, `StatsGrid`, `FilterBar`, `tablePresets.ts`).
     - `app/components/feature/` $\rightarrow$ Domain/Feature-Specific Components (`RbacSimulatorBanner.ts`, `UserGrowthChart.ts`, `LoginViewWidget.ts`).
   - **Zero-Logic Route Rule**: (< 45 baris kode per file route).
   - **DILARANG** menaruh file komponen langsung di root `app/components/` (Wajib di `core/`, `shared/`, atau `feature/`).
   - **DILARANG** menggunakan JSX biasa di route (Gunakan Proxy DSL `builder.ts`).
   - **DILARANG** menggunakan percabangan `if (intent === '...')` di file route (Gunakan Service Strategy Handler).
   - **DILARANG** hardcode warna hex/rgb langsung (Wajib gunakan CSS Design Tokens `var(--...)` / Semantic Theme variables).
3. **SELF-AUDIT:** Sebelum memberikan output akhir, periksa kembali apakah kode yang kamu buat melanggar aturan di `PROJECT_DOCUMENTATION.md` dan `PROJECT_CONTEXT.md`.

---

## 📋 EXECUTION WORKFLOW

### Saat Membuat/Mengedit Komponen UI (`app/components/`):
1. **Atomic UI Element** $\rightarrow$ Simpan di `app/components/core/` (DILARANG panggil service/schema).
2. **Global Layout / Table Preset** $\rightarrow$ Simpan di `app/components/shared/` (`composite.ts`, `tablePresets.ts`).
3. **Domain / Widget Khusus** $\rightarrow$ Simpan di `app/components/feature/` (misal: chart, simulation banner, auth form widget).

### Saat Membuat/Mengedit Fitur di `app/features/`:
1. **Langkah 1: Schema Layer (`app/schemas/[domain].schema.ts`)**
   - Definisikan Zod Schema, TypeScript Types, dan Option Presets (`ROLE_OPTIONS`, `STATUS_OPTIONS`, `BADGES`).
2. **Langkah 2: Service Layer (`app/services/[domain].service.ts`)**
   - Buat logic DB/API, Caching `cacheData()`, dan fungsi `handle[Domain]Action(args)` untuk menangani seluruh intent tanpa `if-else` di route.
3. **Langkah 3: Feature Route (`app/features/[route].ts`)**
   - Hubungkan `loader` dan `action` ke Service Layer.
   - Tulis UI murni penataan tag DSL (< 45 baris kode).

---

## 🔍 END-TO-END CONTRACT ALIGNMENT & LIVE PROBE PROTOCOL (WAJIB)

Ketika mengimplementasikan fitur dari referensi API atau porting dari frontend/backend yang sudah ada:

### 1. Contract & Response Shape Audit
- **Jangan Menebak Struktur Data:** Jangan asumsikan struktur nested seperti `data.items` jika backend mengembalikan array langsung.
- **Defensive Parsing:** Selalu gunakan defensive parser di service layer:
  ```ts
  const items = Array.isArray(json?.data) ? json.data : (json?.data?.items ?? []);
  ```
- **Samakan Request Specs:** Periksa URL endpoint, HTTP method, header authorization, request body shape, dan mekanisme session cookie dengan backend aslinya.

### 2. Error Handling & React Object Rendering Safety
- **String Error Guarantee:** `action` response MUST mengembalikan error bertipe string:
  ```ts
  return Response.json(
    { error: typeof err === 'string' ? err : err?.message || 'Terjadi kesalahan sistem' },
    { status: 400 }
  );
  ```
- **Defensive Widget Unpacking:** Di level Widget/UI, selalu ekstrak error ke string sebelum dirender:
  ```ts
  const rawErr = actionData?.error ?? actionData?.message;
  const errorMessage = typeof rawErr === 'string' ? rawErr : rawErr?.message || (rawErr ? JSON.stringify(rawErr) : undefined);
  ```
  *(Mencegah React Fatal Error: `Objects are not valid as a React child`)*.

### 3. HTTP Status Code Protocol for Single-Fetch Actions
- Form validation error & credential mismatch wajib mengembalikan status `400 Bad Request` atau `200` dengan `{ error: string }`.
- **DILARANG** mengembalikan status `401 Unauthorized` pada form submission biasa jika itu menyebabkan network console red errors & memicu trap single-fetch.
- Sukses mutasi/login wajib mengembalikan `302 Redirect` dengan header `Set-Cookie` yang valid.

### 4. Live Verification & Smoke Probing (Mandatory Pre-Completion)
Sebelum menyatakan task selesai, jalankan probe berikut:
1. `bun run typecheck` $\rightarrow$ Pastikan 0 type error.
2. `bun run build` $\rightarrow$ Pastikan SSR bundle & client build berhasil 100%.
3. **Live Action Smoke Test:**
   - Test bad payload/invalid credentials $\rightarrow$ Pastikan response 400/200 dengan string error.
   - Test valid credentials $\rightarrow$ Pastikan redirect 302 dan session cookie terbit.

---

## 🛠️ DSL CONTEXT & PROXY COMPONENT CHEATSHEET

### 1. Struktur `createPage` & Context Helper
```ts
export default createPage<InferLoader<typeof loader>, any, MyUrlState>(
  (ctx) => {
    // ctx memuat:
    // - data: Data yang di-return oleh loader
    // - actionData: Data / error hasil action submit
    // - urlState: State URL terenkripsi saat ini
    // - updateUrlState(newState): Helper mutasi query state tanpa refresh
    // - send: { submit(payload, options), load(href) } (Fetcher/Form submission)
    // - can(permissionKey): Boolean pengecekan permission pengguna
    // - user: Profile user yang sedang login
    // - t(key): Translator helper
    // - breadcrumbs: Breadcrumb items array
    
    const post = (intent: string, payload = {}) =>
      send.submit({ intent, ...payload }, { method: 'post' });

    return Div(
      { className: 'space-y-5 max-w-6xl mx-auto' },
      PageHeader({ ... }),
      StatsGrid([ ... ]),
      FilterBar({ ... }),
      Table<MyItem>({ ... })
    );
  },
  { defaultState: { search: '', page: 1 } }
);
```

### 2. Komponen DSL Standar
- `PageHeader({ title, subtitle, breadcrumbs, badges, actions: [Button(...)] })`
- `StatsGrid([{ label, value, icon, color }])`
- `FilterBar({ search, onSearchChange, filters: [Select(...)], showReset, onReset })`
- `Table<T>({ data, keyField, columns: [UserAvatarColumn(...), BadgeColumn(...), TextColumn(...), TableActions([ ... ])] })`
- `ConfirmDialog.delete({ name: item.name, onConfirm: () => post('delete-item', { id: item.id }) })`

---

## 📍 ROUTE FILENAME CONVENTION (DOT-NOTATION)

Penamaan file di `app/features/*.ts` otomatis di-resolve oleh router (`app/global-handler.tsx`):

| File Path                               | URL Path                 | Keterangan               |
| :-------------------------------------- | :----------------------- | :----------------------- |
| `app/features/_index.ts`                | `/`                      | Landing / Home Root      |
| `app/features/login.ts`                 | `/login`                 | Authentication Route     |
| `app/features/dashboard.admin.manage.ts`| `/dashboard/admin/manage`| Nested Admin Area        |
| `app/features/app.finance.account.ts`   | `/app/finance/account`   | Feature Domain Route     |

---

## 📦 MODAL & FORM LIFECYCLE RECIPE

Ketika fitur memerlukan Modal (contoh: Tambah Data / Edit Data):

1. **Schema (`app/schemas/[domain].schema.ts`)**:
   Definisikan Zod Schema form input:
   ```ts
   export const CreateItemSchema = z.object({
     intent: z.literal('create-item'),
     name: z.string().min(1, 'Nama wajib diisi'),
   });
   ```

2. **Registry Modal (`app/providers/modal.ts`)**:
   Daftarkan modal UI ke dalam registry:
   ```ts
   modals.register('CREATE_ITEM_MODAL', ({ onSubmit, onClose }) => {
     // Render modal component dengan form
   });
   ```

3. **Feature UI (`app/features/[domain].ts`)**:
   Panggil modal secara imperatif saat tombol diklik:
   ```ts
   Button({
     label: 'Tambah',
     icon: 'Plus',
     onClick: () => modals.open('CREATE_ITEM_MODAL', {
       onSubmit: (v: any) => send.submit({ intent: 'create-item', ...v }, { method: 'post' }),
     }),
   })
   ```

4. **Service Handler (`app/services/[domain].service.ts`)**:
   Eksekusi mutasi pada dispatcher strategy:
   ```ts
   strategies['create-item'] = async () => {
     const parsed = CreateItemSchema.safeParse(body);
     if (!parsed.success) return Response.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
     await db.create(parsed.data);
     return successResponse({ created: true });
   };
   ```

---

## 🛡️ RBAC & PERMISSION GUARDING BLUEPRINT

1. **Route Level (`metaAccess`)**:
   Pasang konfigurasi proteksi pada loader di file `app/features/*.ts`:
   ```ts
   export const metaAccess: MetaAccessConfig = {
     roles: ['admin', 'manager'],
     permissions: ['account:read'],
     redirectTo: '/login',
   };
   // Wajib assign ke loader agar terbaca middleware/global-handler
   (loader as any).metaAccess = metaAccess;
   ```

2. **UI & Action Button Guarding**:
   Pasang property `guard` pada DSL Button atau Table Actions:
   ```ts
   Button({
     label: 'Hapus Akun',
     guard: 'account:delete', // Otomatis disembunyikan / disabled jika user tidak punya izin
     onClick: () => ...
   })
   ```

---

## ⛔ CRITICAL FAILURE CRITERIA
Jika output yang kamu hasilkan memuat salah satu dari poin di bawah ini, **BERARTI KAMU GAGAL MENJALANKAN SKILL INI**:
- Menaruh file komponen langsung di root `app/components/` (bukan di `core/`, `shared/`, atau `feature/`).
- Terdapat baris `if (intent === '...')` di dalam file `app/features/*.ts`.
- Terdapat tag JSX mentah `<div className="...">` tanpa membungkusnya dalam `.custom()` atau widget komponen.
- Terdapat impor/definisi Schema Zod langsung di dalam file `app/features/*.ts`.
- Panjang file `app/features/*.ts` melebihi 45 baris kode.
- Mengoper object error langsung ke elemen React tanpa unpacking string.
- Melewatkan verifikasi live probe & contract alignment saat menghubungkan API/Action.
