"""Thin wrapper around Meta's WhatsApp Cloud API, mirroring the Laravel
WhatsAppCloudService. Falls back to just logging (status=pending) when no
credentials are configured, so the rest of the app keeps working in dev."""

import re

import requests
from django.conf import settings

from .models import NotificationLog


def _digits_only(phone: str) -> str:
    return re.sub(r"\D+", "", phone or "")


def _send_whatsapp_text(recipient_phone: str, body: str) -> NotificationLog:
    digits = _digits_only(recipient_phone)
    log = NotificationLog.objects.create(
        channel=NotificationLog.Channel.WHATSAPP,
        recipient=digits,
        body=body,
        status=NotificationLog.Status.PENDING,
    )

    token = settings.WHATSAPP_CLOUD_TOKEN
    phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
    if not token or not phone_number_id or not digits:
        log.status = NotificationLog.Status.FAILED
        log.meta = {"error": "WhatsApp not configured or missing recipient phone"}
        log.save(update_fields=["status", "meta"])
        return log

    try:
        response = requests.post(
            f"https://graph.facebook.com/v20.0/{phone_number_id}/messages",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "messaging_product": "whatsapp",
                "to": digits,
                "type": "text",
                "text": {"body": body},
            },
            timeout=15,
        )
        response.raise_for_status()
        log.status = NotificationLog.Status.SENT
        log.meta = response.json()
    except requests.RequestException as exc:  # pragma: no cover - network dependent
        log.status = NotificationLog.Status.FAILED
        log.meta = {"error": str(exc)}

    log.save(update_fields=["status", "meta"])
    return log


def send_order_invoice_whatsapp(order) -> NotificationLog:
    body = (
        f"Facture — commande {order.reference or order.pk}\n"
        f"Total : {order.total_fcfa} FCFA\n"
        f"Acompte versé : {order.advance_payment_fcfa} FCFA\n"
        f"Solde dû : {order.balance_due_fcfa} FCFA"
    )
    return _send_whatsapp_text(order.client.phone, body)


def send_order_receipt_whatsapp(order) -> NotificationLog:
    body = (
        f"Reçu de paiement — commande {order.reference or order.pk}\n"
        f"Montant versé : {order.advance_payment_fcfa} FCFA\n"
        f"Merci pour votre confiance."
    )
    return _send_whatsapp_text(order.client.phone, body)
