from rest_framework import serializers

from .models import CashMovement, DailyCashClosure, FinanceCategory, FixedAsset


class FinanceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceCategory
        fields = ["id", "name", "type", "sort_order"]
        read_only_fields = ["id"]


class CashMovementSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)

    class Meta:
        model = CashMovement
        fields = [
            "id",
            "category",
            "category_name",
            "direction",
            "amount_fcfa",
            "label",
            "movement_date",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class DailyCashClosureSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyCashClosure
        fields = ["id", "closed_on", "opening_fcfa", "closing_fcfa", "notes"]
        read_only_fields = ["id"]


class FixedAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = FixedAsset
        fields = ["id", "name", "acquisition_date", "amount_fcfa", "useful_life_months", "notes"]
        read_only_fields = ["id"]
