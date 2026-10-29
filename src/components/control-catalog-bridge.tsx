"use client";

import { useEffect, useState, type ReactNode } from "react";
import { applyLiveCatalog } from "@/lib/control-plane-live";
import type { PromoCatalog } from "@/lib/control-plane-catalog";

export function ControlCatalogBridge({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/promo-catalog", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PromoCatalog | null) => {
        if (cancelled || !data?.items) return;
        applyLiveCatalog(data);
        setVersion(1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div key={version} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
