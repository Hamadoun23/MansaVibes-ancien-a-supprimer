from rest_framework import viewsets

from apps.core.permissions import IsNotTailleur

from .models import Invoice, Payment, Quote
from .serializers import InvoiceSerializer, PaymentSerializer, QuoteSerializer


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.select_related("client").prefetch_related("items").all()
    serializer_class = QuoteSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["status", "client"]


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("client", "order").prefetch_related("items", "payments").all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsNotTailleur]
    search_fields = ["number", "client__name"]
    filterset_fields = ["status", "client", "order"]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("invoice").all()
    serializer_class = PaymentSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["invoice"]
