from rest_framework import serializers

from .models import ReportingSnapshot


class ReportingSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportingSnapshot
        fields = ["id", "period_start", "period_end", "metrics"]
        read_only_fields = ["id"]
