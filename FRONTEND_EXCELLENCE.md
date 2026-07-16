# Gauram Designer Studio — Frontend Excellence Plan

> **Goal:** Take the current boutique billing UI from “solid, warm SaaS shell” to a **crazy-good, couture-grade product UI** — something a Devanahalli designer studio would be proud to open at the counter every day, and that customers would keep as a printed keepsake.
>
> **Audience:** Implementers (AI agents or engineers). This document is grounded in a full read of the live codebase as of the audit date — not a generic redesign wishlist.
>
> **Related docs (do not replace):**
> - `MILLION_DOLLAR_SPEC.md` — original product + design-system blueprint
> - `MOBILE_OPTIMIZATION_SPEC.md` — phone-first audit (many items partially done)
> - `TRANSFORMATION_PLAN.md` — architecture + feature roadmap
>
> This file answers: **what is true right now, what still hurts, and exactly how to make the frontend exceptional.**

---

## 0. Executive snapshot

| Dimension | Current grade | Target |
|---|---|---|
| Visual system (tokens, type, color) | B− | A+ boutique luxury |
| Component consistency | C+ | A (one kit, no snowflake buttons) |
| Core bill flow (create → print → share) | B+ | A (zero friction, zero alerts) |
| Receipt / print artifact | B | A+ (couture keepsake) |
| Dashboard insight density | B | A (actionable, not just pretty cards) |
| Motion & micro-delight | C | A− (purposeful, reduced-motion safe) |
| Accessibility | C | AA baseline everywhere |
| Mobile craft | B+ | A (native-feeling counter tool) |
| Code craft (dupes, invalid classes, RSC) | C | A |

**One-line north star**

> A counter tool that feels like it was **tailored for Gauram** — warm ink, antique gold, calm spacing, instant bill generation, and a receipt that looks like it came from a fashion house, not a default ERP.

---

## 1. What already works (build on this)

Do **not** throw away the shell. The foundation is real:

### 1.1 Design tokens & chrome
- Warm **ink / paper / gold** tokens live in `src/app/globals.css` `@theme`.
- Safe-area helpers, mobile input ≥16px rule, print utilities, custom scrollbars.
- Fonts loaded: Inter (UI), Plus Jakarta (display variable), JetBrains Mono (IDs / money).
- App shell: collapsible desktop sidebar + mobile drawer + sticky header + `⌘K` command palette.

### 1.2 Product surfaces that already feel intentional
| Surface | File | Strengths |
|---|---|---|
| Dashboard | `src/app/page.tsx` | Greeting, 4 KPIs, SVG 6-month trend, search + date filters, desktop table + mobile row cards, skeletons / empty state |
| Create bill | `src/components/InvoiceForm.tsx` | Phone-first customer lookup, desktop dropdown + mobile bottom sheet, segmented payment modes, sticky summary, **fixed mobile CTA bar**, overall discount |
| Receipt | `src/app/invoices/[id]/page.tsx` | Watermark, letterhead, paid stamp, terms, print-only signature row, delete confirm sheet, mobile bottom action bar |
| Customers | `src/app/customers/page.tsx` | Add-client sheet, stats strip, mobile-friendly list |
| Customer profile | `src/app/customers/[id]/page.tsx` | LTV card, stylist notes |
| Reports | `src/app/reports/page.tsx` | Date presets, GST cards, category bars, CSV export, hybrid table/cards |
| UI kit (start) | `src/components/ui/Kit.tsx` | `Button`, `Card*`, `Skeleton`, `EmptyState` |

### 1.3 Explicit product constraints (preserve unless product changes)
- Single boutique, 1–2 counter staff.
- Bills finalize + paid on creation (no partial-payment UI for now).
- Flat GST 12% (CGST 6% + SGST 6%) + one overall discount.
- Stack: Next.js App Router, React 19, Tailwind v4, Prisma, lucide-react. Prefer lean deps.

---

## 2. Honest audit — what’s blocking “crazy good”

