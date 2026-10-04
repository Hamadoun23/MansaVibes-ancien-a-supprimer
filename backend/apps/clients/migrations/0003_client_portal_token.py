import secrets

from django.db import migrations, models

import apps.clients.models


def fill_tokens(apps, schema_editor):
    Client = apps.get_model("clients", "Client")
    for client in Client.objects.filter(portal_token__isnull=True):
        client.portal_token = secrets.token_urlsafe(16)
        client.save(update_fields=["portal_token"])


class Migration(migrations.Migration):
    dependencies = [("clients", "0002_initial")]

    operations = [
        migrations.AddField(
            model_name="client",
            name="portal_token",
            field=models.CharField(max_length=32, null=True, editable=False),
        ),
        migrations.RunPython(fill_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="client",
            name="portal_token",
            field=models.CharField(
                max_length=32, unique=True, default=apps.clients.models.generate_portal_token, editable=False
            ),
        ),
    ]
