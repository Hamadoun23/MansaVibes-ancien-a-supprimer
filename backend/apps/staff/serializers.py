from rest_framework import serializers

from .models import Employee, StaffPerformance, StaffTask


class StaffTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffTask
        fields = ["id", "employee", "title", "status", "due_date"]
        read_only_fields = ["id"]


class StaffPerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffPerformance
        fields = ["id", "employee", "period_year", "period_month", "completed_tasks"]
        read_only_fields = ["id"]


class EmployeeSerializer(serializers.ModelSerializer):
    tasks = StaffTaskSerializer(many=True, read_only=True)

    class Meta:
        model = Employee
        fields = [
            "id",
            "user",
            "name",
            "phone",
            "role_title",
            "monthly_salary_fcfa",
            "tasks",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
