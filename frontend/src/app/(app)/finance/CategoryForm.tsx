"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Select } from "@/components/ui/Field";

interface Category {
  id: number;
  name: string;
  type: string;
}

export function CategoryForm({
  category,
  onSaved,
  onCancel,
}: {
  category: Category | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState(category?.type ?? "expense");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, type };
      if (category) {
        await apiFetch(`/finance-categories/${category.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/finance-categories/", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer la catégorie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="cat-name">Nom</Label>
        <Input id="cat-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="cat-type">Type</Label>
        <Select id="cat-type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="income">Recette</option>
          <option value="expense">Dépense</option>
        </Select>
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