### 2.1 Brand & typography (the silent identity leak)

| Issue | Evidence | Why it hurts |
|---|---|---|
| **“Serif” is not a serif** | `--font-serif: var(--font-plus-jakarta)` in `globals.css` — Plus Jakarta is a geometric sans | Boutique luxury relies on **display contrast**. Headings look like slightly different UI text, not fashion house lettering |
| **Gold is a ghost brand** | Tokens exist; nearly every primary CTA is `bg-ink-900`. Gold appears only in EmptyState icon + a few active:bg tints | Without gold on grand totals, active nav, and primary ritual actions, the app reads as “nice gray SaaS,” not Gauram |
| **Uppercase micro-labels everywhere** | Dozens of `text-[8px]`–`text-[10px] uppercase tracking-wider` | Reads as template UI; many are **below readable size** on phone |
| **Invalid / dead Tailwind classes** | `text-ink-550`, `text-ink-950`, `text-ink-955`, `text-ink-705`, `border-rose-205`, `pl-0!` | Silent style bugs — intended polish never lands |

**Fix direction**
1. Add a real display face (recommended: **Cormorant Garamond** or **Cinzel** for wordmark only; Cormorant for softer boutique). Map `--font-serif` to it.
2. Use gold **deliberately, sparingly**:
   - Grand total underline / amount
   - Active nav indicator (left rail or gold ring, not only black pill)
   - Primary “Generate Bill” / “Create Bill” (or gold outline + ink fill hybrid)
   - Receipt frame hairline + paid stamp ink
3. Cap micro-labels at **11px minimum** on mobile; prefer sentence case for body hierarchy, reserve uppercase for true system labels (1–2 per section max).
4. Grep and kill every invalid color/utility class; extend the token ramp if you need mid steps (`ink-400`, `ink-600`).

### 2.2 Component system is half-born

`Kit.tsx` has 5 primitives. The app still hand-rolls:

- Buttons (30+ one-off `className` blocks)
- Cards (repeated shadow string)
- Modals / sheets (command palette, delete confirm, add customer, customer suggestions)
- Inputs / labels (`inputCls` / `labelCls` only inside InvoiceForm)
- Badges (payment mode pills copy-pasted)
- `fmt` currency helper (**4+ copies**)

**Crazy-good rule:** if a pattern appears twice, it belongs in the kit.

**Minimum kit to ship next**

| Component | Responsibility |
|---|---|
| `Button` | Already exists — **use it everywhere**; add `loading` prop + `asChild`/Link variant |
| `Input`, `Select`, `Textarea`, `Field` | Label, hint, error, required mark, 16px mobile |
| `Badge` | Payment mode, category, status |
| `Modal` + `BottomSheet` | Focus trap, Escape, restore focus, backdrop, `role="dialog"` |
| `Toast` | Success / error / undo (replace every `alert`) |
| `Table` / `DataRow` | Desktop table + mobile list pattern as one abstraction |
| `PageHeader` | Title (serif) + subtitle + primary action slot |
| `StatCard` | One consistent KPI tile (avoid 4 slightly different shadows) |
| `Avatar` | Initials circle (customers + form) |
| `Money` | Shared `fmt` / `fmtExact` with `tabular-nums` + mono |
| `ConfirmDialog` | Destructive actions (delete invoice, reset sequence) |
| `SkeletonPage` | Layout-matched skeletons per route |

Optional later: `Command` (cmdk-style with live data), `Tabs`, `Tooltip`.

### 2.3 Interaction debt (the app still “yells” with browser dialogs)

`alert()` / `confirm()` still fire in:

| File | Cases |
|---|---|
| `InvoiceForm.tsx` | Validation + submit errors |
| `invoices/[id]/page.tsx` | Delete failure |
| `customers/page.tsx` | Add customer validation / errors |
| `customers/[id]/page.tsx` | Notes save errors |
| `settings/page.tsx` | Save failure; sequence reset uses `confirm()` |
| `reports/page.tsx` | Empty export |

