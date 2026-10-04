from django.contrib import admin

from .models import CommerceCartItem, Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "price_fcfa", "is_active"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline]


@admin.register(CommerceCartItem)
class CommerceCartItemAdmin(admin.ModelAdmin):
    list_display = ["session_id", "product", "quantity"]
