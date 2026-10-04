from rest_framework import serializers

from .models import InventoryFormTemplate, InventoryItem, StockAlert, StockMovement, Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "phone", "email", "address", "notes"]
        read_only_fields = ["id"]


class InventoryFormTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryFormTemplate
        fields = ["id", "name", "applies_to_stock_type", "fields", "sort_order", "is_active", "notes"]
        read_only_fields = ["id"]


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = ["id", "inventory_item", "supplier", "quantity_delta", "reason", "reference", "created_at"]
        read_only_fields = ["id", "created_at"]


class InventoryItemSerializer(serializers.ModelSerializer):
    is_below_reorder_level = serializers.BooleanField(read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True, default=None)

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "supplier",
            "supplier_name",
            "inventory_form_template",
            "stock_type",
            "name",
            "sku",
            "description",
            "quality_label",
            "colors",
            "unit",
            "quantity_on_hand",
            "reorder_level",
            "is_below_reorder_level",
            "characteristic_values",
            "notes",
        ]
        read_only_fields = ["id"]


class StockAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockAlert
        fields = ["id", "inventory_item", "threshold", "active"]
        read_only_fields = ["id"]
