import clsx from "clsx";
import { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={clsx("block text-[0.78rem] font-medium text-ink-soft mb-1.5", props.className)} />;
}

// 16px text stops iOS from zooming into the field on focus.
const controlClasses =
  "w-full rounded-xl border border-line bg-bg-card px-3.5 h-12 text-base text-ink placeholder:text-muted focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold-soft transition";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(controlClasses, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(controlClasses, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(controlClasses, "h-auto py-3 resize-none", props.className)} />;
}

export function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}
