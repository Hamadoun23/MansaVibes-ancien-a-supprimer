"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, type Paginated } from "@/lib/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormTemplateForm } from "./FormTemplateForm";

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

const STOCK_TYPE_LABELS: Record<string, string> = {
  fabric: "Tissu",
  accessory: "Accessoire",
  other: "Autre",
};

export default function InventoryFormTemplatesPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [editing, setEditing] = useState<FormTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function reload() {
    apiFetch<Paginated<FormTemplate>>("/inventory-form-templates/").then((res) => setTemplates(res.results));
  }

  useEffect(reload, []);

  async function handleDelete(t: FormTemplate) {
    if (!confirm(`Supprimer la fiche "${t.name}" ?`)) return;
    await apiFetch(`/inventory-form-templates/${t.id}/`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Fiches de stock"
        subtitle="Les caractéristiques personnalisées par type d'article"
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus size={14} /> Nouvelle
          </Button>
        }
      />
      <div className="px-4 py-4 md:px-8 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <div key={t.id} className="border border-line bg-bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">{t.name}</p>
              {!t.is_active && <Badge>Inactif</Badge>}
            </div>
            <p className="text-xs text-muted mt-1">
              {STOCK_TYPE_LABELS[t.applies_to_stock_type] ?? t.applies_to_stock_type} · {t.fields.length} champ(s)
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  setEditing(t);
                  setModalOpen(true);
                }}
                className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink"
              >
                <Pencil size={13} /> Modifier
              </button>
              <button onClick={() => handleDelete(t)} className="flex items-center gap-1 text-xs text-ink-soft hover:text-danger">
                <Trash2 size={13} /> Supprimer
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="text-sm text-muted">Aucune fiche.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modifier la fiche" : "Nouvelle fiche"}>
        <FormTemplateForm
          template={editing}
          onCancel={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            reload();
          }}
        />
      </Modal>
    </div>
  );
}
