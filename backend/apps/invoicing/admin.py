from django.contrib import admin

from .models import Invoice, InvoiceItem, Payment, Quote, QuoteItem


class QuoteItemInline(admin.TabularInline):
    model = QuoteItem
    extra = 0


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ["id", "client", "status", "total_fcfa", "valid_until"]
    list_filter = ["status"]
    inlines = [QuoteItemInline]


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ["number", "client", "status", "total_fcfa", "balance_due_fcfa"]
    list_filter = ["status"]
    search_fields = ["number", "client__name"]
    inlines = [InvoiceItemInline, PaymentInline]
