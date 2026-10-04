"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatFcfa } from "@/lib/format";
import type { DashboardOverview } from "@/lib/types";
import { PageHeader } from "@/components/shell/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { useAuth } from "@/lib/auth-context";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  done: "Terminé",
  validated: "Validé",
  delivered: "Livré",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<DashboardOverview>("/dashboard/overview/")
      .then(setData)
      .catch(() => setError(true));
  }, []);

  return (
    <div>
      <PageHeader title={`Bonjour, ${user?.name?.split(" ")[0] ?? ""}`} subtitle="Aperçu de l'activité de l'atelier" />

      <div className="px-4 py-5 md:px-8">
        {error && <p className="text-danger text-sm">Impossible de charger les données.</p>}

        {!data && !error && <p className="text-sm text-muted">Chargement…</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile label="Commandes" value={String(data.orders_total)} />
              <StatTile label="Chiffre d'affaires" value={formatFcfa(data.revenue_total_fcfa)} tone="gold" />
              <StatTile label="Solde clients dû" value={formatFcfa(data.outstanding_balance_fcfa)} tone="danger" />
              <StatTile
                label="Trésorerie nette"
                value={formatFcfa(data.cash_net_fcfa)}
                tone={data.cash_net_fcfa < 0 ? "danger" : "default"}
              />
            </div>

            <div className="mt-8">
              <p className="eyebrow mb-3">Commandes par statut</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {Object.entries(data.orders_by_status).map(([status, count]) => (
                  <div key={status} className="border border-line bg-bg-card px-3 py-3 text-center">
                    <p className="serif text-lg">{count}</p>
                    <p className="text-[0.65rem] uppercase tracking-[0.1em] text-muted mt-1">
                      {STATUS_LABELS[status] ?? status}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-2 md:max-w-md">
              <StatTile label="Entrées caisse" value={formatFcfa(data.cash_in_fcfa)} />
              <StatTile label="Sorties caisse" value={formatFcfa(data.cash_out_fcfa)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
