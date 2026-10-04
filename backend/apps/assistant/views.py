import json

import anthropic
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes, throttle_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from .agent import run_assistant
from .tools import execute_action
from .transcription import transcribe

MAX_AUDIO_BYTES = 10 * 1024 * 1024


class AssistantThrottle(UserRateThrottle):
    scope = "assistant"


def _transcribe_upload(request):
    audio = request.FILES.get("audio")
    if not audio:
        return None
    if audio.size > MAX_AUDIO_BYTES:
        raise ValueError("Note vocale trop longue.")
    return transcribe(audio)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def assistant_status(request):
    return Response({"ai": bool(settings.ANTHROPIC_API_KEY), "transcription": True})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([AssistantThrottle])
@parser_classes([MultiPartParser, FormParser])
def transcribe_view(request):
    """Plain dictation: voice note -> text (for notes fields)."""
    try:
        text = _transcribe_upload(request)
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    if text is None:
        return Response({"detail": "Aucun audio reçu."}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"text": text})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([AssistantThrottle])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def assistant_view(request):
    """Voice note or text -> reply + pre-filled action forms to confirm."""
    try:
        transcript = _transcribe_upload(request)
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    text = (transcript or request.data.get("text") or "").strip()
    if not text:
        return Response({"detail": "Je n'ai rien entendu. Réessayez en parlant plus près du téléphone."}, status=400)

    if not settings.ANTHROPIC_API_KEY:
        return Response(
            {"transcript": transcript, "reply": "L'assistant IA n'est pas encore activé sur ce serveur.", "actions": []}
        )

    history = request.data.get("history") or []
    if isinstance(history, str):
        try:
            history = json.loads(history)
        except json.JSONDecodeError:
            history = []

    try:
        result = run_assistant(request.user, text, history)
    except anthropic.RateLimitError:
        return Response({"detail": "L'assistant est très sollicité, réessayez dans un instant."}, status=503)
    except (anthropic.APIConnectionError, anthropic.APIStatusError):
        return Response({"detail": "L'assistant est momentanément indisponible."}, status=503)
    return Response({"transcript": transcript, **result})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def execute_view(request):
    """Runs one action the user confirmed (possibly after editing the form)."""
    name = request.data.get("type")
    args = request.data.get("input")
    if not isinstance(name, str) or not isinstance(args, dict):
        return Response({"detail": "Action invalide."}, status=400)
    origin = request.headers.get("Origin") or request.build_absolute_uri("/").rstrip("/")
    try:
        return Response(execute_action(name, args, request.user, origin))
    except PermissionError as exc:
        return Response({"detail": str(exc)}, status=403)
    except ObjectDoesNotExist:
        return Response({"detail": "Élément introuvable (client ou commande)."}, status=400)
    except (ValueError, KeyError, TypeError) as exc:
        return Response({"detail": f"Formulaire incomplet : {exc}"}, status=400)
