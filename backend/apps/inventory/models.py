from django.db import models

from apps.core.models import TimeStampedModel


class Supplier(TimeStampedModel):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    address = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["name"])]

    def __str__(self) -> str:
        return self.name


class InventoryFormTemplate(TimeStampedModel):
    """Defines the custom characteristic fields for a stock type (e.g. fabric:
    color, quality, width...) — filled in on each InventoryItem.characteristic_values."""

    name = models.CharField(max_length=255)
    applies_to_stock_type = models.CharField(max_length=32, blank=True, default="")
    fields = models.JSONField(default=list)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, default="")

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


class InventoryItem(TimeStampedModel):
    class StockType(models.TextChoices):
        FABRIC = "fabric", "Tissu"
        ACCESSORY = "accessory", "Accessoire / mercerie"
        OTHER = "other", "Autre"

    supplier = models.ForeignKey(
        Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name="inventory_items"
    )
    inventory_form_template = models.ForeignKey(
        InventoryFormTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name="inventory_items"
    )
    stock_type = models.CharField(max_length=16, choices=StockType.choices, default=StockType.FABRIC)
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=64, blank=True, default="")
    description = models.TextField(blank=True, default="")
    quality_label = models.CharField(max_length=191, blank=True, default="")
    colors = models.JSONField(blank=True, default=list)
    unit = models.CharField(max_length=32, default="unité")
    quantity_on_hand = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    reorder_level = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    characteristic_values = models.JSONField(blank=True, default=dict)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["name"])]

    def __str__(self) -> str:
        return self.name

    @property
    def is_below_reorder_level(self) -> bool:
        return self.quantity_on_hand <= self.reorder_level


class StockMovement(TimeStampedModel):
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="movements")
    supplier = models.ForeignKey(
        Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name="stock_movements"
    )
    quantity_delta = models.DecimalField(max_digits=12, decimal_places=3)
    reason = models.CharField(max_length=255, blank=True, default="")
    reference = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.inventory_item.name}: {self.quantity_delta}"


class StockAlert(TimeStampedModel):
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="alerts")
    threshold = models.DecimalField(max_digits=12, decimal_places=3)
    active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"Alerte {self.inventory_item.name} @ {self.threshold}"
