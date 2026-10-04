"""Business tools the voice assistant can use.

Read tools run immediately during the model's loop. Write tools are never run
by the model: they come back to the phone as action cards the user confirms
with one tap (a mis-heard amount must not land in the books silently), then
`execute_action` runs them with the user's own role checks.
"""

import re
from datetime import date
from urllib.parse import quote

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.clients.models import Client, ClientMeasurement
from apps.core.models import AppSettings
from apps.orders.models import MeasurementFormTemplate, Order, OrderItem, OrderStatusHistory
from apps.orders.services import record_payment


def _nullable(t: str) -> dict:
    return {"type": [t, "null"]}


def _tool(name: str, description: str, properties: dict) -> dict:
    return {
        "name": name,
        "description": description,
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": properties,
            "required": list(properties),
            "additionalProperties": False,
        },
    }


PAYMENT_METHODS = ["cash", "orange_money", "wave", "bank_transfer"]
STATUSES = ["pending", "in_progress", "done", "validated", "delivered"]

READ_TOOLS = [
    _tool(
        "chercher_clients",
        "Cherche des clients par nom ou téléphone (recherche partielle). À utiliser avant toute action sur un "
        "client existant pour obtenir son client_id.",
        {"recherche": {"type": "string"}},
    ),
    _tool(
        "voir_client",
        "Détail d'un client : téléphone, mesures enregistrées et commandes en cours.",
        {"client_id": {"type": "integer"}},
    ),
    _tool(
        "chercher_commandes",
        "Liste des commandes. Filtre optionnel par texte (référence, client, modèle) et/ou statut.",
        {"recherche": _nullable("string"), "statut": {"type": ["string", "null"], "enum": STATUSES + [None]}},
    ),
    _tool(
        "resume_du_jour",
        "Résumé de la journée : commandes en retard, à livrer aujourd'hui, prêtes à retirer, reste à encaisser.",
        {},
    ),
]

WRITE_TOOLS = [
    _tool(
        "creer_client",
        "Propose la création d'un nouveau client (vérifier d'abord qu'il n'existe pas avec chercher_clients).",
        {"nom": {"type": "string"}, "telephone": _nullable("string"), "notes": _nullable("string")},
    ),
    _tool(
        "enregistrer_mesures",
        "Propose d'enregistrer des mesures pour un client. client_id si le client existe, sinon null et "
        "client_nom identique à celui d'une création proposée juste avant. modele_mesure_id : un des modèles "
        "de mesure fournis (null si aucun ne convient). Chaque mesure a un libellé lisible et une valeur en cm.",
        {
            "client_id": _nullable("integer"),
            "client_nom": {"type": "string"},
            "modele_mesure_id": _nullable("integer"),
            "libelle": {"type": "string"},
            "mesures": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "cle": {"type": "string"},
                        "libelle": {"type": "string"},
                        "valeur": {"type": "number"},
                    },
                    "required": ["cle", "libelle", "valeur"],
                    "additionalProperties": False,
                },
            },
        },
    ),
    _tool(
        "creer_commande",
        "Propose une nouvelle commande. client_id si le client existe, sinon null avec client_nom d'une "
        "création proposée. date_livraison au format AAAA-MM-JJ. Montants en FCFA entiers.",
        {
            "client_id": _nullable("integer"),
            "client_nom": {"type": "string"},
            "modele_tenue": {"type": "string"},
            "modele_mesure_id": _nullable("integer"),
            "quantite": {"type": "integer"},
            "prix_total_fcfa": {"type": "integer"},
            "acompte_fcfa": {"type": "integer"},
            "mode_paiement": {"type": ["string", "null"], "enum": PAYMENT_METHODS + [None]},
            "date_livraison": _nullable("string"),
            "client_fournit_tissu": {"type": "boolean"},
            "notes": _nullable("string"),
        },
    ),
    _tool(
        "encaisser",
        "Propose d'enregistrer un paiement reçu sur une commande existante (référence CMD-…).",
        {
            "reference": {"type": "string"},
            "montant_fcfa": {"type": "integer"},
            "mode_paiement": {"type": ["string", "null"], "enum": PAYMENT_METHODS + [None]},
        },
    ),
    _tool(
        "changer_statut",
        "Propose de changer le statut d'une commande : pending=reçue, in_progress=en couture, done=prête, "
        "validated=essayage validé, delivered=livrée.",
        {"reference": {"type": "string"}, "statut": {"type": "string", "enum": STATUSES}},
    ),
    _tool(
        "message_whatsapp",
        "Prépare un message WhatsApp à envoyer au client (l'utilisateur l'envoie lui-même). Ajoute le lien de "
        "suivi si utile en écrivant {lien_suivi} dans le texte.",
        {"client_id": {"type": "integer"}, "message": {"type": "string"}},
    ),
]

