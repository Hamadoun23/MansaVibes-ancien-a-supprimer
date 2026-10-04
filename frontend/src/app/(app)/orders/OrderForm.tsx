"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch, type Paginated } from "@/lib/api";
import type {
  Client,
  DeliveryMode,
  DiscountScope,
  Order,
  OrderStatus,
  PaymentMethod,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/Field";

interface Employee {
  id: number;
  name: string;
}

interface ItemDraft {
  id?: number;
  description: string;
  quantity: number;
  unit_price_fcfa: number;
  discount_applies: boolean;
}

export function OrderForm({
  order,
  defaultClientId,
  onSaved,
  onCancel,
}: {
  order: Order | null;
  defaultClientId?: string | null;
  onSaved: (order: Order) => void;
  onCancel: () => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [clientId, setClientId] = useState(order ? String(order.client) : defaultClientId ?? "");
  const [modelName, setModelName] = useState(order?.model_name ?? "");
  const [dueDate, setDueDate] = useState(order?.due_date ?? "");
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "pending");
  const [assignee, setAssignee] = useState(order?.assignee ? String(order.assignee) : "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order?.payment_method ?? "");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(order?.delivery_mode ?? "pickup");
  const [advancePayment, setAdvancePayment] = useState(String(order?.advance_payment_fcfa ?? 0));
  const [discountScope, setDiscountScope] = useState<DiscountScope>(order?.discount_scope ?? "none");
  const [discountPercent, setDiscountPercent] = useState(String(order?.discount_percent ?? 0));
  const [notes, setNotes] = useState(order?.notes ?? "");
  const [items, setItems] = useState<ItemDraft[]>(
    order?.items.map((i) => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      unit_price_fcfa: i.unit_price_fcfa,
      discount_applies: i.discount_applies,
    })) ?? [{ description: "", quantity: 1, unit_price_fcfa: 0, discount_applies: false }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Paginated<Client>>("/clients/?page_size=200").then((res) => setClients(res.results));
    apiFetch<Paginated<Employee>>("/employees/?page_size=200")
      .then((res) => setEmployees(res.results))
      .catch(() => setEmployees([]));
  }, []);

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }
  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit_price_fcfa: 0, discount_applies: false }]);
  }
  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clientId) {
      setError("Sélectionnez un client.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        client: Number(clientId),
        model_name: modelName,
        due_date: dueDate || null,
        status,
        assignee: assignee ? Number(assignee) : null,
        payment_method: paymentMethod,
        delivery_mode: deliveryMode,
        advance_payment_fcfa: Number(advancePayment) || 0,
        discount_scope: discountScope,
        discount_percent: Number(discountPercent) || 0,
        notes,
        items: items
          .filter((item) => item.description.trim() !== "")
          .map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price_fcfa: item.unit_price_fcfa,
            discount_applies: item.discount_applies,
          })),
      };
      const saved = order
        ? await apiFetch<Order>(`/orders/${order.id}/`, { method: "PATCH", body: JSON.stringify(payload) })
        : await apiFetch<Order>("/orders/", { method: "POST", body: JSON.stringify(payload) });
      onSaved(saved);
    } catch {
      setError("Impossible d'enregistrer la commande.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="o-client">Client</Label>
        <Select id="o-client" required value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Sélectionner…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="o-model">Modèle</Label>
          <Input id="o-model" value={modelName} onChange={(e) => setModelName(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="o-due">Échéance</Label>
          <Input id="o-due" type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)} />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="o-status">Statut</Label>
          <Select id="o-status" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminé</option>
            <option value="validated">Validé</option>
            <option value="delivered">Livré</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="o-assignee">Assigné à</Label>
          <Select id="o-assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">—</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="o-delivery">Livraison</Label>
          <Select id="o-delivery" value={deliveryMode} onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}>
            <option value="pickup">Retrait en boutique</option>
            <option value="delivery">Livraison</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="o-payment">Mode de paiement</Label>
          <Select id="o-payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
            <option value="">—</option>
            <option value="cash">Espèces</option>
            <option value="orange_money">Orange Money</option>
            <option value="wave">Wave</option>
            <option value="bank_transfer">Virement bancaire</option>
          </Select>
        </FieldGroup>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FieldGroup>
          <Label htmlFor="o-advance">Acompte versé (FCFA)</Label>
          <Input id="o-advance" type="number" value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="o-discount-scope">Remise</Label>
          <Select id="o-discount-scope" value={discountScope} onChange={(e) => setDiscountScope(e.target.value as DiscountScope)}>
            <option value="none">Aucune</option>
            <option value="all">Toute la commande</option>
            <option value="line">Par article</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="o-discount-percent">Remise (%)</Label>
          <Input
            id="o-discount-percent"
            type="number"
            min={0}
            max={100}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            disabled={discountScope === "none"}
          />
        </FieldGroup>
      </div>

      <div className="mt-2 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="eyebrow">Articles</p>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.14em] text-gold-dark"
          >
            <Plus size={13} /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="border border-line bg-white p-3">
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                  />
                </div>
                <div className="w-16">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    placeholder="Prix"
                    value={item.unit_price_fcfa}
                    onChange={(e) => updateItem(i, { unit_price_fcfa: Number(e.target.value) })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="mt-2.5 text-muted hover:text-danger"
                  aria-label="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {discountScope === "line" && (
                <label className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={item.discount_applies}
                    onChange={(e) => updateItem(i, { discount_applies: e.target.checked })}
                  />
                  Remise applicable sur cet article
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      <FieldGroup>
        <Label htmlFor="o-notes">Notes</Label>
        <Textarea id="o-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldGroup>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
