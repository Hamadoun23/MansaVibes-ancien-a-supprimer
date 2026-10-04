"""Public, login-free tracking page for the tailor's clients (/suivi/<token>).

The token is an unguessable per-client secret shared over WhatsApp; it exposes
only what the client already knows about themselves: their orders' progress,
what's left to pay, and their measurements.
"""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.core.models import AppSettings
from apps.orders.models import Order

from .models import Client


class PortalThrottle(ScopedRateThrottle):
    scope = "portal"


@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([PortalThrottle])
def client_portal(request, token: str):
    client = get_object_or_404(Client.objects.prefetch_related("measurements__measurement_template"), portal_token=token)
    shop = AppSettings.load()
    orders = client.orders.prefetch_related("items", "status_histories").order_by("-created_at")[:20]

    return Response(
        {
            "atelier": {"name": shop.business_name, "phone": shop.phone, "address": shop.address},
            "client": {"name": client.name},
            "orders": [
                {
                    "reference": o.reference,
                    "model_name": o.model_name or ", ".join(i.description for i in o.items.all()[:3]),
                    "status": o.status,
                    "status_label": Order.Status(o.status).label,
                    "due_date": o.due_date,
                    "delivery_mode": o.delivery_mode,
                    "total_fcfa": o.total_fcfa,
                    "paid_fcfa": o.advance_payment_fcfa,
                    "balance_due_fcfa": o.balance_due_fcfa,
                    "created_at": o.created_at,
                    "timeline": [
                        {"status": h.status, "at": h.created_at} for h in reversed(list(o.status_histories.all()))
                    ],
                }
                for o in orders
            ],
            "measurements": [
                {
                    "label": m.label,
                    "template": m.measurement_template.name if m.measurement_template else "",
                    "rows": m.display_rows(),
                    "updated_at": m.updated_at,
                }
                for m in client.measurements.all()
            ],
        }
    )
