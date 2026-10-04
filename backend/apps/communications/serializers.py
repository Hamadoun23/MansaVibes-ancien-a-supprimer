from rest_framework import serializers

from .models import NotificationLog


class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = ["id", "channel", "recipient", "body", "status", "meta", "created_at"]
        read_only_fields = ["id", "created_at"]
