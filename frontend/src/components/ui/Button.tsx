import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "dark" | "gold" | "outline" | "ghost" | "danger" | "wa" | "soft";
type Size = "lg" | "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  dark: "bg-ink text-white hover:opacity-90",
  gold: "bg-gold text-[#111110] hover:opacity-90",
  outline: "bg-transparent text-ink border border-line-strong hover:border-ink",
  ghost: "bg-transparent text-ink-soft hover:bg-bg-sunken",
  danger: "bg-danger-soft text-danger hover:opacity-90",
  wa: "bg-wa text-[#fff] hover:opacity-90",
  soft: "bg-bg-sunken text-ink hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  lg: "h-14 px-6 text-[0.95rem] rounded-2xl",
  md: "h-12 px-5 text-[0.88rem] rounded-xl",
  sm: "h-9 px-3.5 text-[0.78rem] rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "dark", size = "md", fullWidth, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-semibold",
          "transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
