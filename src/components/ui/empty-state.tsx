import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface EmptyStateAction {
  label: string;
  href: string;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx("empty-state-panel", className)}>
      <div className="empty-state-icon">
        <Icon size={28} strokeWidth={1.5} aria-hidden />
      </div>
      <h2 className="ds-h4 text-text-heading">{title}</h2>
      <p className="empty-state-copy">{description}</p>
      {action ? (
        <Link href={action.href} className="btn-primary mt-2">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
