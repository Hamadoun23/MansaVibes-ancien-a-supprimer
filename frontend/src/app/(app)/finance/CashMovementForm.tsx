"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, type Paginated } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/Field";

interface Category {
  id: number;
  name: string;
  type: string;
}

interface CashMovement {
  id: number;
  label: string;
  direction: "in" | "out";
  amount_fcfa: number;
  movement_date: string;
  notes: string;
  category: number | null;
}

export function CashMovementForm({
  movement,
  onSaved,
  onCancel,
}: {
  movement: CashMovement | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [label, setLabel] = useState(movement?.label ?? "");
  const [direction, setDirection] = useState<"in" | "out">(movement?.direction ?? "out");
  const [amount, setAmount] = useState(String(movement?.amount_fcfa ?? ""));
  const [category, setCategory] = useState(movement?.category ? String(movement.category) : "");
  const [date, setDate] = useState(movement?.movement_date ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(movement?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Paginated<Category>>("/finance-categories/?page_size=200").then((res) => setCategories(res.results));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        label,
        direction,
        amount_fcfa: Number(amount) || 0,
        category: category ? Number(category) : null,
        movement_date: date,
        notes,
      };
      if (movement) {
        await apiFetch(`/cash-movements/${movement.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/cash-movements/", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer le mouvement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="cm-label">Libellé</Label>
        <Input id="cm-label" required value={label} onChange={(e) => setLabel(e.target.value)} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="cm-direction">Sens</Label>
          <Select id="cm-direction" value={direction} onChange={(e) => setDirection(e.target.value as "in" | "out")}>
            <option value="in">Entrée</option>
            <option value="out">Sortie</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="cm-amount">Montant (FCFA)</Label>
          <Input id="cm-amount" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FieldGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="cm-category">Catégorie</Label>
          <Select id="cm-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="cm-date">Date</Label>
          <Input id="cm-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="cm-notes">Notes</Label>
        <Textarea id="cm-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
