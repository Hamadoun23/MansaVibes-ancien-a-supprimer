from django.db import models

from apps.core.models import TimeStampedModel


class NotificationLog(TimeStampedModel):
    class Channel(models.TextChoices):
        WHATSAPP = "whatsapp", "WhatsApp"
        SMS = "sms", "SMS"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        SENT = "sent", "Envoyé"
        FAILED = "failed", "Échec"

    channel = models.CharField(max_length=16, choices=Channel.choices, default=Channel.WHATSAPP)
    recipient = models.CharField(max_length=64)
    body = models.TextField(blank=True, default="")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    meta = models.JSONField(blank=True, default=dict)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["channel", "status"])]

    def __str__(self) -> str:
        return f"{self.channel} → {self.recipient} ({self.status})"
