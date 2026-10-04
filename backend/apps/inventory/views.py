from rest_framework import viewsets

from apps.core.permissions import IsNotTailleur

from .models import InventoryFormTemplate, InventoryItem, StockAlert, StockMovement, Supplier
from .serializers import (
    InventoryFormTemplateSerializer,
    InventoryItemSerializer,
    StockAlertSerializer,
    StockMovementSerializer,
    SupplierSerializer,
)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsNotTailleur]
    search_fields = ["name", "phone", "email"]


class InventoryFormTemplateViewSet(viewsets.ModelViewSet):
    queryset = InventoryFormTemplate.objects.all()
    serializer_class = InventoryFormTemplateSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["applies_to_stock_type", "is_active"]


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.select_related("supplier", "inventory_form_template").all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsNotTailleur]
    search_fields = ["name", "sku"]
    filterset_fields = ["stock_type", "supplier"]


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related("inventory_item", "supplier").all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["inventory_item", "supplier"]

    def perform_create(self, serializer):
        movement = serializer.save()
        item = movement.inventory_item
        item.quantity_on_hand = item.quantity_on_hand + movement.quantity_delta
        item.save(update_fields=["quantity_on_hand"])


class StockAlertViewSet(viewsets.ModelViewSet):
    queryset = StockAlert.objects.select_related("inventory_item").all()
    serializer_class = StockAlertSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["inventory_item", "active"]
