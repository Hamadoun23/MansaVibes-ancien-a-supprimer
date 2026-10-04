"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label } from "@/components/ui/Field";

export function ReceiveStockForm({
  itemId,
  itemName,
  onSaved,
  onCancel,
}: {
  itemId: number;
  itemName: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("Réception fournisseur");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/stock-movements/", {
        method: "POST",
        body: JSON.stringify({ inventory_item: itemId, quantity_delta: quantity, reason }),
      });
      onSaved();
    } catch {
      setError("Impossible d'enregistrer le mouvement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-sm text-muted">
        Article : <span className="text-ink font-medium">{itemName}</span>
      </p>
      <FieldGroup>
        <Label htmlFor="mv-qty">Quantité (utilisez un nombre négatif pour une sortie)</Label>
        <Input id="mv-qty" type="number" step="0.001" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="mv-reason">Motif</Label>
        <Input id="mv-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </FieldGroup>
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
