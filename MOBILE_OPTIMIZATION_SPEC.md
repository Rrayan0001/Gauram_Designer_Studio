# Gauram Designer Studio — Mobile Optimization Specification

> A focused, audit-driven spec for making the billing app feel like a premium native-quality experience on phones. Built from a direct review of every page in the repo. Feed this to an AI coding agent (or dev) to execute. Pair with `MILLION_DOLLAR_SPEC.md` for the broader design system.

**Target devices:** iPhone SE (375 pt) up to iPhone 15 Pro Max (430 pt), small Androids (360 dp) up to large Androids (412 dp). Test in Chrome DevTools device mode at 375×667 AND 360×640 minimum, plus a real iPhone Safari.

---

## A. Mobile Audit — Issues Found (current state)

### A1. Critical — UX breakers
1. **No viewport safe-area handling.** No `viewport-fit=cover` meta and no `env(safe-area-inset-*)` padding anywhere. On notched iPhones the sticky mobile header, sidebar drawer bottom, and any future bottom action bar will overlap the notch/home-indicator.
2. **Reports → Recent Billings Ledger** (`src/app/reports/page.tsx:305`) is a desktop table with only `overflow-x-auto` and **no mobile fallback**. Forces awkward horizontal scrolling on phones. Same for the Category share column (no touch fallback beyond bars, which is OK).
3. **Invoice detail line items table** (`src/app/invoices/[id]/page.tsx:223`) is also `overflow-x-auto`-only with no mobile card fallback — customers struggle to read items on a phone when checking the WhatsApp-shared view.
4. **iOS input zoom-on-focus.** `globals.css` sets inputs to `font-size: 14px` (the no-zoom threshold), but most inputs override with `text-xs` (~12px) or `text-[10px]`, **re-triggering iOS auto-zoom** whenever the counter staff taps a field. Annoying on the daily-use page.
5. **`alert()` / `confirm()`** still used in `InvoiceForm` (validation), `invoices/[id]` (delete confirmation), and `customers/[id]` paths — jarring native dialogs, broken on some in-app WebViews, and visually off-brand on mobile.
6. **Generate button buried on mobile.** `InvoiceForm`'s sticky right-column summary (`sticky top-6`) stops meaning anything on phones — it flows in-column, so the primary CTA "Generate & Print Receipt" sinks below ~10+ inputs and several item cards. The single most-tapped action requires a long scroll on mobile.
7. **No fixed bottom action bar.** The invoice detail's Delete / WhatsApp / Print group uses `flex flex-wrap gap-2 w-full` — on a 360dp phone this wraps unpredictably and Print often lands on its own row, half off-screen.
8. **Customer suggestions dropdown** (`InvoiceForm:195`) is `absolute ... max-h-44 overflow-y-auto`. On mobile it floats over the Name/Address inputs below and has no viewport-edge collision guard — long lists push past the keyboard and get clipped.
9. **No `inputMode` / `type` tweaks.** Phone field is `type="text"` (should be `type="tel"` + `inputMode="tel"` for the numeric keypad + dial-pad autocomplete). Qty and Rate are `type="number"` but lack `inputMode="decimal"` causing wrong keyboard on Android. Date inputs lack `inputMode` and on iOS render the wheel — fine, but no `enterKeyHint`.

