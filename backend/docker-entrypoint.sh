#!/bin/sh
set -e

echo "Waiting for Postgres at ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..."
python - <<'PYEOF'
import os
import socket
import time

host = os.getenv("POSTGRES_HOST", "db")
port = int(os.getenv("POSTGRES_PORT", "5432"))

for _ in range(60):
    try:
        with socket.create_connection((host, port), timeout=2):
            break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit("Postgres did not become available in time")
PYEOF

echo "Applying migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput >/dev/null

if [ "${SEED_DEMO:-false}" = "true" ]; then
    echo "Seeding demo data..."
    python manage.py seed_demo
fi

if [ -n "${DJANGO_SUPERUSER_PHONE:-}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
    echo "Ensuring superuser exists..."
    python manage.py shell -c "
from apps.accounts.models import User
phone = '${DJANGO_SUPERUSER_PHONE}'
if not User.objects.filter(phone=phone).exists():
    User.objects.create_superuser(phone=phone, password='${DJANGO_SUPERUSER_PASSWORD}', name='${DJANGO_SUPERUSER_NAME:-Admin VP}')
"
fi

exec "$@"
