import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({ message = "Loading...", className }: PageLoadingProps) {
  return (
    <div className={clsx("page-container", className)}>
      <div className="page-loading" role="status" aria-live="polite">
        <Loader2 size={22} className="animate-spin text-brass-700" aria-hidden />
        <p>{message}</p>
      </div>
    </div>
  );
}