Also missing:
- Global toast provider
- Inline field errors on the bill form (empty name/phone/rate)
- Success moment after bill create (redirect only — no celebration, no “receipt ready” feedback before navigate)
- Focus trap + `aria-modal` on every overlay
- Debounced search (dashboard + customers refetch on every keystroke)

### 2.4 Information architecture gaps

| Gap | Impact |
|---|---|
| Command palette is **static nav only** | Misses the killer feature: jump to invoice ID / customer phone / “bill for Priya” |
| No global “today’s pulse” beyond dashboard KPIs | Staff can’t answer “how much UPI today?” without Reports |
| No date presets on dashboard | Reports has them; dashboard doesn’t — inconsistency |
| Row click missing on desktop invoice table | Mobile rows are full-link; desktop forces “Receipt” button |
| No breadcrumbs on deep pages | Invoice / customer detail feel detached |
| No `loading.tsx` / `error.tsx` / `not-found.tsx` | White flashes and generic failures |
| Sidebar collapse not persisted | Preference lost every refresh |
| Category UI vs reality | Form implies garments categories but **submit hardcodes** `"Women's Wear"` / `HSN 6204` |

### 2.5 Receipt & print (the product’s public face)

Current receipt is good; couture still unfinished:

- Gold hairline frame not present (corner ornaments are faint ink only).
- Grand total underline is ink, not gold.
- Line-item category badge uses `print-only` in the **desktop table cell** (inverted intent — may hide on screen / confuse print CSS).
- Mobile item cards use `print-only:hidden` (nonstandard utility — verify it actually hides in print).
- Desktop table is `hidden md:block` → **printing from a phone may omit the table** unless a print media override exists (it doesn’t fully).
- WhatsApp message is short text only — no line items, no GSTIN, no thank-you brand line, no UPI handle.
- No true PDF download (only `window.print()`).
- No “copy invoice link / ID” affordance.

### 2.6 Motion & polish

- Relies on Tailwind `animate-in` classes — fine for enter, not enough for **KPI count-up**, list reorder, modal spring, success confetti-lite, chart draw-on.
- No `prefers-reduced-motion` policy in CSS.
- `active:scale-[0.98]` is scattered (good instinct) but not systematic.
- Chart tooltips are always-on labels (cluttered when all months have values).

### 2.7 Performance & architecture (frontend-facing)

Almost every page is `'use client'` + `useEffect` + `fetch`:

- Double network waterfalls (invoice detail fetches invoice + business settings).
- No shared cache → navigating Dashboard → Reports re-downloads all invoices.
- Client-side aggregation of full invoice lists for KPIs (won’t scale; feels fine now, smells later).
- No pagination / virtualization (fine under ~200 bills; plan for more).
- Heavy pages re-render full SVG chart on every filter keystroke.

**Lean path (fits TRANSFORMATION_PLAN):**
- Prefer **Server Components** for first paint + Prisma read.
- Client islands for filters, form, modals.
- Optional: SWR only if you refuse RSC migration — don’t add both complexity layers.

### 2.8 Accessibility short list

- Icon-only buttons: some `aria-label`s exist (mobile search/menu); many delete/close buttons still weak.
- Focus rings often killed without replacement (`focus:outline-none` without ring).
- No skip-to-content link.
- Color-only cues (paid stamp red, payment pills) — add text always.
- Command palette: good keyboard nav; needs `role="listbox"` / option aria when expanded to live search.
- Contrast: `ink-300` on paper for body-ish text fails AA in places — reserve `ink-300` for chrome only; body ≥ `ink-500`, preferably `ink-700`.

### 2.9 Mobile residual issues (post MOBILE_OPTIMIZATION_SPEC)

Many items were fixed (safe areas, bottom bars, 16px inputs, mobile filters, full-row taps). Still open:

