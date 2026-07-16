# 🌸 Gauram Designer Studio — Transformation Plan
### From *Generic Billing App* → *Best-in-Class Indian Boutique Billing*

> **Vision:** A 1-2 person boutique should feel like the software was built just for them. Instant interactions, GST-correct, Indian conventions, zero cost to run.

---

## 🎯 Core Constraints
- **Users:** Single boutique, 1-2 staff
- **Workflows:** Plain retail only (no rentals, no custom stitching, no bridal)
- **Priority:** Speed & performance (sub-100ms perceived)
- **Budget:** Free / self-host only
- **Stack additions:** Framer Motion only (for micro-animations)
- **Dream:** Beat Vyapar/Khatabook in the boutique niche

---

## 📐 Architecture Decisions

### State Management
- **Server state:** React Server Components + native `useState`/`useEffect` + `useTransition` (no TanStack Query — keep it lean)
- **Client UI state:** React `useState` + custom hooks + `localStorage` for persistence (no Zustand)
- **Performance primitives:** `useTransition` for non-urgent updates, `useDeferredValue` for search, `React.memo` for expensive lists, `useMemo` for aggregations
- **URL state:** Native `useSearchParams` for shareable filter URLs

### Animation
- **Framer Motion** for: page transitions, modal enter/exit, count-up on KPIs, toast slide-in, confetti on first finalized bill, hover micro-interactions
- Respect `prefers-reduced-motion` globally

### Data Layer
- Keep Prisma + SQLite (single boutique = SQLite is fine; consider Postgres only if multi-tenant ever)
- All mutations use `router.refresh()` + optimistic local state
- No WebSockets (free-tier constraint)

### Charts
- Build custom animated SVG charts with **Framer Motion** (no Recharts/Tremor — keeps bundle tiny, fully styled)
- Or: pure Tailwind/CSS bars with number count-up (cheapest)

---

# 🚨 PART 1 — Bad UI/UX Audit (Current)

## A. Visual Inconsistency

| Symptom | Evidence |
|---|---|
| Mixed border-radius | `rounded-lg` / `rounded-xl` / `rounded-2xl` / `rounded-3xl` scattered |
| Mixed shadows | `shadow-sm` / `shadow-md` / `shadow-xl` / `shadow-2xl` used randomly |
| Mixed color semantics | `emerald-500` vs `green-600` vs `green-50` all mean "paid" |
| Mixed transitions | `transition-colors` vs `transition-all` vs none |
| Mixed section padding | `p-5` / `p-6` / `p-8` / `p-8 md:p-12` ad-hoc |
| **Broken styles** | `from-maroon-800 to-gold-500` in `reports/page.tsx:237` — colors not in theme, no-op |
| **Dead hover styles** | Settings Save: `hover:text-gray-900` on already gray text |
| Decorative borders | Corner ornaments on invoice detail — dated, no value |
| **Inverted contrast** | Invoice modal "Record Payment": dark text on dark bg |

## B. Information Architecture

- No breadcrumbs
- No global search (Cmd-K)
- Sidebar state lost on refresh
- No mobile navigation (sidebar is fixed 220px)
- No 404 page
- Empty states are just an icon + 2 lines

## C. Dashboard (`src/app/page.tsx`)

- KPI cards lack time-period context
- No deltas / comparisons
- No real chart (just progress bars)
- No sorting / pagination / bulk actions
- No row click → must use eye icon
- No skeleton loaders
- No date presets (Today / This Week / This Month)
- Search fires per keystroke (no debounce)
- "Active Drafts" wording confusing

## D. Invoice Form (`src/components/InvoiceForm.tsx`)

- Auto-suggest on phone only (not name)
- Borderless inline inputs in line-items table
- HSN/SAC & GST user-editable (compliance footgun)
- No item reordering
- No item templates (every "Bridal Lehenga" retyped)
- No bulk paste from Excel
- No overall bill discount
- No tax-inclusive mode (MRP convention)
- No split payments (Cash + UPI)
- No draft auto-save (refresh = lost work)
- No item-level validation (discount > rate silently accepted)
- Customer silently auto-created — no feedback

## E. Invoice Detail (`src/app/invoices/[id]/page.tsx`)

- Edit only for drafts — no credit note
- Delete only for drafts — no void
- Print = `window.print()` (browser-dependent)
- WhatsApp text is hardcoded, no item list, no UPI link
- No "duplicate bill" for repeat orders
- No internal notes

## F. Customers

- **No Add Customer button** (must come via billing)
- No edit customer page
- No tags (VIP / Wholesale)
- No quick actions (Call / WhatsApp / Email)
- No bulk import/export
- Customer detail is sparse (no LTV trend, no avg bill)

## G. Reports

- No time-period filter
- No comparison period
- No real charts
- No tax filing export (GSTR-1)
- No aging report
- Capped at 15 recent payments
- References undefined theme colors

## H. Settings

- No logo upload
- No signature upload
- No UPI QR upload
- No bank details field
- Terms = plain textarea
- No GSTIN format validation
- Dead styles on Save button

## I. Cross-Cutting

- `alert()` for all errors (blocks thread, not accessible)
- No toast system
- No focus trap in modals
- No `aria-label` on icon buttons
- Color-only status signals
- No focus rings (focus:outline-none without replacement)
- No skip-to-content link
- Hardcoded `+91` (no international)
- Hardcoded `en-IN` locale

## J. Code Smells

