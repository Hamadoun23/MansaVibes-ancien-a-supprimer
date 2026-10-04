from django.contrib import admin

from .models import ReportingSnapshot


@admin.register(ReportingSnapshot)
class ReportingSnapshotAdmin(admin.ModelAdmin):
    list_display = ["period_start", "period_end"]
