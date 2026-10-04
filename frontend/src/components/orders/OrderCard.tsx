"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { CalendarClock, ChevronRight, MessageCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Order, OrderListItem } from "@/lib/types";
import { formatFcfa } from "@/lib/format";
import { isLate, STATUS } from "@/lib/status";
import { MESSAGES, waLink } from "@/lib/whatsapp";
import { StatusBadge } from "@/components/ui/Badge";

export function formatDue(date: string | null): string {
  if (!date) return "Sans date";
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (date === today) return "Aujourd'hui";
  if (date === tomorrow) return "Demain";
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Order summary with the one action that matters next (advance, or tell the client it's ready). */
export function OrderCard({
  order,
  canEdit,
  onChanged,
}: {
  order: OrderListItem;
  canEdit: boolean;
  onChanged?: (updated: OrderListItem) => void;
}) {
  const [busy, setBusy] = useState(false);
  const late = isLate(order.due_date, order.status);
  const next = STATUS[order.status]?.next;
  const ready = order.status === "done" || order.status === "validated";

  async function advance() {
    setBusy(true);
    try {
      const updated = await apiFetch<Order>(`/orders/${order.id}/advance/`, { method: "POST" });
      onChanged?.({ ...order, status: updated.status });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mv-reveal rounded-2xl border border-line-soft bg-bg-card">
      <Link href={`/orders/${order.id}`} className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{order.client_name}</p>
          <p className="truncate text-sm text-ink-soft">{order.model_name || order.reference}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span
              className={clsx(
                "inline-flex items-center gap-1 text-xs",
                late ? "font-semibold text-danger" : "text-muted"
              )}
            >
              <CalendarClock size={13} />
              {late ? `En retard · ${formatDue(order.due_date)}` : formatDue(order.due_date)}
            </span>
          </div>
        </div>
        <div className="text-right">
          {order.balance_due_fcfa > 0 ? (
            <>
              <p className="tabular text-sm font-semibold">{formatFcfa(order.balance_due_fcfa)}</p>
              <p className="text-[0.7rem] text-muted">à encaisser</p>
            </>
          ) : (
            <p className="text-[0.7rem] font-semibold text-success">Payé</p>
          )}
          <ChevronRight size={16} className="mt-2 ml-auto text-muted" />
        </div>
      </Link>
      {canEdit && next && (
        <div className="flex gap-2 border-t border-line-soft px-3 py-2.5">
          {ready && order.client_phone && (
            <a
              href={waLink(
                order.client_phone,
                MESSAGES.ready({
                  clientName: order.client_name,
                  token: order.client_portal_token,
                  model: order.model_name,
                  balance: order.balance_due_fcfa,
                })
              )}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center gap-1.5 rounded-xl bg-wa px-3 text-sm font-semibold [color:#fff]"
            >
              <MessageCircle size={16} /> Prévenir
            </a>
          )}
          <button
            onClick={advance}
            disabled={busy}
            className="h-10 flex-1 rounded-xl bg-bg-sunken text-sm font-semibold text-ink disabled:opacity-50"
          >
            {busy ? "…" : next}
          </button>
        </div>
      )}
    </div>
  );
}
