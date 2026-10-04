"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, type Paginated } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/Field";

interface Supplier {
  id: number;
  name: string;
}

interface InventoryItem {
  id: number;
  name: string;
  stock_type: string;
  sku: string;
  unit: string;
  quantity_on_hand: string;
  reorder_level: string;
  quality_label: string;
  notes: string;
  supplier: number | null;
}

export function ItemForm({
  item,
  onSaved,
  onCancel,
}: {
  item: InventoryItem | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [name, setName] = useState(item?.name ?? "");
  const [stockType, setStockType] = useState(item?.stock_type ?? "fabric");
  const [supplier, setSupplier] = useState(item?.supplier ? String(item.supplier) : "");
  const [sku, setSku] = useState(item?.sku ?? "");
  const [unit, setUnit] = useState(item?.unit ?? "m");
  const [quantity, setQuantity] = useState(item?.quantity_on_hand ?? "0");
  const [reorderLevel, setReorderLevel] = useState(item?.reorder_level ?? "0");
  const [qualityLabel, setQualityLabel] = useState(item?.quality_label ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Paginated<Supplier>>("/suppliers/?page_size=200").then((res) => setSuppliers(res.results));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        stock_type: stockType,
        supplier: supplier ? Number(supplier) : null,
        sku,
        unit,
        quantity_on_hand: quantity,
        reorder_level: reorderLevel,
        quality_label: qualityLabel,
        notes,
      };
      if (item) {
        await apiFetch(`/inventory-items/${item.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/inventory-items/", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer l'article.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="i-name">Nom</Label>
        <Input id="i-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="i-type">Type</Label>
          <Select id="i-type" value={stockType} onChange={(e) => setStockType(e.target.value)}>
            <option value="fabric">Tissu</option>
            <option value="accessory">Accessoire / mercerie</option>
            <option value="other">Autre</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="i-supplier">Fournisseur</Label>
          <Select id="i-supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FieldGroup>
          <Label htmlFor="i-unit">Unité</Label>
          <Input id="i-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="i-qty">Quantité</Label>
          <Input id="i-qty" type="number" step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="i-reorder">Seuil d&apos;alerte</Label>
          <Input id="i-reorder" type="number" step="0.001" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
        </FieldGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="i-sku">Référence (SKU)</Label>
          <Input id="i-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="i-quality">Qualité</Label>
          <Input id="i-quality" value={qualityLabel} onChange={(e) => setQualityLabel(e.target.value)} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="i-notes">Notes</Label>
        <Textarea id="i-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
