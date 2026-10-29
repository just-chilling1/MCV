import { clsx } from "clsx";
import { ReactNode } from "react";

interface DashboardSectionProps {
  children: ReactNode;
  className?: string;
  /** Remove inner padding — use for media/forms with their own spacing */
  flush?: boolean;
  as?: "section" | "div" | "aside" | "header";
}

export function DashboardSection({
  children,
  className,
  flush = false,
  as: Tag = "section",
}: DashboardSectionProps) {
  return (
    <Tag
      className={clsx(
        "dashboard-container",
        flush && "dashboard-container-flush",
        className
      )}
    >
      {children}
    </Tag>
  );
}

interface DashboardSectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
}

export function DashboardSectionHeader({
  title,
  subtitle,
  icon,
  className,
}: DashboardSectionHeaderProps) {
  return (
    <div className={clsx("dashboard-section-header", className)}>
      {icon ? <div className="dashboard-section-icon">{icon}</div> : null}
      <div className="min-w-0">
        <h2 className="ds-h3">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-relaxed text-text-secondary">{subtitle}</p> : null}
      </div>
    </div>
  );
}
