from rest_framework import serializers

from .models import Client, ClientMeasurement


class ClientMeasurementSerializer(serializers.ModelSerializer):
    display_rows = serializers.SerializerMethodField()

    class Meta:
        model = ClientMeasurement
        fields = [
            "id",
            "client",
            "measurement_template",
            "label",
            "data",
            "poitrine_cm",
            "taille_cm",
            "hanche_cm",
            "longueur_cm",
            "epaule_cm",
            "custom_measures",
            "measurement_notes",
            "display_rows",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_display_rows(self, obj: ClientMeasurement) -> list[dict]:
        return obj.display_rows()


class ClientSerializer(serializers.ModelSerializer):
    measurements = ClientMeasurementSerializer(many=True, read_only=True)
    orders_count = serializers.IntegerField(source="orders.count", read_only=True)

    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "notes",
            "balance_fcfa",
            "portal_token",
            "measurements",
            "orders_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "portal_token", "created_at", "updated_at"]


class ClientListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ["id", "name", "phone", "email", "balance_fcfa", "portal_token", "created_at"]
