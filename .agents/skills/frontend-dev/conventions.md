# Coding Conventions

Referensi lengkap aturan kode untuk semua apps di rayeen-app-gateway monorepo.

---

## File Naming

| Tipe | Konvensi | Contoh |
|---|---|---|
| React component | PascalCase | `ProjectCard.tsx` |
| Route file | kebab atau dot-notation | `projects.$slug.tsx` |
| Hook | camelCase, prefix `use` | `useScrollPosition.ts` |
| Store | camelCase, prefix `use` | `useProjectStore.ts` |
| Types file | camelCase | `types.ts` atau `project.types.ts` |
| Service file | camelCase | `services.ts` atau `project.service.ts` |
| Utility | camelCase | `utils.ts`, `crypto.ts` |
| Constants | camelCase | `brand.ts`, `navigation.ts` |

---

## Component Patterns

### Simple function component

```tsx
import { cn } from "~/lib/utils";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning";
  className?: string;
}

export function Badge({ label, variant = "default", className }: BadgeProps) {
  const variantClass = {
    default: "bg-[var(--border)] text-foreground",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
  }[variant];

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-[var(--radius-pill)]",
      variantClass,
      className
    )}>
      {label}
    </span>
  );
}
```

### forwardRef component (DOM-exposed primitives)

```tsx
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "~/lib/utils";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variants = {
      primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
      secondary: "bg-[var(--surface)] text-foreground border border-[var(--border-strong)]",
      ghost: "bg-transparent text-foreground hover:bg-[var(--surface-subtle)]",
    };
    const sizes = {
      sm: "h-8 px-4 text-sm",
      md: "h-10 px-5 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium",
          "rounded-[var(--radius-pill)] transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
```

### Compound component

```tsx
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "~/lib/utils";

function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] bg-card border border-[var(--border)]",
        "shadow-[var(--shadow-card)] overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
  return <h3 className={cn("text-lg font-semibold leading-none", className)} {...props} />;
}

function CardContent({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;

export { Card };
```

---

## Zustand Store Patterns

### Global UI store

```ts
// app/components/shared/store/ui.ts
import { create } from "zustand";

interface Alert {
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface UIState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  loading: boolean;
  alert: Alert | null;
  setTheme: (theme: "light" | "dark") => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
  showAlert: (alert: Alert) => void;
  clearAlert: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: "light",
  sidebarOpen: false,
  loading: false,
  alert: null,
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setLoading: (loading) => set({ loading }),
  showAlert: (alert) => set({ alert }),
  clearAlert: () => set({ alert: null }),
}));
```

### Feature store

```ts
// app/components/features/[feature]/store.ts
import { create } from "zustand";
import type { ProjectItem } from "./types";

interface ProjectState {
  projects: ProjectItem[];
  selectedProject: ProjectItem | null;
  isLoading: boolean;
  setProjects: (projects: ProjectItem[]) => void;
  selectProject: (project: ProjectItem | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,
  setProjects: (projects) => set({ projects }),
  selectProject: (selectedProject) => set({ selectedProject }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

---

## Route File Pattern

```tsx
// app/routes/projects.$slug.tsx
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: `${data?.project.name} — Rayeen` },
];

export async function loader({ params }: LoaderFunctionArgs) {
  const project = await getProjectBySlug(params.slug!);
  if (!project) throw new Response("Not Found", { status: 404 });
  return { project };
}

export default function ProjectPage() {
  const { project } = useLoaderData<typeof loader>();
  return (
    <main>
      {/* route content */}
    </main>
  );
}
```

---

## Service Layer Pattern

```ts
// app/components/features/[feature]/services.ts

export const ProjectService = {
  async getAll(): Promise<ProjectItem[]> {
    // fetch dari API atau Firebase
  },

  async getById(id: string): Promise<ProjectItem | null> {
    // ...
  },

  async create(data: NewProject): Promise<ProjectItem> {
    // ...
  },

  async update(id: string, data: Partial<ProjectItem>): Promise<ProjectItem> {
    // ...
  },

  async delete(id: string): Promise<void> {
    // soft delete: set deleted = true
  },
};
```

---

## Error Handling

```tsx
// Typed error boundary di root.tsx
export function ErrorBoundary() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
        <p className="text-muted">Please try refreshing the page.</p>
      </div>
    </div>
  );
}
```

---

## Dark Mode Toggle

```tsx
// app/components/shared/widgets/ThemeToggle.tsx
import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { useUIStore } from "~/components/shared/store/ui";

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-[var(--radius-card-sm)] hover:bg-[var(--surface-subtle)] transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
```

---

## Lenis Smooth Scroll — Anti-Pattern & Rules

### DILARANG — menyebabkan scroll berat dan patah-patah

```css
/* ❌ SALAH — konflik langsung dengan Lenis */
html {
  scroll-behavior: smooth;
}
```

```tsx
// ❌ SALAH — browser native smooth scroll vs Lenis = berebut kontrol
el.scrollIntoView({ behavior: "smooth" });
```

```tsx
// ❌ SALAH — arrow function baru setiap render, remove tidak akan bekerja
gsap.ticker.add((time) => lenis.raf(time * 1000));
// ...
gsap.ticker.remove(lenis.raf); // referensi berbeda, memory leak
```

### WAJIB — cara yang benar

```css
/* ✅ BENAR — tidak ada scroll-behavior, Lenis handle semuanya */
html {
  -webkit-font-smoothing: antialiased;
}
```

```tsx
// ✅ BENAR — instant jump, Lenis animasikan dari posisi baru
el.scrollIntoView({ behavior: "instant" });
```

```tsx
// ✅ BENAR — simpan referensi, cleanup benar
const ticker = (time: number) => lenis.raf(time * 1000);
gsap.ticker.add(ticker);
// cleanup:
gsap.ticker.remove(ticker); // referensi SAMA
```

---

## Flash Message Pattern (Server → Client Toast)

### Flow

```
action() → setFlashMessage() → cookie → redirect
                                           ↓
