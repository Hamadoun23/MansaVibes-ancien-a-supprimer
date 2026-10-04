from datetime import timedelta

from django.db import transaction
from django.db.models import F, Sum, Value
from django.db.models.functions import Greatest
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsNotTailleur, ReadOnlyForTailleur
from apps.finance.models import CashMovement

from .models import MeasurementFormTemplate, Order, OrderAssignment, OrderStatusHistory
from .serializers import (
    MeasurementFormTemplateSerializer,
    OrderAssignmentSerializer,
    OrderListSerializer,
    OrderPaymentSerializer,
    OrderSerializer,
)
from .services import record_payment


class MeasurementFormTemplateViewSet(viewsets.ModelViewSet):
    queryset = MeasurementFormTemplate.objects.all()
    serializer_class = MeasurementFormTemplateSerializer
    permission_classes = [ReadOnlyForTailleur]
    search_fields = ["name"]


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related("client", "assignee", "measurement_template").prefetch_related(
        "items", "status_histories", "images"
    )
    permission_classes = [ReadOnlyForTailleur]
    search_fields = ["reference", "client__name", "model_name"]
    filterset_fields = {
        "status": ["exact", "in"],
        "client": ["exact"],
        "assignee": ["exact"],
        "payment_method": ["exact"],
        "delivery_mode": ["exact"],
    }
    ordering_fields = ["created_at", "updated_at", "due_date", "total_fcfa"]

    def get_serializer_class(self):
        if self.action == "list":
            return OrderListSerializer
        return OrderSerializer

    @action(detail=True, methods=["post"])
    def advance(self, request, pk=None):
        """Moves the order one step along the production flow (one-tap button)."""
        order = self.get_object()
        next_status = Order.NEXT_STATUS.get(order.status)
        if not next_status:
            return Response({"detail": "Commande déjà livrée."}, status=status.HTTP_400_BAD_REQUEST)
        order.status = next_status
        order.save(update_fields=["status", "updated_at"])
        OrderStatusHistory.objects.create(order=order, status=next_status, user=request.user)
        return Response(OrderSerializer(order, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        """Records a payment: bumps the advance and logs a cash-in movement."""
        order = self.get_object()
        payload = OrderPaymentSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        amount = payload.validated_data["amount_fcfa"]
        method = payload.validated_data.get("payment_method") or order.payment_method

        with transaction.atomic():
            record_payment(order, amount, method)
        return Response(OrderSerializer(order, context={"request": request}).data)


class OrderAssignmentViewSet(viewsets.ModelViewSet):
    queryset = OrderAssignment.objects.select_related("order", "employee").all()
    serializer_class = OrderAssignmentSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["order", "employee"]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def today_overview(request):
    """The tailor's daily screen: what's late, due, ready, and what's left to collect."""
    today = timezone.localdate()
    active = Order.objects.exclude(status=Order.Status.DELIVERED).select_related("client")
    in_work = [Order.Status.PENDING, Order.Status.IN_PROGRESS]
    ready_statuses = [Order.Status.DONE, Order.Status.VALIDATED]

    def serialize(qs):
        return OrderListSerializer(qs, many=True).data

    to_collect = (
        active.aggregate(t=Sum(Greatest(F("total_fcfa") - F("advance_payment_fcfa"), Value(0))))["t"] or 0
    )
    cash_today = (
        CashMovement.objects.filter(direction=CashMovement.Direction.IN, movement_date=today).aggregate(
            t=Sum("amount_fcfa")
        )["t"]
        or 0
    )

    return Response(
        {
            "date": today,
            "late": serialize(active.filter(status__in=in_work, due_date__lt=today).order_by("due_date")),
            "due_today": serialize(active.filter(status__in=in_work, due_date=today)),
            "upcoming": serialize(
                active.filter(
                    status__in=in_work, due_date__gt=today, due_date__lte=today + timedelta(days=7)
                ).order_by("due_date")
            ),
            "ready": serialize(active.filter(status__in=ready_statuses).order_by("due_date")),
            "counts": {
                "pending": active.filter(status=Order.Status.PENDING).count(),
                "in_progress": active.filter(status=Order.Status.IN_PROGRESS).count(),
                "ready": active.filter(status__in=ready_statuses).count(),
            },
            "to_collect_fcfa": to_collect,
            "cash_today_fcfa": cash_today,
        }
    )
