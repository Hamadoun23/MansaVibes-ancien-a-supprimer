"use client";

import { FormEvent, useEffect, useState } from "react";
import clsx from "clsx";
import { apiFetch, errorMessage, type Paginated } from "@/lib/api";
import type { MeasurementFormTemplate } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

const LEGACY_FIELDS: { key: string; label: string }[] = [
  { key: "poitrine_cm", label: "Poitrine" },
  { key: "taille_cm", label: "Taille" },
  { key: "hanche_cm", label: "Hanche" },
  { key: "longueur_cm", label: "Longueur" },
  { key: "epaule_cm", label: "Épaule" },
];

/** Pick the garment's measurement sheet, then type values on a numeric keypad. */
export function AddMeasurementForm({ clientId, onSaved }: { clientId: number; onSaved: () => void }) {
  const [templates, setTemplates] = useState<MeasurementFormTemplate[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Paginated<MeasurementFormTemplate>>("/measurement-templates/").then((r) =>
      setTemplates(r.results.filter((t) => t.is_active))
    );
  }, []);

  const template = templates.find((t) => t.id === templateId);
  const fields = template ? template.fields.map((f) => ({ key: f.key, label: f.label || f.key })) : LEGACY_FIELDS;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const filled = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ""));
    const payload: Record<string, unknown> = template
      ? { measurement_template: template.id, label: label || template.name, data: filled }
      : { label: label || "Mesures", data: {}, ...filled };
    try {
      await apiFetch(`/clients/${clientId}/measurements/`, { method: "POST", body: JSON.stringify(payload) });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {templates.length > 0 && (
        <div>
          <Label>Modèle de mesure</Label>
          <div className="flex flex-wrap gap-2">
            {[{ id: null, name: "Standard" }, ...templates].map((t) => (
              <button
                key={t.id ?? "std"}
                type="button"
                onClick={() => {
                  setTemplateId(t.id);
                  setValues({});
                }}
                className={clsx(
                  "h-10 rounded-full px-4 text-sm font-medium",
                  templateId === t.id ? "bg-ink text-white" : "bg-bg-sunken text-ink-soft"
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="m-label">Nom de la fiche</Label>
        <Input
          id="m-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={template?.name ?? "Ex. Boubou, Costume…"}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.key}>
            <Label htmlFor={`m-${field.key}`}>{field.label}</Label>
            <div className="relative">
              <Input
                id={`m-${field.key}`}
                inputMode="decimal"
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value.replace(",", ".") }))}
                className="tabular pr-10 font-semibold"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">cm</span>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" fullWidth size="lg" disabled={saving}>
        {saving ? "Enregistrement…" : "Enregistrer les mesures"}
      </Button>
    </form>
  );
}
