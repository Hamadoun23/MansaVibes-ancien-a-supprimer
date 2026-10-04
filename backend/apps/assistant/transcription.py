"""Speech-to-text for voice notes, run locally on the server with faster-whisper
(no audio leaves the VPS). The model loads lazily on first use and is cached
in WHISPER_CACHE_DIR so container restarts don't re-download it."""

import os
import tempfile
import threading

from django.conf import settings

_model = None
_lock = threading.Lock()


def _get_model():
    global _model
    with _lock:
        if _model is None:
            from faster_whisper import WhisperModel

            _model = WhisperModel(
                settings.WHISPER_MODEL,
                device="cpu",
                compute_type="int8",
                download_root=settings.WHISPER_CACHE_DIR,
                cpu_threads=settings.WHISPER_THREADS,
            )
        return _model


def transcribe(uploaded_file) -> str:
    suffix = "." + (uploaded_file.name.rsplit(".", 1)[-1] if "." in uploaded_file.name else "webm")
    # delete=False: the file must be reopenable by the decoder (Windows dev too).
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        for chunk in uploaded_file.chunks():
            tmp.write(chunk)
    try:
        segments, _info = _get_model().transcribe(
            tmp.name,
            language="fr",
            beam_size=1,
            vad_filter=True,
            # Biases recognition toward the shop's vocabulary.
            initial_prompt=(
                "Atelier de couture au Mali. Client, mesures en centimètres : poitrine, taille, hanche, "
                "épaule, longueur, manche, cou, tour de bras. Boubou, bazin, kaftan, agbada, wax. "
                "Montants en francs CFA, acompte, Orange Money, Wave."
            ),
        )
        return " ".join(s.text.strip() for s in segments).strip()
    finally:
        os.unlink(tmp.name)
