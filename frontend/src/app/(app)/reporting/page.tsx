"use client";

import { useEffect, useState } from "react";
import { apiFetch, type Paginated } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shell/PageHeader";

interface Snapshot {
  id: number;
  period_start: string;
  period_end: string;
  metrics: Record<string, unknown>;
}

export default function ReportingPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  useEffect(() => {
    apiFetch<Paginated<Snapshot>>("/reporting-snapshots/").then((res) => setSnapshots(res.results));
  }, []);

  return (
    <div>
      <PageHeader title="Rapports" subtitle="Instantanés de performance périodiques" />
      <div className="px-4 py-4 md:px-8 space-y-2">
        {snapshots.map((s) => (
          <div key={s.id} className="border border-line bg-bg-card px-4 py-3">
            <p className="text-sm font-medium">
              {formatDate(s.period_start)} → {formatDate(s.period_end)}
            </p>
            <pre className="mt-2 text-xs text-muted overflow-x-auto">{JSON.stringify(s.metrics, null, 2)}</pre>
          </div>
        ))}
        {snapshots.length === 0 && (
          <p className="text-sm text-muted">
            Aucun instantané pour le moment — le tableau de bord (Accueil) affiche déjà les indicateurs en
            temps réel.
          </p>
        )}
      </div>
    </div>
  );
}
