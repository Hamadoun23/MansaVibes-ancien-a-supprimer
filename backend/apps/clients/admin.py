from django.contrib import admin

from .models import Client, ClientMeasurement


class ClientMeasurementInline(admin.TabularInline):
    model = ClientMeasurement
    extra = 0
    fields = ["label", "measurement_template", "poitrine_cm", "taille_cm", "hanche_cm"]


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ["name", "phone", "email", "balance_fcfa", "created_at"]
    search_fields = ["name", "phone", "email"]
    inlines = [ClientMeasurementInline]


@admin.register(ClientMeasurement)
class ClientMeasurementAdmin(admin.ModelAdmin):
    list_display = ["client", "label", "measurement_template", "created_at"]
    search_fields = ["client__name", "label"]
