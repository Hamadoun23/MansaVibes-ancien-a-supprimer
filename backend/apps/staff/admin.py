from django.contrib import admin

from .models import Employee, StaffPerformance, StaffTask


class StaffTaskInline(admin.TabularInline):
    model = StaffTask
    extra = 0


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ["name", "role_title", "phone", "monthly_salary_fcfa", "user"]
    search_fields = ["name", "phone"]
    inlines = [StaffTaskInline]


@admin.register(StaffTask)
class StaffTaskAdmin(admin.ModelAdmin):
    list_display = ["title", "employee", "status", "due_date"]
    list_filter = ["status"]


@admin.register(StaffPerformance)
class StaffPerformanceAdmin(admin.ModelAdmin):
    list_display = ["employee", "period_year", "period_month", "completed_tasks"]
