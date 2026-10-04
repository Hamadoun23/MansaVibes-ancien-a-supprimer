"use client";

import { FormEvent, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { MeasurementField, MeasurementFormTemplate } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/Field";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function TemplateForm({
  template,
  onSaved,
  onCancel,
}: {
  template: MeasurementFormTemplate | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [notes, setNotes] = useState(template?.notes ?? "");
  const [referencePrice, setReferencePrice] = useState(String(template?.reference_price_fcfa ?? 0));
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [fields, setFields] = useState<MeasurementField[]>(template?.fields ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addField() {
    setFields((prev) => [...prev, { key: "", label: "", unit: "cm", type: "number" }]);
  }

  function updateField(index: number, patch: Partial<MeasurementField>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name,
        slug: slugify(name),
        notes,
        reference_price_fcfa: Number(referencePrice) || 0,
        is_active: isActive,
        sort_order: template?.sort_order ?? 0,
        fields: fields
          .filter((f) => f.key.trim() !== "" || f.label.trim() !== "")
          .map((f) => ({ ...f, key: f.key || slugify(f.label) })),
      };
      if (template) {
        await apiFetch(`/measurement-templates/${template.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/measurement-templates/", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer le modèle.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="tpl-name">Nom du modèle</Label>
        <Input id="tpl-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Boubou homme" />
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="tpl-price">Prix de référence (FCFA)</Label>
          <Input
            id="tpl-price"
            type="number"
            value={referencePrice}
            onChange={(e) => setReferencePrice(e.target.value)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="tpl-active">Statut</Label>
          <Select id="tpl-active" value={isActive ? "1" : "0"} onChange={(e) => setIsActive(e.target.value === "1")}>
            <option value="1">Actif</option>
            <option value="0">Inactif</option>
          </Select>
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label htmlFor="tpl-notes">Notes</Label>
        <Textarea id="tpl-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldGroup>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="eyebrow">Champs de mensuration</p>
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
                <Input
                  placeholder="Libellé (ex: Longueur manche)"
                  value={field.label}
                  onChange={(e) => updateField(i, { label: e.target.value })}
                />
              </div>
              <div className="w-16">
                <Input placeholder="Unité" value={field.unit} onChange={(e) => updateField(i, { unit: e.target.value })} />
              </div>
              <div className="w-24">
                <Select value={field.type} onChange={(e) => updateField(i, { type: e.target.value })}>
                  <option value="number">Nombre</option>
                  <option value="text">Texte</option>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => removeField(i)}
                className="mt-2.5 text-muted hover:text-danger"
                aria-label="Supprimer le champ"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {fields.length === 0 && <p className="text-sm text-muted">Aucun champ — ajoutez les mensurations à relever.</p>}
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
