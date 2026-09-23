---
name: backend-dev
description: "Use when any app in rayeen-app-gateway needs to communicate with the Rayeen API backend — analyzing API requirements, implementing server-side loaders/actions that consume api.rayeen.web.id endpoints, specifying new API needs, and coordinating with the backend-dev agent in rayeen-apis for endpoint development."
---

# Skill: backend-dev (rayeen-app-gateway)

You are the **API integration layer** for the rayeen-app-gateway monorepo. Your role is distinct from the backend-dev in `rayeen-apis` — you are **not building the API server**. You are:

1. **Analyzing** what API endpoints each frontend app needs
2. **Implementing** server-side `loader()` and `action()` in React Router that call `api.rayeen.web.id`
3. **Specifying** new API requirements in a structured format that the backend-dev agent in `rayeen-apis` can act on
4. **Coordinating** the handoff between what the frontend needs and what the backend must build

---

## PRE-FLIGHT CHECKLIST (WAJIB BACA SEBELUM CODING)

**STOP.** Sebelum menulis code apapun:

1. **Baca skill ini SAMPAI HABIS**
2. **API call SELALU server-side** — di `loader()` / `action()`, BUKAN dari komponen React
3. **Setiap catch block WAJIB `ErrorCatch()`** — tidak ada bare `catch {}`
4. **Flash message WAJIB include error.message** — bukan pesan generic
5. **401 otomatis redirect** — `apiFetch` handle, jangan manual
6. **Form submission via `<Form>` atau `<fetcher.Form>`** — BUKAN `<form onSubmit>`
7. **Identifier dari API = `uid`** — bukan `id` (integer internal)
8. **Cek service layer yang sudah ada** sebelum tulis baru — `sot-sync list_functions(filter="Service")`
9. **Simpan setiap API spec ke memory** — `memory_store(type="decision")`
10. **Spec untuk backend rayeen-apis WAJIB dikirim** — jangan implement endpoint sendiri tanpa spec handoff

### Identifier Convention

API response dari rayeen-apis mengembalikan field `uid` (UUID) sebagai public identifier. Frontend SELALU gunakan `uid` sebagai ID:

```ts
// ✅ BENAR
const projectsRes = await ProjectService.list(token, workspace.uid);

// ❌ SALAH — workspace.id adalah integer internal, bukan untuk URL
const projectsRes = await ProjectService.list(token, workspace.id);
```

---

## Production API Base URL

```
https://api.rayeen.web.id
```

**Local dev fallback:**
```
http://localhost:3001
```

Always use an environment variable — never hardcode:

```ts
// apps/[nama-app]/app/lib/api.ts
const API_BASE = process.env.API_URL ?? "https://api.rayeen.web.id";
```

---

## Cara Kerja — Request Flow

```
Frontend App (React Router)
    │
    ├── loader() / action()  ← SERVER-SIDE (SSR, tidak exposed ke browser)
    │       │
    │       └── fetch(API_BASE + "/endpoint", { headers, body })
    │               │
    │               └── Rayeen API (api.rayeen.web.id)
    │                       │
    │                       └── ResponseData({ status, error_message, data, version })
    │
    └── Route component (client) ← useLoaderData() / useActionData()
```

**Aturan penting:**
- API call dari frontend apps **harus selalu lewat server-side** (`loader`/`action`) — jangan fetch langsung dari komponen React (client-side)
- Ini mencegah API key / internal URL exposed ke browser
- Pengecualian: public data yang tidak sensitif boleh di-fetch client-side dengan SWR/React Query

---

## Struktur API Service Layer

Setiap app yang berkomunikasi dengan Rayeen API harus punya service layer di:

```
apps/[nama-app]/app/lib/
├── api.ts          ← base fetch helper + error handling
└── services/
    └── [domain].ts ← domain-specific API calls
```

### `api.ts` — Base Fetch Helper

```ts
// apps/[nama-app]/app/lib/api.ts
const API_BASE = process.env.API_URL ?? "https://api.rayeen.web.id";

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  error_message: string | null;
  data: T | null;
  version: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    throw new ApiError(`API ${res.status}: ${path}`, res.status);
  }

  return res.json() as Promise<ApiResponse<T>>;
}
```

