from django.contrib import admin

from .models import InventoryFormTemplate, InventoryItem, StockAlert, StockMovement, Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ["name", "phone", "email"]
    search_fields = ["name", "phone", "email"]


@admin.register(InventoryFormTemplate)
class InventoryFormTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "applies_to_stock_type", "is_active", "sort_order"]


class StockMovementInline(admin.TabularInline):
    model = StockMovement
    extra = 0


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ["name", "stock_type", "quantity_on_hand", "unit", "reorder_level", "supplier"]
    list_filter = ["stock_type"]
    search_fields = ["name", "sku"]
    inlines = [StockMovementInline]


@admin.register(StockAlert)
class StockAlertAdmin(admin.ModelAdmin):
    list_display = ["inventory_item", "threshold", "active"]
