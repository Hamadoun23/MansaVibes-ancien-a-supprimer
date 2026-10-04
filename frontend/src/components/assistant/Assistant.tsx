"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowUp, CheckCheck, Mic, Sparkles, Square, X } from "lucide-react";
import { apiFetch, errorMessage } from "@/lib/api";
import type { AssistantAction, AssistantResponse } from "@/lib/types";
import { audioFileName, useVoiceRecorder } from "@/lib/useVoiceRecorder";
import { ActionCard, type CardState } from "./ActionCard";

interface Turn {
  role: "user" | "assistant";
  text: string;
  actions?: AssistantAction[];
  pending?: boolean;
  error?: boolean;
}

const EXAMPLES = [
  "Nouvelle cliente Awa Traoré, 76 12 34 56, boubou bazin pour samedi, 45 000, acompte 20 000 en Wave",
  "Mesures de Moussa : poitrine 104, taille 92, épaule 48, longueur 140",
  "Qu'est-ce que je dois livrer aujourd'hui ?",
  "Fatou a payé 15 000 en Orange Money",
];

const AssistantContext = createContext<{ open: () => void }>({ open: () => {} });

export function useAssistant() {
  return useContext(AssistantContext);
}

const REFRESH_EVENT = "mv:data-changed";

/** Re-runs `load` after the assistant closed (it may have created or changed data). */
export function useRefreshAfterAssistant(load: () => void) {
  useEffect(() => {
    window.addEventListener(REFRESH_EVENT, load);
    return () => window.removeEventListener(REFRESH_EVENT, load);
  }, [load]);
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  return (
    <AssistantContext.Provider value={{ open }}>
      {children}
      {isOpen && (
        <AssistantSheet
          onClose={() => {
            setIsOpen(false);
            window.dispatchEvent(new Event(REFRESH_EVENT));
          }}
        />
      )}
    </AssistantContext.Provider>
  );
}

function AssistantSheet({ onClose }: { onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const send = useCallback(
    async (payload: { audio?: Blob; text?: string }) => {
      setBusy(true);
      const history = turns.filter((t) => !t.pending && !t.error).map((t) => ({ role: t.role, text: t.text }));
      setTurns((prev) => [
        ...prev,
        { role: "user", text: payload.text ?? "", pending: !payload.text },
        { role: "assistant", text: "", pending: true },
      ]);

      const form = new FormData();
      if (payload.audio) form.append("audio", payload.audio, audioFileName(payload.audio));
      if (payload.text) form.append("text", payload.text);
      form.append("history", JSON.stringify(history));

      try {
        const res = await apiFetch<AssistantResponse>("/assistant/", { method: "POST", body: form });
        setTurns((prev) => [
          ...prev.slice(0, -2),
          { role: "user", text: res.transcript ?? payload.text ?? "" },
          { role: "assistant", text: res.reply, actions: res.actions },
        ]);
      } catch (e) {
        setTurns((prev) => [
          ...prev.slice(0, -2),
          ...(payload.text ? [{ role: "user" as const, text: payload.text }] : []),
          { role: "assistant", text: errorMessage(e), error: true },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [turns]
  );

  const recorder = useVoiceRecorder((audio) => send({ audio }));

  const submitText = () => {
    const value = text.trim();
    if (!value || busy) return;
    setText("");
    send({ text: value });
  };

  const openCards = turns.flatMap((t) => t.actions ?? []).filter((a) => (cardStates[a.id] ?? "draft") === "draft");

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label="Assistant">
      <header className="pt-safe border-b border-line-soft bg-bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-gold-light">
            <Sparkles size={18} />
          </span>
          <div className="flex-1">
            <p className="font-semibold leading-tight">Assistant</p>
            <p className="text-xs text-muted">Parlez, je remplis les formulaires pour vous</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-10 w-10 place-items-center rounded-full bg-bg-sunken text-ink-soft"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-5">
          {turns.length === 0 && (
            <div className="mv-rise space-y-3 pt-4">
              <p className="serif text-2xl leading-snug">Dites-moi ce que vous voulez faire.</p>
              <p className="text-sm text-muted">Appuyez sur le micro et parlez naturellement. Par exemple :</p>
              <div className="space-y-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => send({ text: ex })}
                    className="block w-full rounded-2xl border border-line-soft bg-bg-card px-4 py-3 text-left text-sm text-ink-soft active:scale-[0.99]"
                  >
                    « {ex} »
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn, i) =>
            turn.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-[0.95rem] text-white">
                  {turn.pending ? <Dots label="Transcription" /> : turn.text}
                </div>
              </div>
            ) : (
              <div key={i} className="space-y-3">
                <div
                  className={clsx(
                    "max-w-[90%] rounded-3xl rounded-bl-lg px-4 py-2.5 text-[0.95rem]",
                    turn.error ? "bg-danger-soft text-danger" : "bg-bg-card"
                  )}
                >
                  {turn.pending ? <Dots label="Je prépare" /> : turn.text}
                </div>
                {turn.actions?.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    state={cardStates[action.id] ?? "draft"}
                    onStateChange={(s) => setCardStates((prev) => ({ ...prev, [action.id]: s }))}
                  />
                ))}
              </div>
            )
          )}

          {openCards.length > 1 && (
            <p className="flex items-center gap-2 text-xs text-muted">
              <CheckCheck size={14} /> Validez les formulaires dans l&apos;ordre (le client d&apos;abord).
            </p>
          )}
        </div>
      </div>

      <footer className="pb-safe border-t border-line-soft bg-bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitText()}
            placeholder={recorder.state === "recording" ? "J'écoute…" : "Ou écrivez ici…"}
            disabled={recorder.state === "recording"}
            className="h-12 min-w-0 flex-1 rounded-full bg-bg-sunken px-5 text-base placeholder:text-muted focus:outline-none"
          />
          {text.trim() ? (
            <button
              onClick={submitText}
              disabled={busy}
              aria-label="Envoyer"
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-white disabled:opacity-40"
            >
              <ArrowUp size={22} />
            </button>
          ) : (
            <button
              onClick={recorder.toggle}
              disabled={busy && recorder.state !== "recording"}
              aria-label={recorder.state === "recording" ? "Arrêter l'enregistrement" : "Parler"}
              className={clsx(
                "grid h-16 w-16 shrink-0 place-items-center rounded-full transition disabled:opacity-40",
                recorder.state === "recording"
                  ? "mv-recording bg-danger text-white [color:#fff]"
                  : "bg-gold text-[#111110]"
              )}
            >
              {recorder.state === "recording" ? <Square size={22} fill="currentColor" /> : <Mic size={26} />}
            </button>
          )}
        </div>
        <p className="mx-auto max-w-2xl px-4 pt-1.5 text-center text-[0.72rem] text-muted">
          {recorder.state === "recording"
            ? `Enregistrement ${formatSeconds(recorder.seconds)} · appuyez pour terminer`
            : recorder.state === "denied"
              ? "Autorisez le micro dans les réglages du navigateur."
              : recorder.state === "unsupported"
                ? "Ce navigateur ne permet pas l'enregistrement : écrivez votre demande."
                : "Rien n'est enregistré sans votre validation."}
        </p>
      </footer>
    </div>
  );
}

function Dots({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 opacity-80">
      {label}
      <span className="inline-flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </span>
    </span>
  );
}

function formatSeconds(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