### A2. High — Polish gaps
10. **Typography too small on mobile.** Many `text-[8px]`, `text-[9px]`, `text-[10px]` usages (dashboard mobile list, reports badges, item card subtotals, invoice line labels). Apple/Google readability min is ~11–13px on phone. Uppercase tracking on 8px is unreadable.
11. **Touch targets under 44×44 pt.** Badges, the sidebar "Collapse" toggle, item delete `p-2` icon buttons, "Reset" ghost button (`px-3 py-2.5` ok-ish but the close-X is `p-1.5`), the date-range "to" label span between two date inputs. Fails Apple HIG / Material tap-target min.
12. **Whole row isn't tappable.** Dashboard and Customers list mobile rows put the action in a separate button — the whole card should be a `<Link>`/`<button>` (users instinctively tap the row, not the "View Receipt" button). Add tap state (`active:bg-paper`) and a chevron affordance.
13. **Monospace numbers overflow.** Long GSTIN (`29GYCPP4290P1ZG`) and order IDs (`GDS/2026/0001`) in `font-mono` on a 360dp screen push off the edge of the receipt card. Need `break-all` or `whitespace-nowrap` + `overflow-hidden` with a smaller mono size on mobile.
14. **Watermark & corner filigrees** on invoice detail: `w-96 h-96` watermark (`opacity-[0.04]`) and `w-24 h-24` corner borders can clip oddly at 375px width and add DOM weight that prints faintly. Constrain with `max-w-full` and `aspect-square`.
15. **No loading/skeleton in reports** — the `loading` spinner block exists but the whole page waits; meanwhile the stat cards render zeros which flash misleadingly. Reports should block/skeleton per section.
16. **Sidebar drawer has no focus trap & no restore-focus.** Opening it and tabbing walks the background. Escape closes (good) but focus is left nowhere. Also swipe-to-close (gesture) would feel native.
17. **Command palette** (`CommandPalette.tsx`) is desktop-only by trigger (⌘K). Mobile users never reach it. Add a visible search affordance in the mobile header (magnifying-glass that opens the palette).
18. **No haptic/scroll-momentum polish.** Lists use `divide-y` but no `-webkit-overflow-scrolling: touch` (older iOS) and no `overscroll-behavior: contain` — list bounce pulls the whole page.

### A3. Medium — Refinement
19. **Filters on dashboard collapse awkwardly.** The date-range "to" group is `flex flex-wrap items-center gap-3` — on 375px the Reset button wraps to its own row, on 360px the two date inputs stack weirdly. Use a disclosed "Filters" sheet on mobile instead.
20. **Settings page** stacks 1-col on mobile (fine) but the two-column "Invoicing sequence" grid (`md:grid-cols-2`) becomes cramped; the `nextInvoiceNum` input shares a row awkwardly. Set both to full width on mobile.
21. **Custom details hero** (`customers/[id]`) — the profile card (`md:col-span-2`) and stats card stack 1-col on mobile, then the orders table scrolls horizontally with no mobile card fallback. Tap the row → expandable, or convert to cards.
22. **No "pull to refresh" or refresh affordance.** Not strictly required, but a manual "Refresh" button in lists would help counter staff who leave the tab open.
23. **WhatsApp share opens raw text** with `window.open` — on mobile, this should ideally open the WhatsApp app deep-link (it does via `wa.me`), but the text loses line breaks in some Android WhatsApp clients. Use `%0A` for newlines explicitly and trim length.
24. **Print on mobile is unreliable.** `window.print()` works on iOS Safari but produces a giant page; the current `@media print` CSS targets A4 fixed widths. On phones the receipt is better shared as a **PDF link + WhatsApp** than printed. Add a "Share PDF" path.
25. **Fixed/sticky elements lack `position: sticky` on the inner scroll context.** The mobile sticky header (`Sidebar.tsx:68` `sticky top-0 z-40`) works, but `main` is `flex-1 overflow-auto` — nested sticky inside non-root scroller can snag on iOS.
26. **Form submit button** has no `enterKeyHint="done"` and no keyboard "Go" handling — counter staff on mobile can't submit from the keyboard.
27. **No autofill/autocomplete.** `customerPhone` should `autoComplete="tel"`, `customerName` `autoComplete="name"`, address `autoComplete="street-address"`. Reduces typing on personal phones.

### A4. Low — Nice to have
- Long-press to copy invoice ID.
- Swipe-left on a list row to reveal Delete (iOS-list feel).
- Bottom tab bar as alternative to drawer nav on mobile (Dashboard / New Bill / Customers / Reports).
- Skeleton screens matching real layouts (current skeleton on dashboard invoice table is just three shimmer bars — cheap).
- Vibration API (`navigator.vibrate(10)`) on successful bill generation.

---

## B. Mobile Design Tokens (add to `globals.css`)