- `fmt` defined in 3+ files
- `statusBadge` defined in 2 files
- Payment modal logic duplicated (Dashboard + Invoice Detail)
- No global state → refetch after every action
- No optimistic UI
- No data caching

---

# ✨ PART 2 — Transformation Phases

## Phase 0 — Foundation (Week 1)

### 0.1 Design Tokens

**File:** `src/app/globals.css`

```css
@import "tailwindcss";

@theme {
  /* Brand — boutique maroon + gold */
  --color-brand-50:  #fdf4f3;
  --color-brand-100: #fbe7e5;
  --color-brand-200: #f7d0cc;
  --color-brand-300: #efa9a2;
  --color-brand-400: #e07a72;
  --color-brand-500: #c94a3f;
  --color-brand-600: #b03a30;
  --color-brand-700: #922e26;
  --color-brand-800: #6e211b;   /* primary brand */
  --color-brand-900: #4a1612;
  --color-brand-950: #2a0d0b;

  --color-gold-400: #e8c468;
  --color-gold-500: #d4a83c;    /* accent */

  /* Semantic */
  --color-success-bg: #ecfdf5;
  --color-success-fg: #047857;
  --color-success-border: #a7f3d0;
  --color-warning-bg: #fffbeb;
  --color-warning-fg: #b45309;
  --color-warning-border: #fde68a;
  --color-danger-bg:  #fef2f2;
  --color-danger-fg:  #b91c1c;
  --color-danger-border: #fecaca;
  --color-info-bg:    #eff6ff;
  --color-info-fg:    #1d4ed8;
  --color-info-border:#bfdbfe;

  /* Surfaces */
  --color-surface: #ffffff;
  --color-surface-2: #fafaf9;     /* page bg */
  --color-surface-3: #f5f5f4;     /* hover */
  --color-border: #e7e5e4;
  --color-border-strong: #d6d3d1;
  --color-ink: #1c1917;
  --color-ink-2: #44403c;
  --color-ink-3: #78716c;        /* secondary text */
  --color-ink-4: #a8a29e;        /* tertiary */

  /* Radii */
  --radius-card: 0.875rem;       /* 14px */
  --radius-button: 0.625rem;     /* 10px */

  /* Shadows — restrained */
  --shadow-card: 0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.02);
  --shadow-elevated: 0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04);
  --shadow-modal: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05);

  /* Fonts */
  --font-sans: var(--font-inter), system-ui, -apple-system, sans-serif;
  --font-serif: var(--font-cinzel), Georgia, serif;  /* logo + invoice header only */
}

:root {
  color-scheme: light;
}

[data-theme="dark"] {
  --color-surface: #0c0a09;
  --color-surface-2: #1c1917;
  --color-surface-3: #292524;
  --color-border: #292524;
  --color-border-strong: #44403c;
  --color-ink: #fafaf9;
  --color-ink-2: #e7e5e4;
  --color-ink-3: #a8a29e;
  --color-ink-4: #78716c;
  color-scheme: dark;
}

* { border-color: var(--color-border); }
body {
  background-color: var(--color-surface-2);
  color: var(--color-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

input, select, textarea {
  background: var(--color-surface);
  color: var(--color-ink);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 3px rgba(176, 58, 48, 0.12);
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border-strong); border-radius: 3px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 0.2 Component Library

Create `src/components/ui/`:

#### `Button.tsx`
```tsx
'use client'
import { motion } from 'framer-motion'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  primary:   'bg-brand-800 text-white hover:bg-brand-700 active:bg-brand-900 shadow-card',
  secondary: 'bg-surface text-ink border border-border hover:bg-surface-3',
  ghost:     'text-ink-2 hover:bg-surface-3 hover:text-ink',
  danger:    'bg-danger-bg text-danger-fg border border-danger-border hover:bg-red-100',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700',
}
const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
  icon?: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-[var(--radius-button)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
        variants[variant], sizes[size], className
      )}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </motion.button>
  )
)
Button.displayName = 'Button'
```

#### `Card.tsx`
```tsx
import { cn } from '@/lib/utils'
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-surface rounded-[var(--radius-card)] border border-border shadow-card', className)} {...props} />
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4 border-b border-border', className)} {...props} />
}
export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}
```

#### `StatCard.tsx`
```tsx
'use client'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from './Card'
import { cn } from '@/lib/utils'

export function StatCard({
  label, value, format = 'currency', delta, icon, accent
}: {
  label: string
  value: number
  format?: 'currency' | 'number' | 'percent'
  delta?: { value: number; period: string }
  icon: React.ReactNode
  accent?: 'brand' | 'success' | 'warning' | 'danger'
}) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, v =>
    format === 'currency' ? `₹${Math.round(v).toLocaleString('en-IN')}`
    : format === 'percent' ? `${v.toFixed(0)}%`
    : Math.round(v).toLocaleString('en-IN')
  )

  useEffect(() => { animate(count, value, { duration: 0.8, ease: 'easeOut' }) }, [value, count])

  const accentMap = {
    brand: 'text-brand-700 bg-brand-50',
    success: 'text-emerald-700 bg-emerald-50',
    warning: 'text-amber-700 bg-amber-50',
    danger: 'text-red-700 bg-red-50',
  }

  return (
    <Card className="p-5 hover:shadow-elevated transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-xs font-medium text-ink-3 uppercase tracking-wider">{label}</p>
          <motion.p className="text-2xl font-bold text-ink tabular-nums">{rounded}</motion.p>
          {delta && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', {
              'text-emerald-600': delta.value > 0,
              'text-red-600': delta.value < 0,
              'text-ink-3': delta.value === 0,
            })}>
              {delta.value > 0 ? <TrendingUp className="w-3 h-3" /> :
               delta.value < 0 ? <TrendingDown className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />}
              <span>{Math.abs(delta.value).toFixed(1)}%</span>
              <span className="text-ink-4 font-normal">vs {delta.period}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', accentMap[accent || 'brand'])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
