"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="mv-rise pb-safe relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-bg-card md:max-h-[85vh] md:max-w-lg md:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-bg-card px-5 pt-4 pb-3">
          <h2 className="serif text-xl">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-10 w-10 place-items-center rounded-full bg-bg-sunken text-ink-soft"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
