"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Check, ChevronRight, MessageCircle, Search, UserPlus } from "lucide-react";
import { apiFetch, errorMessage, type Paginated } from "@/lib/api";
import type { Client, MeasurementFormTemplate, Order } from "@/lib/types";
import { formatFcfa } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/status";
import { MESSAGES, waLink } from "@/lib/whatsapp";
import { useShop } from "@/lib/shop";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { DictateButton } from "@/components/assistant/DictateButton";

type ClientPick = Pick<Client, "id" | "name" | "phone" | "portal_token">;

function addDays(n: number) {
  return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
}

export default function NewOrderPage() {
  return (
    <Suspense>
      <NewOrder />
    </Suspense>
  );
}

function NewOrder() {
  const router = useRouter();
  const params = useSearchParams();
  const shop = useShop();
  const [step, setStep] = useState(0);
  const [client, setClient] = useState<ClientPick | null>(null);
  const [templates, setTemplates] = useState<MeasurementFormTemplate[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [model, setModel] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [fabric, setFabric] = useState(false);
  const [notes, setNotes] = useState("");
  const [total, setTotal] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [method, setMethod] = useState("cash");
  const [due, setDue] = useState(addDays(7));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Order | null>(null);

  useEffect(() => {
    apiFetch<Paginated<MeasurementFormTemplate>>("/measurement-templates/").then((r) =>
      setTemplates(r.results.filter((t) => t.is_active))
    );
    const preset = params.get("client");
    if (preset) {
      apiFetch<Client>(`/clients/${preset}/`).then((c) => {
        setClient(c);
        setStep(1);
      });
    }
  }, [params]);

  function pickTemplate(t: MeasurementFormTemplate) {
    setTemplateId(t.id);
    setModel(t.name);
    if (t.reference_price_fcfa) setTotal(t.reference_price_fcfa * quantity);
  }

  async function submit() {
    if (!client) return;
    setSaving(true);
    setError(null);
    try {
      const order = await apiFetch<Order>("/orders/", {
        method: "POST",
        body: JSON.stringify({
          client: client.id,
          model_name: model,
          measurement_template: templateId,
          due_date: due || null,
          notes,
          items: [
            {
              description: model,
              quantity,
              unit_price_fcfa: Math.round(total / quantity),
              measurement_template: templateId,
              client_supplies_fabric: fabric,
            },
          ],
        }),
      });
      const final = deposit
        ? await apiFetch<Order>(`/orders/${order.id}/pay/`, {
            method: "POST",
            body: JSON.stringify({ amount_fcfa: deposit, payment_method: method }),
          })
        : order;
      setCreated(final);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (created && client) {
    return (
      <div className="pt-safe mx-auto flex min-h-[80dvh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-success-soft text-success">
          <Check size={38} />
        </span>
        <h1 className="serif mt-6 text-3xl">Commande enregistrée</h1>
        <p className="mt-2 text-ink-soft">
          {created.reference} · {client.name} · {formatFcfa(created.total_fcfa)}
        </p>
        {client.phone && (
          <a
            href={waLink(
              client.phone,
              MESSAGES.received({
                clientName: client.name,
                token: client.portal_token,
                model,
                shop: shop?.business_name,
              })
            )}
            target="_blank"
            rel="noreferrer"
            className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-wa text-base font-semibold [color:#fff]"
          >
            <MessageCircle size={20} /> Envoyer le suivi au client
          </a>
        )}
        <Link
          href={`/orders/${created.id}`}
          className="mt-3 flex h-14 w-full items-center justify-center rounded-2xl bg-bg-card font-semibold"
        >
          Voir la commande
        </Link>
        <button onClick={() => router.push("/today")} className="mt-4 text-sm text-muted">
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  const steps = ["Client", "Tenue", "Prix & date"];

  return (
    <div>
      <PageHeader back title="Nouvelle commande" />
      <div className="mx-auto max-w-2xl px-4 md:px-8">
        <ol className="mb-5 grid grid-cols-3 gap-2">
          {steps.map((label, i) => (
            <li key={label}>
              <button onClick={() => i < step && setStep(i)} className="w-full text-left" disabled={i > step}>
                <div className={clsx("h-1.5 rounded-full", i <= step ? "bg-gold" : "bg-bg-sunken")} />
                <p className={clsx("mt-1.5 text-xs", i === step ? "font-semibold" : "text-muted")}>{label}</p>
              </button>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <ClientStep
            onPick={(c) => {
              setClient(c);
              setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <div className="space-y-5">
            <SelectedClient client={client} onChange={() => setStep(0)} />
            {templates.length > 0 && (
              <div>
                <Label>Modèle</Label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => pickTemplate(t)}
                      className={clsx(
                        "rounded-2xl px-4 py-2.5 text-left text-sm",
                        templateId === t.id ? "bg-ink text-white" : "bg-bg-card"
                      )}
                    >
                      <span className="block font-semibold">{t.name}</span>
                      {!!t.reference_price_fcfa && (
                        <span className="block text-xs opacity-70">{formatFcfa(t.reference_price_fcfa)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>Tenue</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Boubou bazin brodé, kaftan…"
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="mb-0 flex-1">Quantité</Label>
              <Stepper value={quantity} onChange={setQuantity} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl bg-bg-card px-4 py-3.5 text-sm">
              <input
                type="checkbox"
                checked={fabric}
                onChange={(e) => setFabric(e.target.checked)}
                className="h-5 w-5 accent-[var(--gold)]"
              />
              Le client apporte son tissu
            </label>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="mb-0">Détails (broderie, coupe…)</Label>
                <DictateButton onText={(t) => setNotes((n) => (n ? `${n} ${t}` : t))} />
              </div>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button fullWidth size="lg" disabled={!model.trim()} onClick={() => setStep(2)}>
              Continuer <ChevronRight size={18} />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <SelectedClient client={client} onChange={() => setStep(0)} />
            <div>
              <Label>Prix total</Label>
              <MoneyField value={total} onChange={setTotal} />
            </div>
            <div>
              <Label>Acompte reçu</Label>
              <MoneyField value={deposit} onChange={(v) => setDeposit(Math.min(v, total || v))} />
              {total > 0 && (
                <div className="mt-2 flex gap-2">
                  {[0.5, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => setDeposit(Math.round(total * r))}
                      className="h-9 rounded-full bg-bg-card px-3 text-xs font-medium"
                    >
                      {r === 1 ? "Tout payé" : "Moitié"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {deposit > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMethod(m.value)}
                    className={clsx(
                      "h-11 rounded-xl text-sm font-medium",
                      method === m.value ? "bg-ink text-white" : "bg-bg-card text-ink-soft"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
            <div>
              <Label>Date de livraison</Label>
              <div className="mb-2 flex flex-wrap gap-2">
                {[
                  { label: "3 jours", d: 3 },
                  { label: "1 semaine", d: 7 },
                  { label: "2 semaines", d: 14 },
                  { label: "1 mois", d: 30 },
                ].map((o) => (
                  <button
                    key={o.d}
                    onClick={() => setDue(addDays(o.d))}
                    className={clsx(
                      "h-9 rounded-full px-3 text-xs font-medium",
                      due === addDays(o.d) ? "bg-ink text-white" : "bg-bg-card"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>

            <Summary model={model} quantity={quantity} total={total} deposit={deposit} />

            {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
            <Button fullWidth size="lg" onClick={submit} disabled={saving || total <= 0}>
              <Check size={18} /> {saving ? "Enregistrement…" : "Enregistrer la commande"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ClientStep({ onPick }: { onPick: (c: ClientPick) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientPick[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      apiFetch<Paginated<ClientPick>>(`/clients/?search=${encodeURIComponent(query.trim())}`).then((r) =>
        setResults(r.results.slice(0, 8))
      );
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  async function create() {
    setError(null);
    try {
      onPick(await apiFetch<Client>("/clients/", { method: "POST", body: JSON.stringify({ name, phone }) }));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (creating) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Nom du client</Label>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Téléphone (WhatsApp)</Label>
          <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="76 12 34 56" />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button fullWidth size="lg" onClick={create} disabled={!name.trim()}>
          Créer et continuer <ChevronRight size={18} />
        </Button>
        <button onClick={() => setCreating(false)} className="w-full text-sm text-muted">
          Chercher un client existant
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="flex h-12 items-center gap-2 rounded-2xl bg-bg-card px-4">
        <Search size={18} className="text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom ou téléphone"
          className="min-w-0 flex-1 bg-transparent text-base focus:outline-none"
        />
      </label>
      <button
        onClick={() => {
          setName(/\d/.test(query) ? "" : query);
          setPhone(/\d/.test(query) ? query : "");
          setCreating(true);
        }}
        className="flex h-14 w-full items-center gap-3 rounded-2xl bg-gold-soft px-4 text-sm font-semibold text-gold-dark"
      >
        <UserPlus size={19} /> Nouveau client{query && !/\d/.test(query) ? ` « ${query} »` : ""}
      </button>
      <div className="divide-y divide-line-soft rounded-2xl bg-bg-card">
        {results.map((c) => (
          <button key={c.id} onClick={() => onPick(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bg-sunken font-semibold">
              {c.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{c.name}</span>
              <span className="block text-xs text-muted">{c.phone || "—"}</span>
            </span>
            <ChevronRight size={16} className="text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectedClient({ client, onChange }: { client: ClientPick | null; onChange: () => void }) {
  if (!client) return null;
  return (
    <div className="flex items-center justify-between rounded-2xl bg-bg-card px-4 py-3">
      <p className="text-sm">
        Pour <span className="font-semibold">{client.name}</span>
      </p>
      <button onClick={onChange} className="text-sm font-semibold text-gold-dark">
        Changer
      </button>
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-bg-card p-1">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="h-10 w-10 rounded-lg text-lg"
        aria-label="Moins"
      >
        −
      </button>
      <span className="tabular w-8 text-center font-semibold">{value}</span>
      <button onClick={() => onChange(value + 1)} className="h-10 w-10 rounded-lg text-lg" aria-label="Plus">
        +
      </button>
    </div>
  );
}

function MoneyField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="relative">
      <Input
        inputMode="numeric"
        value={value ? new Intl.NumberFormat("fr-FR").format(value) : ""}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
        placeholder="0"
        className="tabular h-14 pr-16 text-xl font-semibold"
      />
      <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">FCFA</span>
    </div>
  );
}

function Summary({
  model,
  quantity,
  total,
  deposit,
}: {
  model: string;
  quantity: number;
  total: number;
  deposit: number;
}) {
  const rest = useMemo(() => Math.max(0, total - deposit), [total, deposit]);
  return (
    <div className="rounded-2xl bg-bg-card p-4 text-sm">
      <div className="flex justify-between">
        <span className="text-ink-soft">
          {quantity} × {model}
        </span>
        <span className="tabular font-semibold">{formatFcfa(total)}</span>
      </div>
      <div className="mt-1 flex justify-between">
        <span className="text-ink-soft">Reste à payer</span>
        <span className="tabular font-semibold text-gold-dark">{formatFcfa(rest)}</span>
      </div>
    </div>
  );
}