```

#### `Badge.tsx`
```tsx
import { CheckCircle2, Clock, AlertTriangle, FileText, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const variants = {
  success: 'bg-success-bg text-success-fg border-success-border',
  warning: 'bg-warning-bg text-warning-fg border-warning-border',
  danger:  'bg-danger-bg text-danger-fg border-danger-border',
  info:    'bg-info-bg text-info-fg border-info-border',
  neutral: 'bg-surface-3 text-ink-2 border-border',
  brand:   'bg-brand-50 text-brand-700 border-brand-200',
}

export function Badge({
  variant = 'neutral', className, children, icon
}: {
  variant?: keyof typeof variants
  className?: string
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
      variants[variant], className
    )}>
      {icon}{children}
    </span>
  )
}

export const StatusBadge = ({ status }: { status: 'paid' | 'partial' | 'pending' | 'draft' | 'void' }) => {
  const map = {
    paid:    { v: 'success' as const, label: 'Paid',    icon: <CheckCircle2 className="w-3 h-3" /> },
    partial: { v: 'warning' as const, label: 'Partial', icon: <Clock className="w-3 h-3" /> },
    pending: { v: 'danger'  as const, label: 'Pending', icon: <AlertTriangle className="w-3 h-3" /> },
    draft:   { v: 'neutral' as const, label: 'Draft',   icon: <FileText className="w-3 h-3" /> },
    void:    { v: 'neutral' as const, label: 'Void',    icon: <XCircle className="w-3 h-3" /> },
  }
  return <Badge variant={map[status].v} icon={map[status].icon}>{map[status].label}</Badge>
}
```

#### `Modal.tsx`
```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export function Modal({
  open, onClose, title, children, size = 'md', footer
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector<HTMLElement>('[autofocus], button, input, select, textarea')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={cn(
              'relative bg-surface rounded-2xl shadow-modal w-full overflow-hidden',
              sizeMap[size]
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 id="modal-title" className="text-base font-semibold text-ink">{title}</h2>
                <button onClick={onClose} aria-label="Close"
                  className="text-ink-3 hover:text-ink p-1 rounded-md hover:bg-surface-3">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-border bg-surface-2 flex gap-3 justify-end">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
```

#### `Toast.tsx`
```tsx
'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'
const ToastContext = createContext<{ toast: (msg: string, type?: ToastType) => void }>({ toast: () => {} })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: ToastType }>>([])

  const toast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    error:   <XCircle className="w-4 h-4 text-red-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    info:    <Info className="w-4 h-4 text-blue-600" />,
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[60] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 bg-surface rounded-xl shadow-elevated border pointer-events-auto min-w-[280px] max-w-md',
                t.type === 'success' && 'border-emerald-200',
                t.type === 'error' && 'border-red-200',
                t.type === 'warning' && 'border-amber-200',
                t.type === 'info' && 'border-blue-200',
              )}
            >
              {iconMap[t.type]}
              <p className="flex-1 text-sm text-ink">{t.msg}</p>
              <button onClick={() => setToasts(x => x.filter(y => y.id !== t.id))} aria-label="Dismiss"
                className="text-ink-3 hover:text-ink">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
```

#### `EmptyState.tsx`
```tsx
import { cn } from '@/lib/utils'

export function EmptyState({
  icon, title, description, action, className
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center text-ink-3 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-ink mb-1">{title}</h3>
      {description && <p className="text-xs text-ink-3 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}
```

#### `Skeleton.tsx`
```tsx
import { cn } from '@/lib/utils'
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-surface-3 rounded-md animate-pulse', className)} />
}
export function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
      ))}
    </tr>
  )
}
```

#### `DataTable.tsx`
```tsx
'use client'
import { useState, useMemo, useDeferredValue } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'

export type Column<T> = {
  key: keyof T
  label: string
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  render?: (row: T) => React.ReactNode
  className?: string
  width?: string
}

