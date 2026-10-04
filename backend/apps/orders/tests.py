from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.clients.models import Client
from apps.finance.models import CashMovement

from .models import Order


class OrderFlowTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(phone="70000001", password="x", name="Owner", role="owner")
        self.tailleur = User.objects.create_user(phone="70000002", password="x", name="Tailleur", role="tailleur")
        self.client_obj = Client.objects.create(name="Awa Traoré", phone="76000000")
        self.order = Order.objects.create(client=self.client_obj, model_name="Boubou", total_fcfa=50_000)
        self.client.force_authenticate(self.owner)

    def test_reference_is_generated(self):
        self.assertTrue(self.order.reference.startswith("CMD-"))

    def test_advance_walks_the_flow_and_logs_history(self):
        for expected in ["in_progress", "done", "delivered"]:
            res = self.client.post(f"/api/v1/orders/{self.order.id}/advance/")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.data["status"], expected)
        self.assertEqual(self.client.post(f"/api/v1/orders/{self.order.id}/advance/").status_code, 400)
        self.assertEqual(self.order.status_histories.count(), 3)

    def test_pay_updates_balance_and_cash(self):
        res = self.client.post(
            f"/api/v1/orders/{self.order.id}/pay/", {"amount_fcfa": 20_000, "payment_method": "wave"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["balance_due_fcfa"], 30_000)
        movement = CashMovement.objects.get()
        self.assertEqual((movement.direction, movement.amount_fcfa), ("in", 20_000))

    def test_tailleur_cannot_pay(self):
        self.client.force_authenticate(self.tailleur)
        res = self.client.post(f"/api/v1/orders/{self.order.id}/pay/", {"amount_fcfa": 1000})
        self.assertEqual(res.status_code, 403)

    def test_today_buckets(self):
        today = timezone.localdate()
        self.order.due_date = today - timedelta(days=1)
        self.order.save()
        Order.objects.create(client=self.client_obj, due_date=today, total_fcfa=10_000)
        Order.objects.create(client=self.client_obj, status="done", total_fcfa=5_000)
        res = self.client.get("/api/v1/today/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["late"]), 1)
        self.assertEqual(len(res.data["due_today"]), 1)
        self.assertEqual(len(res.data["ready"]), 1)
        self.assertEqual(res.data["to_collect_fcfa"], 65_000)


class ClientPortalTests(APITestCase):
    def test_portal_is_public_and_scoped_to_token(self):
        awa = Client.objects.create(name="Awa", phone="1")
        other = Client.objects.create(name="Other", phone="2")
        Order.objects.create(client=awa, model_name="Kaftan", total_fcfa=40_000, advance_payment_fcfa=10_000)
        Order.objects.create(client=other, model_name="Secret", total_fcfa=1)

        res = self.client.get(f"/api/v1/public/portal/{awa.portal_token}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual([o["model_name"] for o in res.data["orders"]], ["Kaftan"])
        self.assertEqual(res.data["orders"][0]["balance_due_fcfa"], 30_000)
        self.assertNotIn("phone", res.data["client"])

    def test_unknown_token_is_404(self):
        self.assertEqual(self.client.get("/api/v1/public/portal/nope/").status_code, 404)
