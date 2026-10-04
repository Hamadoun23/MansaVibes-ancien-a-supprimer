"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, type Paginated } from "@/lib/api";
import { formatDate, formatFcfa } from "@/lib/format";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmployeeForm } from "./EmployeeForm";
import { TaskForm } from "./TaskForm";

interface StaffTask {
  id: number;
  employee: number;
  title: string;
  status: string;
  due_date: string | null;
}

interface Employee {
  id: number;
  name: string;
  phone: string;
  role_title: string;
  monthly_salary_fcfa: number;
  tasks: StaffTask[];
}

const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  done: "Terminé",
};

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);

  const [editingTask, setEditingTask] = useState<StaffTask | null>(null);
  const [taskEmployeeId, setTaskEmployeeId] = useState<number | undefined>(undefined);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  function reload() {
    apiFetch<Paginated<Employee>>("/employees/").then((res) => setEmployees(res.results));
  }

  useEffect(reload, []);

  async function deleteEmployee(e: Employee) {
    if (!confirm(`Supprimer l'employé "${e.name}" ?`)) return;
    await apiFetch(`/employees/${e.id}/`, { method: "DELETE" });
    reload();
  }

  async function toggleTaskDone(task: StaffTask) {
    await apiFetch(`/staff-tasks/${task.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ status: task.status === "done" ? "pending" : "done" }),
    });
    reload();
  }

  async function deleteTask(task: StaffTask) {
    if (!confirm(`Supprimer la tâche "${task.title}" ?`)) return;
    await apiFetch(`/staff-tasks/${task.id}/`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Personnel"
        subtitle={`${employees.length} employé${employees.length > 1 ? "s" : ""}`}
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditingEmployee(null);
              setEmployeeModalOpen(true);
            }}
          >
            <Plus size={14} /> Employé
          </Button>
        }
      />
      <div className="px-4 py-4 md:px-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((emp) => (
          <div key={emp.id} className="border border-line bg-bg-card px-4 py-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">{emp.name}</p>
                <p className="text-xs text-muted mt-0.5">{emp.role_title || "—"}</p>
                <p className="text-xs text-muted">{emp.phone}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingEmployee(emp);
                    setEmployeeModalOpen(true);
                  }}
                  className="text-ink-soft hover:text-ink"
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => deleteEmployee(emp)} className="text-ink-soft hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm">{formatFcfa(emp.monthly_salary_fcfa)} / mois</p>

            <div className="mt-3 border-t border-line pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted">Tâches</p>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setTaskEmployeeId(emp.id);
                    setTaskModalOpen(true);
                  }}
                  className="text-[0.65rem] uppercase tracking-[0.12em] text-gold-dark"
                >
                  + Ajouter
                </button>
              </div>
              {emp.tasks.length === 0 && <p className="text-xs text-muted">Aucune tâche.</p>}
              <div className="space-y-1">
                {emp.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => toggleTaskDone(task)}
                      className={`flex items-center gap-1.5 ${task.status === "done" ? "text-muted line-through" : "text-ink-soft"}`}
                    >
                      <CheckCircle2 size={13} className={task.status === "done" ? "text-success" : ""} />
                      {task.title}
                      {task.due_date && <span className="text-muted">· {formatDate(task.due_date)}</span>}
                    </button>
                    <div className="flex items-center gap-2">
                      <Badge tone={task.status === "done" ? "success" : "muted"}>
                        {TASK_STATUS_LABELS[task.status] ?? task.status}
                      </Badge>
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setTaskEmployeeId(emp.id);
                          setTaskModalOpen(true);
                        }}
                        className="text-ink-soft hover:text-ink"
                      >
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => deleteTask(task)} className="text-ink-soft hover:text-danger">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        {employees.length === 0 && <p className="text-sm text-muted">Aucun employé.</p>}
      </div>

      <Modal open={employeeModalOpen} onClose={() => setEmployeeModalOpen(false)} title={editingEmployee ? "Modifier l'employé" : "Nouvel employé"}>
        <EmployeeForm
          employee={editingEmployee}
          onCancel={() => setEmployeeModalOpen(false)}
          onSaved={() => {
            setEmployeeModalOpen(false);
            reload();
          }}
        />
      </Modal>

      <Modal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} title={editingTask ? "Modifier la tâche" : "Nouvelle tâche"}>
        <TaskForm
          task={editingTask}
          defaultEmployeeId={taskEmployeeId}
          onCancel={() => setTaskModalOpen(false)}
          onSaved={() => {
            setTaskModalOpen(false);
            reload();
          }}
        />
      </Modal>
    </div>
  );
}