WRITE_TOOL_NAMES = {t["name"] for t in WRITE_TOOLS}
OWNER_ONLY = {"creer_commande", "encaisser", "changer_statut"}


def _order_line(o: Order) -> dict:
    return {
        "reference": o.reference,
        "client": o.client.name,
        "client_id": o.client_id,
        "modele": o.model_name,
        "statut": Order.Status(o.status).label,
        "livraison": o.due_date.isoformat() if o.due_date else None,
        "total_fcfa": o.total_fcfa,
        "reste_fcfa": o.balance_due_fcfa,
    }


def run_read_tool(name: str, args: dict) -> dict | list:
    if name == "chercher_clients":
        q = (args.get("recherche") or "").strip()
        digits = re.sub(r"\D", "", q)
        filters = Q(name__icontains=q)
        if len(digits) >= 4:
            filters |= Q(phone__contains=digits)
        return [{"client_id": c.id, "nom": c.name, "telephone": c.phone} for c in Client.objects.filter(filters)[:8]]

    if name == "voir_client":
        c = Client.objects.filter(pk=args["client_id"]).first()
        if not c:
            return {"erreur": "Client introuvable"}
        return {
            "client_id": c.id,
            "nom": c.name,
            "telephone": c.phone,
            "notes": c.notes,
            "mesures": [
                {"libelle": m.label, "valeurs": [f"{r['label']}: {r['value']} {r['unit']}" for r in m.display_rows()]}
                for m in c.measurements.all()[:5]
            ],
            "commandes": [_order_line(o) for o in c.orders.exclude(status="delivered").select_related("client")[:10]],
        }

    if name == "chercher_commandes":
        qs = Order.objects.select_related("client")
        if args.get("recherche"):
            q = args["recherche"]
            qs = qs.filter(Q(reference__icontains=q) | Q(client__name__icontains=q) | Q(model_name__icontains=q))
        if args.get("statut"):
            qs = qs.filter(status=args["statut"])
        return [_order_line(o) for o in qs[:15]]

    if name == "resume_du_jour":
        today = timezone.localdate()
        active = Order.objects.exclude(status="delivered").select_related("client")
        in_work = ["pending", "in_progress"]
        return {
            "en_retard": [_order_line(o) for o in active.filter(status__in=in_work, due_date__lt=today)[:10]],
            "a_livrer_aujourdhui": [_order_line(o) for o in active.filter(status__in=in_work, due_date=today)],
            "pretes": [_order_line(o) for o in active.filter(status__in=["done", "validated"])[:10]],
            "reste_a_encaisser_fcfa": sum(o.balance_due_fcfa for o in active),
        }

    return {"erreur": f"Outil inconnu : {name}"}


def summarize_action(name: str, args: dict) -> str:
    """Human-readable line for the confirmation card."""
    fcfa = lambda n: f"{(n or 0):,}".replace(",", " ") + " FCFA"  # noqa: E731
    if name == "creer_client":
        return f"Nouveau client : {args['nom']}" + (f" · {args['telephone']}" if args.get("telephone") else "")
    if name == "enregistrer_mesures":
        values = ", ".join(f"{m['libelle']} {m['valeur']:g}" for m in args["mesures"])
        return f"Mesures de {args['client_nom']} ({args['libelle']}) : {values}"
    if name == "creer_commande":
        parts = [f"Commande {args['modele_tenue']} pour {args['client_nom']}", fcfa(args["prix_total_fcfa"])]
        if args.get("acompte_fcfa"):
            parts.append(f"acompte {fcfa(args['acompte_fcfa'])}")
        if args.get("date_livraison"):
            parts.append(f"livraison le {args['date_livraison']}")
        return " · ".join(parts)
    if name == "encaisser":
        return f"Encaisser {fcfa(args['montant_fcfa'])} sur {args['reference']}"
    if name == "changer_statut":
        return f"{args['reference']} → {Order.Status(args['statut']).label}"
    if name == "message_whatsapp":
        return f"Message WhatsApp : « {args['message'][:120]} »"
    return name


