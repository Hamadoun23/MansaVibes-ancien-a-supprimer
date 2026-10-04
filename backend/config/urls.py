from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import UserViewSet
from apps.clients.public_views import client_portal
from apps.clients.views import ClientMeasurementViewSet, ClientViewSet
from apps.commerce.views import CommerceCartItemViewSet, ProductViewSet
from apps.communications.views import NotificationLogViewSet
from apps.core.views import AppSettingsView
from apps.finance.views import (
    CashMovementViewSet,
    DailyCashClosureViewSet,
    FinanceCategoryViewSet,
    FixedAssetViewSet,
)
from apps.inventory.views import (
    InventoryFormTemplateViewSet,
    InventoryItemViewSet,
    StockAlertViewSet,
    StockMovementViewSet,
    SupplierViewSet,
)
from apps.invoicing.views import InvoiceViewSet, PaymentViewSet, QuoteViewSet
from apps.orders.views import MeasurementFormTemplateViewSet, OrderAssignmentViewSet, OrderViewSet, today_overview
from apps.reporting.views import ReportingSnapshotViewSet, dashboard_overview
from apps.staff.views import EmployeeViewSet, StaffPerformanceViewSet, StaffTaskViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("clients", ClientViewSet, basename="client")
router.register("client-measurements", ClientMeasurementViewSet, basename="client-measurement")
router.register("measurement-templates", MeasurementFormTemplateViewSet, basename="measurement-template")
router.register("orders", OrderViewSet, basename="order")
router.register("order-assignments", OrderAssignmentViewSet, basename="order-assignment")
router.register("employees", EmployeeViewSet, basename="employee")
router.register("staff-tasks", StaffTaskViewSet, basename="staff-task")
router.register("staff-performances", StaffPerformanceViewSet, basename="staff-performance")
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("inventory-form-templates", InventoryFormTemplateViewSet, basename="inventory-form-template")
router.register("inventory-items", InventoryItemViewSet, basename="inventory-item")
router.register("stock-movements", StockMovementViewSet, basename="stock-movement")
router.register("stock-alerts", StockAlertViewSet, basename="stock-alert")
router.register("finance-categories", FinanceCategoryViewSet, basename="finance-category")
router.register("cash-movements", CashMovementViewSet, basename="cash-movement")
router.register("daily-cash-closures", DailyCashClosureViewSet, basename="daily-cash-closure")
router.register("fixed-assets", FixedAssetViewSet, basename="fixed-asset")
router.register("quotes", QuoteViewSet, basename="quote")
router.register("invoices", InvoiceViewSet, basename="invoice")
router.register("payments", PaymentViewSet, basename="payment")
router.register("products", ProductViewSet, basename="product")
router.register("cart-items", CommerceCartItemViewSet, basename="cart-item")
router.register("reporting-snapshots", ReportingSnapshotViewSet, basename="reporting-snapshot")
router.register("notifications", NotificationLogViewSet, basename="notification")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/dashboard/overview/", dashboard_overview, name="dashboard-overview"),
    path("api/v1/assistant/", include("apps.assistant.urls")),
    path("api/v1/today/", today_overview, name="today-overview"),
    path("api/v1/public/portal/<str:token>/", client_portal, name="client-portal"),
    path("api/v1/app-settings/", AppSettingsView.as_view(), name="app-settings"),
    path("api/v1/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
