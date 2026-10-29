"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { getBrandCssVars } from "@/lib/brand-vars";

export function BrandStyleProvider({ children }: { children: React.ReactNode }) {
  // ponytail: apply brand overrides after hydration so SSR HTML matches the first client render (:root in globals.css).
  const [vars, setVars] = useState<CSSProperties | undefined>(undefined);

  useEffect(() => {
    setVars(getBrandCssVars() as CSSProperties);
  }, []);

  return <div style={vars}>{children}</div>;
}
