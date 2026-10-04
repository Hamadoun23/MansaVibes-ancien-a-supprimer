from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Employee(TimeStampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="employee"
    )
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, blank=True, default="")
    role_title = models.CharField(max_length=255, blank=True, default="")
    monthly_salary_fcfa = models.BigIntegerField(default=0)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["name"])]

    def __str__(self) -> str:
        return self.name


class StaffTask(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        IN_PROGRESS = "in_progress", "En cours"
        DONE = "done", "Terminé"

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    due_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["due_date", "-created_at"]

    def __str__(self) -> str:
        return self.title


class StaffPerformance(TimeStampedModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="performances")
    period_year = models.PositiveIntegerField()
    period_month = models.PositiveSmallIntegerField()
    completed_tasks = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "period_year", "period_month"], name="staff_perf_period_unique"
            )
        ]
        ordering = ["-period_year", "-period_month"]

    def __str__(self) -> str:
        return f"{self.employee.name} — {self.period_month}/{self.period_year}"
