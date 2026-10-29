"use client";

import { usePathname } from "next/navigation";
import { isFeatureEnabled } from "@/config/features.config";
import { CoreWorkflowProvider } from "@/features/core-workflow/CoreWorkflowProvider";
import { BlogBuilderWorkflowProvider } from "@/features/blog-builder/context/BlogBuilderWorkflowProvider";
import { BlogWorkflowNavProvider } from "@/features/blog-builder/context/BlogWorkflowNavProvider";
import { needsBlogBuilderContext } from "@/lib/blog-builder-routes";
import { BrandStyleProvider } from "./BrandStyleProvider";
import { Shell } from "./Shell";
import { ToastProvider } from "@/contexts/ToastContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const content = (
    <BrandStyleProvider>
      <Shell>
        <ToastProvider>{children}</ToastProvider>
      </Shell>
    </BrandStyleProvider>
  );

  let tree = content;

  if (isFeatureEnabled("blog-builder")) {
    tree = needsBlogBuilderContext(pathname) ? (
      <BlogBuilderWorkflowProvider>{content}</BlogBuilderWorkflowProvider>
    ) : (
      content
    );
    tree = <BlogWorkflowNavProvider>{tree}</BlogWorkflowNavProvider>;
  } else if (isFeatureEnabled("core-workflow")) {
    tree = <CoreWorkflowProvider>{content}</CoreWorkflowProvider>;
  }

  return tree;
}
