from rest_framework import serializers

from .models import CommerceCartItem, Product, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "sort_order"]
        read_only_fields = ["id"]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "slug", "price_fcfa", "description", "is_active", "images"]
        read_only_fields = ["id"]


class CommerceCartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommerceCartItem
        fields = ["id", "session_id", "product", "quantity"]
        read_only_fields = ["id"]