```css
/* viewport — put in layout.tsx Metadata `viewport` export */
/* <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5" /> */

/* Safe-area helpers */
:root {
  --safe-top:    env(safe-area-inset-top,    0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left:   env(safe-area-inset-left,   0px);
  --safe-right:  env(safe-area-inset-right,  0px);
}

.pt-safe { padding-top: calc(var(--safe-top) + 0.5rem); }
.pb-safe { padding-bottom: calc(var(--safe-bottom) + 0.5rem); }
.px-safe { padding-left:  calc(var(--safe-left)  + 1rem); padding-right: calc(var(--safe-right) + 1rem); }

/* Mobile bottom action bar anchor (when used) */
.bar-safe { padding-bottom: calc(var(--safe-bottom) + 8px); }

/* Prevent iOS text size adjust */
html { -webkit-text-size-adjust: 100%; }

/* Momentum scroll & contain bounce */
.scroll-y { -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }

/* Disable tap highlight, enable active state */
button, a, [role="button"] { -webkit-tap-highlight-color: transparent; }

/* Inputs must stay ≥16px on mobile to avoid iOS auto-zoom */
@media (max-width: 767px) {
  input, select, textarea { font-size: 16px; }
  /* counter the text-xs overrides on form inputs specifically */
  .input-mobile-lg { font-size: 16px !important; }
}
```

Add the viewport export in `src/app/layout.tsx`:
```ts
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#1a1814',
}
```

---

## C. Page-by-Page Mobile Fixes

### C1. Layout / Shell (`layout.tsx` + `Sidebar.tsx`)
- Add the `viewport` export above (fixes notch + theme color).
- Apply `.pt-safe` to the mobile sticky header; apply `.pb-safe` to the mobile drawer footer and to `<main>` padding on mobile.
- Mobile header: keep the hamburger; add a center/left magnifier button that opens `CommandPalette` (so ⌘K power is reachable by touch).
- Drawer: add focus trap (Radix `Dialog` or a tiny `useFocusTrap`), restore focus on close, add swipe-right-to-close (gesture lib optional; native `touchstart`/`touchmove` is fine), add `inert` to the rest of the page while open.
- Optional bottom tab bar on phones (`md:hidden`): Dashboard · New Bill · Customers · Reports. Replaces reliance on the drawer for daily navigation.

### C2. Dashboard (`page.tsx`)
- Stat grid is already `grid-cols-2 lg:grid-cols-4` — good. Keep, but bump label `text-[10px]` → `text-xs` on mobile and ensure the value (₹ amounts) wraps gracefully (`tabular-nums` already, add `break-words`).
- **Filters**: collapse the date-range + search into a "Filters" disclosure on mobile (one toggle, expands a sheet). Keep search visible; hide date-range behind the toggle.
- **Invoice list row → make whole card a `<Link>`**, drop the secondary "View Receipt" button, add a trailing chevron and `active:bg-paper` tap state.
- Bump every `text-[8px]`/`text-[9px]` uppercase label → minimum `text-[10px]` on mobile (or `text-[11px]`).
- Empty state mobile: same elegant `EmptyState` from the kit, not the tiny inline text.

### C3. Create Bill (`InvoiceForm.tsx`) — the daily-use mobile page
- **Layout**: on phones, render single-column with a **fixed bottom action bar** holding the live "Grand Total ₹X" on the left and a sticky gold "Generate" button on the right (full-width primary on <380px). Move the current in-card Generate button out — the bottom bar becomes the CTA.
- **Inputs**: every input → `font-size: 16px` on mobile (add `input-mobile-lg` class or rely on the media query) to kill iOS zoom. Add `type="tel" inputMode="tel" autoComplete="tel"` on phone; `inputMode="numeric"` on Qty; `inputMode="decimal"` on Rate/Discount; `autoComplete="name"` / `"street-address"` on the others. Add `enterKeyHint="next"` / `"done"`.
- **Customer suggestions dropdown**: render as a bottom-sheet on mobile (`fixed inset-x-0 bottom-0` modal) instead of absolute dropdown — survives the keyboard, full-width rows, big tap targets.
- **Line item card**: the 12-col grid already collapses to 1-col on `md:` — double-check on 375px that Description / Qty / Rate stack in that order and the Rate ₹ prefix stays aligned. Bump label `text-[9px]` → `text-[10px]`. Item delete trash → 44×44 hit area (`p-2` → `min-w-[44px] min-h-[44px]` with centered icon).
- **Discount + Payment mode**: the payment mode segmented grid is `grid-cols-2` — keep on mobile (2×2); good. Discount input sits above it — fine.
- **Summary**: on mobile, drop the `sticky top-6` (no-op), let it flow above the fixed bottom CTA bar, show the Grand Total prominently in the CTA bar so staff always see it.
- After submit success: replace `alert`/`router.push` flash with a toast (`sonner`) + haptic, then route to the receipt.

