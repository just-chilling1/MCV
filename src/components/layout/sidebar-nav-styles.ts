import { clsx } from "clsx";

export const sidebarSectionLabelClass = "sidebar-section-label";

export function sidebarNavItemClass(isActive: boolean, collapsed: boolean) {
  return clsx(
    "sidebar-nav-item group flex items-center gap-3 pl-[14px] pr-3 py-3 rounded-md border border-transparent transition-[background-color,border-color,box-shadow,color] duration-[160ms]",
    collapsed && "justify-center px-2 pl-2",
    isActive && "is-active"
  );
}

export function sidebarNavIconClass(isActive: boolean) {
  return clsx(
    "w-5 h-5 shrink-0 transition-colors duration-[160ms]",
    isActive
      ? "text-brass-300"
      : "text-ink-3 group-hover:text-ink-4"
  );
}

export function sidebarNavLabelClass(isActive: boolean) {
  return clsx(
    "sidebar-nav-label text-[15px] min-w-0 truncate font-normal leading-[1.4]",
    isActive ? "text-[#FFFDF8]" : "text-ink"
  );
}
