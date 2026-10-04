from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ["name"]
    list_display = ["name", "phone", "role", "is_staff", "is_active"]
    search_fields = ["name", "phone"]
    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        ("Informations", {"fields": ("name", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("phone", "name", "role", "password1", "password2")}),
    )
    readonly_fields = ["date_joined"]