### C4. Invoice / Receipt detail (`invoices/[id]/page.tsx`)
- **Top action bar**: on phones split into a non-sticky top row (Back + title) and a **fixed bottom action bar** (`fixed inset-x-0 bottom-0 bar-safe`) with Delete · WhatsApp · Print (Print = primary gold, full-width when alone). Use `z-30` so it sits above content but below the palette.
- **Delete**: replace native `confirm` with a branded bottom-sheet or modal ("Delete this invoice permanently?" + Cancel/Confirm).
- **Receipt card on mobile**:
  - Constrain watermark: `w-96 h-96` → `max-w-[16rem] max-h-[16rem]` so it scales down on 375px screens.
  - Constrain corner filigrees: `w-24 h-24` → `w-16 h-16 sm:w-24 sm:h-24`.
  - Capped `p-8 md:p-12` → `p-5 sm:p-8 md:p-12` to give breathing room on phones.
  - **Line items table**: render as stacked cards on mobile (one card per line: top = description + category pill, bottom = Qty / Rate / Amount row). On `md:` keep the table. Drop the `overflow-x-auto` fallback.
  - Billed-To block: `md:grid-cols-2` already stacks — good.
  - Totals: `md:col-span-7 / col-span-5` stack on mobile (terms first, totals below) — fine, but put the Grand Total + PAID stamp visually together.
  - PAID stamp: `absolute right-0 bottom-12 rotate-[-12deg]` — on mobile it may overlap the totals text; move into the flow (`relative`) on mobile, absolute only on `md:`.
- GSTIN/phone mono: add `break-all` or `text-[10px]` mono on mobile so they never overflow.

### C5. Customers list (`customers/page.tsx`)
- Add the stat strip (total clients, etc.) **only if data is cheap**; otherwise skip on mobile.
- Mobile list rows → make the **whole card a `<Link>`** to `/customers/[id]`, add chevron + `active:bg-paper`.
- Bump `text-[10px]` / `text-[9px]` labels → `text-[11px]`.
- Provide an "Add Customer" action (currently customers only auto-create from a bill — there is no manual create route). On mobile this lives as a "+" in the page header.

### C6. Customer profile (`customers/[id]/page.tsx`)
- Hero card already responsive; bump the avatar/typography slightly on mobile.
- LTV total card: render as a band **above** the hero on mobile (so the number is the first thing), not beside.
- **Orders table** → stacked mobile cards (Order ID + date + mode pill + total + chevron) like the dashboard; tap = navigate. The "View Receipt" button repeats — drop it on mobile.
- Future tabs (Orders / Payments / Notes) → use a top tab strip (`overflow-x-auto`) with `min-w` per tab so all are tappable.

### C7. Reports (`reports/page.tsx`)
- **Add the missing mobile ledger fallback**: convert the Recent Billings Ledger table (`overflow-x-auto`) into stacked cards under `lg:` — Date / Invoice / Customer / Mode pill / Amount, the whole row a `<Link>`. Keep table on `lg:`.
- The stat cards (3-up) → already stack to 1-col on mobile, good; show only the meaningful ones (drop "Pending Collections" if equals zero — keep the layout faithful).
- Category share bars: fine on mobile (already stacked).
- Add a **date-range preset chip row** (This Month · Quarter · FY · All) scrollable horizontally — better than no filter at all (currently reports ignores range).
- Per-section skeletons on mobile (do not flash zeros): wrap stat cards and ledger in `Skeleton` blocks of matching height.

