"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, type Paginated } from "@/lib/api";
import { formatDate, formatFcfa } from "@/lib/format";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatTile } from "@/components/ui/StatTile";
import { CashMovementForm } from "./CashMovementForm";
import { CategoryForm } from "./CategoryForm";
import { FixedAssetForm } from "./FixedAssetForm";

interface Category {
  id: number;
  name: string;
  type: string;
}

interface CashMovement {
  id: number;
  label: string;
  direction: "in" | "out";
  amount_fcfa: number;
  movement_date: string;
  notes: string;
  category: number | null;
  category_name: string | null;
}

interface FixedAsset {
  id: number;
  name: string;
  acquisition_date: string;
  amount_fcfa: number;
  useful_life_months: number | null;
  notes: string;
}

interface Summary {
  inflow_fcfa: number;
  outflow_fcfa: number;
  net_fcfa: number;
}

const TABS = [
  { value: "movements", label: "Mouvements" },
  { value: "categories", label: "Catégories" },
  { value: "assets", label: "Immobilisations" },
] as const;

type Tab = (typeof TABS)[number]["value"];

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>("movements");

  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [editingMovement, setEditingMovement] = useState<CashMovement | null>(null);
  const [movementModalOpen, setMovementModalOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [assetModalOpen, setAssetModalOpen] = useState(false);

  function reloadMovements() {
    apiFetch<Paginated<CashMovement>>("/cash-movements/").then((res) => setMovements(res.results));
    apiFetch<Summary>("/cash-movements/summary/").then(setSummary);
  }
  function reloadCategories() {
    apiFetch<Paginated<Category>>("/finance-categories/").then((res) => setCategories(res.results));
  }
  function reloadAssets() {
    apiFetch<Paginated<FixedAsset>>("/fixed-assets/").then((res) => setAssets(res.results));
  }

  useEffect(() => {
    reloadMovements();
    reloadCategories();
    reloadAssets();
  }, []);

  async function deleteMovement(m: CashMovement) {
    if (!confirm(`Supprimer le mouvement "${m.label}" ?`)) return;
    await apiFetch(`/cash-movements/${m.id}/`, { method: "DELETE" });
    reloadMovements();
  }
  async function deleteCategory(c: Category) {
    if (!confirm(`Supprimer la catégorie "${c.name}" ?`)) return;
    await apiFetch(`/finance-categories/${c.id}/`, { method: "DELETE" });
    reloadCategories();
  }
  async function deleteAsset(a: FixedAsset) {
    if (!confirm(`Supprimer l'immobilisation "${a.name}" ?`)) return;
    await apiFetch(`/fixed-assets/${a.id}/`, { method: "DELETE" });
    reloadAssets();
  }

  return (
    <div>
      <PageHeader
        title="Finance"
        subtitle="Trésorerie, catégories, immobilisations"
        action={
          tab === "movements" ? (
            <Button size="sm" onClick={() => { setEditingMovement(null); setMovementModalOpen(true); }}>
              <Plus size={14} /> Mouvement
            </Button>
          ) : tab === "categories" ? (
            <Button size="sm" onClick={() => { setEditingCategory(null); setCategoryModalOpen(true); }}>
              <Plus size={14} /> Catégorie
            </Button>
          ) : (
            <Button size="sm" onClick={() => { setEditingAsset(null); setAssetModalOpen(true); }}>
              <Plus size={14} /> Immobilisation
            </Button>
          )
        }
      />

      <div className="flex gap-2 overflow-x-auto border-b border-line bg-bg-card px-4 py-3 md:px-8">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={clsx(
              "shrink-0 border px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.1em]",
              tab === t.value ? "border-ink bg-ink text-white" : "border-line text-ink-soft"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-5 md:px-8 space-y-6">
        {tab === "movements" && (
          <>
            {summary && (
              <div className="grid grid-cols-3 gap-3 md:max-w-lg">
                <StatTile label="Entrées" value={formatFcfa(summary.inflow_fcfa)} />
                <StatTile label="Sorties" value={formatFcfa(summary.outflow_fcfa)} />
                <StatTile label="Net" value={formatFcfa(summary.net_fcfa)} tone={summary.net_fcfa < 0 ? "danger" : "gold"} />
              </div>
            )}
            <div className="border border-line bg-bg-card divide-y divide-line">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {m.category_name ?? "Sans catégorie"} · {formatDate(m.movement_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-sm ${m.direction === "in" ? "text-success" : "text-danger"}`}>
                      {m.direction === "in" ? "+" : "-"}
                      {formatFcfa(m.amount_fcfa)}
                    </p>
                    <button onClick={() => { setEditingMovement(m); setMovementModalOpen(true); }} className="text-ink-soft hover:text-ink">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteMovement(m)} className="text-ink-soft hover:text-danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {movements.length === 0 && <p className="px-4 py-3 text-sm text-muted">Aucun mouvement.</p>}
            </div>
          </>
        )}

        {tab === "categories" && (
          <div className="border border-line bg-bg-card divide-y divide-line max-w-lg">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted mt-0.5">{c.type === "income" ? "Recette" : "Dépense"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setEditingCategory(c); setCategoryModalOpen(true); }} className="text-ink-soft hover:text-ink">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteCategory(c)} className="text-ink-soft hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <p className="px-4 py-3 text-sm text-muted">Aucune catégorie.</p>}
          </div>
        )}

        {tab === "assets" && (
          <div className="border border-line bg-bg-card divide-y divide-line">
            {assets.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    Acquis le {formatDate(a.acquisition_date)}
                    {a.useful_life_months ? ` · ${a.useful_life_months} mois` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm">{formatFcfa(a.amount_fcfa)}</p>
                  <button onClick={() => { setEditingAsset(a); setAssetModalOpen(true); }} className="text-ink-soft hover:text-ink">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteAsset(a)} className="text-ink-soft hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {assets.length === 0 && <p className="px-4 py-3 text-sm text-muted">Aucune immobilisation.</p>}
          </div>
        )}
      </div>

      <Modal open={movementModalOpen} onClose={() => setMovementModalOpen(false)} title={editingMovement ? "Modifier le mouvement" : "Nouveau mouvement"}>
        <CashMovementForm
          movement={editingMovement}
          onCancel={() => setMovementModalOpen(false)}
          onSaved={() => { setMovementModalOpen(false); reloadMovements(); }}
        />
      </Modal>

      <Modal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title={editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}>
        <CategoryForm
          category={editingCategory}
          onCancel={() => setCategoryModalOpen(false)}
          onSaved={() => { setCategoryModalOpen(false); reloadCategories(); }}
        />
      </Modal>

      <Modal open={assetModalOpen} onClose={() => setAssetModalOpen(false)} title={editingAsset ? "Modifier l'immobilisation" : "Nouvelle immobilisation"}>
        <FixedAssetForm
          asset={editingAsset}
          onCancel={() => setAssetModalOpen(false)}
          onSaved={() => { setAssetModalOpen(false); reloadAssets(); }}
        />
      </Modal>
    </div>
  );
}
