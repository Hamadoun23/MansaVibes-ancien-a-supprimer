from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsNotTailleur
from apps.orders.models import Order

from .models import NotificationLog
from .serializers import NotificationLogSerializer
from .services import send_order_invoice_whatsapp, send_order_receipt_whatsapp


class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NotificationLog.objects.all()
    serializer_class = NotificationLogSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["channel", "status"]

    @action(detail=False, methods=["post"], url_path="orders/(?P<order_id>[^/.]+)/whatsapp/invoice")
    def send_invoice(self, request, order_id=None):
        order = Order.objects.select_related("client").get(pk=order_id)
        log = send_order_invoice_whatsapp(order)
        return Response(NotificationLogSerializer(log).data, status=201)

    @action(detail=False, methods=["post"], url_path="orders/(?P<order_id>[^/.]+)/whatsapp/receipt")
    def send_receipt(self, request, order_id=None):
        order = Order.objects.select_related("client").get(pk=order_id)
        log = send_order_receipt_whatsapp(order)
        return Response(NotificationLogSerializer(log).data, status=201)