root loader() → getFlashMessage() → { flash } → useLoaderData
                                                    ↓
App component → <FlashObserver flash={flash} />
                    ↓                    ↓
               sonner toast     sweetalert2 modal
```

### Aturan

- **DILARANG** `useActionData` untuk toast — coupling route, tidak works cross-redirect
- **WAJIB** flash message via cookie session — works across any redirect chain
- Root `loader()` selalu baca flash dan pass ke `FlashObserver`
- `FlashObserver` ditaruh di `App()` component (bukan di `Layout`)

### Server action pattern

```ts
import type { ActionFunctionArgs } from "react-router";
import { setFlashMessage, flashRedirect } from "~/lib/flash.server";

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();

  try {
    // ... mutasi data
    const cookie = await setFlashMessage(request, {
      type: "success",
      message: "Data berhasil disimpan!",
    });
    return flashRedirect("/dashboard", cookie);
  } catch (error) {
    const cookie = await setFlashMessage(request, {
      type: "error",
      title: "Gagal menyimpan",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return flashRedirect("/form", cookie);
  }
}
```

### Konfirmasi destruktif (client-side, sebelum submit)

```tsx
import Swal from "sweetalert2";

async function handleDelete(id: string) {
  const result = await Swal.fire({
    title: "Hapus data?",
    text: "Data yang dihapus tidak bisa dikembalikan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
    customClass: {
      popup: "!rounded-[24px] !bg-[var(--card)] !text-[var(--foreground)]",
      confirmButton: "!rounded-[1000px] !bg-red-500 !text-white !px-6 !py-2",
      cancelButton: "!rounded-[1000px] !bg-transparent !text-[var(--foreground)] !border !border-[var(--border-strong)] !px-6 !py-2",
    },
  });

  if (result.isConfirmed) {
    // submit form / fetch delete API
  }
}
```

### Client-only toast (tidak lewat server)

```ts
import { toast } from "sonner";

// Feedback instan tanpa server roundtrip
toast.success("Berhasil disalin!");
toast.error("Format email tidak valid");
toast.loading("Mengunggah file...");
```

---

## Submit Button — Anti Double-Submit (WAJIB)

Setiap tombol submit WAJIB `disabled` + spinner saat request berjalan. Jangan pernah biarkan user klik 2x.

### Opsi A — `SubmitButton` (nurafin) — auto-detect navigation/fetcher state

```tsx
import { SubmitButton } from "~/components/shared/components/SubmitButton";

// <fetcher.Form> — scope="fetcher"
<SubmitButton scope="fetcher" submittingText="Menyimpan...">Simpan</SubmitButton>

// <Form> browser submit — scope="navigation" (default)
<SubmitButton submittingText="Membuat...">Buat</SubmitButton>
```

### Opsi B — pattern inline (wms) untuk modal yang memakai `useFetcher`

```tsx
const fetcher = useFetcher();
const isSubmitting = fetcher.state !== "idle";

<fetcher.Form method="post">
  <button
    type="submit"
    disabled={isSubmitting || !name.trim()}
    className="... disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isSubmitting && <Loader2 size={14} className="animate-spin" />}
    {isSubmitting ? "Creating..." : "Create Project"}
  </button>
</fetcher.Form>
```

Jangan hanya disable — tampilkan spinner `Loader2` + ganti label (mis. "Menyimpan..."), dan kombinasikan dengan validasi (`disabled={isSubmitting || !formValid}`).

---

## Loading & Skeleton States (WAJIB)

Tidak boleh ada layar kosong/hang saat memuat data.

| Situasi | Pattern |
|---|---|
| Data list client-side (TanStack Query) | `LoadingState` (skeleton rows) saat `isLoading`, `ErrorState` (`onRetry`) saat `isError` |
| Navigasi antar route | `NavigationProgress` (bar 2px top) + `PageSkeleton` saat `navigation.state === "loading"` |
| Submit form | `SubmitButton` atau pattern inline di atas |

### Data list — ternary isError → isLoading → data

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
    {items.map((item) => <Row key={item.uid} item={item} />)}
  </div>
);
```

### Navigasi route — skeleton layout, bukan overlay freeze

```tsx
const navigation = useNavigation();
const isNavigating = navigation.state === "loading";

<WorkspaceLayout sidebar={<WorkspaceSidebar />}>
  {isNavigating ? <PageSkeleton /> : <Outlet />}
</WorkspaceLayout>
```

`PageSkeleton` mengekspor `SkeletonLine` / `SkeletonBlock` untuk skeleton custom. `NavigationProgress` di-mount di `root.tsx`. `GlobalLoader` (overlay) HANYA untuk aksi blocking singkat (upload besar), bukan navigasi route.