| Issue | Notes |
|---|---|
| Tiny type remains | `text-[8px]` / `[9px]` labels on bottom bars and badges |
| Bottom nav vs drawer | Counter staff still opens drawer for every nav hop — consider a **4-tab bottom bar** (Dashboard / New Bill / Customers / Reports) |
| Customer name search | Still phone-driven only |
| Item templates | Every lehenga retyped |
| Haptics | No `navigator.vibrate` on successful bill (optional, Android) |
| Print on phone | Unreliable; prioritize **WhatsApp-ready PDF or image** |

---

## 3. Design system — complete the language

### 3.1 Color strategy (committed, not bland)

**Scene sentence:** Staff under bright shop LEDs, phone or laptop at the counter, 30-second bill cycles; customers may glance at the screen or receive a printed slip. Mood = calm confidence, not neon fintech.

| Role | Token | Usage |
|---|---|---|
| Canvas | `paper` `#faf8f4` | App background |
| Surface | `white` | Cards, sheets |
| Ink | `ink-900` … `ink-100` | Text + borders (warm neutrals only) |
| Accent | `gold-600` / `gold-500` / `gold-100` | ≤10% of pixels; high meaning |
| Success | deep green (new semantic tokens) | Rare — prefer gold stamp for paid |
| Danger | `rose-600` family | Delete / destructive only |
| WhatsApp | brand green `#25D366` | Share only |

Add to `@theme` if missing:

```css
--color-success-600: /* deep green for rare success text */
--color-danger-600: #e11d48;
--color-ink-400: /* mid step for secondary UI */
--color-ink-600: /* mid step for hover text */
--shadow-card: 0 1px 3px rgba(26,24,20,0.02), 0 8px 24px -12px rgba(26,24,20,0.05);
--shadow-float: 0 20px 50px rgba(26,24,20,0.15);
--radius-card: 1rem; /* 16px */
--radius-control: 0.75rem; /* 12px */
--z-dropdown: 40;
--z-sticky: 30;
--z-modal: 50;
--z-toast: 60;
```

**Ban list (keep UI distinctive)**
- No glassmorphism wallpaper
- No gradient text
- No left rainbow side-stripe cards
- No identical 4-icon feature grids as marketing filler
- No cream-on-cream low contrast body copy
- No 32px+ card radius

### 3.2 Typography scale (fix hierarchy)

| Role | Font | Size / weight | Use |
|---|---|---|---|
| Display | Real serif (Cormorant Garamond 600–700) | 28–36 / 24 mobile | Page titles, receipt brand, grand total |
| Title | Plus Jakarta or Inter 650 | 18–20 | Card titles |
| Body | Inter 400–500 | 14–16 | Forms, tables |
| Label | Inter 600 | 11–12, tracking slight | Field labels (not 8px) |
| Mono | JetBrains Mono 500 | 12–14 | Order IDs, phones, money |
| Micro | Inter 500 | **≥11** | Meta only |

Rules:
- `text-wrap: balance` on `h1–h3`.
- Money always `tabular-nums` + mono.
- Line length on prose (terms) ≤ 65ch.

### 3.3 Spacing rhythm
- Page vertical: `space-y-6 md:space-y-8`
- Card padding: `p-5 md:p-6` (one standard)
- Section gaps inside cards: `gap-4` / `space-y-4`
- Touch targets: **44×44** minimum (already mostly done — protect it)

### 3.4 Motion language
- Duration: 150–220ms UI; 300–400ms page enter
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out expo-ish)
- Prefer transform/opacity; avoid layout thrash
- `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }` with sensible overrides
- Optional dep: **motion** (framer-motion) only if chart draw + modal + count-up justify it

---

## 4. Page-by-page “crazy good” brief

### 4.1 App shell (`layout.tsx` + `Sidebar.tsx` + `CommandPalette.tsx`)

