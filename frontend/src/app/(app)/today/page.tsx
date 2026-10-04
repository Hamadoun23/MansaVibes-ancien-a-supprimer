"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mic, Plus, UserPlus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { OrderListItem, TodayOverview } from "@/lib/types";
import { formatFcfa } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { useShop } from "@/lib/shop";
import { useAssistant, useRefreshAfterAssistant } from "@/components/assistant/Assistant";
import { OrderCard } from "@/components/orders/OrderCard";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
}

export default function TodayPage() {
  return (
    <Suspense>
      <Today />
    </Suspense>
  );
}

function Today() {
  const { user } = useAuth();
  const shop = useShop();
  const { open: openAssistant } = useAssistant();
  const params = useSearchParams();
  const [data, setData] = useState<TodayOverview | null>(null);
  const [error, setError] = useState(false);
  const canEdit = user?.role !== "tailleur";

  const load = useCallback(() => {
    apiFetch<TodayOverview>("/today/")
      .then((d) => {
        setData(d);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);
  useRefreshAfterAssistant(load);

  // PWA shortcut "Assistant vocal" lands here with ?assistant=1
  useEffect(() => {
    if (params.get("assistant") === "1") openAssistant();
  }, [params, openAssistant]);

  const firstName = user?.name?.split(" ")[0] ?? "";
  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  // A card moved to another bucket: simplest is to reload the day.
  const replace = () => load();

  return (
    <div className="pt-safe mx-auto max-w-3xl px-4 md:px-8">
      <header className="pt-6 pb-5">
        <p className="text-sm capitalize text-muted">{dateLabel}</p>
        <h1 className="serif mt-1 text-4xl leading-[1.05] tracking-tight">
          {greeting()} {firstName}
        </h1>
        {shop?.business_name && <p className="text-sm text-ink-soft">{shop.business_name}</p>}
      </header>

      {/* The one big action */}
      <button
        onClick={openAssistant}
        className="mv-tide flex w-full items-center gap-4 rounded-3xl p-6 text-left active:scale-[0.99]"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gold text-[#111110]">
          <Mic size={26} />
        </span>
        <span>
          <span className="serif block text-2xl leading-tight">Parler à l&apos;assistant</span>
          <span className="mt-1 block text-sm opacity-75">Client, mesures, commande, paiement… dites-le, validez.</span>
        </span>
      </button>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {canEdit && (
          <Link
            href="/orders/new"
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-bg-card text-sm font-semibold"
          >
            <Plus size={18} /> Commande
          </Link>
        )}
        <Link
          href="/clients/new"
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-bg-card text-sm font-semibold"
        >
          <UserPlus size={18} /> Client
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          Impossible de charger la journée. Vérifiez la connexion.
        </p>
      )}

      {data && (
        <>
          {canEdit && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-bg-card px-4 py-4">
                <p className="text-xs text-muted">Encaissé aujourd&apos;hui</p>
                <p className="tabular mt-1 text-lg font-semibold">{formatFcfa(data.cash_today_fcfa)}</p>
              </div>
              <div className="rounded-2xl bg-bg-card px-4 py-4">
                <p className="text-xs text-muted">Reste à encaisser</p>
                <p className="tabular mt-1 text-lg font-semibold text-gold-dark">{formatFcfa(data.to_collect_fcfa)}</p>
              </div>
            </div>
          )}

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {[
              { label: "Reçues", value: data.counts.pending, href: "/orders?status=pending" },
              { label: "En couture", value: data.counts.in_progress, href: "/orders?status=in_progress" },
              { label: "Prêtes", value: data.counts.ready, href: "/orders?status=done" },
            ].map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="flex shrink-0 items-center gap-2 rounded-full bg-bg-card px-4 py-2 text-sm"
              >
                <span className="tabular font-semibold">{c.value}</span>
                <span className="text-ink-soft">{c.label}</span>
              </Link>
            ))}
          </div>

          <Section title="En retard" tone="danger" orders={data.late} canEdit={canEdit} onChanged={replace} />
          <Section title="À livrer aujourd'hui" orders={data.due_today} canEdit={canEdit} onChanged={replace} />
          <Section title="Prêtes — prévenir le client" orders={data.ready} canEdit={canEdit} onChanged={replace} />
          <Section title="Cette semaine" orders={data.upcoming} canEdit={canEdit} onChanged={replace} />

          {!data.late.length && !data.due_today.length && !data.ready.length && !data.upcoming.length && (
            <div className="mt-10 text-center">
              <p className="serif text-xl">Journée calme.</p>
              <p className="mt-1 text-sm text-muted">Aucune livraison prévue cette semaine.</p>
            </div>
          )}
        </>
      )}

      {!data && !error && (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-bg-card" />
          ))}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  orders,
  tone,
  canEdit,
  onChanged,
}: {
  title: string;
  orders: OrderListItem[];
  tone?: "danger";
  canEdit: boolean;
  onChanged: () => void;
}) {
  if (!orders.length) return null;
  return (
    <section className="mt-7">
      <h2 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${tone === "danger" ? "text-danger" : ""}`}>
        {title}
        <span className="rounded-full bg-bg-sunken px-2 py-0.5 text-xs text-ink-soft">{orders.length}</span>
      </h2>
      <div className="space-y-2.5">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} canEdit={canEdit} onChanged={onChanged} />
        ))}
      </div>
    </section>
  );
}
