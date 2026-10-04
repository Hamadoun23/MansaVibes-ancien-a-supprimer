from django.utils.crypto import get_random_string
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class PhoneTokenObtainPairSerializer(TokenObtainPairSerializer):
    """SimpleJWT already uses USERNAME_FIELD (phone) — this just enriches the
    response with the user's profile so the frontend doesn't need a second call."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class UserSerializer(serializers.ModelSerializer):
    is_tailleur = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "phone", "role", "is_tailleur"]
        read_only_fields = ["id", "role"]


class UserManageSerializer(serializers.ModelSerializer):
    """For the owner-only account management screen: create/edit staff logins."""

    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "name", "phone", "role", "is_active", "password"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        user.set_password(password or get_random_string(12))
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
