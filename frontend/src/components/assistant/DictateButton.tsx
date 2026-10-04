"use client";

import { useState } from "react";
import clsx from "clsx";
import { Loader2, Mic, Square } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { audioFileName, useVoiceRecorder } from "@/lib/useVoiceRecorder";

/** Small mic next to a text field: speak, the transcription is appended to the field. */
export function DictateButton({ onText }: { onText: (text: string) => void }) {
  const [busy, setBusy] = useState(false);
  const recorder = useVoiceRecorder(async (audio) => {
    setBusy(true);
    const form = new FormData();
    form.append("audio", audio, audioFileName(audio));
    try {
      const res = await apiFetch<{ text: string }>("/assistant/transcribe/", { method: "POST", body: form });
      if (res.text) onText(res.text);
    } finally {
      setBusy(false);
    }
  });

  if (recorder.state === "unsupported") return null;
  const recording = recorder.state === "recording";

  return (
    <button
      type="button"
      onClick={recorder.toggle}
      disabled={busy}
      aria-label={recording ? "Arrêter la dictée" : "Dicter"}
      className={clsx(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition",
        recording ? "mv-recording bg-danger [color:#fff]" : "bg-gold-soft text-gold-dark"
      )}
    >
      {busy ? (
        <Loader2 size={14} className="animate-spin" />
      ) : recording ? (
        <Square size={12} fill="currentColor" />
      ) : (
        <Mic size={14} />
      )}
      {busy ? "Transcription…" : recording ? "Terminer" : "Dicter"}
    </button>
  );
}
