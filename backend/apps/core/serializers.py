from rest_framework import serializers

from .models import AppSettings


class AppSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppSettings
        fields = ["business_name", "phone", "address", "settings"]