### Service Pattern

```ts
// apps/logofy/app/lib/services/logo.ts
import { apiFetch } from "~/lib/api";

export interface GenerateLogoRequest {
  imageBase64: string;
  aiMode: "element-transform" | "style-reference" | "sketch-evolution";
  logoStyle: string;
  brandName?: string;
  slogan?: string;
  designDescription?: string;
  designRequirements?: string;
}

export interface GenerateLogoResponse {
  jobId: string;
  estimatedSeconds: number;
}

export const LogoService = {
  generate: (payload: GenerateLogoRequest) =>
    apiFetch<GenerateLogoResponse>("/logos/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getStatus: (jobId: string) =>
    apiFetch<{ status: string; logoUrl?: string }>(`/logos/${jobId}/status`),
};
```

---

## Implementasi di React Router Loader / Action

```ts
// apps/logofy/app/routes/generate.brand.tsx
import type { ActionFunctionArgs } from "react-router";
import { LogoService } from "~/lib/services/logo";
import { setFlashMessage, flashRedirect } from "~/lib/flash.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const payload = {
    imageBase64: formData.get("imageBase64") as string,
    aiMode: formData.get("aiMode") as string,
    logoStyle: formData.get("logoStyle") as string,
    brandName: formData.get("brandName") as string | undefined,
    // ...
  };

  try {
    const result = await LogoService.generate(payload);

    if (result.status === "error" || !result.data) {
      const cookie = await setFlashMessage(request, {
        type: "error",
        title: "Gagal generate logo",
        message: result.error_message ?? "Terjadi kesalahan.",
      });
      return flashRedirect("/generate/brand", cookie);
    }

    const cookie = await setFlashMessage(request, {
      type: "success",
      message: "Logo sedang diproses! ID: " + result.data.jobId,
    });
    return flashRedirect("/", cookie);
  } catch (err) {
    const cookie = await setFlashMessage(request, {
      type: "error",
      title: "Koneksi gagal",
      message: "Tidak bisa menghubungi API server.",
    });
    return flashRedirect("/generate/brand", cookie);
  }
}
```

---

## Format Spesifikasi API Baru (Handoff ke rayeen-apis)

Ketika sebuah frontend app butuh endpoint baru yang **belum ada** di `api.rayeen.web.id`, buat spesifikasi dengan format berikut sebelum meminta backend-dev rayeen-apis untuk build:

```markdown
## API Spec Request

**App:** apps/logofy
**Feature:** Logo Generation
**Priority:** high

### Endpoint
POST /logos/generate

### Request Body
```json
{
  "imageBase64": "string (required) — base64 encoded image",
  "aiMode": "element-transform | style-reference | sketch-evolution",
  "logoStyle": "minimalist | engraved | line-art | cartoon | geometric | emblem",
  "brandName": "string (optional)",
  "slogan": "string (optional)",
  "designDescription": "string (optional)",
  "designRequirements": "string (optional)"
}
```

### Expected Response
```json
{
  "status": "success",
  "error_message": null,
  "data": {
    "jobId": "string — unique job identifier",
    "estimatedSeconds": "number — estimated processing time"
  },
  "version": "string"
}
```

### Error Cases
- 400: missing required fields
- 413: image too large (>5MB base64)
- 503: AI provider unavailable

### Notes
- Async job pattern — client polls GET /logos/:jobId/status
- Requires AI provider integration (Gemini atau Cloudflare AI Workers)
```

---

## Endpoint yang Sudah Ada di Rayeen API

Berdasarkan `api.rayeen.web.id`:

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/` | Interactive API docs UI |
| GET | `/status` | Server health, uptime, memory, DB connection |
| GET | `/docs` | Auto-generated route documentation |
| GET | `/schema` | Database schema (semua tables + columns) |
| GET | `/agent` | Active AI agent rules dan skill configurations |

---

## Rules Wajib saat Integrasi API

1. **Selalu handle loading + success + error** — jangan only happy path
2. **Gunakan `ResponseData` shape** — API selalu return `{ status, error_message, data, version }`
3. **Check `result.status === "error"`** sebelum mengakses `result.data`
4. **Flash message** untuk semua API response yang perlu feedback user
5. **Jangan expose API URL / response ke client** jika berisi data sensitif
6. **Timeout handling** — set `AbortController` dengan timeout pada fetch calls panjang
7. **WAJIB `ErrorCatch()` di setiap catch block** — tidak boleh ada bare `catch {}` tanpa logging:

```ts
import { ErrorCatch } from "~/lib/api";

