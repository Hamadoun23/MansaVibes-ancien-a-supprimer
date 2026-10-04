from rest_framework import serializers

from .models import (
    MeasurementFormTemplate,
    Order,
    OrderAssignment,
    OrderImage,
    OrderItem,
    OrderStatusHistory,
)


class MeasurementFormTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasurementFormTemplate
        fields = [
            "id",
            "name",
            "slug",
            "notes",
            "fields",
            "sort_order",
            "is_active",
            "reference_price_fcfa",
        ]
        read_only_fields = ["id"]


class OrderItemSerializer(serializers.ModelSerializer):
    line_gross_fcfa = serializers.IntegerField(read_only=True)
    line_net_fcfa = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "inventory_item",
            "inventory_characteristic_key",
            "inventory_consumed_meters",
            "measurement_template",
            "description",
            "quantity",
            "unit_price_fcfa",
            "discount_fcfa",
            "discount_applies",
            "client_supplies_fabric",
            "line_gross_fcfa",
            "line_net_fcfa",
        ]
        read_only_fields = ["id"]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ["id", "status", "note", "user", "created_at"]
        read_only_fields = ["id", "created_at"]


class OrderImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderImage
        fields = ["id", "image", "caption", "sort_order"]
        read_only_fields = ["id"]


class OrderAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderAssignment
        fields = ["id", "employee", "role"]
        read_only_fields = ["id"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)
    status_histories = OrderStatusHistorySerializer(many=True, read_only=True)
    images = OrderImageSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    client_phone = serializers.CharField(source="client.phone", read_only=True)
    client_portal_token = serializers.CharField(source="client.portal_token", read_only=True)
    balance_due_fcfa = serializers.IntegerField(read_only=True)
    is_fully_paid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "client",
            "client_name",
            "client_phone",
            "client_portal_token",
            "reference",
            "model_name",
            "measurement_template",
            "status",
            "due_date",
            "assignee",
            "total_fcfa",
            "advance_payment_fcfa",
            "balance_due_fcfa",
            "is_fully_paid",
            "payment_method",
            "delivery_mode",
            "discount_scope",
            "order_discount_fcfa",
            "discount_percent",
            "model_notes",
            "notes",
            "inventory_deducted_at",
            "items",
            "status_histories",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "inventory_deducted_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        OrderStatusHistory.objects.create(
            order=order, status=order.status, user=self.context["request"].user
        )
        order.recalculate_totals()
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        previous_status = instance.status

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                OrderItem.objects.create(order=instance, **item_data)

        if instance.status != previous_status:
            OrderStatusHistory.objects.create(
                order=instance, status=instance.status, user=self.context["request"].user
            )

        instance.recalculate_totals()
        return instance


class OrderListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    client_phone = serializers.CharField(source="client.phone", read_only=True)
    client_portal_token = serializers.CharField(source="client.portal_token", read_only=True)
    balance_due_fcfa = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "reference",
            "client",
            "client_name",
            "client_phone",
            "client_portal_token",
            "model_name",
            "status",
            "due_date",
            "total_fcfa",
            "advance_payment_fcfa",
            "balance_due_fcfa",
            "created_at",
        ]


class OrderPaymentSerializer(serializers.Serializer):
    amount_fcfa = serializers.IntegerField(min_value=1)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices, required=False, allow_blank=True)
