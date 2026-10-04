from django.db import models

from apps.core.models import TimeStampedModel


class FinanceCategory(TimeStampedModel):
    class Type(models.TextChoices):
        INCOME = "income", "Recette"
        EXPENSE = "expense", "Dépense"

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=16, choices=Type.choices, default=Type.EXPENSE)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "Finance categories"
        indexes = [models.Index(fields=["type"])]

    def __str__(self) -> str:
        return self.name


class CashMovement(TimeStampedModel):
    class Direction(models.TextChoices):
        IN = "in", "Entrée"
        OUT = "out", "Sortie"

    category = models.ForeignKey(
        FinanceCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="cash_movements"
    )
    direction = models.CharField(max_length=8, choices=Direction.choices, default=Direction.OUT)
    amount_fcfa = models.BigIntegerField()
    label = models.CharField(max_length=255)
    movement_date = models.DateField()
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-movement_date", "-created_at"]
        indexes = [models.Index(fields=["movement_date"])]

    def __str__(self) -> str:
        return self.label


class DailyCashClosure(TimeStampedModel):
    closed_on = models.DateField(unique=True)
    opening_fcfa = models.BigIntegerField(default=0)
    closing_fcfa = models.BigIntegerField(default=0)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-closed_on"]

    def __str__(self) -> str:
        return str(self.closed_on)


class FixedAsset(TimeStampedModel):
    name = models.CharField(max_length=255)
    acquisition_date = models.DateField()
    amount_fcfa = models.BigIntegerField()
    useful_life_months = models.PositiveSmallIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-acquisition_date"]

    def __str__(self) -> str:
        return self.name
