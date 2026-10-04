"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Plus, Search } from "lucide-react";
import { apiFetch, type Paginated } from "@/lib/api";
import type { OrderListItem } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shell/PageHeader";
import { OrderCard } from "@/components/orders/OrderCard";
import { useRefreshAfterAssistant } from "@/components/assistant/Assistant";

const FILTERS = [
  { key: "active", label: "En cours", query: "status__in=pending,in_progress,done,validated&ordering=due_date" },
  { key: "pending", label: "Reçues", query: "status=pending&ordering=due_date" },
  { key: "in_progress", label: "En couture", query: "status=in_progress&ordering=due_date" },
  { key: "done", label: "Prêtes", query: "status__in=done,validated&ordering=due_date" },
  { key: "delivered", label: "Livrées", query: "status=delivered&ordering=-updated_at" },
];

export default function OrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const filterKey = params.get("status") ?? "active";
  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const canEdit = user?.role !== "tailleur";

  const load = useCallback(() => {
    const q = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : "";
    apiFetch<Paginated<OrderListItem>>(`/orders/?${filter.query}${q}`).then((res) => {
      setOrders(res.results);
      setNext(res.next);
    });
  }, [filter.query, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);
  useRefreshAfterAssistant(load);

  async function loadMore() {
    if (!next) return;
    const res = await apiFetch<Paginated<OrderListItem>>(next);
    setOrders((prev) => [...(prev ?? []), ...res.results]);
    setNext(res.next);
  }

  return (
    <div>
      <PageHeader
        title="Commandes"
        action={
          canEdit && (
            <Link
              href="/orders/new"
              aria-label="Nouvelle commande"
              className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white"
            >
              <Plus size={20} />
            </Link>
          )
        }
      />
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <label className="flex h-12 items-center gap-2 rounded-2xl bg-bg-card px-4">
          <Search size={18} className="text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Client, tenue, référence…"
            className="min-w-0 flex-1 bg-transparent text-base focus:outline-none"
          />
        </label>

        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => router.replace(f.key === "active" ? "/orders" : `/orders?status=${f.key}`)}
              className={clsx(
                "h-10 shrink-0 rounded-full px-4 text-sm font-medium transition",
                f.key === filter.key ? "bg-ink text-white" : "bg-bg-card text-ink-soft"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2.5">
          {orders === null &&
            [0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-bg-card" />)}
          {orders?.length === 0 && <p className="py-12 text-center text-sm text-muted">Aucune commande ici.</p>}
          {orders?.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              canEdit={canEdit}
              onChanged={(updated) =>
                setOrders((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null)
              }
            />
          ))}
          {next && (
            <button onClick={loadMore} className="h-12 w-full rounded-2xl bg-bg-card text-sm font-semibold">
              Voir plus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
