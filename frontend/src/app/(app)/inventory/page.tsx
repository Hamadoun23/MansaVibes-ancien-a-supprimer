"use client";

import { useEffect, useState } from "react";
import { PackagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, type Paginated } from "@/lib/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ItemForm } from "./ItemForm";
import { ReceiveStockForm } from "./ReceiveStockForm";

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
  is_below_reorder_level: boolean;
  supplier_name: string | null;
}

const STOCK_TYPE_LABELS: Record<string, string> = {
  fabric: "Tissu",
  accessory: "Accessoire",
  other: "Autre",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [receiving, setReceiving] = useState<InventoryItem | null>(null);

  function reload() {
    apiFetch<Paginated<InventoryItem>>("/inventory-items/")
      .then((res) => setItems(res.results))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleDelete(item: InventoryItem) {
    if (!confirm(`Supprimer l'article "${item.name}" ?`)) return;
    await apiFetch(`/inventory-items/${item.id}/`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle={`${items.length} article${items.length > 1 ? "s" : ""}`}
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
      <div className="px-4 py-4 md:px-8">
        {loading && <p className="text-sm text-muted">Chargement…</p>}
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="border border-line bg-bg-card px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {STOCK_TYPE_LABELS[item.stock_type] ?? item.stock_type}
                    {item.supplier_name ? ` · ${item.supplier_name}` : ""}
                  </p>
                </div>
                {item.is_below_reorder_level && <Badge tone="danger">Seuil bas</Badge>}
              </div>
              <p className="mt-2 text-sm">
                {item.quantity_on_hand} {item.unit}{" "}
                <span className="text-xs text-muted">(seuil {item.reorder_level})</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  onClick={() => setReceiving(item)}
                  className="flex items-center gap-1 text-xs text-ink-soft hover:text-gold-dark"
                >
                  <PackagePlus size={13} /> Mouvement
                </button>
                <button
                  onClick={() => {
                    setEditing(item);
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink"
                >
                  <Pencil size={13} /> Modifier
                </button>
                <button onClick={() => handleDelete(item)} className="flex items-center gap-1 text-xs text-ink-soft hover:text-danger">
                  <Trash2 size={13} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
        {!loading && items.length === 0 && <p className="text-sm text-muted">Aucun article en stock.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modifier l'article" : "Nouvel article"}>
        <ItemForm
          item={editing}
          onCancel={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            reload();
          }}
        />
      </Modal>

      <Modal open={!!receiving} onClose={() => setReceiving(null)} title="Mouvement de stock">
        {receiving && (
          <ReceiveStockForm
            itemId={receiving.id}
            itemName={receiving.name}
            onCancel={() => setReceiving(null)}
            onSaved={() => {
              setReceiving(null);
              reload();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