// Di setiap loader/action:
} catch (error) {
  ErrorCatch({ error, context: "action:create-workspace" });
  const message = error instanceof Error ? error.message : "Unknown error";
  const cookie = await setFlashMessage(request, { type: "error", message });
  return flashRedirect("/fallback", cookie);
}
```

**Rules ErrorCatch:**
- Selalu tangkap `error` — tulis `catch (error)`, bukan `catch {}`
- Selalu panggil `ErrorCatch()` sebagai baris pertama di catch
- Context string deskriptif: `"loader:fitur"` atau `"action:operasi"`
- Flash message wajib include `error.message` — bukan pesan generic
- ErrorCatch saat ini `console.error()`, nanti bisa diperluas ke Telegram alert
- `ErrorCatch()` otomatis re-throw `Response` objects — jadi redirect 401 tidak tertangkap

### Auto-redirect pada 401 (Token Expired / Unauthorized)

`apiFetch()` di `~/lib/api.ts` sudah handle 401 otomatis:
- Jika API return HTTP 401 → `apiFetch` throw `redirect("/auth/login")`
- `ErrorCatch()` di catch block deteksi `error instanceof Response` → re-throw
- React Router tangkap Response → user di-redirect ke login page

**Aturan:**
- Jangan handle 401 manual di loader/action — `apiFetch` yang handle
- Jangan try/catch 401 di service layer — biarkan bubble up
- Jangan gunakan flash message untuk 401 — langsung redirect
- Session cookie tetap ada tapi akan invalid di next `requireAuth()` check

```ts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10_000); // 10s

