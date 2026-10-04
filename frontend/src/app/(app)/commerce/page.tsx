"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, type Paginated } from "@/lib/api";
import { formatFcfa } from "@/lib/format";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProductForm } from "./ProductForm";

interface Product {
  id: number;
  name: string;
  slug: string;
  price_fcfa: number;
  description: string;
  is_active: boolean;
}

export default function CommercePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function reload() {
    apiFetch<Paginated<Product>>("/products/").then((res) => setProducts(res.results));
  }

  useEffect(reload, []);

  async function handleDelete(p: Product) {
    if (!confirm(`Supprimer le produit "${p.name}" ?`)) return;
    await apiFetch(`/products/${p.id}/`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Boutique"
        subtitle={`${products.length} produit${products.length > 1 ? "s" : ""}`}
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
        {products.map((p) => (
          <div key={p.id} className="border border-line bg-bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">{p.name}</p>
              {!p.is_active && <Badge>Inactif</Badge>}
            </div>
            <p className="mt-2 text-sm text-gold-dark">{formatFcfa(p.price_fcfa)}</p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  setEditing(p);
                  setModalOpen(true);
                }}
                className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink"
              >
                <Pencil size={13} /> Modifier
              </button>
              <button onClick={() => handleDelete(p)} className="flex items-center gap-1 text-xs text-ink-soft hover:text-danger">
                <Trash2 size={13} /> Supprimer
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="text-sm text-muted">Aucun produit publié.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modifier le produit" : "Nouveau produit"}>
        <ProductForm
          product={editing}
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
