# Gauram Designer Studio — Codebase Audit

**Date:** 2026-07-17  
**Stack:** Next.js 16 · React 19 · Prisma · PostgreSQL  
**Scope:** Full review of `src/`, `prisma/`, and app config  
**TypeScript:** `tsc --noEmit` passes  
**ESLint:** 32 errors, 16 warnings (mostly `any` and setState-in-effect)

---

## Summary

The app is a boutique billing system (customers, invoices, items, payments, business settings) with a polished mobile-friendly UI. Core domain modeling is solid, but several Settings/admin features are non-functional, billing always forces “paid in full,” discounts and categories are not persisted correctly, and there is no authentication for a production deploy.

---

## Critical / Broken Features

### 1. Settings save is broken

**Where:** `src/app/settings/page.tsx` → `src/app/api/business/route.ts`

The Settings page calls **POST** `/api/business`, but the API only implements **GET** and **PUT**.

```ts
// settings/page.tsx
const res = await fetch('/api/business', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
})
```

**Result:** “Save Settings” fails (method not allowed / 405).

**Fix:** Use `method: 'PUT'` (or add a POST handler that mirrors PUT).

---

### 2. Invoice sequence field name mismatch

**Where:** Settings UI vs Prisma schema

| Layer | Field name |
|--------|------------|
| UI (`settings/page.tsx`) | `invoiceSequenceStart` |
| Schema / API | `nextInvoiceNum` |

**Result:**

- On load, sequence falls back to `1` even if the DB has a higher number.
- On save (once save works), the wrong key is sent and ignored or rejected by Prisma.

**Fix:** Map UI field ↔ `nextInvoiceNum` on read and write.

---

### 3. Danger-zone actions do not exist

**Where:** `src/app/settings/page.tsx` → `src/app/api/payments/route.ts`

Settings calls:

| UI action | Request | Expected behavior |
|-----------|---------|-------------------|
| Reset Sequence | `POST /api/payments` with `{ action: 'reset_counter' }` | Reset invoice counter to 1 |
| Backup Database | `GET /api/payments?action=export_db` | Download full JSON dump |

`payments/route.ts` only records payments — no reset, no export.

**Result:** “Reset Sequence” and “Backup Database JSON” are non-functional.

**Fix:** Implement these actions (preferably under `/api/business` or a dedicated admin route), or remove the UI until implemented.

---

## High-Priority Product / Data Bugs

### 4. Every bill is forced to “paid in full”

**Where:** `src/components/InvoiceForm.tsx`

```ts
amountPaid: totalAmount,
isFinalized: true,
isFinalizing: true,
```

**Result:**

- Partial / pending invoices cannot be created from the UI.
- Schema and payment API support partial payments, but the form never uses them.
- Invoice detail always shows a “PAID IN FULL” stamp, which matches this forced behavior.

**Fix:** Allow optional advance / partial payment amount; only mark paid when `amountPaid >= totalAmount`.

---

### 5. Overall discount is not stored

**Where:** `InvoiceForm` (client calc) and invoice detail (reverse calc)

Discount is reverse-engineered from CGST:

```ts
taxableVal = cgstAmount / 0.06
discount = subtotal - taxableVal
```

**Problems:**

- Rounding can make discounts wrong.
- Changing GST rate later breaks historical displays.
- Item-level `discount` is always sent as `0`.

**Fix:** Persist discount (invoice-level and/or line-item) as explicit fields in the DB.

---

### 6. Category is hardcoded — reports are wrong

**Where:** `src/components/InvoiceForm.tsx`

```ts
const payloadItems = items.map(item => ({
  ...item,
  category: "Women's Wear",
  hsnSacCode: "HSN 6204",
  discount: 0,
  gstRate: 12,
}))
```

**Result:** Reports “Category Revenue Share” (Men’s / Kids / Rental) almost always shows 100% Women’s Wear.

**Fix:** Let users select category (and HSN if needed), or drop category reports until selectable.

---

### 7. No authentication

