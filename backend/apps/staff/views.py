from rest_framework import viewsets

from apps.core.permissions import IsNotTailleur

from .models import Employee, StaffPerformance, StaffTask
from .serializers import EmployeeSerializer, StaffPerformanceSerializer, StaffTaskSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("user").prefetch_related("tasks").all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsNotTailleur]
    search_fields = ["name", "phone"]


class StaffTaskViewSet(viewsets.ModelViewSet):
    queryset = StaffTask.objects.select_related("employee").all()
    serializer_class = StaffTaskSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["employee", "status"]


class StaffPerformanceViewSet(viewsets.ModelViewSet):
    queryset = StaffPerformance.objects.select_related("employee").all()
    serializer_class = StaffPerformanceSerializer
    permission_classes = [IsNotTailleur]
    filterset_fields = ["employee", "period_year", "period_month"]
