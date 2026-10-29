import type { ElementType, ReactNode } from "react";
import { clsx } from "clsx";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

/** Standard full-width page wrapper — width is constrained by the app shell. */
export function PageContainer({ children, className, as: Tag = "div" }: PageContainerProps) {
  return <Tag className={clsx("page-container", className)}>{children}</Tag>;
}
