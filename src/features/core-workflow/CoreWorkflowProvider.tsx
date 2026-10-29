"use client";

import { usePathname } from "next/navigation";
import { isFeatureEnabled } from "@/config/features.config";
import { getWorkflowProgress } from "@/lib/features";
import { WorkflowNavProvider } from "@/context/WorkflowNavContext";
import { SearchProvider, useSearch } from "./context/SearchContext";

function WorkflowNavBridgeInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { variations, analysisByVariation, selectedAds, resetSession } = useSearch();

  const progress = getWorkflowProgress(
    pathname,
    variations.length > 0,
    Object.keys(analysisByVariation).length > 0,
    selectedAds.length > 0
  );

  return (
    <WorkflowNavProvider value={{ progress, resetSession }}>{children}</WorkflowNavProvider>
  );
}

export function CoreWorkflowProvider({ children }: { children: React.ReactNode }) {
  if (!isFeatureEnabled("core-workflow")) {
    return <>{children}</>;
  }

  return (
    <SearchProvider>
      <WorkflowNavBridgeInner>{children}</WorkflowNavBridgeInner>
    </SearchProvider>
  );
}
