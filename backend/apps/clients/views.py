from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import DenyTailleurDestroy

from .models import Client, ClientMeasurement, generate_portal_token
from .serializers import ClientListSerializer, ClientMeasurementSerializer, ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.prefetch_related("measurements").all()
    permission_classes = [DenyTailleurDestroy]
    search_fields = ["name", "phone", "email"]
    ordering_fields = ["name", "created_at", "balance_fcfa"]

    def get_serializer_class(self):
        if self.action == "list":
            return ClientListSerializer
        return ClientSerializer

    @action(detail=True, methods=["post"], url_path="measurements")
    def add_measurement(self, request, pk=None):
        client = self.get_object()
        serializer = ClientMeasurementSerializer(data={**request.data, "client": client.id})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["post"], url_path="rotate-portal")
    def rotate_portal(self, request, pk=None):
        """Invalidates the client's tracking link (e.g. sent to the wrong number)."""
        client = self.get_object()
        client.portal_token = generate_portal_token()
        client.save(update_fields=["portal_token", "updated_at"])
        return Response({"portal_token": client.portal_token})


class ClientMeasurementViewSet(viewsets.ModelViewSet):
    queryset = ClientMeasurement.objects.select_related("client", "measurement_template").all()
    serializer_class = ClientMeasurementSerializer
    filterset_fields = ["client"]
