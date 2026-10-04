from datetime import date, timedelta

from django.core.management.base import BaseCommand

from apps.clients.models import Client, ClientMeasurement
from apps.core.models import AppSettings
from apps.finance.models import CashMovement, FinanceCategory
from apps.inventory.models import InventoryItem, Supplier
from apps.orders.models import MeasurementFormTemplate, Order, OrderItem
from apps.staff.models import Employee


class Command(BaseCommand):
    help = "Seed the database with demo data for VP / Mansa Vibes (local dev only)."

    def handle(self, *args, **options):
        settings_row = AppSettings.load()
        settings_row.business_name = "Vêtement Palace"
        settings_row.save(update_fields=["business_name"])

        template, _ = MeasurementFormTemplate.objects.get_or_create(
            name="Boubou homme",
            defaults={
                "slug": "boubou-homme",
                "reference_price_fcfa": 45000,
                "fields": [
                    {"key": "poitrine", "label": "Poitrine", "unit": "cm", "type": "number"},
                    {"key": "longueur", "label": "Longueur", "unit": "cm", "type": "number"},
                    {"key": "epaule", "label": "Épaule", "unit": "cm", "type": "number"},
                ],
            },
        )

        supplier, _ = Supplier.objects.get_or_create(
            name="Tissus Dakar Import", defaults={"phone": "+2210102030405"}
        )
        fabric, _ = InventoryItem.objects.get_or_create(
            name="Bazin riche bleu roi",
            defaults={
                "supplier": supplier,
                "stock_type": InventoryItem.StockType.FABRIC,
                "unit": "mètre",
                "quantity_on_hand": 120,
                "reorder_level": 20,
                "quality_label": "Premium",
            },
        )

        employee, _ = Employee.objects.get_or_create(
            name="Fatou Diop", defaults={"role_title": "Tailleuse", "phone": "+2210605040302"}
        )

        client, _ = Client.objects.get_or_create(
            name="Moussa Traoré", defaults={"phone": "+2210708091011"}
        )
        ClientMeasurement.objects.get_or_create(
            client=client,
            label="Défaut",
            defaults={"measurement_template": template, "data": {"poitrine": 102, "longueur": 145, "epaule": 48}},
        )

        order, created = Order.objects.get_or_create(
            reference="CMD-0001",
            defaults={
                "client": client,
                "model_name": "Boubou brodé",
                "measurement_template": template,
                "status": Order.Status.IN_PROGRESS,
                "due_date": date.today() + timedelta(days=7),
                "assignee": employee,
                "advance_payment_fcfa": 15000,
                "payment_method": Order.PaymentMethod.ORANGE_MONEY,
            },
        )
        if created:
            OrderItem.objects.create(
                order=order,
                inventory_item=fabric,
                measurement_template=template,
                description="Boubou brodé — bazin riche bleu roi",
                quantity=1,
                unit_price_fcfa=45000,
            )
            order.recalculate_totals()

        expense_cat, _ = FinanceCategory.objects.get_or_create(
            name="Achat tissu", defaults={"type": FinanceCategory.Type.EXPENSE}
        )
        income_cat, _ = FinanceCategory.objects.get_or_create(
            name="Vente commande", defaults={"type": FinanceCategory.Type.INCOME}
        )
        CashMovement.objects.get_or_create(
            label="Acompte commande CMD-0001",
            movement_date=date.today(),
            defaults={"direction": CashMovement.Direction.IN, "amount_fcfa": 15000, "category": income_cat},
        )
        CashMovement.objects.get_or_create(
            label="Achat bazin riche",
            movement_date=date.today() - timedelta(days=2),
            defaults={"direction": CashMovement.Direction.OUT, "amount_fcfa": 60000, "category": expense_cat},
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))
