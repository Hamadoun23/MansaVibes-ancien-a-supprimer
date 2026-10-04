"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Textarea } from "@/components/ui/Field";

interface FixedAsset {
  id: number;
  name: string;
  acquisition_date: string;
  amount_fcfa: number;
  useful_life_months: number | null;
  notes: string;
}

export function FixedAssetForm({
  asset,
  onSaved,
  onCancel,
}: {
  asset: FixedAsset | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(asset?.name ?? "");
  const [date, setDate] = useState(asset?.acquisition_date ?? new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(String(asset?.amount_fcfa ?? ""));
  const [lifeMonths, setLifeMonths] = useState(asset?.useful_life_months ? String(asset.useful_life_months) : "");
  const [notes, setNotes] = useState(asset?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        acquisition_date: date,
        amount_fcfa: Number(amount) || 0,
        useful_life_months: lifeMonths ? Number(lifeMonths) : null,
        notes,
      };
      if (asset) {
        await apiFetch(`/fixed-assets/${asset.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/fixed-assets/", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer l'immobilisation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="fa-name">Nom</Label>
        <Input id="fa-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="fa-date">Date d&apos;acquisition</Label>
          <Input id="fa-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="fa-amount">Montant (FCFA)</Label>
          <Input id="fa-amount" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="fa-life">Durée de vie utile (mois)</Label>
        <Input id="fa-life" type="number" value={lifeMonths} onChange={(e) => setLifeMonths(e.target.value)} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="fa-notes">Notes</Label>
        <Textarea id="fa-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
