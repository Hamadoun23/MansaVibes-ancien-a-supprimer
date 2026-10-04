from django.db import models

from apps.clients.models import Client
from apps.core.models import TimeStampedModel
from apps.orders.models import Order


class Quote(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        SENT = "sent", "Envoyé"
        ACCEPTED = "accepted", "Accepté"
        DECLINED = "declined", "Refusé"

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="quotes")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    total_fcfa = models.BigIntegerField(default=0)
    valid_until = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Devis #{self.pk} — {self.client.name}"


class QuoteItem(TimeStampedModel):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price_fcfa = models.BigIntegerField(default=0)


class Invoice(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        SENT = "sent", "Envoyée"
        PAID = "paid", "Payée"
        CANCELLED = "cancelled", "Annulée"

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="invoices")
    order = models.ForeignKey(
        Order, on_delete=models.SET_NULL, null=True, blank=True, related_name="invoices"
    )
    number = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    total_fcfa = models.BigIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.number

    @property
    def paid_fcfa(self) -> int:
        return sum(p.amount_fcfa for p in self.payments.all())

    @property
    def balance_due_fcfa(self) -> int:
        return max(0, self.total_fcfa - self.paid_fcfa)


class InvoiceItem(TimeStampedModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price_fcfa = models.BigIntegerField(default=0)


class Payment(TimeStampedModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    amount_fcfa = models.BigIntegerField()
    paid_at = models.DateTimeField(auto_now_add=True)
    method = models.CharField(max_length=32, blank=True, default="")

    class Meta:
        ordering = ["-paid_at"]
