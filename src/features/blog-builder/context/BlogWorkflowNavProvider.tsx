"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { WorkflowNavProvider } from "@/context/WorkflowNavContext";
import { cachedClientFetch } from "@/lib/client-fetch-cache";
import { computeBlogProgressFromSession } from "@/lib/blog-progress";
import { needsBlogBuilderContext } from "@/lib/blog-builder-routes";

type SessionProgressRow = Parameters<typeof computeBlogProgressFromSession>[0];

/** Lightweight nav progress for pages that don't mount BlogBuilderProvider. */
export function BlogWorkflowNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (needsBlogBuilderContext(pathname)) return;

    void cachedClientFetch<{ session: SessionProgressRow }>("/api/blog/session", { ttl: 60_000 })
      .then((data) => setProgress(computeBlogProgressFromSession(data.session)))
      .catch(() => setProgress(0));
  }, [pathname]);

  const resetSession = useCallback(async () => {
    /* Sidebar always calls supabase.auth.signOut() after this. */
  }, []);

  return (
    <WorkflowNavProvider value={{ progress, resetSession }}>{children}</WorkflowNavProvider>
  );
}
