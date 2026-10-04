import secrets

from django.conf import settings
from django.db import models

from apps.clients.models import Client
from apps.core.models import TimeStampedModel
from apps.inventory.models import InventoryItem
from apps.staff.models import Employee


class MeasurementFormTemplate(TimeStampedModel):
    """A garment type's measurement sheet + reference price (e.g. "Boubou
    homme"). Orders and client measurements are built against a template."""

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    fields = models.JSONField(default=list)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    reference_price_fcfa = models.BigIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self) -> str:
        return self.name

    def normalized_fields(self) -> list[dict]:
        return [
            {
                "key": f.get("key", ""),
                "label": f.get("label", f.get("key", "")),
                "unit": f.get("unit", ""),
                "type": f.get("type", "text"),
            }
            for f in (self.fields or [])
        ]


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        IN_PROGRESS = "in_progress", "En cours"
        DONE = "done", "Terminé"
        VALIDATED = "validated", "Validé"
        DELIVERED = "delivered", "Livré"

    class DiscountScope(models.TextChoices):
        NONE = "none", "Aucune"
        ALL = "all", "Toute la commande"
        LINE = "line", "Par article"

    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Espèces"
        ORANGE_MONEY = "orange_money", "Orange Money"
        WAVE = "wave", "Wave"
        BANK_TRANSFER = "bank_transfer", "Virement bancaire"

    class DeliveryMode(models.TextChoices):
        PICKUP = "pickup", "Retrait en boutique"
        DELIVERY = "delivery", "Livraison"

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="orders")
    reference = models.CharField(max_length=64, unique=True, blank=True, null=True)
    model_name = models.CharField(max_length=255, blank=True, default="")
    measurement_template = models.ForeignKey(
        MeasurementFormTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders"
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    due_date = models.DateField(null=True, blank=True)
    assignee = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_orders"
    )

    total_fcfa = models.BigIntegerField(default=0)
    advance_payment_fcfa = models.BigIntegerField(default=0)
    payment_method = models.CharField(max_length=32, choices=PaymentMethod.choices, blank=True, default="")
    delivery_mode = models.CharField(max_length=24, choices=DeliveryMode.choices, default=DeliveryMode.PICKUP)

    discount_scope = models.CharField(max_length=8, choices=DiscountScope.choices, default=DiscountScope.NONE)
    order_discount_fcfa = models.BigIntegerField(default=0)
    discount_percent = models.PositiveSmallIntegerField(default=0)

    model_notes = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    inventory_deducted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status"])]

    # Simplified production flow used by the "étape suivante" button.
    NEXT_STATUS = {
        "pending": "in_progress",
        "in_progress": "done",
        "done": "delivered",
        "validated": "delivered",
    }

    def __str__(self) -> str:
        return self.reference or f"Commande #{self.pk}"

    def save(self, *args, **kwargs):
        if not self.reference:
            # Same shape as the Laravel references (e.g. CMD-BFHWUAT6).
            alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
            while True:
                ref = "CMD-" + "".join(secrets.choice(alphabet) for _ in range(8))
                if not Order.objects.filter(reference=ref).exists():
                    break
            self.reference = ref
        super().save(*args, **kwargs)

    @property
    def balance_due_fcfa(self) -> int:
        return max(0, self.total_fcfa - self.advance_payment_fcfa)

    @property
    def is_fully_paid(self) -> bool:
        return self.total_fcfa > 0 and self.advance_payment_fcfa >= self.total_fcfa

    @property
    def subtotal_gross_fcfa(self) -> int:
        return sum(item.line_gross_fcfa for item in self.items.all())

    def recalculate_totals(self, save: bool = True) -> None:
        """Mirrors Order::recalculateTotals() from the Laravel app: applies the
        order's discount_percent either across the whole order or per line
        (only on items flagged discount_applies)."""
        items = list(self.items.all())
        subtotal = sum(item.line_gross_fcfa for item in items)
        scope = self.discount_scope or self.DiscountScope.NONE
        percent = min(100, max(0, self.discount_percent or 0))

        if percent == 0 or scope == self.DiscountScope.NONE:
            self.order_discount_fcfa = 0
            for item in items:
                item.discount_fcfa = 0
            self.total_fcfa = subtotal
        elif scope == self.DiscountScope.ALL:
            discount = round(subtotal * percent / 100)
            self.order_discount_fcfa = discount
            self.total_fcfa = max(0, subtotal - discount)
            for item in items:
                item.discount_fcfa = 0
        else:  # LINE
            net = 0
            total_discount = 0
            for item in items:
                gross = item.line_gross_fcfa
                if item.discount_applies:
                    line_discount = min(round(gross * percent / 100), gross)
                    item.discount_fcfa = line_discount
                    net += gross - line_discount
                    total_discount += line_discount
                else:
                    item.discount_fcfa = 0
                    net += gross
            self.order_discount_fcfa = total_discount
            self.total_fcfa = max(0, net)

        if save:
            for item in items:
                item.save(update_fields=["discount_fcfa"])
            self.save(update_fields=["order_discount_fcfa", "total_fcfa"])


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    inventory_item = models.ForeignKey(
        InventoryItem, on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items"
    )
    inventory_characteristic_key = models.CharField(max_length=64, blank=True, default="")
    inventory_consumed_meters = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    measurement_template = models.ForeignKey(
        MeasurementFormTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items"
    )
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price_fcfa = models.BigIntegerField(default=0)
    discount_fcfa = models.BigIntegerField(default=0)
    discount_applies = models.BooleanField(default=False)
    client_supplies_fabric = models.BooleanField(default=False)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return self.description

    @property
    def line_gross_fcfa(self) -> int:
        return self.quantity * self.unit_price_fcfa

    @property
    def effective_line_discount_fcfa(self) -> int:
        return min(max(0, self.discount_fcfa), self.line_gross_fcfa)

    @property
    def line_net_fcfa(self) -> int:
        return max(0, self.line_gross_fcfa - self.effective_line_discount_fcfa)


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_histories")
    status = models.CharField(max_length=16, choices=Order.Status.choices)
    note = models.TextField(blank=True, default="")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Order status histories"


class OrderAssignment(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="assignments")
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="order_assignments")
    role = models.CharField(max_length=64, blank=True, default="")


class OrderImage(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="orders/%Y/%m/")
    caption = models.CharField(max_length=255, blank=True, default="")
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]
