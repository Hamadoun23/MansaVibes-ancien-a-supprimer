"use client";

import { FormEvent, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/Field";

interface Field {
  key: string;
  label: string;
  unit: string;
  type: string;
}

interface FormTemplate {
  id: number;
  name: string;
  applies_to_stock_type: string;
  fields: Field[];
  is_active: boolean;
  notes: string;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_");
}

export function FormTemplateForm({
  template,
  onSaved,
  onCancel,
}: {
  template: FormTemplate | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [stockType, setStockType] = useState(template?.applies_to_stock_type ?? "fabric");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [notes, setNotes] = useState(template?.notes ?? "");
  const [fields, setFields] = useState<Field[]>(template?.fields ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addField() {
    setFields((prev) => [...prev, { key: "", label: "", unit: "", type: "text" }]);
  }
  function updateField(index: number, patch: Partial<Field>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }
  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        applies_to_stock_type: stockType,
        is_active: isActive,
        notes,
        fields: fields
          .filter((f) => f.key.trim() !== "" || f.label.trim() !== "")
          .map((f) => ({ ...f, key: f.key || slugify(f.label) })),
      };
      if (template) {
        await apiFetch(`/inventory-form-templates/${template.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/inventory-form-templates/", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer la fiche.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="ft-name">Nom de la fiche</Label>
        <Input id="ft-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="ft-type">S&apos;applique à</Label>
          <Select id="ft-type" value={stockType} onChange={(e) => setStockType(e.target.value)}>
            <option value="fabric">Tissu</option>
            <option value="accessory">Accessoire / mercerie</option>
            <option value="other">Autre</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="ft-active">Statut</Label>
          <Select id="ft-active" value={isActive ? "1" : "0"} onChange={(e) => setIsActive(e.target.value === "1")}>
            <option value="1">Actif</option>
            <option value="0">Inactif</option>
          </Select>
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="ft-notes">Notes</Label>
        <Textarea id="ft-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldGroup>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="eyebrow">Caractéristiques</p>
          <button
            type="button"
            onClick={addField}
            className="flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.14em] text-gold-dark"
          >
            <Plus size={13} /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={i} className="flex gap-2 items-start border border-line bg-white p-2.5">
              <div className="flex-1">
                <Input placeholder="Libellé" value={field.label} onChange={(e) => updateField(i, { label: e.target.value })} />
              </div>
              <div className="w-16">
                <Input placeholder="Unité" value={field.unit} onChange={(e) => updateField(i, { unit: e.target.value })} />
              </div>
              <div className="w-24">
                <Select value={field.type} onChange={(e) => updateField(i, { type: e.target.value })}>
                  <option value="text">Texte</option>
                  <option value="number">Nombre</option>
                </Select>
              </div>
              <button type="button" onClick={() => removeField(i)} className="mt-2.5 text-muted hover:text-danger">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {fields.length === 0 && <p className="text-sm text-muted">Aucune caractéristique définie.</p>}
        </div>
      </div>

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
