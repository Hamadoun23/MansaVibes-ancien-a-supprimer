"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, type Paginated } from "@/lib/api";
import { formatFcfa } from "@/lib/format";
import type { MeasurementFormTemplate } from "@/lib/types";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TemplateForm } from "./TemplateForm";

export default function MeasurementTemplatesPage() {
  const [templates, setTemplates] = useState<MeasurementFormTemplate[]>([]);
  const [editing, setEditing] = useState<MeasurementFormTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function reload() {
    apiFetch<Paginated<MeasurementFormTemplate>>("/measurement-templates/").then((res) =>
      setTemplates(res.results)
    );
  }

  useEffect(reload, []);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(t: MeasurementFormTemplate) {
    setEditing(t);
    setModalOpen(true);
  }

  async function handleDelete(t: MeasurementFormTemplate) {
    if (!confirm(`Supprimer le modèle "${t.name}" ?`)) return;
    await apiFetch(`/measurement-templates/${t.id}/`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Modèles de mesure"
        subtitle={`${templates.length} modèle${templates.length > 1 ? "s" : ""}`}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} /> Nouveau
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
            <p className="text-xs text-muted mt-1">{t.fields.length} champ(s)</p>
            <p className="mt-2 text-sm text-gold-dark">{formatFcfa(t.reference_price_fcfa)}</p>
            <div className="mt-3 flex gap-3">
              <button onClick={() => openEdit(t)} className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink">
                <Pencil size={13} /> Modifier
              </button>
              <button onClick={() => handleDelete(t)} className="flex items-center gap-1 text-xs text-ink-soft hover:text-danger">
                <Trash2 size={13} /> Supprimer
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="text-sm text-muted">Aucun modèle.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modifier le modèle" : "Nouveau modèle"}>
        <TemplateForm
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
