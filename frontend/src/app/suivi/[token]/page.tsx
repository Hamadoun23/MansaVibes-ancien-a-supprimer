"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { Check, MapPin, MessageCircle, Phone } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { OrderStatus } from "@/lib/types";
import { formatFcfa } from "@/lib/format";
import { STEPS, stepIndex } from "@/lib/status";
import { waLink } from "@/lib/whatsapp";

interface PortalOrder {
  reference: string;
  model_name: string;
  status: OrderStatus;
  status_label: string;
  due_date: string | null;
  delivery_mode: "pickup" | "delivery";
  total_fcfa: number;
  paid_fcfa: number;
  balance_due_fcfa: number;
  created_at: string;
  timeline: { status: OrderStatus; at: string }[];
}

interface Portal {
  atelier: { name: string; phone: string; address: string };
  client: { name: string };
  orders: PortalOrder[];
  measurements: {
    label: string;
    template: string;
    rows: { label: string; value: string | number; unit: string }[];
    updated_at: string;
  }[];
}

function longDate(d: string | null) {
  if (!d) return null;
  return new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Public page a client opens from WhatsApp: no login, just their own orders. */
export default function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<Portal | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    apiFetch<Portal>(`/public/portal/${token}/`, { auth: false })
      .then(setData)
      .catch(() => setMissing(true));
  }, [token]);

  if (missing) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="serif text-2xl">Lien introuvable</p>
          <p className="mt-2 text-sm text-muted">Demandez à votre atelier de vous renvoyer votre lien de suivi.</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-lg space-y-3 px-4 pt-8">
        <div className="h-48 animate-pulse rounded-3xl bg-bg-card" />
        <div className="h-40 animate-pulse rounded-3xl bg-bg-card" />
      </main>
    );
  }

  const firstName = data.client.name.split(/\s+/)[0];
  const active = data.orders.filter((o) => o.status !== "delivered");
  const past = data.orders.filter((o) => o.status === "delivered");

  return (
    <main className="pb-safe mx-auto max-w-lg">
      <header className="mv-tide pt-safe rounded-b-[2rem] px-6 pt-10 pb-8">
        <div className="flex items-center gap-3">
          <Image src="/brand/vp-logo.png" alt="" width={44} height={44} />
          <p className="text-sm font-semibold opacity-90">{data.atelier.name}</p>
        </div>
        <h1 className="serif mt-8 text-4xl leading-[1.05] tracking-tight">Bonjour {firstName}</h1>
        <p className="mt-2 text-sm opacity-75">
          {active.length
            ? `Voici où en ${active.length > 1 ? "sont vos commandes" : "est votre commande"}.`
            : "Vous n'avez pas de commande en cours."}
        </p>
      </header>

      <div className="space-y-4 px-4 pt-5">
        {active.map((o) => (
          <OrderTracker key={o.reference} order={o} />
        ))}

        {data.measurements.length > 0 && (
          <section className="rounded-3xl bg-bg-card p-5">
            <h2 className="font-semibold">Vos mesures</h2>
            <p className="mb-3 text-xs text-muted">Gardées par votre atelier pour vos prochaines tenues.</p>
            <div className="space-y-3">
              {data.measurements.map((m, i) => (
                <div key={i}>
                  <p className="mb-2 text-sm font-medium">{m.label}</p>
                  <dl className="grid grid-cols-3 gap-2">
                    {m.rows.map((r, j) => (
                      <div key={j} className="rounded-xl bg-bg-sunken px-2.5 py-2">
                        <dt className="truncate text-[0.7rem] text-muted">{r.label}</dt>
                        <dd className="tabular font-semibold">
                          {r.value}
                          <span className="ml-0.5 text-xs font-normal text-muted">{r.unit}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="rounded-3xl bg-bg-card p-5">
            <h2 className="mb-2 font-semibold">Déjà livrées</h2>
            <ul className="divide-y divide-line-soft">
              {past.map((o) => (
                <li key={o.reference} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{o.model_name || o.reference}</span>
                  <span className="text-muted">{longDate(o.created_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(data.atelier.phone || data.atelier.address) && (
          <section className="rounded-3xl bg-bg-card p-5">
            <h2 className="mb-3 font-semibold">Votre atelier</h2>
            {data.atelier.address && (
              <p className="mb-4 flex items-start gap-2 text-sm text-ink-soft">
                <MapPin size={16} className="mt-0.5 shrink-0" /> {data.atelier.address}
              </p>
            )}
            {data.atelier.phone && (
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={waLink(data.atelier.phone, `Bonjour, c'est ${data.client.name} au sujet de ma commande.`)}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-wa text-sm font-semibold [color:#fff]"
                >
                  <MessageCircle size={18} /> WhatsApp
                </a>
                <a
                  href={`tel:${data.atelier.phone}`}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-bg-sunken text-sm font-semibold"
                >
                  <Phone size={18} /> Appeler
                </a>
              </div>
            )}
          </section>
        )}

        <p className="py-6 text-center text-xs text-muted">Propulsé par Mansa Vibes</p>
      </div>
    </main>
  );
}

function OrderTracker({ order }: { order: PortalOrder }) {
  const current = stepIndex(order.status);
  const ready = order.status === "done" || order.status === "validated";
  const reachedAt = (s: OrderStatus) => order.timeline.find((t) => t.status === s)?.at;

  return (
    <section className="mv-rise rounded-3xl bg-bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold leading-tight">{order.model_name || "Votre commande"}</p>
          <p className="text-xs text-muted">{order.reference}</p>
        </div>
        {ready && (
          <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">Prête !</span>
        )}
      </div>

      <ol className="mt-5 space-y-0">
        {STEPS.map((step, i) => {
          const done = i <= current;
          const at = reachedAt(step.status);
          return (
            <li key={step.status} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={clsx(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs",
                    done ? "bg-gold text-[#111110]" : "border-2 border-line text-muted",
                    i === current && "ring-4 ring-gold-soft"
                  )}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span className={clsx("my-1 w-0.5 flex-1", i < current ? "bg-gold" : "bg-line")} />
                )}
              </div>
              <div className="pb-5">
                <p className={clsx("text-sm", i === current ? "font-semibold" : done ? "" : "text-muted")}>
                  {step.label}
                </p>
                {at && done && <p className="text-xs text-muted">{longDate(at)}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {order.due_date && !ready && (
        <p className="rounded-2xl bg-bg-sunken px-4 py-3 text-sm">
          {order.delivery_mode === "delivery" ? "Livraison prévue" : "À retirer"} le{" "}
          <span className="font-semibold">{longDate(order.due_date)}</span>
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted">Total</p>
          <p className="tabular text-sm font-semibold">{formatFcfa(order.total_fcfa)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Payé</p>
          <p className="tabular text-sm font-semibold">{formatFcfa(order.paid_fcfa)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Reste</p>
          <p
            className={clsx(
              "tabular text-sm font-semibold",
              order.balance_due_fcfa ? "text-gold-dark" : "text-success"
            )}
          >
            {order.balance_due_fcfa ? formatFcfa(order.balance_due_fcfa) : "Réglé"}
          </p>
        </div>
      </div>
    </section>
  );
}
