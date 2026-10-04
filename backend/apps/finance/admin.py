from django.contrib import admin

from .models import CashMovement, DailyCashClosure, FinanceCategory, FixedAsset


@admin.register(FinanceCategory)
class FinanceCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "type", "sort_order"]
    list_filter = ["type"]


@admin.register(CashMovement)
class CashMovementAdmin(admin.ModelAdmin):
    list_display = ["label", "direction", "amount_fcfa", "movement_date", "category"]
    list_filter = ["direction", "category"]
    date_hierarchy = "movement_date"


@admin.register(DailyCashClosure)
class DailyCashClosureAdmin(admin.ModelAdmin):
    list_display = ["closed_on", "opening_fcfa", "closing_fcfa"]


@admin.register(FixedAsset)
class FixedAssetAdmin(admin.ModelAdmin):
    list_display = ["name", "acquisition_date", "amount_fcfa", "useful_life_months"]