**Do**
1. Active nav: gold left rail (2–3px) + soft `gold-100` fill + ink text (or keep dark pill but add gold top hairline on brand).
2. Persist `collapsed` in `localStorage`.
3. Add **skip to main content** link.
4. Main landmark: `<main id="main" tabIndex={-1}>`.
5. Mobile: evaluate **bottom tab bar** for top 4 destinations; keep drawer for Settings + secondary.
6. Command palette v2 data sources:
   - Static actions (New Bill, Settings…)
   - Live customers (`/api/customers?query=`)
   - Live invoices (`/api/invoices?search=`)
   - Grouped results with keyboard selection
7. Toast provider at layout root.
8. Optional: soft page transition wrapper (opacity only).

### 4.2 Dashboard (`/`)

**Keep:** greeting, KPI grid, trend chart, filters, dual list.

**Upgrade**
| Area | Spec |
|---|---|
| KPI cards | Use `StatCard`; add **period context** (“This month vs last”) with delta % in gold/rose; optional mini sparkline |
| Filters | Debounce search 250ms; date **presets chips** (Today / 7d / Month / Custom) matching Reports language |
| Desktop table | Entire row is clickable `Link`; keep secondary “open in new” if needed; sticky header |
| Empty state | Already good — personalize copy for filtered-empty vs true-empty |
| Chart | Hover tooltip (one month at a time); draw animation once; gold accent on latest point |
| Density | Add quick strip: **Today’s bills count + today’s revenue** (counter staff gold question) |
| Pagination | Client slice 20 + “Load more” once list > 40 |

### 4.3 Create Bill (`InvoiceForm`) — the daily ritual

This page should feel like a **cash register for couture**.

| Area | Spec |
|---|---|
| Validation | Inline errors under fields; toast on hard failures; never `alert` |
| Customer | Search phone **and** name; “New client” chip when no match; show LTV if returning |
| Categories | Wire real category + HSN map (or remove category UI until real). Suggested map: Women’s Wear → 6204, Men’s → 6203, Kids → 6209, Rental → SAC as configured |
| Item UX | Template chips (“Bridal Lehenga”, “Blouse Stitching”, “Men’s Suit”) that fill description + default rate |
| Discount | Live preview already good — clamp discount ≤ subtotal with inline warning |
| Summary | Gold underline grand total; show GST explainer tooltip; sticky on desktop |
| Submit | Loading state on Button; success toast “Receipt ready”; optional brief checkmark animation; then navigate |
| Draft safety | `beforeunload` or localStorage autosave of form JSON (key `bill-draft`) — huge trust win |
| A11y | Fieldset groups; error `aria-describedby`; focus first invalid field on submit |

### 4.4 Receipt (`/invoices/[id]`) — the showpiece

**Screen chrome**
- Desktop action cluster: Back · Delete · WhatsApp · Print · (later) Download PDF
- Mobile bottom bar: keep 3-up; ensure safe-area
- Toast on delete failure; ConfirmDialog already pattern-started — extract to kit

**Printable card (couture checklist)**
- [ ] Gold hairline double-frame (print-safe `#7a5e1f`)
- [ ] Real serif wordmark + tagline
- [ ] Mono GSTIN / invoice ID, never overflow (`break-all` + sensible size)
- [ ] Billed-to card
- [ ] Line items: always print-visible table (media query forces table on print even from mobile layout)
- [ ] HSN shown per line (compliance + pro feel)
- [ ] Totals ladder with gold grand total
- [ ] Rotated PAID stamp in gold/burgundy ink (print double border already good)
- [ ] Terms justified, 10–11pt print
- [ ] Signature row print-only
- [ ] Footer thank-you + website + thin gold rule
- [ ] No decorative overflow clipping on A4

**WhatsApp v2 message template**
```
Hi {name},
Thank you for choosing Gauram Designer Studio 🌸

Invoice *#{orderId}*
Date: {date}
Items:
• {desc} × {qty} — ₹{amount}
…
Subtotal … CGST … SGST …
*Grand Total: ₹{total}*
Paid via {mode}

{address one-liner}
GSTIN: {gstin}
```

### 4.5 Customers list & profile

