# Gauram Designer Studio — "Million Dollar" Billing System Specification

> A complete blueprint for elevating the existing boutique billing app into a premium, polished, production-grade SaaS-quality product. Feed this entire document to an AI coding agent (or dev team) to rebuild/redesign the system end-to-end.

---

## 1. Product Context & Goal

**Gauram Designer Studio** is a boutique fashion house in Devanahalli, Bengaluru (GSTIN `29GYCPP4290P1ZG`) offering:
- Custom stitching (bridal lehengas, men's suits)
- Ready-made designer wear (Men's / Women's / Kids)
- Rental outfits (with refundable deposit terms)

The system is an **internal billing & invoicing tool** used at the studio counter to generate GST-compliant printable receipts instantly. The current state is functional but visually flat, monochrome (pure gray-900 on white), and lacks the "boutique luxury" feel a designer studio deserves. The goal: make it feel like a **million-dollar boutique SaaS** — confident typography, refined color palette, micro-interactions, delightful empty states, and a flawless print/PDF output that customers keep as a keepsake.

### Design North Star
- **Boutique luxury, not corporate sterile.** Warm neutrals + one precious-metal accent (antique gold) + deep charcoal ink.
- **Calm, generous spacing.** Whitespace is a feature.
- **Typography-led.** A refined serif (display) paired with a clean sans (UI) and a precise mono (numerals/IDs).
- **Every state designed.** Loading skeletons, empty states, success moments, error states.
- **Print is the product.** The receipt is the artifact the customer takes home — it must look exquisite on paper.

---

## 2. Current Tech Stack (do not change without reason)

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"` + `@theme`) |
| Icons | lucide-react |
| Fonts | `Inter` (sans) + `Cinzel` (serif display) via `next/font/google` |
| Database | PostgreSQL on Neon (Prisma ORM, `@prisma/client` v5) |
| Runtime | Node, deployed on Vercel (implied) |
| PDF | Browser `window.print()` with `@media print` CSS (no PDF lib yet) |

**Not installed (candidates to add):** Recharts/visx (charts), `@radix-ui` primitives (dialogs/menus), `react-hook-form` + `zod` (form/validation), `sonner` or `toast` (notifications), `framer-motion` (animation), `@react-pdf/renderer` or `playwright` (true PDF), `next-auth` (auth). Add only as needed; prefer minimal dependencies.

---

## 3. Current Page & Route Map

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Dashboard: 2 stat cards + invoice list w/ search + date filters |
| `/invoices/new` | `src/app/invoices/new/page.tsx` → `InvoiceForm` | Create bill (instant finalization, paid-on-creation model) |
| `/invoices/[id]` | `src/app/invoices/[id]/page.tsx` | Printable receipt; Delete / WhatsApp share / Print buttons |
| `/invoices/[id]/edit` | `src/app/invoices/[id]/edit/page.tsx` | Edit invoice (reuses `InvoiceForm`) |
| `/customers` | `src/app/customers/page.tsx` | Customer ledger list w/ search |
| `/customers/[id]` | `src/app/customers/[id]/page.tsx` | Customer profile + order history |
| `/reports` | `src/app/reports/page.tsx` | Revenue cards + category breakdown + payment ledger |
| `/settings` | `src/app/settings/page.tsx` | Business profile, GSTIN, invoice sequence, T&C |
| API | `src/app/api/{business,customers,invoices,payments}/route.ts` | REST CRUD |

Shared: `src/components/Sidebar.tsx` (collapsible desktop + mobile drawer), `src/lib/prisma.ts` (Prisma client singleton).

---

## 4. Data Model (Prisma) — current entities

```prisma
BusinessSettings   // singleton, id="default"
  name, address, phone, email, website, gstin,
  termsAndConds, invoicePrefix, nextInvoiceNum, logoUrl?

Customer
  id (uuid), name, phone (unique), address?, timestamps
  invoices Invoice[]

Invoice
  id, orderId? (unique, e.g. "GDS/2026/0001"), customerId,
  invoiceDate, status (draft|pending|partial|paid),
  subtotal, cgstAmount, sgstAmount, totalAmount,
  amountPaid, pendingAmount, paymentMode, termsText, timestamps
  items InvoiceItem[], payments Payment[]

InvoiceItem
  id, invoiceId (cascade), description, category,
  hsnSacCode, quantity, rate, discount, amount

Payment
  id, invoiceId (cascade), amount, mode, date, note?
```

> Note: current code hardcodes `category="Women's Wear"`, `hsnSacCode="HSN 6204"`, `gstRate=12`, `discount=0` per item, and a single `overallDiscount` + `amountPaid=totalAmount` (paid-on-creation) model. This is intentional simplification — preserve unless the user requests installments.

---

## 5. Proposed Design System (THE upgrade)

### 5.1 Color tokens (define in `globals.css` `@theme`)

```
/* Ink / neutrals — warm, not pure gray */
--ink-900: #1a1814   /* primary text, near-black with warmth */
--ink-700: #3d3730
--ink-500: #6b6359
--ink-300: #b5ada1
--ink-100: #ece7df
--paper:   #faf8f4   /* app background, soft ivory */
--card:    #ffffff

/* Brand precious-metal accent */
--gold-600: #b08d3f   /* primary accent */
--gold-500: #c9a961   /* hover / highlights */
--gold-100: #f3ead2   /* tint backgrounds */

/* Semantic */
--emerald-600 / --rose-600 / --amber-600  (paid / due / partial)
```
Replace the current all-gray palette (`bg-gray-900` etc.) with the warm ink scale. Use `--gold-600` sparingly: primary CTAs, active nav indicator, invoice grand-total underline, print filigree.

### 5.2 Typography scale

| Role | Font | Weight | Example use |
|---|---|---|---|
| Display | **Cinzel** (serif) | 600–700 | "Dashboard", invoice brand name, receipts |
| UI | **Inter** | 400/500/600 | body, labels, buttons |
| Numerals/IDs | **JetBrains Mono** or `ui-monospace` | 500 | order IDs, amounts, GSTIN |

Add a subtle tracking tweak: uppercase labels → `tracking-wider`, display headings → `tracking-tight`. Numerals should use `tabular-nums` so columns of ₹ amounts align in tables.

### 5.3 Spacing, radius, shadow
- Card radius: `rounded-2xl` (16px). Inputs: `rounded-lg` (8px). Pills: `rounded-full`.
- Shadow: replace default with a soft layered one: `shadow-[0_1px_2px_rgba(26,24,20,0.04),0_8px_24px_-12px_rgba(26,24,20,0.08)]`.
- Borders: `border-ink-100`. Hover borders: `border-ink-300`.
- Generous padding on cards (`p-6` / `p-8`), section gaps `space-y-8`.

### 5.4 Components to standardize (build a `src/components/ui/` kit)
- `Button` (variants: primary=ink, gold, outline, ghost, danger; sizes sm/md)
- `Card`, `CardHeader`, `CardContent`
- `StatCard` (label, value, delta, sparkline slot, icon)
- `Input`, `Select`, `Textarea`, `Field` (label+error wrapper)
- `Badge` (status pills: paid/partial/draft with matched color)
- `Table` primitives (`Table`, `THead`, `TR`, `TD`) with sticky header + hover row
- `EmptyState` (icon, headline, copy, CTA) — every list has one
- `Skeleton` (shimmer) — every fetch has one
- `Modal`/`Dialog` (Radix-based) for confirm-delete, add-payment
- `Toast` (sonner) for save/delete/WhatsApp success
- `Tabs` for invoice view (Receipt / Payments / Audit)
- `CommandPalette` (⌘K) — search invoices/customers/create-bill (premium touch)

---

## 6. Page-by-Page Redesign Spec

### 6.1 App Shell / Sidebar
- Width 240px expanded / 64px collapsed (current 220/60 — bump up).
- Brand block: gold 1px ring around logo, Cinzel wordmark. Active link: **gold left-rail** (3px bar) + ink-ink text, not a filled black pill.
- Add a subtle top "studio status" footer: today's date, environment, signed-in stylist name (hardcode for now, "Gauram Studio — Counter").
- Mobile: keep drawer but add slide animation; backdrop blur `backdrop-blur-sm`.
- Add a global **⌘K command palette** trigger in the sidebar footer.

### 6.2 Dashboard (`/`)
Currently: 2 stat cards + one big invoice table. Upgrade:
- **Hero greeting row**: "Good afternoon, Gauram Studio" + today's date in Cinzel + a single primary "New Bill" button on the right.
- **4 stat cards** (not 2): Total Revenue, Invoices Issued, This Month, Avg. Bill Value. Each with a 30-day sparkline and % delta vs last month.
- **Charts row**: a 12-month revenue area chart (Recharts) + a donut of category sales (reuse the existing `catSales` aggregate). No chart lib? Render with inline SVG as a first pass; add Recharts when approved.
- **Recent invoices** table: as now but with improved row hover, status badges with color, tabular-nums amounts, and a right-aligned "View" ghost link. Add pagination (10/page) if list grows.
- **Invoice list filters** already exist (search + date range) — promote into a refined filter bar with chips and a "Reset" ghost button. Add a category dropdown filter (data already supported in API).

### 6.3 Create Bill (`/invoices/new`)
Best page to make feel premium — it's the daily ritual.
- Two-column layout (keep): left = customer + line items; right = bill settings + summary (sticky).
- **Customer card**: phone-first entry with live suggestions dropdown (already exists). Polish: avatar circle with initials, "Returning client" gold badge if `customerId` resolved.
- **Line items**: each item card has a left gold index number (#1) instead of gray chip. Add a draggable reorder handle (optional). Show live line total with tabular-nums.
- **Summary panel** (sticky on lg): "Payment Summary" with a hairline divider above Grand Total, Cinzel "Grand Total" label, large gold-underlined ₹ amount. Add a live tax breakdown tooltip on hover over CGST/SGST.
- **Payment mode**: replace plain `<select>` with segmented button group (UPI / Cash / Card / Bank Transfer) with icons.
- **Submit**: primary gold button "Generate & Print Invoice" with a sparkle icon and a brief shimmer on success; on success show a celebratory toast and redirect to the receipt.

### 6.4 Invoice / Receipt (`/invoices/[id]`) — THE SHOWPIECE
This must look like a couture invoice, not a CRUD detail page.
**On-screen** (no-print header): Back, Edit, Delete (confirm modal), WhatsApp (green), Print (primary). Add **Download PDF** using `@react-pdf/renderer` or a server route (preferred) — current `window.print()` is fine as fallback.
**Printable card**:
- Replace the generic corner borders with a refined **gold hairline frame** + a faint monogram watermark behind the header (logo at ~6% opacity, centered).
- **Letterhead**: Cinzel wordmark, tagline "Designing Dreams, Creating Elegance", full address block, phone, email, website, GSTIN in mono.
- **Invoice meta** (right): Invoice ID (mono, bold), Date, Payment Mode, Order status badge.
- **Billed To**: encapsulated card with customer name (serif), phone, address.
- **Line items table**: header row in ink-900 with gold-500 bottom border; zebra rows; right-aligned tabular amounts; show HSN/SAC code per line; show category as a tiny gold pill.
- **Totals**: Subtotal → Discount (rose) → Taxable → CGST 6% → SGST 6% → **Grand Total** in Cinzel, large, gold underline.
- **Paid stamp**: replace the green "Paid in Full" pill with an actual rotated rubber-stamp style SVG badge (gold ink, "PAID" + date), visible in print.
- **Terms**: justified small text in ink-500.
- **Signature row** (print-only): "Customer Signature" | "For Gauram Designer Studio — Authorized Signatory".
- **Footer**: a thin gold rule + "Thank you for choosing Gauram Designer Studio 🌸" + website.
- **@media print**: A5 portrait or A4 with 12mm margins, all grays → pure `#000`/`#000` shades, gold → a printable gold (`#7a5e1f` to ensure it prints on B/W). Hide all `.no-print`. Scale to fit width.

### 6.5 Customers list (`/customers`)
- Header: "Customers" + count chip + "Add Customer" button (currently customers auto-create only — add manual creation).
- Stat strip: total clients, repeat clients, top spender.
- Table: avatar (initials in gold circle), name, phone (mono), orders, total billed, last order date, "View" link.
- Empty state: elegant illustration + "Your first client appears here after the first bill."

### 6.6 Customer profile (`/customers/[id]`)
- Hero card: large initial avatar, name (serif), phone, address, **LTV** (total billed), orders count, "New Bill for this Customer" gold button.
- Tabs: **Orders** (current table) | **Payments** (timeline) | **Notes** (new — internal stylist notes).
- Orders table needs a status badge + amount + view link; expandable row to show line items (premium touch).

### 6.7 Reports (`/reports`)
The page already has good content (3 revenue cards, category bars, payment ledger). Polish:
- Add a **date-range picker** at the top (range presets: This Month / Quarter / FY / All Time) controlling all aggregates.
- Replace the broken `bg-gradient-to-r from-maroon-800 to-gold-500` utility (these colors don't exist) with real tokens `from-gold-600 to-gold-500`.
- Revenue cards: add sparklines; "Pending Collections" card should only show if there are actual dues (currently always shown — make conditional).
- Add a **monthly trending bar chart** (revenue per month) and a **top customers** leaderboard.
- Payment ledger: virtualize if grows; add export to CSV button.
- Add **GST summary** card (total CGST + SGST collected in range) — critical for Indian SME filing.

### 6.8 Settings (`/settings`)
- Section cards already good. Add **logo upload** (current `logoUrl` field is unused) — accept image, store in `public/` or an object store, preview in letterhead.
- Add **invoice template preview** (mini live receipt preview) next to T&C editor.
- Add **danger zone**: "Reset invoice sequence" with confirmation, and an **Export all data** button (JSON dump).
- Save success: replace inline text with a toast (sonner).

---

## 7. Cross-cutting Engineering Improvements

1. **Forms & validation**: introduce `react-hook-form` + `zod`. Replace `alert()` calls everywhere with toasts + inline errors.
2. **Data fetching**: move from hand-rolled `useEffect+fetch` to SWR or React Query (caching, revalidation, optimistic UI). Reduces refetch storms on dashboard.
3. **Loading states**: every page must render `<Skeleton>` matching layout (not "Loading…"). Add Suspense streaming where possible.
4. **Error boundaries**: wrap each route in an error boundary with a branded fallback.
5. **Server components**: most pages are `'use client'` purely for fetch. Convert to Server Components fetching Prisma directly; keep small client islands for interactivity. This is the #1 perf win.
6. **Types**: generate a shared `src/lib/types.ts` mirroring Prisma models (currently interfaces inline in each page — duplicated & drift-prone).
7. **API**: return consistent envelope `{ data } | { error }`; add `GET /api/reports?range=...` so the dashboard/reports aren't refetching all invoices and aggregating client-side.
8. **Currency/number**: hoist the duplicated `fmt`/`formatCurrency` helpers into `src/lib/format.ts` (3+ copies exist today). Make GST % configurable via settings, not hardcoded `0.06`.
9. **Security — IMPORTANT**: `.env` with the live Neon DB URL is committed-capable and was readable. Move secrets out of git, rotate the Neon password, add `.env*` to `.gitignore` (verify present), and never log it. Add basic auth (NextAuth credentials or a single shared staff password) before public deployment — currently anyone with the URL can create/delete invoices.
10. **Accessibility**: keyboard nav for the command palette & menus, focus rings, `aria-label`s on icon buttons (some exist, audit the rest), color contrast AA on all ink/paper combos.
11. **Performance**: `lucide-react` is imported as individual icons — good. Ensure `Image` from next is used for logo (it is). Add `loading="lazy"` semantics via RSC.
12. **Observability**: log errors server-side (not just `console.error`); add a simple `error` table or Sentry.

---

## 8. Feature Roadmap (ordered by "wow per effort")

**Tier 1 — Polish (highest ROI, do first)**
1. Apply the warm ink + gold design system across all pages.
2. Standardize the UI component kit (`src/components/ui/`).
3. Redesign the printable receipt + true PDF download.
4. Skeletons, empty states, toasts everywhere.

**Tier 2 — Delight**
5. ⌘K command palette (jump to customer, bill, or "new bill").
6. Customer profile LTV hero + tabs.
7. Reports date-range + GST summary + charts.
8. WhatsApp share: send the actual PDF/inline receipt image (currently only a text summary).

**Tier 3 — Growth**
9. Auth + multi-user staff (who created which bill).
10. Installments / partial payments UI (schema supports it; UI was stripped down).
11. Appointments / fitting-date tracking & SMS/WhatsApp reminders.
12. Inventory for rental garments (deposit tracking, due-date returns).
13. GSTR-1 / sales-register CSV export for the accountant.

---

## 9. Acceptance Criteria ("done when")

- [ ] No `bg-gray-900` / pure-neutral defaults remain; everything uses ink/gold tokens.
- [ ] No `alert()` or `confirm()` remain — all confirmations via modals, all notices via toasts.
- [ ] Every list view has a designed empty state and a skeleton loading state.
- [ ] The printed receipt, when printed to PDF, looks like a couture invoice (gold frame, monogram, stamp, signature line, thank-you footer) and is B/W-printer safe.
- [ ] Number columns use `tabular-nums`; ₹ formatting via one shared helper.
- [ ] `.env` secret rotated and not in git; `.gitignore` confirmed; README documents setup.
- [ ] Basic auth gates every mutating route.
- [ ] Lighthouse perf ≥ 90 on dashboard; LCP < 2s on a cold cache.
- [ ] `npm run lint` and `npm run build` pass clean; TypeScript strict, no `any` in new code.
- [ ] All previously functional flows still work: create bill → auto-finalize paid → print → WhatsApp share text; customer auto-create; sequential invoice numbering; GST calc.

---

## 10. Out of Scope (explicit non-goals, preserve current behavior)

- Multi-tenant/multi-store support (single studio only).
- Item-level discounts or per-line GST rate (kept flat GST 12% + single overall discount).
- Draft-style quotes (every bill is finalized + paid on creation).
- Status/dues/partial-payment workflows in the UI were intentionally removed in prior commits — do not reintroduce without approval.

---

### Quick reference — current files to touch first
1. `src/app/globals.css` — define ink/gold theme tokens here.
2. `src/components/Sidebar.tsx` — apply gold active rail, add command palette trigger.
3. `src/app/page.tsx` — dashboard hero + 4 stats + charts.
4. `src/components/InvoiceForm.tsx` — segmented payment-mode + sticky gold summary.
5. `src/app/invoices/[id]/page.tsx` — couture receipt + PDF.
6. `src/lib/format.ts` (new) — shared currency/date/number helpers.
7. `src/components/ui/*` (new) — the kit.

End of specification.