from rest_framework import viewsets

from apps.core.permissions import IsNotTailleur

from .models import CommerceCartItem, Product
from .serializers import CommerceCartItemSerializer, ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.prefetch_related("images").all()
    serializer_class = ProductSerializer
    permission_classes = [IsNotTailleur]
    search_fields = ["name"]
    filterset_fields = ["is_active"]


class CommerceCartItemViewSet(viewsets.ModelViewSet):
    queryset = CommerceCartItem.objects.select_related("product").all()
    serializer_class = CommerceCartItemSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["session_id"]
