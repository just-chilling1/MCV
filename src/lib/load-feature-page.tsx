import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { PageLoading } from "@/components/ui/page-loading";

/** Code-split a feature page so route JS loads only when visited. */
export function loadFeaturePage<P = Record<string, never>>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  message: string
) {
  return dynamic(loader, {
    loading: () => <PageLoading message={message} />,
  });
}
