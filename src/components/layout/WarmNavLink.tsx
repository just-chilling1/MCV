"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { warmRouteData } from "@/lib/warm-route-data";

type WarmNavLinkProps = ComponentProps<typeof Link>;

function hrefToPath(href: WarmNavLinkProps["href"]): string | null {
  if (typeof href === "string") return href.split("?")[0] ?? href;
  if (href && typeof href === "object" && "pathname" in href && href.pathname) {
    return href.pathname;
  }
  return null;
}

export function WarmNavLink({ href, onMouseEnter, onFocus, ...props }: WarmNavLinkProps) {
  const warm = () => {
    const path = hrefToPath(href);
    if (path) warmRouteData(path);
  };

  return (
    <Link
      href={href}
      onMouseEnter={(event) => {
        warm();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        warm();
        onFocus?.(event);
      }}
      {...props}
    />
  );
}