try {
  const res = await apiFetch("/heavy-endpoint", { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

---

## Koordinasi dengan backend-dev rayeen-apis

Alur kerja saat frontend butuh API baru:

```
1. frontend-dev / backend-dev (gateway) identifies need
        │
        ▼
2. Tulis API Spec Request (format di atas)
        │
        ▼
3. backend-dev (rayeen-apis) reviews spec & implements endpoint
        │
        ▼
4. Test endpoint di api.rayeen.web.id/docs
        │
        ▼
5. backend-dev (gateway) implements loader/action + service layer
        │
        ▼
6. Update route di apps/[nama-app] untuk gunakan endpoint baru
```

**Prinsip:** backend-dev di gateway adalah **spec writer + consumer**, backend-dev di rayeen-apis adalah **implementer**. Keduanya harus sinkron pada kontrak (request shape, response shape, error codes) sebelum implementasi dimulai.

---

## Bug Tracing via AI Bridge (WAJIB saat ada error 500)

Ketika mendapat error dari API (statusCode 500), **JANGAN tebak-tebak**. Query bug_logs dulu:

```bash
curl -s "https://api.rayeen.web.id/ai/bug-logs?key=rayeen-ai-bridge-2026&resolved=false"
```

Response berisi array of bug logs dengan field:
- `context` — handler yang error (e.g. "tasks:create")
- `message` — actual error message dari PostgreSQL/runtime
- `stack` — full stack trace
- `request_path` — endpoint yang dipanggil
- `request_body` — payload yang dikirim
- `user_id` — user yang trigger error

**Workflow:**
1. Error 500 terjadi → cek bug_logs
2. Baca `message` + `stack` → identifikasi root cause
3. Fix code
4. Mark resolved: `curl -X PUT "https://api.rayeen.web.id/ai/bug-logs/<uid>/resolve?key=rayeen-ai-bridge-2026"`

**JANGAN** fix berdasarkan tebakan jika bug_logs tersedia.

---

## Checklist sebelum merge API integration

- [ ] `API_BASE` dibaca dari `process.env.API_URL` — tidak hardcode URL
- [ ] API call lewat server-side `loader`/`action` — tidak fetch dari komponen React
- [ ] Loading, success, dan error state semua dihandle
- [ ] Response shape divalidasi dengan Zod sebelum dipakai:
  ```ts
  import { z } from "zod";
  const schema = z.object({ jobId: z.string(), estimatedSeconds: z.number() });
  const parsed = schema.parse(result.data);
  ```
- [ ] Flash message diset untuk semua outcome yang butuh feedback user
- [ ] Timeout/abort diset untuk endpoint yang bisa lama
- [ ] `.env.local` tidak di-commit — cek `.gitignore`

---

## sot-sync MCP — Kapan Minta Bantuan dan Tool Mana

sot-sync tersedia sebagai MCP server lokal. Tugas utama backend-dev di gateway adalah **analisis kebutuhan API dan implementasi service layer** — banyak keputusan butuh pemahaman kode yang ada dulu. sot-sync menghemat token signifikan untuk tugas-tugas ini.

### Decision Table — Situasi → Tool

| Situasi | Tool sot-sync | Kenapa lebih efisien |
|---|---|---|
| Mau tahu semua `loader`/`action` yang sudah ada di sebuah app | `list_functions(filter="loader")` atau `list_functions(filter="action")` | List semua dengan lokasi file:line, vs grep manual |
| Mau pahami service layer yang sudah ada (misal `LogoService`) | `parse_file(file="apps/logofy/app/lib/services/logo.ts")` | Return struktur lengkap + semua method signatures |
| Mau tahu bagaimana `loader` memanggil API di app lain sebagai referensi | `get_context_explain(function_name="loader")` | Penjelasan deep + relasi ke fungsi lain |
| Mau trace alur dari `action()` ke `apiFetch` ke API call | `trace_code_path(from="action", to="apiFetch")` | Lihat dependency chain tanpa buka file satu per satu |
| Mau tahu endpoint apa yang sudah pernah dispesifikasikan | `memory_query(query="API spec endpoint", project="rayeen-app-gateway")` | Semantic search ke spec yang pernah ditulis di sesi lalu |
| Mau simpan spec API baru agar bisa di-query sesi berikutnya | `memory_store(content="spec...", type="decision", project="rayeen-app-gateway")` | Spec tersimpan permanen, bisa di-refer tanpa re-read file |
| Perlu analisis: apakah response shape API cocok dengan kebutuhan UI | `power_analyze(query="apakah response shape ini sesuai?", context="<response_shape + UI_needs>")` | Analisis mendalam dengan model kuat |
| Tidak yakin tool mana yang dipakai | `suggest_tools(query="deskripsi task")` | Rekomendasi otomatis |

### Aturan penggunaan

**1. Sebelum menulis service layer baru, cek yang sudah ada**

```
// Urutan yang benar sebelum implement:
1. list_functions(filter="Service")     ← ada service yang bisa di-extend?
2. parse_file("...services/existing")  ← pahami pattern yang sudah dipakai
3. Baru tulis service baru mengikuti pattern yang ada
```

**2. Simpan setiap API Spec ke memory**

Setiap spec yang ditulis untuk dikirim ke rayeen-apis backend-dev, simpan juga ke `memory_store`:

```
memory_store(
  content = "<isi spec lengkap>",
  type    = "decision",
  tags    = "api-spec, [nama-endpoint], [nama-app]",
  project = "rayeen-app-gateway"
)
```

Ini memastikan spec bisa di-query tanpa harus buka file, dan backend-dev rayeen-apis bisa `memory_query` untuk menemukan spec terbaru.

**3. `trace_code_path` untuk debug alur API yang tidak berfungsi**

Jika API call tidak sampai ke server atau response tidak sesuai, gunakan `trace_code_path` untuk lihat apakah ada disconnect di chain: `action → service → apiFetch → API_BASE`.

**4. `power_analyze` untuk validasi kontrak API**

Sebelum spec dikirim ke rayeen-apis, gunakan `power_analyze` untuk validasi: apakah request shape yang diusulkan sudah cover semua kebutuhan UI, apakah ada edge case yang terlewat, apakah error codes sudah lengkap.
