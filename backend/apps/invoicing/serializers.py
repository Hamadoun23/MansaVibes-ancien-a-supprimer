from rest_framework import serializers

from .models import Invoice, InvoiceItem, Payment, Quote, QuoteItem


class QuoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = ["id", "description", "quantity", "unit_price_fcfa"]
        read_only_fields = ["id"]


class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, required=False)
    client_name = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = Quote
        fields = ["id", "client", "client_name", "status", "total_fcfa", "valid_until", "items", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        quote = Quote.objects.create(**validated_data)
        for item_data in items_data:
            QuoteItem.objects.create(quote=quote, **item_data)
        return quote


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ["id", "description", "quantity", "unit_price_fcfa"]
        read_only_fields = ["id"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "invoice", "amount_fcfa", "paid_at", "method"]
        read_only_fields = ["id", "paid_at"]


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)
    payments = PaymentSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    paid_fcfa = serializers.IntegerField(read_only=True)
    balance_due_fcfa = serializers.IntegerField(read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "client",
            "client_name",
            "order",
            "number",
            "status",
            "total_fcfa",
            "paid_fcfa",
            "balance_due_fcfa",
            "items",
            "payments",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        return invoice
