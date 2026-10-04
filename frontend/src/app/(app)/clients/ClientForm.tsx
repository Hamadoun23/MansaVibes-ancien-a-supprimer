"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Client } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Textarea } from "@/components/ui/Field";
import { DictateButton } from "@/components/assistant/DictateButton";

export function ClientForm({
  client,
  onSaved,
  onCancel,
}: {
  client: Client | null;
  onSaved: (client: Client) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(client?.name ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, phone, email, notes };
      const saved = client
        ? await apiFetch<Client>(`/clients/${client.id}/`, { method: "PATCH", body: JSON.stringify(payload) })
        : await apiFetch<Client>("/clients/", { method: "POST", body: JSON.stringify(payload) });
      onSaved(saved);
    } catch {
      setError("Impossible d'enregistrer le client.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="c-name">Nom complet</Label>
        <Input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="c-phone">Téléphone</Label>
        <Input id="c-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="c-email">Email</Label>
        <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </FieldGroup>
      <FieldGroup>
        <div className="mb-1.5 flex items-center justify-between">
          <Label htmlFor="c-notes" className="mb-0">
            Notes
          </Label>
          <DictateButton onText={(t) => setNotes((n) => (n ? `${n} ${t}` : t))} />
        </div>
        <Textarea id="c-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldGroup>
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
