from types import SimpleNamespace
from unittest import mock

from django.test import override_settings
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.clients.models import Client
from apps.finance.models import CashMovement
from apps.orders.models import Order


def _block(type_, **kw):
    return SimpleNamespace(type=type_, **kw)


class ExecuteActionTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(phone="1", password="x", name="Owner", role="owner")
        self.client.force_authenticate(self.owner)

    def run_action(self, type_, input_):
        return self.client.post("/api/v1/assistant/execute/", {"type": type_, "input": input_}, format="json")

    def test_new_client_then_order_with_deposit(self):
        self.assertEqual(self.run_action("creer_client", {"nom": "Awa Traoré", "telephone": "76123456", "notes": None}).status_code, 200)
        res = self.run_action(
            "creer_commande",
            {
                "client_id": None,
                "client_nom": "awa traoré",
                "modele_tenue": "Boubou bazin",
                "modele_mesure_id": None,
                "quantite": 1,
                "prix_total_fcfa": 45000,
                "acompte_fcfa": 20000,
                "mode_paiement": "wave",
                "date_livraison": "2026-10-20",
                "client_fournit_tissu": True,
                "notes": None,
            },
        )
        self.assertEqual(res.status_code, 200, res.data)
        order = Order.objects.get()
        self.assertEqual((order.total_fcfa, order.balance_due_fcfa), (45000, 25000))
        self.assertEqual(CashMovement.objects.get().amount_fcfa, 20000)

    def test_tailleur_cannot_cash_in(self):
        tailleur = User.objects.create_user(phone="2", password="x", name="T", role="tailleur")
        self.client.force_authenticate(tailleur)
        res = self.run_action("encaisser", {"reference": "CMD-X", "montant_fcfa": 1000, "mode_paiement": None})
        self.assertEqual(res.status_code, 403)

    def test_whatsapp_link_includes_tracking_url(self):
        c = Client.objects.create(name="Awa", phone="76 12 34 56")
        res = self.run_action("message_whatsapp", {"client_id": c.id, "message": "Votre tenue est prête : {lien_suivi}"})
        self.assertTrue(res.data["link"].startswith("https://wa.me/22376123456?text="))
        self.assertIn(c.portal_token, res.data["link"])


@override_settings(ANTHROPIC_API_KEY="test-key")
class AssistantLoopTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(phone="1", password="x", name="Owner", role="owner")
        self.client.force_authenticate(self.owner)
        Client.objects.create(name="Moussa Diarra", phone="70000000")

    @mock.patch("apps.assistant.agent.anthropic.Anthropic")
    def test_read_then_propose(self, anthropic_cls):
        create = anthropic_cls.return_value.beta.messages.create
        create.side_effect = [
            SimpleNamespace(
                stop_reason="tool_use",
                content=[_block("tool_use", id="t1", name="chercher_clients", input={"recherche": "Moussa"})],
            ),
            SimpleNamespace(
                stop_reason="tool_use",
                content=[
                    _block(
                        "tool_use",
                        id="t2",
                        name="encaisser",
                        input={"reference": "CMD-AAAA", "montant_fcfa": 10000, "mode_paiement": "cash"},
                    )
                ],
            ),
            SimpleNamespace(stop_reason="end_turn", content=[_block("text", text="Vérifiez le paiement.")]),
        ]
        res = self.client.post("/api/v1/assistant/", {"text": "Moussa a payé 10 mille"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["reply"], "Vérifiez le paiement.")
        self.assertEqual([a["type"] for a in res.data["actions"]], ["encaisser"])
        # The read tool's result went back to the model (the list is shared, so search it).
        results = [
            block
            for message in create.call_args.kwargs["messages"]
            if isinstance(message["content"], list)
            for block in message["content"]
            if isinstance(block, dict) and block.get("tool_use_id") == "t1"
        ]
        self.assertIn("Moussa Diarra", results[0]["content"])