### C8. Settings (`settings/page.tsx`)
- All `md:grid-cols-2` → already stack to 1-col on mobile; verify each input is 16px and full-width.
- The form's bottom Save button: on mobile add `enterKeyHint="done"` and make it full-width, sticky-ish at the bottom of the form (not fixed — sticky inside the scroll container).
- Replace the success inline text with a toast.
- Institutionalize a "danger zone" with reset/export; on mobile render it last with clear separators.

---

## D. Cross-cutting Mobile Rules (apply everywhere)

| Rule | Implementation |
|---|---|
| Min tap target | 44×44 pt. Audit every icon button; pad or wrap in a min-size hit area. |
| Min text on mobile | 11px body, 10px only for uppercase tracking micro-labels — never 8 or 9px. |
| No iOS zoom | Inputs `font-size: 16px` on `max-width: 767px`. |
| Keyboard hints | `inputMode`, `type`, `autoComplete`, `enterKeyHint` on every form field. |
| Safe areas | `.pt-safe` / `.pb-safe` / `.px-safe` on sticky/fixed surfaces. |
| Sticky/fixed primary actions | Bottom action bar (`bar-safe`) for the single most-tapped action per page. |
| Native dialogs | Kill `alert`/`confirm`; use toasts + a branded modal/bottom-sheet. |
| Lists | Whole row tappable; chevron affordance; `active:` tap state; no separate "View" button on mobile. |
| Wide tables | Mobile = stacked cards; desktop = table. No horizontal scroll fallback. |
| Long tokens (GSTIN/IDs) | `font-mono` + `break-all` + mobile size step-down. |
| Focus trap | Drawers/modals trap focus, restore on close, `inert` background. |
| Performance | Lazy-mount the command palette and modals; keep route components as Server Components where possible so the first paint on 4G is fast. |
| Haptics | `navigator.vibrate?.(10)` on Generate success, Delete confirm, WhatsApp send. |
| Overscroll | `.scroll-y` lists contain their bounce so the whole page doesn't rubber-band. |

---

## E. Acceptance Criteria — "mobile is done when"

- [ ] `viewport-fit=cover` + `themeColor` exported; no notch overlap on iPhone 12+ and SE.
- [ ] Tapping any input on iPhone Safari does **not** auto-zoom the page.
- [ ] Tapping any input reveals the correct mobile keyboard (tel/numeric/decimal/text) per field.
- [ ] Every interactive element ≥ 44×44 pt; verified with Accessibility Inspector in Safari devtools.
- [ ] No `alert()` / `confirm()` remain anywhere; confirmations use bottom-sheets/modals, notices use toasts.
- [ ] Reports ledger and invoice line items render as **stacked mobile cards** on <768px — zero horizontal scroll anywhere.
- [ ] Create Bill: the Generate CTA is always reachable (fixed bottom bar on mobile) and shows live Grand Total.
- [ ] Invoice detail: Delete/WhatsApp/Print live in a fixed bottom action bar with safe-area padding; Delete requires a branded confirm sheet.
- [ ] Whole list rows are tappable on Dashboard, Customers, Customer history, Reports ledger.
- [ ] `.pt-safe` / `.pb-safe` applied to the mobile header, drawer, and any bottom bar.
- [ ] No `text-[8px]` or `text-[9px]` survives on mobile; minimum 10px (micro uppercase) / 11px (body).
- [ ] Drawer has focus trap, restore-focus, and works with VoiceOver/Android TalkBack.
- [ ] `npm run build` clean; Lighthouse Mobile on the dashboard ≥ 90 for Performance/Accessibility/Best-Practices.
- [ ] Manual pass on real iPhone (Safari) + one Android (Chrome) at 360dp width — no overflow, no clipped buttons, no mis-taps.

---

End of mobile optimization specification.