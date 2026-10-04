import clsx from "clsx";
import type { OrderStatus } from "@/lib/types";
import { STATUS } from "@/lib/status";

const toneClasses = {
  muted: "bg-bg-sunken text-ink-soft",
  gold: "bg-gold-soft text-gold-dark",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  ink: "bg-ink text-white",
} as const;

export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: keyof typeof toneClasses }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold whitespace-nowrap",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status];
  return <Badge tone={s?.tone ?? "muted"}>{s?.label ?? status}</Badge>;
}