export function DataTable<T extends { id: string }>({
  data, columns, loading, emptyState, onRowClick, defaultSort, pageSize = 20
}: {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  defaultSort?: { key: keyof T; dir: 'asc' | 'desc' }
  pageSize?: number
}) {
  const [sort, setSort] = useState<{ key: keyof T; dir: 'asc' | 'desc' } | null>(defaultSort || null)
  const [page, setPage] = useState(0)
  const deferredSort = useDeferredValue(sort)

  const sorted = useMemo(() => {
    if (!deferredSort) return data
    return [...data].sort((a, b) => {
      const av = a[deferredSort.key] as any
      const bv = b[deferredSort.key] as any
      if (av < bv) return deferredSort.dir === 'asc' ? -1 : 1
      if (av > bv) return deferredSort.dir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, deferredSort])

  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(sorted.length / pageSize)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left">
              {columns.map(col => (
                <th key={String(col.key)}
                  className={cn('px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wider', col.className)}
                  style={col.width ? { width: col.width } : undefined}>
                  {col.sortable ? (
                    <button
                      onClick={() => setSort(s => s?.key === col.key
                        ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
                        : { key: col.key, dir: 'asc' })}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      {col.label}
                      {sort?.key === col.key
                        ? (sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
                        : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
                    </button>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{columns.map((c, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}</tr>
              ))
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length}>{emptyState}</td></tr>
            ) : (
              pageData.map(row => (
                <tr key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn('hover:bg-surface-2 transition-colors', onRowClick && 'cursor-pointer')}
                >
                  {columns.map(col => (
                    <td key={String(col.key)}
                      className={cn('px-4 py-3', col.className)}
                      style={{ textAlign: col.align }}>
                      {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-ink-3">
          <span>Page {page + 1} of {totalPages} ({sorted.length} rows)</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1 rounded border border-border disabled:opacity-50 hover:bg-surface-2">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border border-border disabled:opacity-50 hover:bg-surface-2">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

#### `Spinner.tsx`
```tsx
import { cn } from '@/lib/utils'

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeMap = { sm: 'w-4 h-4 border-2', md: 'w-5 h-5 border-2', lg: 'w-8 h-8 border-[3px]' }
  return (
    <div className={cn(
      'rounded-full border-brand-300 border-t-brand-700 animate-spin',
      sizeMap[size], className
    )} role="status" aria-label="Loading" />
  )
}
```

### 0.3 Shared Utilities

**`src/lib/utils.ts`**
```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useEffect, useState } from 'react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(n: number, opts: { compact?: boolean } = {}): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: opts.compact ? 1 : 0,
    notation: opts.compact ? 'compact' : 'standard',
  }).format(n)
}

export function formatDate(d: string | Date, style: 'short' | 'long' | 'datetime' = 'short'): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (style === 'datetime') {
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function useDebounce<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function validateGSTIN(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.toUpperCase())
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, '')
  return cleaned.length >= 10 && cleaned.length <= 13
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
```

Install: `npm i clsx tailwind-merge framer-motion`

### 0.4 Layout Shell

**`src/app/layout.tsx`**
```tsx
import type { Metadata } from 'next'
import { Inter, Cinzel } from 'next/font/google'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AppShell } from '@/components/layout/AppShell'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' })

export const metadata: Metadata = {
  title: 'Gauram Designer Studio',
  description: 'Boutique billing & invoice management',
  icons: { icon: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${cinzel.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-800 focus:text-white focus:rounded">
          Skip to main content
        </a>
        <ThemeProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**`src/components/layout/AppShell.tsx`**
```tsx
'use client'
import { Sidebar } from './Sidebar'
import { CommandPalette } from './CommandPalette'
import { motion } from 'framer-motion'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-2">
      <Sidebar />
      <main id="main" className="flex-1 min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="p-6 md:p-8 max-w-7xl mx-auto print:p-0 print:max-w-none"
        >
          {children}
        </motion.div>
      </main>
      <CommandPalette />
    </div>
  )
}
```

**`src/components/layout/Sidebar.tsx`**
```tsx
'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, PlusCircle, Users, BarChart3, Settings, ChevronsLeft, ChevronsRight, Receipt, X, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const links = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, shortcut: 'G D' },
  { name: 'New Bill', href: '/invoices/new', icon: PlusCircle, shortcut: 'N' },
  { name: 'Bills', href: '/bills', icon: Receipt },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) setCollapsed(saved === 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const NavContent = () => (
    <>
      <Link href="/" className={cn(
        'flex items-center gap-3 px-3 py-4 border-b border-border',
        collapsed && 'justify-center'
      )}>
        <Image src="/logo.png" alt="Gauram" width={36} height={36}
          className="rounded-lg flex-shrink-0" />
        {(!collapsed) && (
          <div className="min-w-0">
            <p className="font-serif font-bold text-sm text-ink tracking-wider uppercase">Gauram</p>
            <p className="text-[10px] text-ink-3 tracking-widest uppercase">Designer Studio</p>
          </div>
        )}
      </Link>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {links.map(({ name, href, icon: Icon, shortcut }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} title={collapsed ? name : undefined}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                collapsed && 'justify-center',
                active
                  ? 'bg-brand-800 text-white'
                  : 'text-ink-2 hover:bg-surface-3 hover:text-ink'
              )}>
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-white' : 'text-ink-3 group-hover:text-ink-2')} />
              {(!collapsed) && <span className="truncate flex-1">{name}</span>}
              {(!collapsed && shortcut) && (
                <kbd className="text-[10px] text-ink-4 opacity-0 group-hover:opacity-100">{shortcut}</kbd>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t border-border hidden lg:block">
        <button onClick={() => setCollapsed(c => !c)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-ink-3 hover:bg-surface-3 hover:text-ink-2',
            collapsed && 'justify-center'
          )}>
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : (
            <><ChevronsLeft className="w-4 h-4" /><span>Collapse</span></>
          )}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 bg-surface rounded-lg shadow-card border border-border">
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-surface border-r border-border transition-all duration-200 h-screen sticky top-0',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}>
        <NavContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-surface flex flex-col">
              <button onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1.5 text-ink-3 hover:text-ink">
                <X className="w-4 h-4" />
              </button>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
```

**`src/components/layout/PageHeader.tsx`**
```tsx
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Crumb { label: string; href?: string }

export function PageHeader({
  title, subtitle, breadcrumbs, actions, className
}: {
  title: string
  subtitle?: string
  breadcrumbs?: Crumb[]
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-border', className)}>
      <div className="space-y-1.5 min-w-0">
        {breadcrumbs && (
          <nav className="flex items-center gap-1 text-xs text-ink-3 mb-2">
            {breadcrumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-ink-4" />}
                {c.href ? <Link href={c.href} className="hover:text-ink">{c.label}</Link> : <span>{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-3">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
```

**`src/components/layout/CommandPalette.tsx`**
```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { PlusCircle, Users, BarChart3, Settings, LayoutDashboard, Receipt, Search } from 'lucide-react'
import { Modal } from '../ui/Modal'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
        const tag = document.activeElement?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        e.preventDefault()
        router.push('/invoices/new')
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [router])

  const go = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="lg">
      <Command className="rounded-lg">
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <Search className="w-4 h-4 text-ink-3" />
          <Command.Input placeholder="Search or jump to..."
            className="flex-1 py-3 bg-transparent text-sm focus:outline-none" />
          <kbd className="text-[10px] text-ink-4">ESC</kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto py-2">
          <Command.Empty className="py-6 text-center text-sm text-ink-3">No results found.</Command.Empty>
          <Command.Group heading="Navigate" className="text-[10px] font-semibold text-ink-4 uppercase tracking-wider px-3 py-1">
            <CommandItem onSelect={() => go('/')} icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</CommandItem>
            <CommandItem onSelect={() => go('/invoices/new')} icon={<PlusCircle className="w-4 h-4" />}>New Bill <kbd className="ml-auto text-[10px] text-ink-4">N</kbd></CommandItem>
            <CommandItem onSelect={() => go('/bills')} icon={<Receipt className="w-4 h-4" />}>All Bills</CommandItem>
            <CommandItem onSelect={() => go('/customers')} icon={<Users className="w-4 h-4" />}>Customers</CommandItem>
            <CommandItem onSelect={() => go('/reports')} icon={<BarChart3 className="w-4 h-4" />}>Reports</CommandItem>
            <CommandItem onSelect={() => go('/settings')} icon={<Settings className="w-4 h-4" />}>Settings</CommandItem>
          </Command.Group>
        </Command.List>
      </Command>
    </Modal>
  )
}

function CommandItem({ children, onSelect, icon }: { children: React.ReactNode; onSelect: () => void; icon: React.ReactNode }) {
  return (
    <Command.Item onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2 text-sm rounded-md cursor-pointer data-[selected=true]:bg-surface-3">
      {icon}{children}
    </Command.Item>
  )
}
```

**`src/components/ThemeProvider.tsx`**
```tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: 'system', setTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'system'
    setTheme(saved)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const dark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', theme)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
```

### 0.5 Database Schema Additions

**`prisma/schema.prisma`** — add these fields:

```prisma
model BusinessSettings {
  id               String   @id @default("default")
  name             String   @default("Gauram Designer Studio")
  address          String   @default("")
  phone            String   @default("")
  email            String   @default("")
  website          String   @default("")
  gstin            String   @default("")
  termsAndConds    String   @default("")
  invoicePrefix    String   @default("GDS/2026/")
  nextInvoiceNum   Int      @default(1)
  logoUrl          String?
  signatureUrl     String?
  upiQrUrl         String?
  upiVpa           String?
  bankDetails      String?
  themeAccent      String   @default("maroon")
  updatedAt        DateTime @updatedAt
}

model Customer {
  id        String    @id @default(uuid())
  name      String
  phone     String    @unique
  address   String?
  email     String?
  tags      String?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  invoices  Invoice[]
}

model Invoice {
  id             String        @id @default(uuid())
  orderId        String?       @unique
  customerId     String
  customer       Customer      @relation(fields: [customerId], references: [id])
  invoiceDate    DateTime      @default(now())
  status         String        @default("draft")
  subtotal       Float
  discountTotal  Float         @default(0)
  cgstAmount     Float
  sgstAmount     Float
  totalAmount    Float
  amountPaid     Float         @default(0)
  pendingAmount  Float
  paymentMode    String        @default("Cash")
  isTaxInclusive Boolean       @default(true)
  termsText      String
  internalNotes  String?
  voidReason     String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  items          InvoiceItem[]
  payments       Payment[]
}

model InvoiceItem {
  id          String   @id @default(uuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description String
  category    String
  hsnSacCode  String
  quantity    Int      @default(1)
  rate        Float
  discount    Float    @default(0)
  gstRate     Float    @default(0)
  amount      Float
  position    Int      @default(0)
}

model Payment {
  id         String   @id @default(uuid())
  invoiceId  String
  invoice    Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  amount     Float
  mode       String
  date       DateTime @default(now())
  note       String?
}

model ItemTemplate {
  id          String   @id @default(uuid())
  description String
  category    String
  hsnSacCode  String
  gstRate     Float
  defaultRate Float?
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())
}
```

Then run: `npx prisma migrate dev --name add_retail_polish`

### 0.6 API Helpers

**`src/lib/api.ts`**
```ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function ok<T>(data: T) { return NextResponse.json(data) }
export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
export function handleError(e: unknown) {
  if (e instanceof ZodError) return err(e.errors[0]?.message || 'Invalid input', 400)
  console.error(e)
  return err(e instanceof Error ? e.message : 'Internal error', 500)
}
```

---

## Phase 1 — Lightning-Fast Dashboard (Week 2)

**`src/app/page.tsx`** — full rewrite sketch:

```tsx
'use client'
import { useEffect, useState, useMemo, useTransition } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, Wallet, Clock, CheckCircle2, Plus, AlertTriangle, Sparkles } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatINR, formatDate, greeting } from '@/lib/utils'

export default function Dashboard() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => fetch('/api/invoices').then(r => r.json()),
    staleTime: 30_000,
  })

  const metrics = useMemo(() => {
    const active = invoices.filter((i: any) => i.status !== 'draft' && i.status !== 'void')
    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endPrev = new Date(now.getFullYear(), now.getMonth(), 0)

    const thisMonth = active.filter((i: any) => new Date(i.invoiceDate) >= startMonth)
    const prevMonth = active.filter((i: any) => {
      const d = new Date(i.invoiceDate)
      return d >= startPrev && d <= endPrev
    })

    const sum = (arr: any[], key: string) => arr.reduce((s, i) => s + (i[key] || 0), 0)
    const pct = (curr: number, prev: number) => prev === 0 ? null : ((curr - prev) / prev) * 100

    return {
      thisMonthSales: sum(thisMonth, 'totalAmount'),
      prevMonthSales: sum(prevMonth, 'totalAmount'),
      salesDelta: pct(sum(thisMonth, 'totalAmount'), sum(prevMonth, 'totalAmount')),
      outstanding: sum(active, 'pendingAmount'),
      avgTicket: active.length ? sum(active, 'totalAmount') / active.length : 0,
      prevAvgTicket: prevMonth.length ? sum(prevMonth, 'totalAmount') / prevMonth.length : 0,
      settlementRate: active.length ? (active.filter((i: any) => i.status === 'paid').length / active.length) * 100 : 0,
      drafts: invoices.filter((i: any) => i.status === 'draft').length,
      overdue: active.filter((i: any) => i.pendingAmount > 0 && new Date(i.invoiceDate) < new Date(Date.now() - 30 * 86400000)).length,
    }
  }, [invoices])

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${greeting()}, Gauram 🌸`}
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={
          <Link href="/invoices/new">
            <Button icon={<Plus className="w-4 h-4" />}>New Bill</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="This Month Sales" value={metrics.thisMonthSales}
          icon={<TrendingUp className="w-5 h-5" />} accent="brand"
          delta={metrics.salesDelta !== null ? { value: metrics.salesDelta, period: 'last month' } : undefined} />
        <StatCard label="Outstanding Dues" value={metrics.outstanding}
          icon={<AlertTriangle className="w-5 h-5" />} accent="danger" />
        <StatCard label="Avg Ticket Size" value={metrics.avgTicket}
          icon={<Wallet className="w-5 h-5" />} accent="success"
          delta={pct(metrics.avgTicket, metrics.prevAvgTicket) ? { value: pct(metrics.avgTicket, metrics.prevAvgTicket)!, period: 'last month' } : undefined} />
        <StatCard label="Settlement Rate" value={metrics.settlementRate} format="percent"
          icon={<CheckCircle2 className="w-5 h-5" />} accent="success" />
      </div>

      {(metrics.overdue > 0 || metrics.drafts > 0) && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              Action Queue
            </h2>
          </CardHeader>
          <CardBody className="space-y-2">
            {metrics.overdue > 0 && (
              <Link href="/bills?overdue=true" className="flex items-center justify-between p-3 rounded-lg bg-danger-bg border border-danger-border hover:bg-red-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-danger-fg" />
                  <span className="text-sm text-red-900"><b>{metrics.overdue}</b> bills overdue for collection</span>
                </div>
                <span className="text-xs text-red-700 group-hover:underline">View →</span>
              </Link>
            )}
            {metrics.drafts > 0 && (
              <Link href="/bills?status=draft" className="flex items-center justify-between p-3 rounded-lg bg-warning-bg border border-warning-border hover:bg-amber-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-warning-fg" />
                  <span className="text-sm text-amber-900"><b>{metrics.drafts}</b> draft bills waiting to be finalized</span>
                </div>
                <span className="text-xs text-amber-700 group-hover:underline">View →</span>
              </Link>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Bills</h2>
          <Link href="/bills" className="text-xs text-brand-700 hover:underline">View all →</Link>
        </CardHeader>
        <DataTable
          data={invoices.slice(0, 10)}
          columns={[
            { key: 'orderId', label: 'Order ID', render: r => <span className="font-mono text-xs font-semibold">{r.orderId || '—'}</span> },
            { key: 'customer', label: 'Customer', render: r => (
              <div>
                <div className="font-medium">{r.customer.name}</div>
                <div className="text-xs text-ink-3">{r.customer.phone}</div>
              </div>
            )},
            { key: 'invoiceDate', label: 'Date', render: r => <span className="text-xs text-ink-3">{formatDate(r.invoiceDate)}</span> },
            { key: 'totalAmount', label: 'Total', align: 'right', render: r => <span className="font-semibold tabular-nums">{formatINR(r.totalAmount)}</span> },
            { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
          ] as Column<any>[]}
          loading={isLoading}
          onRowClick={(r: any) => location.href = `/invoices/${r.id}`}
          emptyState={<EmptyState icon={<Wallet className="w-7 h-7" />} title="No bills yet" description="Create your first bill to get started"
            action={<Link href="/invoices/new"><Button icon={<Plus className="w-4 h-4" />}>Create Bill</Button></Link>} />}
        />
      </Card>
    </div>
  )
}
```

**Install:** `npm i @tanstack/react-query`

Add QueryClientProvider wrapper:

**`src/components/QueryProvider.tsx`**
```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 }
    }
  }))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
```

---

## Phase 2 — Billing Form Polish (Week 3-4)

Key changes to `src/components/InvoiceForm.tsx`:

1. **Live preview** in right column (stacked on mobile via tabs)
2. **Item templates** — search & insert from `ItemTemplate` table
3. **Description autocomplete** — server endpoint `/api/items/suggest?q=`
4. **Auto-save** — debounced 3s `PUT` to a `/api/invoices/[id]/autosave` endpoint
5. **Tax-inclusive toggle** — affects rate vs amount calc
6. **Overall discount** — new field below items, applied to subtotal
7. **Split payments** — UI allows adding multiple payment entries before finalize
8. **HSN/SAC locked** unless user toggles "Advanced"
9. **Undo/redo stack**
10. **Item reorder** — drag handles or up/down arrows
11. **Bulk paste** — handle `onPaste` on last row, parse TSV
12. **Validation feedback** inline, not `alert()`

Suggested file split:
```
src/components/billing/
├── InvoiceForm.tsx
├── CustomerPicker.tsx
├── LineItemsTable.tsx
├── ItemRow.tsx
├── ItemTemplateDrawer.tsx
├── PaymentSplitter.tsx
├── BillSummary.tsx
└── LivePreview.tsx
```

API: `src/app/api/items/suggest/route.ts`
```ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.toLowerCase() || ''
  const items = await prisma.invoiceItem.findMany({
    where: { description: { contains: q } },
    take: 10,
    orderBy: { invoice: { createdAt: 'desc' } },
    include: { invoice: { select: { createdAt: true } } },
  })
  const map = new Map<string, { description: string; rate: number; category: string; lastUsed: Date }>()
  items.forEach((it: any) => {
    if (!map.has(it.description)) {
      map.set(it.description, { description: it.description, rate: it.rate, category: it.category, lastUsed: it.invoice.createdAt })
    }
  })
  return NextResponse.json(Array.from(map.values()).slice(0, 8))
}
```

---

## Phase 3 — Customer CRM (Week 5)

**New pages:**
- `src/app/customers/new/page.tsx` — Add customer form
- `src/app/customers/[id]/edit/page.tsx` (or slide-over drawer)
- `src/app/api/customers/import/route.ts` — CSV bulk import

**Customer detail enhancements:**
- Header card with avatar (initials), tags, quick actions
- KPI strip: Lifetime value, Avg bill, Last visit, Top category, Pending dues
- "Send WhatsApp" button with pre-filled message templates
- Notes editor (save on blur)

**Bulk operations** (Customers page toolbar):
- Select multiple → tag, message, export
- Export selected as CSV

---

## Phase 4 — Reports (Week 6)

**Chart components** (`src/components/charts/`) — all custom SVG with Framer Motion:

- `LineChart.tsx` — gradient area, hover tooltips
- `DonutChart.tsx` — animated segments
- `BarChart.tsx` — horizontal & vertical
- `HeatmapCalendar.tsx` — GitHub-style day heatmap

**Reports page** features:
- Time period selector (Today / 7d / 30d / 90d / YTD / Custom)
- Compare to previous period toggle
- KPI cards with sparklines
- All chart types above
- **Aging report table** — bucket invoices by days overdue
- **GSTR-1 export** (CSV) — HSN-wise summary
- **Export all as PDF** (use `react-pdf` or self-hosted `puppeteer-core`)

---

## Phase 5 — Settings Polish (Week 7)

**New components in settings:**
- **Logo uploader** — drag-drop, preview, crop
- **Signature uploader** — same pattern
- **UPI QR uploader** + VPA field
- **Bank details form** (account #, IFSC auto-validate, holder name, branch)
- **Theme accent picker** (3 swatches)
- **Terms & Conditions rich text** (use Tiptap or Lexical — both free)
- **GSTIN validator** (real-time feedback with format check)
- **Danger zone**: Reset to defaults (with confirm modal)
- **Data backup**: download `backup-{date}.json` of all tables

Install: `npm i @tiptap/react @tiptap/starter-kit react-dropzone`

---

## Phase 6 — Polish & Delight (Week 8)

- **First-run onboarding** — 3-step coachmark tour
- **Confetti** on first bill finalized of the day (use `canvas-confetti`, free)
- **Toast polish** — success toast has subtle checkmark animation
- **Number count-up** on every KPI
- **Page transitions**
- **Empty state illustrations** — custom SVG, brand colors
- **Skeleton screens**
- **Optimistic updates** — record payment → UI updates instantly
- **Print stylesheet audit** — multi-page support, page break controls
- **PDF generation** — server-side via `puppeteer-core` (free)
- **WhatsApp share with line items** — proper formatted message
- **UPI deep link** — `upi://pay?pa={VPA}&pn={name}&am={amount}&tn={orderId}`

---

## 🎯 Success Criteria (Final Checklist)

- [ ] All `alert()` replaced with toasts
- [ ] No `console.error` in production
- [ ] 100% keyboard navigable (test with Tab only)
- [ ] All interactive elements have visible focus rings
- [ ] All icon buttons have `aria-label`
- [ ] WCAG 2.1 AA color contrast
- [ ] Lighthouse: 95+ all categories
- [ ] Lighthouse mobile + desktop tested
- [ ] Bundle size: < 200KB initial JS
- [ ] First Contentful Paint < 1s
- [ ] All search inputs debounced (250ms)
- [ ] All forms have inline validation
- [ ] All empty states have illustrations + CTAs
- [ ] All pages have breadcrumbs
- [ ] Sidebar state persists
- [ ] Dark mode works everywhere
- [ ] Print output is clean & professional
- [ ] PDF export works
- [ ] GSTIN, HSN validation works
- [ ] Backup/restore works
- [ ] Mobile drawer navigation works
- [ ] Command palette (Cmd-K) works
- [ ] Keyboard shortcuts work
- [ ] Reduced-motion preference respected

---

## 📦 Files to Add/Modify Summary

**New files (~40):**
- `src/lib/utils.ts`, `src/lib/api.ts`
- `src/components/ui/{Button,Card,StatCard,Badge,Modal,Toast,EmptyState,Skeleton,DataTable,Spinner}.tsx`
- `src/components/layout/{AppShell,Sidebar,PageHeader,CommandPalette,ThemeProvider,QueryProvider}.tsx`
- `src/components/billing/{CustomerPicker,LineItemsTable,ItemRow,ItemTemplateDrawer,PaymentSplitter,BillSummary,LivePreview}.tsx`
- `src/components/customers/{CustomerForm,ImportDialog,CustomerHeader}.tsx`
- `src/components/charts/{LineChart,DonutChart,BarChart,HeatmapCalendar}.tsx`
- `src/app/customers/new/page.tsx`
- `src/app/customers/[id]/edit/page.tsx`
- `src/app/bills/page.tsx`
- `src/app/api/items/suggest/route.ts`
- `src/app/api/items/templates/route.ts`
- `src/app/api/customers/import/route.ts`
- `src/app/api/invoices/[id]/autosave/route.ts`
- `src/app/api/invoices/[id]/duplicate/route.ts`
- `src/app/api/reports/{sales,aging,gstr1}/route.ts`
- `src/app/api/export/{pdf,csv}/route.ts`
- `src/app/api/upload/route.ts`

**Modified files (~12):**
- `src/app/layout.tsx` — providers, theme, skip link
- `src/app/globals.css` — design tokens
- `src/app/page.tsx` — new dashboard
- `src/components/InvoiceForm.tsx` — split into billing/ components
- `src/components/Sidebar.tsx` → moved to layout/Sidebar.tsx (old file deleted)
- `src/app/invoices/new/page.tsx` — minor
- `src/app/invoices/[id]/page.tsx` — better print, share, payment modals
- `src/app/invoices/[id]/edit/page.tsx` — minor
- `src/app/customers/page.tsx` — DataTable, add button, bulk ops
- `src/app/customers/[id]/page.tsx` — richer profile
- `src/app/reports/page.tsx` — real charts, time picker
- `src/app/settings/page.tsx` — uploads, validation
- `prisma/schema.prisma` — new fields
- `package.json` — install: framer-motion, @tanstack/react-query, cmdk, clsx, tailwind-merge, zod, canvas-confetti

**Deleted (replaced):**
- `src/components/Sidebar.tsx` (moved to layout/)
- Decorative corner border elements in `src/app/invoices/[id]/page.tsx`
- All `alert()` calls

---

## 🚀 Implementation Order for Your Agent

1. **Day 1-2:** Install deps, design tokens, `utils.ts`, base UI components (Button, Card, Badge, Input wrappers)
2. **Day 3:** Layout shell (Sidebar, AppShell, PageHeader, ThemeProvider, ToastProvider)
3. **Day 4:** Schema migration, then refactor existing pages to use new components (zero behavior change yet)
4. **Day 5:** Remove dead styles, fix broken classes, standardize spacing
5. **Day 6-7:** Command palette, keyboard shortcuts, mobile responsive pass
6. **Week 2:** Dashboard overhaul (real charts, sparklines, action queue, KPIs)
7. **Week 3:** Invoice form split into subcomponents, autocomplete, item templates
8. **Week 4:** Invoice view: PDF, WhatsApp with items, internal notes, duplicate
9. **Week 5:** Customer pages (add, edit, tags, bulk ops, rich detail)
10. **Week 6:** Reports with custom charts, time selector, GSTR-1 export
11. **Week 7:** Settings polish (uploads, validation, rich text, backup)
12. **Week 8:** Onboarding, confetti, micro-animations, final pass

---

## 📋 Quick Wins (Can be done in 1 day each)

1. **Replace all `alert()` with toasts** (2 hours)
2. **Add `aria-label` to all icon buttons** (1 hour)
3. **Standardize shadows to `shadow-card` / `shadow-elevated` / `shadow-modal`** (2 hours)
4. **Standardize rounding to `rounded-[var(--radius-card)]` / `rounded-[var(--radius-button)]`** (1 hour)
5. **Fix broken `from-maroon-800 to-gold-500` and dead hover states** (30 mins)
6. **Add skip-to-content link** (15 mins)
7. **Persist sidebar collapsed state** (30 mins)
8. **Debounce all search inputs** (2 hours)
9. **Replace "Loading…" with Skeleton** (2 hours)
10. **Add page transitions** (30 mins)

---

*End of plan.*
