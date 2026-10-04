from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsNotTailleur

from .models import CashMovement, DailyCashClosure, FinanceCategory, FixedAsset
from .serializers import (
    CashMovementSerializer,
    DailyCashClosureSerializer,
    FinanceCategorySerializer,
    FixedAssetSerializer,
)


class FinanceCategoryViewSet(viewsets.ModelViewSet):
    queryset = FinanceCategory.objects.all()
    serializer_class = FinanceCategorySerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["type"]


class CashMovementViewSet(viewsets.ModelViewSet):
    queryset = CashMovement.objects.select_related("category").all()
    serializer_class = CashMovementSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["direction", "category", "movement_date"]
    ordering_fields = ["movement_date", "amount_fcfa"]

    @action(detail=False, methods=["get"])
    def summary(self, request):
        qs = self.filter_queryset(self.get_queryset())
        totals = qs.values("direction").annotate(total=Sum("amount_fcfa"))
        inflow = next((t["total"] for t in totals if t["direction"] == "in"), 0) or 0
        outflow = next((t["total"] for t in totals if t["direction"] == "out"), 0) or 0
        return Response({"inflow_fcfa": inflow, "outflow_fcfa": outflow, "net_fcfa": inflow - outflow})


class DailyCashClosureViewSet(viewsets.ModelViewSet):
    queryset = DailyCashClosure.objects.all()
    serializer_class = DailyCashClosureSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["closed_on"]


class FixedAssetViewSet(viewsets.ModelViewSet):
    queryset = FixedAsset.objects.all()
    serializer_class = FixedAssetSerializer
    permission_classes = [IsNotTailleur]
