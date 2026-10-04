"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Textarea } from "@/components/ui/Field";

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export function SupplierForm({
  supplier,
  onSaved,
  onCancel,
}: {
  supplier: Supplier | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(supplier?.name ?? "");
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [email, setEmail] = useState(supplier?.email ?? "");
  const [address, setAddress] = useState(supplier?.address ?? "");
  const [notes, setNotes] = useState(supplier?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, phone, email, address, notes };
      if (supplier) {
        await apiFetch(`/suppliers/${supplier.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/suppliers/", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer le fournisseur.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="s-name">Nom</Label>
        <Input id="s-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="s-phone">Téléphone</Label>
          <Input id="s-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="s-email">Email</Label>
          <Input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="s-address">Adresse</Label>
        <Textarea id="s-address" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="s-notes">Notes</Label>
        <Textarea id="s-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
