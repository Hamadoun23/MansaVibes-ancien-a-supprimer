"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, type Paginated } from "@/lib/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SupplierForm } from "./SupplierForm";

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function reload() {
    apiFetch<Paginated<Supplier>>("/suppliers/").then((res) => setSuppliers(res.results));
  }

  useEffect(reload, []);

  async function handleDelete(s: Supplier) {
    if (!confirm(`Supprimer le fournisseur "${s.name}" ?`)) return;
    await apiFetch(`/suppliers/${s.id}/`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Fournisseurs"
        subtitle={`${suppliers.length} fournisseur${suppliers.length > 1 ? "s" : ""}`}
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus size={14} /> Nouveau
          </Button>
        }
      />
      <div className="px-4 py-4 md:px-8 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((s) => (
          <div key={s.id} className="border border-line bg-bg-card px-4 py-3">
            <p className="font-medium text-sm">{s.name}</p>
            <p className="text-xs text-muted mt-0.5">{s.phone}</p>
            {s.email && <p className="text-xs text-muted">{s.email}</p>}
            {s.address && <p className="text-xs text-muted mt-1">{s.address}</p>}
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  setEditing(s);
                  setModalOpen(true);
                }}
                className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink"
              >
                <Pencil size={13} /> Modifier
              </button>
              <button onClick={() => handleDelete(s)} className="flex items-center gap-1 text-xs text-ink-soft hover:text-danger">
                <Trash2 size={13} /> Supprimer
              </button>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && <p className="text-sm text-muted">Aucun fournisseur.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modifier le fournisseur" : "Nouveau fournisseur"}>
        <SupplierForm
          supplier={editing}
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
