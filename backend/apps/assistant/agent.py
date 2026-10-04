"""The voice assistant's reasoning loop (Claude + the shop's tools).

Each request is rebuilt from the plain-text history the phone sends back, so
the server stays stateless. Inside one request the loop appends the model's
content blocks unchanged between tool calls.
"""

import json

import anthropic
from django.conf import settings
from django.utils import timezone

from apps.orders.models import MeasurementFormTemplate

from .tools import READ_TOOLS, WRITE_TOOL_NAMES, WRITE_TOOLS, run_read_tool, shop_context, summarize_action

MAX_STEPS = 8
JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]

SYSTEM_PROMPT = """Tu es l'assistant d'un atelier de couture au Mali, intégré à l'application de gestion de l'atelier.
L'utilisateur (tailleur ou gérant) te parle souvent par note vocale transcrite automatiquement : la transcription peut
contenir des fautes, des chiffres mal reconnus ou des mots bambara. Interprète avec bon sens.

Ton rôle : transformer ce qu'il dit en actions concrètes dans l'application.
- Pour agir sur un client existant, cherche-le d'abord (chercher_clients). S'il y a plusieurs correspondances
  plausibles, demande lequel en une phrase. S'il n'existe pas et que l'utilisateur décrit un nouveau client, propose
  creer_client puis les autres actions avec client_id null et le même client_nom.
- Les outils d'écriture (creer_client, enregistrer_mesures, creer_commande, encaisser, changer_statut,
  message_whatsapp) ne s'exécutent pas tout de suite : ils s'affichent comme formulaires pré-remplis que l'utilisateur
  corrige et valide. Propose-les dès que tu as l'essentiel ; ne demande pas de confirmation à l'oral.
- Mesures : en centimètres. Associe chaque mesure à la clé du modèle de mesure le plus adapté quand il y en a un
  (cle = la clé du champ) ; sinon invente une clé courte en minuscules.
- Montants en francs CFA : « 45 mille » = 45000, « 1 million 500 » = 1500000.
- Dates : convertis « samedi », « dans deux semaines », « le 20 » en AAAA-MM-JJ à partir de la date du jour fournie.
- Modes de paiement : espèces=cash, Orange Money=orange_money, Wave=wave, virement=bank_transfer.
- Si l'utilisateur pose une question (que livrer aujourd'hui, combien me doit X…), utilise les outils de lecture et
  réponds directement.

Réponds toujours en français, en une ou deux phrases courtes et simples, sans markdown : l'utilisateur lit sur
son téléphone, souvent en plein travail. Si une information indispensable manque (par exemple le prix d'une
commande), propose quand même le formulaire avec ce que tu sais et signale ce qui manque."""


def _request_context(user) -> str:
    templates = [
        {
            "modele_mesure_id": t.id,
            "nom": t.name,
            "prix_reference_fcfa": t.reference_price_fcfa,
            "champs": [{"cle": f["key"], "libelle": f["label"]} for f in t.normalized_fields()],
        }
        for t in MeasurementFormTemplate.objects.filter(is_active=True)
    ]
    today = timezone.localdate()
    return (
        f"[Contexte] Date du jour : {JOURS[today.weekday()]} {today.isoformat()}. "
        f"Atelier : {shop_context()['atelier']}. Utilisateur : {user.name}, rôle {user.role}"
        + (" (ne peut pas créer de commande, encaisser ni changer un statut)" if user.role == "tailleur" else "")
        + f". Modèles de mesure : {json.dumps(templates, ensure_ascii=False)}"
    )


def run_assistant(user, text: str, history: list[dict]) -> dict:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    messages: list[dict] = []
    for turn in history[-12:]:
        if turn.get("role") in ("user", "assistant") and turn.get("text"):
            messages.append({"role": turn["role"], "content": turn["text"]})
    while messages and messages[0]["role"] != "user":
        messages.pop(0)
    messages.append({"role": "user", "content": f"{_request_context(user)}\n\n{text}"})

    tools = READ_TOOLS + WRITE_TOOLS
    proposals: list[dict] = []
    response = None

    for _ in range(MAX_STEPS):
        response = client.beta.messages.create(
            model=settings.ASSISTANT_MODEL,
            max_tokens=16000,
            system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
            tools=tools,
            messages=messages,
            output_config={"effort": "medium"},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        )
        if response.stop_reason == "refusal":
            return {"reply": "Je ne peux pas traiter cette demande.", "actions": proposals}

        tool_uses = [b for b in response.content if b.type == "tool_use"]
        if not tool_uses:
            break

        messages.append({"role": "assistant", "content": response.content})
        results = []
        for block in tool_uses:
            if block.name in WRITE_TOOL_NAMES:
                proposals.append(
                    {
                        "id": block.id,
                        "type": block.name,
                        "input": block.input,
                        "summary": summarize_action(block.name, block.input),
                    }
                )
                content = "Formulaire affiché à l'utilisateur, en attente de sa validation."
            else:
                try:
                    content = json.dumps(run_read_tool(block.name, block.input), ensure_ascii=False, default=str)
                except Exception as exc:  # a failed lookup must not kill the whole turn
                    results.append(
                        {"type": "tool_result", "tool_use_id": block.id, "content": f"Erreur : {exc}", "is_error": True}
                    )
                    continue
            results.append({"type": "tool_result", "tool_use_id": block.id, "content": content})
        messages.append({"role": "user", "content": results})

    reply = " ".join(b.text for b in (response.content if response else []) if b.type == "text").strip()
    if not reply:
        reply = "Vérifiez et validez." if proposals else "Je n'ai pas compris, pouvez-vous reformuler ?"
    return {"reply": reply, "actions": proposals}
