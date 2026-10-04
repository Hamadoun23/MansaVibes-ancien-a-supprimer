import secrets

from django.db import models

from apps.core.models import TimeStampedModel


def generate_portal_token() -> str:
    """Unguessable token for the client's public tracking page (/suivi/<token>)."""
    return secrets.token_urlsafe(16)


class Client(TimeStampedModel):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    balance_fcfa = models.BigIntegerField(default=0)
    portal_token = models.CharField(max_length=32, unique=True, default=generate_portal_token, editable=False)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["name"])]

    def __str__(self) -> str:
        return self.name


class ClientMeasurement(TimeStampedModel):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="measurements")
    measurement_template = models.ForeignKey(
        "orders.MeasurementFormTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="client_measurements",
    )
    label = models.CharField(max_length=255, default="Défaut")
    data = models.JSONField(blank=True, default=dict)

    # Legacy free-form fields, kept for garments that don't use a template.
    poitrine_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    taille_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    hanche_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    longueur_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    epaule_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    custom_measures = models.JSONField(blank=True, default=list)
    measurement_notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.client.name} — {self.label}"

    def display_rows(self) -> list[dict]:
        """Rows to render: template fields when set, else the legacy columns,
        followed by any free-form extra measures (e.g. dictated to the assistant)."""
        extras = [
            {"label": m.get("label", ""), "value": m.get("value", ""), "unit": m.get("unit", "")}
            for m in (self.custom_measures or [])
            if isinstance(m, dict) and m.get("value") not in (None, "")
        ]
        if self.measurement_template_id:
            rows = []
            for field in self.measurement_template.normalized_fields():
                value = self.data.get(field["key"])
                if value in (None, ""):
                    continue
                rows.append({"label": field["label"], "value": value, "unit": field["unit"]})
            return rows + extras

        legacy = {
            "poitrine_cm": "Poitrine",
            "taille_cm": "Taille",
            "hanche_cm": "Hanche",
            "longueur_cm": "Longueur",
            "epaule_cm": "Épaule",
        }
        rows = []
        for attr, label in legacy.items():
            value = getattr(self, attr)
            if value not in (None, ""):
                rows.append({"label": label, "value": value, "unit": "cm"})
        return rows + extras
