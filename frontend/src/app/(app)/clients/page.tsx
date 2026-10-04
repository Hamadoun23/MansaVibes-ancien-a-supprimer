"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Phone, Search, UserPlus } from "lucide-react";
import { apiFetch, type Paginated } from "@/lib/api";
import type { Client } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";
import { PageHeader } from "@/components/shell/PageHeader";
import { useRefreshAfterAssistant } from "@/components/assistant/Assistant";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    const search = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : "";
    apiFetch<Paginated<Client>>(`/clients/${search}`).then((res) => {
      setClients(res.results);
      setNext(res.next);
    });
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, query]);
  useRefreshAfterAssistant(load);

  async function loadMore() {
    if (!next) return;
    const res = await apiFetch<Paginated<Client>>(next);
    setClients((prev) => [...(prev ?? []), ...res.results]);
    setNext(res.next);
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        action={
          <Link
            href="/clients/new"
            aria-label="Nouveau client"
            className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white"
          >
            <UserPlus size={19} />
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <label className="flex h-12 items-center gap-2 rounded-2xl bg-bg-card px-4">
          <Search size={18} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom ou téléphone"
            className="min-w-0 flex-1 bg-transparent text-base focus:outline-none"
          />
        </label>

        <div className="mt-4 divide-y divide-line-soft overflow-hidden rounded-2xl bg-bg-card">
          {clients === null && [0, 1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse bg-bg-card" />)}
          {clients?.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">Aucun client trouvé.</p>}
          {clients?.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/clients/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold-soft font-semibold text-gold-dark">
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block text-sm text-muted">{c.phone || "—"}</span>
                </span>
              </Link>
              {c.phone && (
                <>
                  <a
                    href={`tel:${c.phone}`}
                    aria-label={`Appeler ${c.name}`}
                    className="grid h-10 w-10 place-items-center rounded-full bg-bg-sunken"
                  >
                    <Phone size={16} />
                  </a>
                  <a
                    href={waLink(c.phone, "")}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`WhatsApp ${c.name}`}
                    className="grid h-10 w-10 place-items-center rounded-full bg-wa [color:#fff]"
                  >
                    <MessageCircle size={16} />
                  </a>
                </>
              )}
            </div>
          ))}
        </div>
        {next && (
          <button onClick={loadMore} className="mt-3 h-12 w-full rounded-2xl bg-bg-card text-sm font-semibold">
            Voir plus
          </button>
        )}
      </div>
    </div>
  );
}
