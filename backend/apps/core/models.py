from django.db import models


class TimeStampedModel(models.Model):
    """Adds created_at / updated_at, mirroring Laravel's timestamps()."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AppSettings(models.Model):
    """Singleton row holding the business identity + free-form settings.

    Single-tenant app (multi-tenancy was deliberately removed on the Laravel
    side, keeping only one business) — this replaces the old `tenants` table.
    """

    business_name = models.CharField(max_length=255, blank=True, default="Mansa Vibes")
    phone = models.CharField(max_length=32, blank=True, default="")
    address = models.CharField(max_length=255, blank=True, default="")
    settings = models.JSONField(blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "App settings"
        verbose_name_plural = "App settings"

    def __str__(self) -> str:
        return self.business_name or "Mansa Vibes"

    @classmethod
    def load(cls) -> "AppSettings":
        obj, _ = cls.objects.get_or_create(pk=1, defaults={"business_name": "Mansa Vibes"})
        return obj