def _resolve_client(args: dict) -> Client:
    if args.get("client_id"):
        return Client.objects.get(pk=args["client_id"])
    client = Client.objects.filter(name__iexact=args["client_nom"].strip()).order_by("-created_at").first()
    if not client:
        raise ValueError(f"Client « {args['client_nom']} » introuvable — créez-le d'abord.")
    return client


def _wa_link(phone: str, text: str) -> str:
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 8:  # Malian local number
        digits = "223" + digits
    return f"https://wa.me/{digits}?text={quote(text)}"


@transaction.atomic
def execute_action(name: str, args: dict, user, origin: str) -> dict:
    """Runs one confirmed action. Returns {message, link?, url?}."""
    if name not in WRITE_TOOL_NAMES:
        raise ValueError("Action inconnue.")
    if name in OWNER_ONLY and getattr(user, "role", None) == "tailleur":
        raise PermissionError("Votre rôle ne permet pas cette action.")

    if name == "creer_client":
        client = Client.objects.create(
            name=args["nom"].strip(), phone=args.get("telephone") or "", notes=args.get("notes") or ""
        )
        return {"message": f"Client {client.name} créé.", "url": f"/clients/{client.id}"}

    if name == "enregistrer_mesures":
        client = _resolve_client(args)
        template = MeasurementFormTemplate.objects.filter(pk=args.get("modele_mesure_id")).first()
        if template:
            keys = {f["key"] for f in template.normalized_fields()}
            data = {m["cle"]: m["valeur"] for m in args["mesures"] if m["cle"] in keys}
            extra = [m for m in args["mesures"] if m["cle"] not in keys]
        else:
            data, extra = {}, args["mesures"]
        ClientMeasurement.objects.create(
            client=client,
            measurement_template=template,
            label=args["libelle"] or "Défaut",
            data=data,
            custom_measures=[{"label": m["libelle"], "value": str(m["valeur"]), "unit": "cm"} for m in extra],
        )
        return {"message": f"Mesures de {client.name} enregistrées.", "url": f"/clients/{client.id}"}

    if name == "creer_commande":
        client = _resolve_client(args)
        due = date.fromisoformat(args["date_livraison"]) if args.get("date_livraison") else None
        qty = max(1, args.get("quantite") or 1)
        order = Order.objects.create(
            client=client,
            model_name=args["modele_tenue"],
            measurement_template_id=args.get("modele_mesure_id"),
            due_date=due,
            payment_method=args.get("mode_paiement") or "",
            notes=args.get("notes") or "",
        )
        OrderItem.objects.create(
            order=order,
            description=args["modele_tenue"],
            quantity=qty,
            unit_price_fcfa=round(args["prix_total_fcfa"] / qty),
            measurement_template_id=args.get("modele_mesure_id"),
            client_supplies_fabric=args.get("client_fournit_tissu", False),
        )
        OrderStatusHistory.objects.create(order=order, status=order.status, user=user)
        order.recalculate_totals()
        if args.get("acompte_fcfa"):
            record_payment(order, args["acompte_fcfa"], args.get("mode_paiement"))
        return {"message": f"Commande {order.reference} créée.", "url": f"/orders/{order.id}"}

    if name == "encaisser":
        order = Order.objects.select_related("client").get(reference__iexact=args["reference"].strip())
        record_payment(order, args["montant_fcfa"], args.get("mode_paiement"))
        return {"message": f"{args['montant_fcfa']} FCFA encaissés sur {order.reference}.", "url": f"/orders/{order.id}"}

    if name == "changer_statut":
        order = Order.objects.get(reference__iexact=args["reference"].strip())
        order.status = args["statut"]
        order.save(update_fields=["status", "updated_at"])
        OrderStatusHistory.objects.create(order=order, status=order.status, user=user)
        return {"message": f"{order.reference} : {order.get_status_display()}.", "url": f"/orders/{order.id}"}

    # message_whatsapp
    client = Client.objects.get(pk=args["client_id"])
    text = args["message"].replace("{lien_suivi}", f"{origin}/suivi/{client.portal_token}")
    return {"message": "Message prêt.", "link": _wa_link(client.phone, text)}


def shop_context() -> dict:
    shop = AppSettings.load()
    return {"atelier": shop.business_name}
