# Design System

Token warna, tipografi, spacing, dan komponen UI untuk rayeen-app-gateway.

---

## Color Tokens

Semua warna didefinisikan sebagai CSS custom properties di `app/index.css` masing-masing app.

### Base Palette (Landing — apps/landing)

```css
:root {
  /* === Backgrounds === */
  --background:      #ffffff;
  --surface:         rgba(237, 237, 237, 0.64);   /* glassmorphism */
  --surface-subtle:  rgba(237, 237, 237, 0.10);
  --card:            #ffffff;
  --input:           rgba(64, 64, 64, 0.06);

  /* === Text === */
  --foreground:      #141414;
  --muted:           #717171;
  --muted-foreground:#adadad;

  /* === Accent === */
  --accent:          #0065ff;
  --accent-hover:    #0047f0;
  --primary:         oklch(0.44 0.04 240);

  /* === Borders === */
  --border:          rgba(64, 64, 64, 0.08);
  --border-strong:   rgba(65, 65, 65, 0.16);

  /* === Radius === */
  --radius:          0.75rem;
  --radius-pill:     1000px;
  --radius-card:     24px;
  --radius-card-sm:  16px;
  --radius-nav:      30px;

  /* === Shadows === */
  --shadow-card:     0 8px 40px rgba(0, 0, 0, 0.039);
  --shadow-sm:       0 2px 8px rgba(0, 0, 0, 0.06);
}

.dark {
  --background:      #0a0a0a;
  --surface:         rgba(30, 30, 30, 0.64);
  --surface-subtle:  rgba(30, 30, 30, 0.40);
  --card:            #111111;
  --foreground:      #f0f0f0;
  --muted:           #888888;
  --muted-foreground:#555555;
  --border:          rgba(255, 255, 255, 0.08);
  --border-strong:   rgba(255, 255, 255, 0.16);
}
```

### Feature-Scoped Palettes

```css
/* apps/crm/app/index.css */
:root {
  --crm-bg:      #f8fafc;
  --crm-primary: oklch(0.40 0.12 260);
  --crm-accent:  oklch(0.55 0.15 200);
}

/* apps/nurafin/app/index.css */
:root {
  --nurafin-bg:      #f0fdf4;
  --nurafin-primary: oklch(0.45 0.15 145);
  --nurafin-accent:  oklch(0.65 0.20 140);
}

/* apps/eis/app/index.css */
:root {
  --eis-bg:      #fafaf9;
  --eis-primary: oklch(0.35 0.05 30);
  --eis-accent:  oklch(0.55 0.12 35);
}

/* apps/campus-erp/app/index.css */
:root {
  --campus-bg:      #fdf4ff;
  --campus-primary: oklch(0.40 0.15 300);
  --campus-accent:  oklch(0.60 0.18 290);
}
```

---

## Typography

### Font Stack

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap');

@theme {
  --font-sans:    'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: 'Inter', sans-serif;
  --font-mono:    'Geist Mono', 'Fira Code', monospace;
}
```

### Type Scale (Tailwind utilities)

| Role | Class |
|---|---|
| Hero | `text-7xl md:text-[80px] font-black leading-none tracking-tighter` |
| H1 | `text-5xl md:text-[56px] font-extrabold leading-none tracking-tight` |
| H2 | `text-4xl md:text-[44px] font-bold leading-tight tracking-tight` |
| H3 | `text-2xl font-bold leading-snug` |
| Body | `text-base leading-[22px] tracking-[-0.01em]` |
| Small | `text-sm leading-5` |
| Eyebrow | `text-sm font-semibold uppercase tracking-widest text-muted` |

---

## Spacing System

**Section vertical padding:**

| Context | Desktop | Mobile |
|---|---|---|
| Hero | `pt-[156px] pb-[180px]` | `pt-[108px] pb-20` |
| Content sections | `py-[120px]` | `py-20` |
| Card inner | `p-6` | `p-4` |

---

## Component Gallery

### Navbar (Floating Glassmorphism)

```tsx
// apps/landing/app/components/shared/layouts/Navbar.tsx
import { Link } from "react-router";
import { motion } from "motion/react";

