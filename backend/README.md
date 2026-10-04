# VP Atelier — backend (Django)

REST API for the Mansa Vibes / Vêtement Palace SaaS. Rewritten from the Laravel app in the repo root,
keeping the same domain model (single-tenant — multi-tenancy was already dropped on the Laravel side).

## Stack

Django 6 · Django REST Framework · SimpleJWT (phone-based login, no email) · django-cors-headers ·
django-filter · Postgres (via Docker, see repo root `docker-compose.yml`) with an automatic SQLite fallback
for quick local runs outside Docker.

## Setup — Docker (recommended)

From the repo root: `docker compose up --build`. Postgres, migrations, and a fallback superuser
(`DJANGO_SUPERUSER_PHONE` / `DJANGO_SUPERUSER_PASSWORD`) are handled by `docker-entrypoint.sh` on first boot. API on
`http://localhost:8020/api/v1/`. `SEED_DEMO=true` in `docker-compose.yml` adds fake demo rows on top —
leave it `false` once real data is loaded (see below), or every restart would re-add the fake client/order.

### Real production data is already loaded

The actual VP data (from the Laravel/MySQL production dump) was imported via
`apps/core/management/commands/import_legacy_dump.py` — real client "Hamadoun Cisse", real order
"CMD-BFHWUAT6", the real inventory (12 items), the two real measurement templates ("IBK Modèle" / "Simple
Coll Mao"), supplier "Faf Solo", employee "Alassane", and the two real user accounts:

- Owner `74335905` and tailleur `8063629836` — passwords come from `OWNER_PASSWORD` / `TAILLEUR_PASSWORD`
  (random ones are printed when unset). The import command itself is not in the public repo (real customer data).

That command is destructive (it clears clients/orders/inventory/etc. before reloading) — don't re-run it
against a database with real user edits in it. It also resets every table's Postgres sequence after
inserting (rows use explicit PKs to preserve the original relationships, which leaves `nextval()` behind
`MAX(id)` otherwise — the first `POST` on an affected table would 500 with a duplicate-key error until
sequences are reset). If you ever import more legacy data by hand and skip that step, fix it with:
```bash
docker compose exec backend python manage.py shell -c "
from django.apps import apps
from django.db import connection
with connection.cursor() as cursor:
    for model in apps.get_models():
        pk = model._meta.pk
        if pk is None or pk.column != 'id':
            continue
        table = model._meta.db_table
        cursor.execute('SELECT pg_get_serial_sequence(%s, %s)', [table, 'id'])
        seq = cursor.fetchone()[0]
        if seq:
            cursor.execute(f'SELECT setval(%s, COALESCE((SELECT MAX(id) FROM \"{table}\"), 1), (SELECT MAX(id) IS NOT NULL FROM \"{table}\"))', [seq])
"
```

## Setup — local (SQLite)

```bash
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
cp .env.example .env
./.venv/Scripts/python.exe manage.py migrate
./.venv/Scripts/python.exe manage.py createsuperuser   # or seed_demo below for a ready-made login
./.venv/Scripts/python.exe manage.py seed_demo         # optional: demo client/order/inventory/finance rows
./.venv/Scripts/python.exe manage.py runserver 8000
```

Demo superuser (from `seed_demo` + the one created during setup): phone `0700000000`, password chosen with `createsuperuser`.
Set `POSTGRES_DB` (+ `POSTGRES_USER`/`PASSWORD`/`HOST`/`PORT`) in `.env` to point this same setup at Postgres
instead of SQLite — `config/settings.py` switches automatically based on whether `POSTGRES_DB` is set.

## Apps

| App | Covers |
|---|---|
| `accounts` | Custom `User` (phone login, `role`: owner / tailleur / staff) |
| `clients` | Clients + mensurations (measurements) |
| `orders` | Measurement form templates, orders, order items, status history, assignments, images |
| `inventory` | Suppliers, inventory form templates, inventory items, stock movements/alerts |
| `finance` | Categories, cash movements, daily closures, fixed assets |
| `invoicing` | Quotes, invoices, payments |
| `staff` | Employees, tasks, performance |
| `commerce` | Products, images, cart |
| `reporting` | Snapshots + `/dashboard/overview/` KPI endpoint |
| `communications` | WhatsApp Cloud API notification log + send actions |
| `core` | Shared `TimeStampedModel`, `AppSettings` singleton, role-based DRF permissions, `seed_demo` command |

## Auth

`POST /api/v1/auth/token/` with `{"phone", "password"}` → `{access, refresh, user}`.
`POST /api/v1/auth/token/refresh/` with `{"refresh"}`. `GET /api/v1/auth/me/`.

## Role permissions

The `tailleur` role mirrors the Laravel `PreventTailleur` middleware: read/write access to clients (no
delete) and read-only access to orders; no access at all to finance, staff, inventory, suppliers,
measurement templates, commerce, reporting, or communications. See `apps/core/permissions.py`.

## Everything is in Django admin

Every model is registered in `admin.py` for its app — `/admin/` is a full data-management UI you can use
from a phone browser while the frontend catches up.
