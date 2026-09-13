# AGENTS.md

## Project

**Bazaf** — Indonesian web food store: a customer storefront (browse menu, cart, WhatsApp order) plus a back office (admin panel, vendor dashboard, POS cashier, invoices, schedules, pre-orders). Deployed to **Cloudflare Workers** through **vinext** (a Vite-based Next.js reimplementation).

## Tech stack

- **React 19** + **vinext** (Next.js-style App Router under Vite). Routes live in `src/app/**/page.tsx`; API routes in `src/app/api/**/route.ts`.
- **Chakra UI v2** (`@chakra-ui/react` 2.8) is the UI framework. Do NOT add another UI/CSS framework or component library. Theme lives in `src/theme/index.ts`.
- **Emotion** (Chakra peer), **zustand** for client state (`src/stores`, `src/hooks`).
- **formik + zod** for forms; **react-icons**; **date-fns**; **chart.js**; **use-debounce**.
- Backend: **Cloudflare Workers / D1 (SQLite)** via `wrangler.jsonc`; DB migrations in `migrations/` (apply with `npm run db:migrate:local` / `:remote`).

## Commands

```bash
npm run dev              # dev server on :3000 (vinext dev)
npm run build            # production build (verify before finishing)
npm run start            # run built worker locally
npm run lint             # eslint via vinext
npm run format           # prettier (writes) — config in .prettierrc.json
npm run deploy           # deploy to Cloudflare Workers
npm run db:migrate:local # apply D1 migrations locally
```

There is **no test suite**. Verify changes with `npm run lint` and `npm run build`.

## Code style

- Prettier config: **no semicolons, single quotes, 2-space indent, no trailing commas**.
- Import alias `@/*` → `src/*`.
- Follow existing patterns and naming (PascalCase components, lowercase folders, default exports for pages/components).
- Do not add comments unless asked.

## UI conventions

- **Keep Chakra UI v2.** Prefer theme tokens (`brand.*`, `gray.*`) over arbitrary hex values.
- The design direction is **calm, clean, minimal, content-first, mobile-first**: generous spacing/line-height, readable text, clear hierarchy, restrained borders/shadows, no decorative clutter.
- Primary accent is `brand` (green). Use status colors sparingly and semantically. Keep text contrast accessible; avoid tiny/low-contrast gray text.
- **Storefront** components (customer-facing home/cart/order flow) live in `src/components/homepage/` and `src/app/{page,cart,orders}`.
- **Back office** (`src/app/admin`, `src/app/dashboard`, `src/app/pos`) reuses the shared kit in `src/components/ui/`, `src/components/shared/`, `src/components/admin/`, and `src/components/{Layout,DashboardShell}.tsx`.
- Prefer improving existing components and shared styles (theme, ui kit) so a change propagates consistently instead of creating one-off duplicates.
- Reuse `src/components/ProductImage.tsx` for product imagery (handles placeholder/broken images).
- Keep Arabic-free, Indonesian-facing copy; do not mix concerns of business logic and presentation.

## Structure cheat-sheet

- `src/app` — vinext routes: `admin/(panel)/*` (admin), `dashboard/*` (vendor), `pos/*` (cashier), `cart`, `orders/[orderId]`, `login`, `api/*`.
- `src/components` — shared/storefront/back-office components; `homepage/` storefront; `admin/` back-office; `customer/` vendor sidebar; `ui/` small kit; `shared/` (Loading, Error).
- `src/theme` — Chakra theme (colors, fonts, component styles).
- `src/stores` + `src/hooks` — zustand state (`useCart`).
- `src/interfaces`, `src/constants`, `src/utils`, `src/lib/server` — types, enums/mappings, helpers, server-only logic.
