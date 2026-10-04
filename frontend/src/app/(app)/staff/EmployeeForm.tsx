"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label } from "@/components/ui/Field";

interface Employee {
  id: number;
  name: string;
  phone: string;
  role_title: string;
  monthly_salary_fcfa: number;
}

export function EmployeeForm({
  employee,
  onSaved,
  onCancel,
}: {
  employee: Employee | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(employee?.name ?? "");
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [roleTitle, setRoleTitle] = useState(employee?.role_title ?? "");
  const [salary, setSalary] = useState(String(employee?.monthly_salary_fcfa ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, phone, role_title: roleTitle, monthly_salary_fcfa: Number(salary) || 0 };
      if (employee) {
        await apiFetch(`/employees/${employee.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/employees/", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer l'employé.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="e-name">Nom</Label>
        <Input id="e-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="e-phone">Téléphone</Label>
          <Input id="e-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="e-role">Poste</Label>
          <Input id="e-role" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Ex: Tailleur" />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="e-salary">Salaire mensuel (FCFA)</Label>
        <Input id="e-salary" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} />
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
