"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, Link2, MessageCircle, MoreHorizontal, Pencil, Phone, Trash2, Wallet } from "lucide-react";
import { apiFetch, errorMessage } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { PAYMENT_METHODS, STATUS, STEPS, isLate, stepIndex } from "@/lib/status";
import { MESSAGES, waLink } from "@/lib/whatsapp";
import { useAuth } from "@/lib/auth-context";
import { useShop } from "@/lib/shop";
import { PageHeader } from "@/components/shell/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { formatDue } from "@/components/orders/OrderCard";
import { OrderForm } from "../OrderForm";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const shop = useShop();
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const canEdit = user?.role !== "tailleur";

  const reload = useCallback(() => {
    apiFetch<Order>(`/orders/${id}/`).then(setOrder);
  }, [id]);

  useEffect(reload, [reload]);

  async function advance() {
    if (!order) return;
    setBusy(true);
    try {
      setOrder(await apiFetch<Order>(`/orders/${order.id}/advance/`, { method: "POST" }));
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: OrderStatus) {
    if (!order) return;
    setOrder(await apiFetch<Order>(`/orders/${order.id}/`, { method: "PATCH", body: JSON.stringify({ status }) }));
    setMoreOpen(false);
  }

  async function handleDelete() {
    if (!order) return;
    if (!confirm(`Supprimer la commande ${order.reference} ? C'est définitif.`)) return;
    await apiFetch(`/orders/${order.id}/`, { method: "DELETE" });
    router.push("/orders");
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 pt-20">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-bg-card" />
        ))}
      </div>
    );
  }

  const current = stepIndex(order.status);
  const late = isLate(order.due_date, order.status);
  const next = STATUS[order.status]?.next;
  const msgInput = {
    clientName: order.client_name,
    token: order.client_portal_token,
    model: order.model_name,
    balance: order.balance_due_fcfa,
    shop: shop?.business_name,
  };
  const ready = order.status === "done" || order.status === "validated";

  return (
    <div>
      <PageHeader
        back
        title={order.model_name || order.reference || "Commande"}
        subtitle={order.reference ?? undefined}
        action={
          canEdit && (
            <button
              onClick={() => setMoreOpen(true)}
              aria-label="Options"
              className="grid h-10 w-10 place-items-center rounded-full bg-bg-card"
            >
              <MoreHorizontal size={20} />
            </button>
          )
        }
      />

      <div className="mx-auto max-w-3xl space-y-4 px-4 md:px-8">
        {/* Client */}
        <div className="flex items-center gap-3 rounded-2xl bg-bg-card p-4">
          <Link href={`/clients/${order.client}`} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold-soft font-semibold text-gold-dark">
              {order.client_name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{order.client_name}</span>
              <span className="block text-sm text-muted">{order.client_phone || "Pas de téléphone"}</span>
            </span>
          </Link>
          {order.client_phone && (
            <a
              href={`tel:${order.client_phone}`}
              aria-label="Appeler"
              className="grid h-11 w-11 place-items-center rounded-full bg-bg-sunken"
            >
              <Phone size={18} />
            </a>
          )}
        </div>

        {/* Progress */}
        <div className="rounded-2xl bg-bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Livraison</p>
            <p className={clsx("text-sm font-semibold", late && "text-danger")}>
              {late ? "En retard · " : ""}
              {formatDue(order.due_date)}
            </p>
          </div>
          <ol className="mt-4 grid grid-cols-4 gap-1.5">
            {STEPS.map((step, i) => (
              <li key={step.status}>
                <div className={clsx("h-1.5 rounded-full", i <= current ? "bg-gold" : "bg-bg-sunken")} />
                <p className={clsx("mt-2 text-[0.72rem]", i === current ? "font-semibold text-ink" : "text-muted")}>
                  {step.label}
                </p>
              </li>
            ))}
          </ol>
          {canEdit && next && (
            <Button fullWidth size="lg" className="mt-4" onClick={advance} disabled={busy}>
              <Check size={18} /> {next}
            </Button>
          )}
        </div>

        {/* Money */}
        <div className="rounded-2xl bg-bg-card p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Money label="Total" value={order.total_fcfa} />
            <Money label="Payé" value={order.advance_payment_fcfa} />
            <Money
              label="Reste"
              value={order.balance_due_fcfa}
              tone={order.balance_due_fcfa > 0 ? "gold" : "success"}
            />
          </div>
          {canEdit && order.balance_due_fcfa > 0 && (
            <Button variant="soft" fullWidth className="mt-4" onClick={() => setPayOpen(true)}>
              <Wallet size={18} /> Encaisser un paiement
            </Button>
          )}
        </div>

        {/* WhatsApp */}
        {order.client_phone && (
          <div className="rounded-2xl bg-bg-card p-4">
            <p className="mb-3 text-sm font-semibold">Prévenir le client</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <WaButton
                primary={ready}
                href={waLink(order.client_phone, MESSAGES.ready(msgInput))}
                label="Tenue prête"
              />
              <WaButton href={waLink(order.client_phone, MESSAGES.received(msgInput))} label="Commande reçue + suivi" />
              {order.balance_due_fcfa > 0 && (
                <WaButton href={waLink(order.client_phone, MESSAGES.reminder(msgInput))} label="Rappel de solde" />
              )}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
              <Link2 size={13} /> Chaque message contient le lien de suivi personnel du client.
            </p>
          </div>
        )}

        {/* Items */}
        <div className="rounded-2xl bg-bg-card">
          <p className="px-4 pt-4 text-sm font-semibold">Articles</p>
          <div className="divide-y divide-line-soft">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-muted">
                    {item.quantity} × {formatFcfa(item.unit_price_fcfa)}
                    {item.client_supplies_fabric && " · tissu du client"}
                  </p>
                </div>
                <p className="tabular text-sm">{formatFcfa(item.line_net_fcfa)}</p>
              </div>
            ))}
            {order.items.length === 0 && <p className="px-4 py-3 text-sm text-muted">Aucun article.</p>}
          </div>
        </div>

        {(order.notes || order.model_notes) && (
          <div className="rounded-2xl bg-bg-card p-4">
            <p className="mb-1 text-sm font-semibold">Notes</p>
            <p className="whitespace-pre-line text-sm text-ink-soft">
              {[order.model_notes, order.notes].filter(Boolean).join("\n")}
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-bg-card p-4">
          <p className="mb-2 text-sm font-semibold">Historique</p>
          <ul className="space-y-2">
            {order.status_histories.map((h) => (
              <li key={h.id} className="flex items-center justify-between text-sm">
                <span>{STATUS[h.status]?.label ?? h.status}</span>
                <span className="text-xs text-muted">{formatDateTime(h.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {payOpen && (
        <PayModal
          order={order}
          onClose={() => setPayOpen(false)}
          onPaid={(o) => {
            setOrder(o);
            setPayOpen(false);
          }}
        />
      )}

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Options">
        <p className="mb-2 text-sm text-muted">Changer le statut</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {(Object.keys(STATUS) as OrderStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={clsx(
                "h-10 rounded-full px-4 text-sm font-medium",
                s === order.status ? "bg-ink text-white" : "bg-bg-sunken text-ink-soft"
              )}
            >
              {STATUS[s].label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <Button
            variant="soft"
            fullWidth
            onClick={() => {
              setMoreOpen(false);
              setEditOpen(true);
            }}
          >
            <Pencil size={17} /> Modifier la commande
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>
            <Trash2 size={17} /> Supprimer
          </Button>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier la commande">
        <OrderForm
          order={order}
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

function Money({ label, value, tone }: { label: string; value: number; tone?: "gold" | "success" }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p
        className={clsx(
          "tabular mt-1 text-[0.95rem] font-semibold",
          tone === "gold" && "text-gold-dark",
          tone === "success" && "text-success"
        )}
      >
        {formatFcfa(value).replace(" FCFA", "")}
      </p>
    </div>
  );
}

function WaButton({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={clsx(
        "flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold",
        primary ? "bg-wa [color:#fff]" : "bg-bg-sunken text-ink"
      )}
    >
      <MessageCircle size={17} /> {label}
    </a>
  );
}

function PayModal({ order, onClose, onPaid }: { order: Order; onClose: () => void; onPaid: (o: Order) => void }) {
  const [amount, setAmount] = useState(order.balance_due_fcfa);
  const [method, setMethod] = useState<string>("cash");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      onPaid(
        await apiFetch<Order>(`/orders/${order.id}/pay/`, {
          method: "POST",
          body: JSON.stringify({ amount_fcfa: amount, payment_method: method }),
        })
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Encaisser">
      <Label>Montant reçu (reste {formatFcfa(order.balance_due_fcfa)})</Label>
      <Input
        inputMode="numeric"
        autoFocus
        value={amount ? String(amount) : ""}
        onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)}
        className="tabular h-14 text-xl font-semibold"
      />
      <div className="mt-2 flex gap-2">
        {[order.balance_due_fcfa, Math.round(order.balance_due_fcfa / 2)].filter(Boolean).map((v, i) => (
          <button
            key={i}
            onClick={() => setAmount(v)}
            className="h-9 rounded-full bg-bg-sunken px-3 text-xs font-medium"
          >
            {i === 0 ? "Tout" : "Moitié"} · {formatFcfa(v)}
          </button>
        ))}
      </div>
      <Label className="mt-5">Moyen de paiement</Label>
      <div className="grid grid-cols-2 gap-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMethod(m.value)}
            className={clsx(
              "h-12 rounded-xl text-sm font-medium",
              method === m.value ? "bg-ink text-white" : "bg-bg-sunken text-ink-soft"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <Button fullWidth size="lg" className="mt-5" onClick={submit} disabled={saving || amount <= 0}>
        {saving ? "Enregistrement…" : `Encaisser ${formatFcfa(amount)}`}
      </Button>
    </Modal>
  );
}
