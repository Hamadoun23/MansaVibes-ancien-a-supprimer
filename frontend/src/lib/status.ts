import type { OrderStatus } from "./types";

type Tone = "muted" | "gold" | "success" | "danger" | "ink";

/** Words a tailor and their client both understand, in production order. */
export const STATUS: Record<OrderStatus, { label: string; tone: Tone; next?: string }> = {
  pending: { label: "Reçue", tone: "muted", next: "Commencer la couture" },
  in_progress: { label: "En couture", tone: "gold", next: "Marquer prête" },
  done: { label: "Prête", tone: "success", next: "Marquer livrée" },
  validated: { label: "Essayage validé", tone: "success", next: "Marquer livrée" },
  delivered: { label: "Livrée", tone: "ink" },
};

/** The four steps shown to clients on their tracking page and on the order stepper. */
export const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Reçue" },
  { status: "in_progress", label: "En couture" },
  { status: "done", label: "Prête" },
  { status: "delivered", label: "Livrée" },
];

export function stepIndex(status: OrderStatus): number {
  if (status === "validated") return 2;
  return STEPS.findIndex((s) => s.status === status);
}

export const PAYMENT_METHODS = [
  { value: "cash", label: "Espèces" },
  { value: "orange_money", label: "Orange Money" },
  { value: "wave", label: "Wave" },
  { value: "bank_transfer", label: "Virement" },
] as const;

export function isLate(dueDate: string | null, status: OrderStatus): boolean {
  if (!dueDate || status === "delivered" || status === "done" || status === "validated") return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}
