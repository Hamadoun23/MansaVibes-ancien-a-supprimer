from django.db.models import Count, Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets

from apps.core.permissions import IsNotTailleur
from apps.finance.models import CashMovement
from apps.orders.models import Order

from .models import ReportingSnapshot
from .serializers import ReportingSnapshotSerializer


class ReportingSnapshotViewSet(viewsets.ModelViewSet):
    queryset = ReportingSnapshot.objects.all()
    serializer_class = ReportingSnapshotSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["period_start", "period_end"]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_overview(request):
    """Quick KPIs for the mobile dashboard home screen."""
    orders_by_status = {
        row["status"]: row["count"] for row in Order.objects.values("status").annotate(count=Count("id"))
    }
    revenue_total = Order.objects.aggregate(total=Sum("total_fcfa"))["total"] or 0
    outstanding = sum(o.balance_due_fcfa for o in Order.objects.only("total_fcfa", "advance_payment_fcfa"))
    cash_in = CashMovement.objects.filter(direction="in").aggregate(t=Sum("amount_fcfa"))["t"] or 0
    cash_out = CashMovement.objects.filter(direction="out").aggregate(t=Sum("amount_fcfa"))["t"] or 0

    return Response(
        {
            "orders_by_status": orders_by_status,
            "orders_total": Order.objects.count(),
            "revenue_total_fcfa": revenue_total,
            "outstanding_balance_fcfa": outstanding,
            "cash_in_fcfa": cash_in,
            "cash_out_fcfa": cash_out,
            "cash_net_fcfa": cash_in - cash_out,
        }
    )