All APIs are open: create/delete invoices, change GSTIN, customer data, etc.

- Acceptable for pure local / single-machine use.
- **Risky if deployed** publicly.

**Fix:** Add auth (session, basic auth, or reverse-proxy protection) before any public deploy.

---

### 8. Invoice number race condition

**Where:** `src/app/api/invoices/route.ts`, `src/app/api/invoices/[id]/route.ts`

Sequence is: read `nextInvoiceNum` → format order ID → increment — as separate queries, not a single transaction.

**Result:** Concurrent finalizations can duplicate or skip invoice numbers.

**Fix:** Use a Prisma `$transaction` (or DB-level atomic increment / unique constraint on `orderId` with retry).

---

## Medium Issues

| Issue | Detail |
|--------|--------|
| **Money as `Float`** | Prisma uses `Float` for amounts. Prefer `Decimal` for GST/money to avoid rounding drift. |
| **Draft flow half-built** | Edit route (`/invoices/[id]/edit`) only allows drafts, but the form always finalizes and never offers “Save as draft”. No clear UI path to create drafts. |
| **No partial payment UI** | Payment API exists; no screen to record advances or balance due. |
| **Dashboard “Total Revenue”** | Sums `totalAmount` for filtered invoices (not only paid / not `amountPaid`). Subtitle says “Paid in full at checkout,” which is misleading. |
| **Always-paid stamp** | Invoice detail always shows PAID IN FULL, regardless of real status. |
| **PostgreSQL `contains` search** | Case-sensitive by default; searching `priya` won’t match `Priya` unless `mode: 'insensitive'`. |
| **Local `dev.db` leftover** | Schema is `postgresql`, but `prisma/dev.db` exists (old SQLite). Confusing for setup. |
| **WhatsApp phone format** | Builds `wa.me/91${phone}` without stripping spaces / `+` / leading `0` — can break for messy phone input. |
| **Business PUT mass-assignment** | Accepts almost any body field; wrong keys can cause 500s. Whitelist allowed fields. |

---

## Lower Priority / Polish

- ESLint: **32 errors, 16 warnings** (`any`, setState-in-effect patterns, etc.)
- No automated tests
- Search on dashboard/customers has no debounce (request per keystroke)
- Incomplete UI affordances (payment history on invoice page, edit link for drafts)
- Spec docs (`MILLION_DOLLAR_SPEC.md`, `MOBILE_OPTIMIZATION_SPEC.md`, `TRANSFORMATION_PLAN.md`) describe a larger product than the current MVP — expected if this is an intentional slice

---

## What Looks Solid

- Clear domain model: customers, invoices, items, payments, business settings
- Prisma client singleton pattern (`src/lib/prisma.ts`) is correct
- Seed only creates business settings (no fake customers/invoices)
- `.env` is gitignored
- Mobile-friendly layout; print / WhatsApp receipt flow is thoughtfully built
- TypeScript build passes (`tsc --noEmit`)

---

## Suggested Fix Order

1. **Settings:** switch to `PUT`; map `nextInvoiceNum` correctly on load/save  
2. **Admin actions:** implement reset counter + DB export (or remove the UI)  
3. **Billing:** optional partial pay / advance; stop hardcoding `amountPaid = total`  
4. **Persist discount** (invoice-level and/or line-item) in the DB  
5. **Category / HSN** selectable again (or drop category reports)  
6. **Auth** before any public deploy  
7. **Transactional invoice numbering**

---

## Key Files Reviewed

| Area | Paths |
|------|--------|
| API | `src/app/api/business`, `customers`, `invoices`, `payments` |
| UI pages | Dashboard, customers, invoice detail/edit/new, reports, settings |
| Components | `InvoiceForm`, `Sidebar`, `CommandPalette`, `ui/Kit` |
| Data | `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts` |

---

## Notes

- This audit is a **read-only review**; no code changes were made when it was written.
- Re-run checks after fixes: `npx tsc --noEmit`, `npx eslint src`, and manual smoke tests for Settings + Create Bill + Reports.

