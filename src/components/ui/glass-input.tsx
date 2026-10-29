import { clsx } from "clsx";
import { InputHTMLAttributes, forwardRef } from "react";

export type GlassInputProps = InputHTMLAttributes<HTMLInputElement>;

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={clsx(
          "flex h-14 w-full rounded-xl border border-[var(--mcv-line-control)] bg-field px-6 py-3 text-lg",
          "text-text-primary placeholder:text-text-muted focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-brass-700 focus-visible:border-brass-700",
          "transition-all duration-300 hover:border-[var(--mcv-line-strong)]",
          "disabled:cursor-not-allowed disabled:text-ink-4 disabled:bg-surface",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

GlassInput.displayName = "GlassInput";
