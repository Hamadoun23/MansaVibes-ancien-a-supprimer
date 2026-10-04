from django.utils import timezone

from apps.finance.models import CashMovement, FinanceCategory

from .models import Order


def record_payment(order: Order, amount: int, method: str | None = None) -> None:
    """Adds a payment to the order's advance and logs the matching cash-in movement."""
    order.advance_payment_fcfa += amount
    if method:
        order.payment_method = method
    order.save(update_fields=["advance_payment_fcfa", "payment_method", "updated_at"])
    category, _ = FinanceCategory.objects.get_or_create(
        name="Commandes", defaults={"type": FinanceCategory.Type.INCOME}
    )
    CashMovement.objects.create(
        category=category,
        direction=CashMovement.Direction.IN,
        amount_fcfa=amount,
        label=f"Paiement {order.reference} — {order.client.name}",
        movement_date=timezone.localdate(),
        notes=Order.PaymentMethod(method).label if method else "",
    )
