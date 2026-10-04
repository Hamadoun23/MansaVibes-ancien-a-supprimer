# VP Atelier — frontend (Next.js)

Mobile-first client for the Mansa Vibes / Vêtement Palace SaaS, built on the VP brand charter (ported from
`WebsiteVP/style.css`: noir/blanc + or mat, Bodoni Moda + Montserrat, flat/no-radius controls).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · lucide-react icons.

## Setup

Via Docker (recommended): `docker compose up --build` from the repo root — app on `http://localhost:3020`.

Standalone:

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL — defaults to http://127.0.0.1:8000/api/v1
npm run dev -- -p 3000
```

Requires the Django backend running (see `../backend/README.md`). Login redirects from `/`.

## Structure

- `src/app/login` — public login page (phone + password, dark VP hero).
- `src/app/(app)/*` — authenticated route group, wrapped by `AppShell` (mobile bottom tab bar / desktop
  sidebar) in `src/components/shell`. Guarded client-side by `src/app/(app)/layout.tsx`.
- `src/lib/api.ts` — fetch wrapper: attaches the JWT, retries once on 401 via refresh token.
- `src/lib/auth-context.tsx` — React context for the logged-in user; tokens live in `localStorage`.
- `src/lib/types.ts` — TypeScript mirrors of the DRF serializers.
- `src/components/ui/*` — design-system primitives (Button, Card, Field, Badge/StatusBadge, StatTile) built
  on the VP tokens defined in `src/app/globals.css`.

## Implemented modules

Every module has full create/edit/delete except Reporting and Communications (read-only logs — there's
nothing for the owner to configure there) and Invoicing (no frontend yet, API supports it):

- **Dashboard** — live KPIs from `/dashboard/overview/`.
- **Clients** — list/search/create/edit/delete + mensurations (add/delete, template-based or free-form).
- **Orders** — list/filter by status/create/edit (line items, discount scope, payment, delivery)/delete,
  status change, status history.
- **Measurement templates** — dynamic field builder (key/label/unit/type rows) for garment measurement
  sheets, full CRUD.
- **Inventory** — items full CRUD + a stock-movement quick action (updates `quantity_on_hand`).
- **Inventory form templates** ("Fiches de stock") — dynamic characteristic builder per stock type.
- **Suppliers, Finance (3 tabs: mouvements/catégories/immobilisations), Staff (+ tasks), Commerce** — full CRUD.
- **Settings** — business name (owner) + staff account management (create/edit/delete logins, owner-only).

All forms open in `src/components/ui/Modal.tsx` (bottom sheet on mobile, centered on desktop); destructive
actions use a plain `confirm()` — fine for an internal tool, revisit if it ever needs undo.
