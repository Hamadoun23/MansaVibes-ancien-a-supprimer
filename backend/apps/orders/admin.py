from django.contrib import admin

from .models import (
    MeasurementFormTemplate,
    Order,
    OrderAssignment,
    OrderImage,
    OrderItem,
    OrderStatusHistory,
)


@admin.register(MeasurementFormTemplate)
class MeasurementFormTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "reference_price_fcfa", "is_active", "sort_order"]
    search_fields = ["name"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


class OrderImageInline(admin.TabularInline):
    model = OrderImage
    extra = 0


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ["created_at"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["reference", "client", "status", "total_fcfa", "balance_due_fcfa", "due_date"]
    list_filter = ["status", "payment_method", "delivery_mode"]
    search_fields = ["reference", "client__name"]
    inlines = [OrderItemInline, OrderImageInline, OrderStatusHistoryInline]


@admin.register(OrderAssignment)
class OrderAssignmentAdmin(admin.ModelAdmin):
    list_display = ["order", "employee", "role"]
