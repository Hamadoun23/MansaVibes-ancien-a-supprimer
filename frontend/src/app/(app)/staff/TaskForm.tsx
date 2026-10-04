"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, type Paginated } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label, Select } from "@/components/ui/Field";

interface Employee {
  id: number;
  name: string;
}

interface StaffTask {
  id: number;
  employee: number;
  title: string;
  status: string;
  due_date: string | null;
}

export function TaskForm({
  task,
  defaultEmployeeId,
  onSaved,
  onCancel,
}: {
  task: StaffTask | null;
  defaultEmployeeId?: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState(task?.employee ?? defaultEmployeeId ?? "");
  const [title, setTitle] = useState(task?.title ?? "");
  const [status, setStatus] = useState(task?.status ?? "pending");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Paginated<Employee>>("/employees/?page_size=200").then((res) => setEmployees(res.results));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { employee: Number(employeeId), title, status, due_date: dueDate || null };
      if (task) {
        await apiFetch(`/staff-tasks/${task.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/staff-tasks/", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer la tâche.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Label htmlFor="t-employee">Employé</Label>
        <Select id="t-employee" required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">Sélectionner…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="t-title">Tâche</Label>
        <Input id="t-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="t-status">Statut</Label>
          <Select id="t-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminé</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="t-due">Échéance</Label>
          <Input id="t-due" type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)} />
        </FieldGroup>
      </div>
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