**List**
- Use shared `Avatar` + `Money` + full-row link (already close)
- EmptyState from kit (currently partial)
- Debounced search
- Sort chips: Recent · Highest LTV · Name
- Quick actions on hover/focus: Call (`tel:`), WhatsApp, New Bill (`/invoices/new?phone=`)

**Profile**
- Hero: avatar, name (serif), phone, address, LTV, order count
- Primary gold/ink CTA: **New Bill for this client**
- Secondary: Call / WhatsApp
- Tabs or clear sections: Orders · Notes (payments later)
- Orders: mobile cards already pattern elsewhere — reuse
- Notes: autosave or clear success toast (no `alert`)

### 4.6 Reports

**Keep:** presets, GST card, CSV, category bars, hybrid ledger.

**Upgrade**
- Dynamic FY preset (don’t hardcode only `fy2026` forever — compute Indian FY from “today”)
- Top 5 customers leaderboard
- Payment mode breakdown (UPI vs Cash pie or bars)
- Month-over-month sparkline
- Empty filtered state with `EmptyState`
- Export toast + disabled state when empty (no `alert`)
- Consider server endpoint `GET /api/reports?range=` to stop shipping entire invoice arrays for aggregates

### 4.7 Settings

- Section cards via `Card` kit
- GSTIN format validation (15-char pattern) inline
- Logo upload → preview on mini receipt
- Live mini receipt preview beside terms
- Danger zone: ConfirmDialog (not `confirm()`)
- Success: toast + brief check on Save button (already has success flash — unify)
- Export JSON: loading state + toast

---

## 5. Cross-cutting engineering plan

### 5.1 Shared utilities (day-one cleanup)

Create:

```
src/lib/format.ts     // fmtINR, fmtINRExact, fmtDateIN, fmtPhone
src/lib/cn.ts         // simple classnames merge (or clsx)
src/lib/types.ts      // shared Invoice, Customer, BusinessSettings types
src/lib/gst.ts        // taxable, cgst, sgst helpers (single source of 0.06)
src/lib/categories.ts // category → HSN map
```

Delete local `fmt` copies from pages.

### 5.2 Kill invalid classes

Repo-wide grep for:
`ink-550|ink-950|ink-955|ink-705|rose-205|pl-0!|print-only:hidden`

Replace with real tokens / standard `print:` variants in `globals.css`.

### 5.3 Toasts

Add **sonner** (tiny) or a 40-line custom toast:
- `toast.success('Bill generated')`
- `toast.error('…')`
- Mount in `layout.tsx`

### 5.4 Forms (optional but recommended for InvoiceForm)

If validation grows: `react-hook-form` + `zod`.
If not: a `useBillForm` hook with explicit error map is enough — avoid half-migrating.

### 5.5 Route-level UX files

```
src/app/loading.tsx
src/app/error.tsx
src/app/not-found.tsx
src/app/invoices/[id]/loading.tsx
```

Branded paper/ink skeletons and a calm error card with “Back to dashboard”.

### 5.6 Server Components migration order (perf)

1. `settings` read path (mostly static)
2. `customers/[id]` initial data
3. `invoices/[id]` initial data
4. Dashboard list (search can stay client with URL params)

Keep mutations client-side.

### 5.7 Accessibility checklist (gate before “done”)

- [ ] Keyboard only: open bill, complete form, print path, delete cancel/confirm
- [ ] Focus visible rings (`focus-visible:ring-2 focus-visible:ring-gold-600/40`)
- [ ] All icon buttons labeled
- [ ] Modals trap focus + restore
- [ ] Contrast AA on body text
- [ ] `prefers-reduced-motion` honored
- [ ] Landmarks: header / nav / main

### 5.8 Performance budgets

| Metric | Target |
|---|---|
| Lighthouse Performance (desktop dashboard) | ≥ 90 |
| LCP | < 2.0s warm cache |
| Bundle | Avoid chart libs unless necessary; keep lucide tree-shake imports |
| Interaction | Search debounce; memo chart; don’t refetch business settings on every page if cached |

---

## 6. Priority roadmap (wow per effort)

