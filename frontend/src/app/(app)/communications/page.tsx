"use client";

import { useEffect, useState } from "react";
import { apiFetch, type Paginated } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";

interface NotificationLog {
  id: number;
  channel: string;
  recipient: string;
  body: string;
  status: "pending" | "sent" | "failed";
  created_at: string;
}

const STATUS_TONE: Record<string, "muted" | "success" | "danger"> = {
  pending: "muted",
  sent: "success",
  failed: "danger",
};

export default function CommunicationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);

  useEffect(() => {
    apiFetch<Paginated<NotificationLog>>("/notifications/").then((res) => setLogs(res.results));
  }, []);

  return (
    <div>
      <PageHeader title="Communications" subtitle="Historique des envois WhatsApp" />
      <div className="px-4 py-4 md:px-8 space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="border border-line bg-bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{log.recipient}</p>
              <Badge tone={STATUS_TONE[log.status]}>{log.status}</Badge>
            </div>
            <p className="text-xs text-muted mt-1">{formatDateTime(log.created_at)}</p>
            {log.body && <p className="mt-2 text-sm text-ink-soft whitespace-pre-line">{log.body}</p>}
          </div>
        ))}
        {logs.length === 0 && <p className="text-sm text-muted">Aucun envoi pour le moment.</p>}
      </div>
    </div>
  );
}
