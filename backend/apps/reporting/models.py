from django.db import models

from apps.core.models import TimeStampedModel


class ReportingSnapshot(TimeStampedModel):
    period_start = models.DateField()
    period_end = models.DateField()
    metrics = models.JSONField(default=dict)

    class Meta:
        ordering = ["-period_end"]
        indexes = [models.Index(fields=["period_start", "period_end"])]

    def __str__(self) -> str:
        return f"{self.period_start} → {self.period_end}"
