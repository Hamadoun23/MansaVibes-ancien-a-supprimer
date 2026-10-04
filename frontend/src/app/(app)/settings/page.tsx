"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, type Paginated } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Label } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { UserForm } from "./UserForm";

interface ManagedUser {
  id: number;
  name: string;
  phone: string;
  role: string;
  is_active: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  tailleur: "Tailleur",
  staff: "Employé",
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const isOwner = user?.role === "owner";

  const [businessName, setBusinessName] = useState("");
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [businessSaved, setBusinessSaved] = useState(false);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);

  useEffect(() => {
    apiFetch<{ business_name: string }>("/app-settings/")
      .then((res) => setBusinessName(res.business_name))
      .catch(() => {});
    if (isOwner) reloadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reloadUsers() {
    apiFetch<Paginated<ManagedUser>>("/users/").then((res) => setUsers(res.results));
  }

  async function handleSaveBusiness(e: FormEvent) {
    e.preventDefault();
    setSavingBusiness(true);
    setBusinessSaved(false);
    try {
      await apiFetch("/app-settings/", { method: "PATCH", body: JSON.stringify({ business_name: businessName }) });
      setBusinessSaved(true);
    } finally {
      setSavingBusiness(false);
    }
  }

  async function handleDeleteUser(u: ManagedUser) {
    if (!confirm(`Supprimer le compte de "${u.name}" ?`)) return;
    await apiFetch(`/users/${u.id}/`, { method: "DELETE" });
    reloadUsers();
  }

  return (
    <div>
      <PageHeader title="Réglages" subtitle="Compte, atelier et comptes du personnel" />
      <div className="px-4 py-5 md:px-8 max-w-lg space-y-8">
        <div className="border border-line bg-bg-card px-4 py-4">
          <p className="eyebrow mb-2">Mon compte</p>
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-sm text-muted">{user?.phone}</p>
          <p className="text-xs text-muted mt-1 capitalize">Rôle : {ROLE_LABELS[user?.role ?? ""] ?? user?.role}</p>
        </div>

        {isOwner && (
          <form onSubmit={handleSaveBusiness} className="border border-line bg-bg-card px-4 py-4">
            <p className="eyebrow mb-3">Atelier</p>
            <FieldGroup>
              <Label htmlFor="business-name">Nom de l&apos;atelier</Label>
              <Input id="business-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </FieldGroup>
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={savingBusiness}>
                {savingBusiness ? "Enregistrement…" : "Enregistrer"}
              </Button>
              {businessSaved && <span className="text-xs text-success">Enregistré.</span>}
            </div>
          </form>
        )}

        {isOwner && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="eyebrow">Comptes du personnel</p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingUser(null);
                  setUserModalOpen(true);
                }}
              >
                <Plus size={14} /> Nouveau compte
              </Button>
            </div>
            <div className="border border-line bg-bg-card divide-y divide-line">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted mt-0.5">{u.phone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={u.is_active ? "muted" : "danger"}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setUserModalOpen(true);
                      }}
                      className="text-ink-soft hover:text-ink"
                    >
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeleteUser(u)} className="text-ink-soft hover:text-danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="px-4 py-3 text-sm text-muted">Aucun compte.</p>}
            </div>
          </div>
        )}

        <Button variant="outline" onClick={logout}>
          Déconnexion
        </Button>
      </div>

      <Modal open={userModalOpen} onClose={() => setUserModalOpen(false)} title={editingUser ? "Modifier le compte" : "Nouveau compte"}>
        <UserForm
          user={editingUser}
          onCancel={() => setUserModalOpen(false)}
          onSaved={() => {
            setUserModalOpen(false);
            reloadUsers();
          }}
        />
      </Modal>
    </div>
  );
}