export function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.8 }}
      className={[
        "fixed top-6 left-1/2 z-50",
        "-translate-x-1/2",
        "flex items-center justify-between gap-4",
        "w-[calc(100vw-48px)] max-w-[584px] h-[60px]",
        "px-6",
        "rounded-[30px]",
        "bg-[rgba(237,237,237,0.64)] dark:bg-[rgba(30,30,30,0.64)]",
        "backdrop-blur-[48px]",
        "border border-[var(--border)]",
      ].join(" ")}
    >
      <Link to="/" className="font-bold text-foreground">Rayeen</Link>
      <div className="flex items-center gap-2">{/* nav links */}</div>
    </motion.nav>
  );
}
```

### Infinite Marquee (3 rows, alternating)

```tsx
// app/components/shared/components/Marquee.tsx
import { useRef } from "react";
import { motion, useAnimationFrame, useMotionValue } from "motion/react";
import { cn } from "~/lib/utils";

interface MarqueeProps {
  items: string[];
  direction?: "left" | "right";
  speed?: number;
  className?: string;
}

export function Marquee({ items, direction = "left", speed = 40, className }: MarqueeProps) {
  const x = useMotionValue(0);
  const ref = useRef<HTMLDivElement>(null);
  const doubled = [...items, ...items];

  useAnimationFrame((_, delta) => {
    const sign = direction === "left" ? -1 : 1;
    const move = sign * (delta / 1000) * speed;
    const next = x.get() + move;
    const itemWidth = ref.current ? ref.current.scrollWidth / 2 : 0;
    x.set(Math.abs(next) >= itemWidth ? 0 : next);
  });

  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div ref={ref} style={{ x }} className="flex gap-3 w-max">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="px-4 py-2 rounded-[var(--radius-pill)]
              bg-[var(--surface-subtle)] border border-[var(--border)]
              text-sm text-muted whitespace-nowrap"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// Usage — Skills section wrapper
export function SkillsMarqueeSection({ rows }: { rows: string[][] }) {
  const directions: Array<"left" | "right"> = ["left", "right", "left"];
  const speeds = [35, 28, 42];

  return (
    <section
      className="py-20 space-y-4"
      style={{
        maskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
      }}
    >
      {rows.map((row, i) => (
        <Marquee key={i} items={row} direction={directions[i]} speed={speeds[i]} />
      ))}
    </section>
  );
}
```

### Screenshot Fade Grid

```tsx
<div
  className="overflow-hidden"
  style={{
    maskImage: "linear-gradient(to bottom, #000 85%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, #000 85%, transparent 100%)",
  }}
>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
    {/* screenshot cards */}
  </div>
</div>
```

---

## Animation Presets

```ts
// app/constants/animations.ts
export const animations = {
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { type: "spring" as const, bounce: 0, duration: 0.8 },
  },
  heroTitle: {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, bounce: 0, duration: 1.2 },
  },
  staggerContainer: {
    animate: { transition: { staggerChildren: 0.08 } },
    whileInView: { transition: { staggerChildren: 0.08 } },
  },
  staggerItem: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    whileInView: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, bounce: 0, duration: 0.6 },
  },
  cardHover: {
    whileHover: { y: -4, scale: 1.01 },
    transition: { type: "spring" as const, bounce: 0, duration: 0.3 },
  },
} as const;
```

---

## Accessibility Checklist

- Semua interactive elements punya `focus-visible` ring menggunakan `focus-visible:ring-2 focus-visible:ring-[var(--accent)]`
- Gunakan semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`
- Image alt text: deskriptif untuk konten, `alt=""` untuk dekoratif
- `aria-label` pada icon-only buttons
- Keyboard navigable: semua click handler dapat diakses via keyboard
- Color contrast: minimum WCAG AA (4.5:1 untuk text normal)
