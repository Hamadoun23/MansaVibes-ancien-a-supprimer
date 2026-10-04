"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "mv_install_dismissed";

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** "Install the app" banner: native prompt on Android, Share → Home Screen hint on iOS. */
export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    if (wasDismissed() || window.matchMedia("(display-mode: standalone)").matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) && !("standalone" in window.navigator && window.navigator.standalone);
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIos) timer = setTimeout(() => setShowIos(true), 4000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode: banner just comes back next time */
    }
    setEvent(null);
    setShowIos(false);
  };

  if (!event && !showIos) return null;

  return (
    <div className="mv-rise fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-xl md:inset-x-auto md:right-6 md:bottom-6 md:w-96">
      {/* eslint-disable-next-line @next/next/no-img-element -- static 40px icon */}
      <img src="/icons/icon-192.png" alt="" className="h-10 w-10 rounded-xl" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Installer l&apos;application</p>
        <p className="opacity-75">
          {event ? (
            "Accès direct depuis l'écran d'accueil."
          ) : (
            <>
              Touchez <Share size={13} className="inline" /> puis « Sur l&apos;écran d&apos;accueil ».
            </>
          )}
        </p>
      </div>
      {event && (
        <button
          onClick={async () => {
            await event.prompt();
            await event.userChoice;
            dismiss();
          }}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-gold px-3 text-sm font-semibold text-[#111110]"
        >
          <Download size={16} /> Installer
        </button>
      )}
      <button onClick={dismiss} aria-label="Plus tard" className="opacity-70">
        <X size={18} />
      </button>
    </div>
  );
}