### Phase 0 — Stabilization (0.5–1 day) — **do first**
1. Shared `format.ts` + remove duplicate `fmt`
2. Fix invalid Tailwind classes
3. Toast system + purge all `alert`/`confirm`
4. Wire `Button` / `Card` / `EmptyState` consistently
5. Focus rings + modal focus trap on existing overlays

### Phase 1 — Brand completion (1–2 days)
1. Real display serif + gold usage pass (totals, CTAs, nav, receipt frame)
2. Type scale cleanup (kill 8–9px UI text)
3. `PageHeader`, `StatCard`, `Badge`, `Avatar`, `Field` kit
4. Receipt print media fixes (always-printable table)

### Phase 2 — Ritual excellence (2–3 days)
1. InvoiceForm: inline validation, templates, category→HSN truth, draft autosave
2. Command palette live search
3. Dashboard presets + row-click + today strip
4. WhatsApp message v2
5. Customer quick actions + New Bill deep link

### Phase 3 — Delight & depth (2–4 days)
1. Motion: modal, count-up KPIs, chart draw (with reduced-motion)
2. Reports leaderboard + payment mix + dynamic FY
3. Settings logo + mini preview
4. Route `loading`/`error`/`not-found`
5. Optional PDF download (`@react-pdf/renderer` or print-to-PDF guide UX)

### Phase 4 — Architecture (as needed)
1. RSC data pages
2. `/api/reports` aggregates
3. Auth before public deploy (security is product quality)
4. Pagination / virtualize lists

---

## 7. Implementation recipes (concrete)

### 7.1 Gold grand total pattern

```tsx
<div className="flex justify-between items-end border-t border-ink-100 pt-3">
  <span className="font-serif text-base font-semibold text-ink-900">Grand Total</span>
  <span className="font-mono text-2xl font-bold tabular-nums text-ink-900 border-b-2 border-gold-600 pb-0.5">
    {fmtExact(total)}
  </span>
</div>
```

### 7.2 Primary CTA pattern

Prefer **ink for density, gold for the money moment**:

- Navigation / secondary: ink or outline  
- **Generate Bill / Create Bill / Save money actions:** `variant="gold"`  
- Destructive: danger outline  

### 7.3 Modal contract (every overlay)

```
- role="dialog" aria-modal="true" aria-labelledby=…
- focus first focusable on open
- Escape closes
- click backdrop closes (unless destructive mid-flight)
- restore focus to opener
- z-index from token scale
- no-print class
```

### 7.4 List dual-layout pattern (standardize)

```
Desktop: table in Card, sticky thead, hover row, full-row link
Mobile:  divided full-width rows, 44px min height, chevron, active:bg-gold-100/10
Empty:   EmptyState
Loading: 3–5 Skeleton rows matching density
```

### 7.5 Search debounce

```ts
// useDebouncedValue(search, 250) → effect depends on debounced value only
```

### 7.6 Category → HSN (stop lying to the database)

```ts
export const CATEGORY_HSN = {
  "Women's Wear": "HSN 6204",
  "Men's Wear": "HSN 6203",
  "Kids Wear": "HSN 6209",
  "Rental": "HSN 9988", // confirm with accountant; placeholder until verified
} as const
```

Do **not** hardcode Women’s Wear on submit while UI offers other categories.

---

## 8. Copy & micro-UX voice

Boutique, not ERP.

| Avoid | Prefer |
|---|---|
| “No boutique invoices found” (when filters active) | “No bills in this date range” |
| “Generating…” | “Creating receipt…” |
| “Error occurred.” | “Couldn’t save — check connection and try again.” |
| “Register New Client” | “Add client” (shorter, calmer) |
| Alert spam | Inline + toast |

Tone: warm, concise, confident. One sparkle max per primary CTA — don’t emoji-clutter the chrome.

---

## 9. Acceptance criteria — “crazy good” definition of done

