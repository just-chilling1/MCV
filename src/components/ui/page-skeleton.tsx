import { clsx } from "clsx";

function Block({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-lg bg-brass-100/70", className)} aria-hidden />;
}

export function PageSkeleton({ cards = 3, className }: { cards?: number; className?: string }) {
  return (
    <div className={clsx("page-container", className)} aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <Block className="h-3 w-24" />
        <Block className="h-8 w-2/3 max-w-md" />
        <Block className="h-4 w-full max-w-xl" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: cards }).map((_, i) => (
          <Block key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}
