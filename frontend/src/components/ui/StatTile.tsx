import clsx from "clsx";

export function StatTile({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  tone?: "default" | "gold" | "danger";
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line-soft bg-bg-card px-4 py-4">
      <p className="text-[0.75rem] text-muted">{label}</p>
      <p
        className={clsx(
          "tabular mt-1 text-xl font-semibold leading-tight",
          tone === "gold" && "text-gold-dark",
          tone === "danger" && "text-danger"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