### Visual & system
- [ ] Real display serif on page titles + receipt brand
- [ ] Gold used on grand totals, at least one primary money CTA, receipt frame/stamp, active nav cue
- [ ] No invalid Tailwind color utilities remain
- [ ] Shared shadow/radius tokens; no one-off mega-shadows
- [ ] No UI text smaller than 11px on mobile (except pure decorative print flourishes)

### Components & consistency
- [ ] Buttons, fields, cards, badges, empty, skeleton, modal, toast come from kit
- [ ] Single `fmt` / date / phone helpers
- [ ] Dual list pattern reused on Dashboard, Customers, Reports, Customer orders

### Interaction
- [ ] Zero `alert()` / `confirm()` in `src/`
- [ ] All destructive flows use ConfirmDialog
- [ ] Invoice form validates inline; focuses first error
- [ ] Search debounced
- [ ] Command palette finds customers + invoices + actions

### Receipt
- [ ] Print from desktop and mobile yields complete line items + totals
- [ ] Gold frame + stamp + signature + thank-you footer
- [ ] WhatsApp includes items + total + GSTIN

### A11y & quality
- [ ] Keyboard paths verified for bill + delete + palette
- [ ] Focus visible; modals trap focus
- [ ] `prefers-reduced-motion` safe
- [ ] `npm run lint` + `npm run build` clean
- [ ] Lighthouse perf ≥ 90 on dashboard (desktop)

### Product truth
- [ ] Categories submitted match UI selection (or UI simplified to match reality)
- [ ] Existing paid-on-create + GST math preserved unless product says otherwise

---

## 10. Suggested file touch list (implementation order)

| Order | Path | Work |
|---|---|---|
| 1 | `src/lib/format.ts` (new) | Shared money/date |
| 2 | `src/lib/cn.ts` (new) | class merge |
| 3 | `src/components/ui/*` | Expand kit; split Kit.tsx if large |
| 4 | `src/components/ui/Toast.tsx` + layout | Global feedback |
| 5 | `src/app/globals.css` | Tokens, reduced-motion, focus, print fixes |
| 6 | `src/app/layout.tsx` | Fonts (real serif), toast, skip link |
| 7 | `src/components/Sidebar.tsx` | Gold active, persist collapse, bottom tabs? |
| 8 | `src/components/CommandPalette.tsx` | Live search |
| 9 | `src/components/InvoiceForm.tsx` | Ritual polish |
| 10 | `src/app/invoices/[id]/page.tsx` | Couture receipt |
| 11 | `src/app/page.tsx` | Dashboard density |
| 12 | `src/app/customers/*` | Quick actions, kit |
| 13 | `src/app/reports/page.tsx` | Leaderboard, FY, toasts |
| 14 | `src/app/settings/page.tsx` | Preview, confirm, validation |
| 15 | `src/app/loading.tsx` etc. | Route UX |

---

## 11. What “crazy good” is *not*

- Not multi-tenant SaaS chrome, dark-mode fintech, or dashboard clutter for investors.
- Not adding charts for chart’s sake.
- Not restyling without fixing alerts, invalid classes, and receipt print truth.
- Not reintroducing partial payments / draft workflows without product approval.
- Not a dependency buffet — every library must earn its KB.

---

## 12. Closing product picture

When this plan is executed, a day in the studio looks like:

1. Staff opens the app → **greeting + today’s revenue** at a glance.  
2. Hits **Create Bill** (or `⌘K` → client name).  
3. Types phone → returning client badge + address autofill.  
4. Taps a **template** for “Bridal Lehenga”, adjusts rate, optional discount.  
5. Chooses **UPI**, taps gold **Generate** → toast → couture receipt.  
6. **Print** for the bag, **WhatsApp** for the phone, done in under a minute.  
7. At close, **Reports → This Month → Export** for the accountant.

That’s the bar: **fast, beautiful, trustworthy, unmistakably Gauram.**

---

*End of FRONTEND_EXCELLENCE.md — audit-backed implementation plan for elevating the Gauram Designer Studio frontend.*
