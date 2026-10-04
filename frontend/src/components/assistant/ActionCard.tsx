"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Check,
  ExternalLink,
  MessageCircle,
  Plus,
  Ruler,
  ShoppingBag,
  Trash2,
  UserPlus,
  Wallet,
  X,
  RefreshCw,
} from "lucide-react";
import { apiFetch, errorMessage } from "@/lib/api";
import type { AssistantAction, AssistantActionType } from "@/lib/types";
import { PAYMENT_METHODS, STATUS } from "@/lib/status";
import { formatFcfa } from "@/lib/format";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const META: Record<AssistantActionType, { title: string; icon: typeof UserPlus }> = {
  creer_client: { title: "Nouveau client", icon: UserPlus },
  enregistrer_mesures: { title: "Mesures", icon: Ruler },
  creer_commande: { title: "Nouvelle commande", icon: ShoppingBag },
  encaisser: { title: "Encaissement", icon: Wallet },
  changer_statut: { title: "Statut de commande", icon: RefreshCw },
  message_whatsapp: { title: "Message WhatsApp", icon: MessageCircle },
};

export type CardState = "draft" | "saving" | "done" | "dismissed";

interface Result {
  message: string;
  url?: string;
  link?: string;
}

/** One pre-filled form proposed by the assistant: the user fixes anything misheard, then validates. */
export function ActionCard({
  action,
  state,
  onStateChange,
}: {
  action: AssistantAction;
  state: CardState;
  onStateChange: (s: CardState) => void;
}) {
  const [input, setInput] = useState(action.input);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const meta = META[action.type];
  const Icon = meta.icon;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => setInput((prev) => ({ ...prev, [key]: value }));

  async function validate() {
    setError(null);
    onStateChange("saving");
    try {
      const res = await apiFetch<Result>("/assistant/execute/", {
        method: "POST",
        body: JSON.stringify({ type: action.type, input }),
      });
      setResult(res);
      onStateChange("done");
      if (res.link) window.open(res.link, "_blank");
    } catch (e) {
      setError(errorMessage(e));
      onStateChange("draft");
    }
  }

  if (state === "dismissed") return null;

  if (state === "done" && result) {
    return (
      <div className="mv-rise flex items-center gap-3 rounded-2xl bg-success-soft px-4 py-3 text-success">
        <Check size={20} className="shrink-0" />
        <p className="flex-1 text-sm font-medium">{result.message}</p>
        {result.url && (
          <Link href={result.url} className="inline-flex items-center gap-1 text-sm font-semibold underline">
            Voir <ExternalLink size={14} />
          </Link>
        )}
        {result.link && (
          <a href={result.link} target="_blank" rel="noreferrer" className="text-sm font-semibold underline">
            Ouvrir
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="mv-rise rounded-2xl border border-line bg-bg-card">
      <div className="flex items-center gap-2.5 px-4 pt-4">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-soft text-gold-dark">
          <Icon size={17} />
        </span>
        <p className="flex-1 font-semibold">{meta.title}</p>
        <button
          onClick={() => onStateChange("dismissed")}
          aria-label="Ignorer"
          className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-bg-sunken"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3 px-4 py-3">
        <Fields type={action.type} input={input} set={set} />
      </div>

      {error && <p className="mx-4 mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="px-4 pb-4">
        <Button
          fullWidth
          size="lg"
          variant={action.type === "message_whatsapp" ? "wa" : "dark"}
          onClick={validate}
          disabled={state === "saving"}
        >
          <Check size={18} />
          {state === "saving"
            ? "Enregistrement…"
            : action.type === "message_whatsapp"
              ? "Envoyer sur WhatsApp"
              : "Valider"}
        </Button>
      </div>
    </div>
  );
}

function Chips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | null;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "h-10 rounded-full px-4 text-sm font-medium transition",
            value === o.value ? "bg-ink text-white" : "bg-bg-sunken text-ink-soft"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MoneyInput({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <Input
        inputMode="numeric"
        value={value ? String(value) : ""}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
        placeholder="0"
        className="tabular"
      />
      {!!value && <p className="mt-1 text-xs text-muted">{formatFcfa(value)}</p>}
    </div>
  );
}

function ClientLine({ name, isNew }: { name: string; isNew: boolean }) {
  return (
    <p className="text-sm text-ink-soft">
      Client : <span className="font-semibold text-ink">{name}</span>
      {isNew && <span className="ml-1 text-gold-dark">(nouveau)</span>}
    </p>
  );
}

function Fields({
  type,
  input,
  set,
}: {
  type: AssistantActionType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set: (k: string, v: any) => void;
}) {
  switch (type) {
    case "creer_client":
      return (
        <>
          <div>
            <Label>Nom</Label>
            <Input value={input.nom ?? ""} onChange={(e) => set("nom", e.target.value)} />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input inputMode="tel" value={input.telephone ?? ""} onChange={(e) => set("telephone", e.target.value)} />
          </div>
          {input.notes !== null && input.notes !== undefined && (
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={input.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
            </div>
          )}
        </>
      );

    case "enregistrer_mesures": {
      const rows: { cle: string; libelle: string; valeur: number }[] = input.mesures ?? [];
      const update = (i: number, patch: Partial<(typeof rows)[number]>) =>
        set(
          "mesures",
          rows.map((r, j) => (j === i ? { ...r, ...patch } : r))
        );
      return (
        <>
          <ClientLine name={input.client_nom} isNew={!input.client_id} />
          <div className="divide-y divide-line-soft rounded-xl bg-bg-sunken">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                <input
                  value={row.libelle}
                  onChange={(e) => update(i, { libelle: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent py-2 text-base focus:outline-none"
                  aria-label="Mesure"
                />
                <input
                  inputMode="decimal"
                  value={String(row.valeur ?? "")}
                  onChange={(e) => update(i, { valeur: Number(e.target.value.replace(",", ".")) || 0 })}
                  className="tabular w-20 rounded-lg bg-bg-card px-2 py-2 text-right text-base font-semibold focus:outline-none focus:ring-2 focus:ring-gold-soft"
                  aria-label={`Valeur ${row.libelle}`}
                />
                <span className="w-6 text-xs text-muted">cm</span>
                <button
                  onClick={() =>
                    set(
                      "mesures",
                      rows.filter((_, j) => j !== i)
                    )
                  }
                  aria-label="Retirer"
                  className="text-muted"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set("mesures", [...rows, { cle: `mesure_${rows.length + 1}`, libelle: "", valeur: 0 }])}
            className="inline-flex items-center gap-1 text-sm font-semibold text-gold-dark"
          >
            <Plus size={15} /> Ajouter une mesure
          </button>
        </>
      );
    }

    case "creer_commande":
      return (
        <>
          <ClientLine name={input.client_nom} isNew={!input.client_id} />
          <div>
            <Label>Tenue</Label>
            <Input value={input.modele_tenue ?? ""} onChange={(e) => set("modele_tenue", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prix total</Label>
              <MoneyInput value={input.prix_total_fcfa} onChange={(v) => set("prix_total_fcfa", v)} />
            </div>
            <div>
              <Label>Acompte</Label>
              <MoneyInput value={input.acompte_fcfa} onChange={(v) => set("acompte_fcfa", v)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Livraison</Label>
              <Input
                type="date"
                value={input.date_livraison ?? ""}
                onChange={(e) => set("date_livraison", e.target.value || null)}
              />
            </div>
            <div>
              <Label>Quantité</Label>
              <Input
                inputMode="numeric"
                value={String(input.quantite ?? 1)}
                onChange={(e) => set("quantite", Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>
          {!!input.acompte_fcfa && (
            <div>
              <Label>Paiement de l&apos;acompte</Label>
              <Chips value={input.mode_paiement} options={PAYMENT_METHODS} onChange={(v) => set("mode_paiement", v)} />
            </div>
          )}
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={!!input.client_fournit_tissu}
              onChange={(e) => set("client_fournit_tissu", e.target.checked)}
              className="h-5 w-5 accent-[var(--gold)]"
            />
            Le client apporte son tissu
          </label>
          {input.notes !== null && input.notes !== undefined && (
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={input.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
            </div>
          )}
        </>
      );

    case "encaisser":
      return (
        <>
          <p className="text-sm text-ink-soft">
            Commande <span className="font-semibold text-ink">{input.reference}</span>
          </p>
          <div>
            <Label>Montant reçu</Label>
            <MoneyInput value={input.montant_fcfa} onChange={(v) => set("montant_fcfa", v)} />
          </div>
          <Chips value={input.mode_paiement} options={PAYMENT_METHODS} onChange={(v) => set("mode_paiement", v)} />
        </>
      );

    case "changer_statut":
      return (
        <>
          <p className="text-sm text-ink-soft">
            Commande <span className="font-semibold text-ink">{input.reference}</span>
          </p>
          <Chips
            value={input.statut}
            options={(["pending", "in_progress", "done", "delivered"] as const).map((s) => ({
              value: s,
              label: STATUS[s].label,
            }))}
            onChange={(v) => set("statut", v)}
          />
        </>
      );

    case "message_whatsapp":
      return (
        <Textarea
          rows={4}
          value={(input.message ?? "").replace("{lien_suivi}", "[lien de suivi]")}
          onChange={(e) => set("message", e.target.value.replace("[lien de suivi]", "{lien_suivi}"))}
        />
      );
  }
}
