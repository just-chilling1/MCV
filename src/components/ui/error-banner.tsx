import { AlertCircle } from "lucide-react";
import { clsx } from "clsx";

interface ErrorBannerProps {
  message: string;
  className?: string;
}

export function ErrorBanner({ message, className }: ErrorBannerProps) {
  return (
    <div
      className={clsx(
        "flex items-start gap-2.5 rounded-xl border border-[var(--mcv-danger)]/30 bg-[var(--mcv-danger)]/10 px-4 py-3 text-[15px] text-[var(--mcv-danger)]",
        className
      )}
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
