"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Link2, MessageCircle, MoreHorizontal, Pencil, Phone, Plus, Ruler, Trash2 } from "lucide-react";
import { apiFetch, type Paginated } from "@/lib/api";
import type { Client, OrderListItem } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { MESSAGES, trackingUrl, waLink } from "@/lib/whatsapp";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { OrderCard } from "@/components/orders/OrderCard";
import { useAssistant, useRefreshAfterAssistant } from "@/components/assistant/Assistant";
import { AddMeasurementForm } from "./AddMeasurementForm";
import { ClientForm } from "../ClientForm";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { open: openAssistant } = useAssistant();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [measureOpen, setMeasureOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canEdit = user?.role !== "tailleur";

  const reload = useCallback(() => {
    apiFetch<Client>(`/clients/${id}/`).then(setClient);
    apiFetch<Paginated<OrderListItem>>(`/orders/?client=${id}`).then((res) => setOrders(res.results));
  }, [id]);

  useEffect(reload, [reload]);
  useRefreshAfterAssistant(reload);

  async function handleDeleteClient() {
    if (!client) return;
    if (!confirm(`Supprimer ${client.name} et toutes ses commandes ? C'est définitif.`)) return;
    await apiFetch(`/clients/${client.id}/`, { method: "DELETE" });
    router.push("/clients");
  }

  async function handleDeleteMeasurement(measurementId: number) {
    if (!confirm("Supprimer cette fiche de mesures ?")) return;
    await apiFetch(`/client-measurements/${measurementId}/`, { method: "DELETE" });
    reload();
  }

  async function copyLink() {
    if (!client) return;
    try {
      await navigator.clipboard.writeText(trackingUrl(client.portal_token));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the WhatsApp button still shares it */
    }
  }

  if (!client) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 pt-20">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        back
        title={client.name}
        subtitle={client.phone || undefined}
        action={
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="Options"
            className="grid h-10 w-10 place-items-center rounded-full bg-bg-card"
          >
            <MoreHorizontal size={20} />
          </button>
        }
      />

      <div className="mx-auto max-w-3xl space-y-4 px-4 md:px-8">
        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          <QuickAction href={client.phone ? `tel:${client.phone}` : undefined} icon={Phone} label="Appeler" />
          <QuickAction
            href={client.phone ? waLink(client.phone, "") : undefined}
            icon={MessageCircle}
            label="WhatsApp"
            external
          />
          <QuickAction
            href={
              client.phone
                ? waLink(client.phone, MESSAGES.link({ clientName: client.name, token: client.portal_token }))
                : undefined
            }
            onClick={client.phone ? undefined : copyLink}
            icon={Link2}
            label={copied ? "Copié !" : "Espace client"}
            external
          />
          {canEdit ? (
            <QuickAction href={`/orders/new?client=${client.id}`} icon={Plus} label="Commande" />
          ) : (
            <QuickAction onClick={() => setMeasureOpen(true)} icon={Ruler} label="Mesures" />
          )}
        </div>

        {client.notes && (
          <div className="rounded-2xl bg-bg-card p-4">
            <p className="mb-1 text-sm font-semibold">Notes</p>
            <p className="whitespace-pre-line text-sm text-ink-soft">{client.notes}</p>
          </div>
        )}

        {/* Measurements */}
        <section className="rounded-2xl bg-bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">Mesures</p>
            <div className="flex gap-2">
              <Button size="sm" variant="soft" onClick={openAssistant}>
                Dicter
              </Button>
              <Button size="sm" onClick={() => setMeasureOpen(true)}>
                <Plus size={15} /> Saisir
              </Button>
            </div>
          </div>

          {client.measurements && client.measurements.length > 0 ? (
            <div className="space-y-3">
              {client.measurements.map((m) => (
                <div key={m.id} className="rounded-xl bg-bg-sunken p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">{m.label}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">{formatDate(m.created_at)}</span>
                      <button
                        onClick={() => handleDeleteMeasurement(m.id)}
                        aria-label="Supprimer"
                        className="text-muted hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {m.display_rows.length === 0 ? (
                    <p className="text-xs text-muted">Aucune valeur.</p>
                  ) : (
                    <dl className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {m.display_rows.map((row, i) => (
                        <div key={i} className="rounded-lg bg-bg-card px-2.5 py-2">
                          <dt className="truncate text-[0.7rem] text-muted">{row.label}</dt>
                          <dd className="tabular font-semibold">
                            {row.value}
                            <span className="ml-0.5 text-xs font-normal text-muted">{row.unit}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Pas encore de mesures. Dictez-les ou saisissez-les.</p>
          )}
        </section>

        {/* Orders */}
        <section>
          <p className="mb-3 font-semibold">
            Commandes <span className="text-muted">({orders.length})</span>
          </p>
          <div className="space-y-2.5">
            {orders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                canEdit={canEdit}
                onChanged={(u) => setOrders((prev) => prev.map((x) => (x.id === u.id ? u : x)))}
              />
            ))}
            {orders.length === 0 && <p className="text-sm text-muted">Aucune commande.</p>}
          </div>
        </section>
      </div>

      <Modal open={measureOpen} onClose={() => setMeasureOpen(false)} title="Nouvelles mesures">
        <AddMeasurementForm
          clientId={client.id}
          onSaved={() => {
            setMeasureOpen(false);
            reload();
          }}
        />
      </Modal>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title={client.name}>
        <div className="space-y-2">
          <Button
            variant="soft"
            fullWidth
            onClick={() => {
              setMoreOpen(false);
              setEditOpen(true);
            }}
          >
            <Pencil size={17} /> Modifier les informations
          </Button>
          <Button variant="soft" fullWidth onClick={copyLink}>
            <Link2 size={17} /> {copied ? "Lien copié" : "Copier le lien de l'espace client"}
          </Button>
          {canEdit && (
            <Button variant="danger" fullWidth onClick={handleDeleteClient}>
              <Trash2 size={17} /> Supprimer le client
            </Button>
          )}
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le client">
        <ClientForm
          client={client}
          onCancel={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            reload();
          }}
        />
      </Modal>
    </div>
  );
}

function QuickAction({
  href,
  onClick,
  icon: Icon,
  label,
  external,
}: {
  href?: string;
  onClick?: () => void;
  icon: typeof Phone;
  label: string;
  external?: boolean;
}) {
  const className =
    "flex flex-col items-center gap-1.5 rounded-2xl bg-bg-card py-3.5 text-[0.72rem] font-medium aria-disabled:opacity-40";
  const content = (
    <>
      <span className="grid h-10 w-10 place-items-center rounded-full bg-bg-sunken">
        <Icon size={18} />
      </span>
      {label}
    </>
  );
  if (href && !onClick) {
    return href.startsWith("/") ? (
      <Link href={href} className={className}>
        {content}
      </Link>
    ) : (
      <a href={href} target={external ? "_blank" : undefined} rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return (
    <button onClick={onClick} disabled={!onClick} aria-disabled={!onClick} className={className}>
      {content}
    </button>
  );
}
