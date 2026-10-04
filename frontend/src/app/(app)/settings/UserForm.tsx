"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Select } from "@/components/ui/Field";

interface ManagedUser {
  id: number;
  name: string;
  phone: string;
  role: string;
  is_active: boolean;
}

export function UserForm({
  user,
  onSaved,
  onCancel,
}: {
  user: ManagedUser | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState(user?.role ?? "tailleur");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { name, phone, role, is_active: isActive };
      if (password) payload.password = password;
      if (user) {
        await apiFetch(`/users/${user.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/users/", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer ce compte (le téléphone est peut-être déjà utilisé).");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="u-name">Nom</Label>
        <Input id="u-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="u-phone">Téléphone (identifiant)</Label>
          <Input id="u-phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="u-role">Rôle</Label>
          <Select id="u-role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="owner">Propriétaire</option>
            <option value="tailleur">Tailleur</option>
            <option value="staff">Employé</option>
          </Select>
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="u-password">{user ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}</Label>
        <Input
          id="u-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={user ? "Laisser vide pour ne pas changer" : ""}
          required={!user}
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="u-active">Statut</Label>
        <Select id="u-active" value={isActive ? "1" : "0"} onChange={(e) => setIsActive(e.target.value === "1")}>
          <option value="1">Actif</option>
          <option value="0">Désactivé</option>
        </Select>
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
