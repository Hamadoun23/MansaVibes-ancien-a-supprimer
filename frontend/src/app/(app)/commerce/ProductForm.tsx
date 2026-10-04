"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/Field";

interface Product {
  id: number;
  name: string;
  slug: string;
  price_fcfa: number;
  description: string;
  is_active: boolean;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductForm({
  product,
  onSaved,
  onCancel,
}: {
  product: Product | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(String(product?.price_fcfa ?? 0));
  const [description, setDescription] = useState(product?.description ?? "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, slug: slugify(name), price_fcfa: Number(price) || 0, description, is_active: isActive };
      if (product) {
        await apiFetch(`/products/${product.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/products/", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer le produit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="p-name">Nom</Label>
        <Input id="p-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="p-price">Prix (FCFA)</Label>
          <Input id="p-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="p-active">Statut</Label>
          <Select id="p-active" value={isActive ? "1" : "0"} onChange={(e) => setIsActive(e.target.value === "1")}>
            <option value="1">Actif</option>
            <option value="0">Inactif</option>
          </Select>
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="p-desc">Description</Label>
        <Textarea id="p-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
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
