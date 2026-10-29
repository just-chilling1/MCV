"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isFeatureEnabled, type FeatureId } from "@/config/features.config";

interface FeatureGuardProps {
  feature: FeatureId;
  children: React.ReactNode;
}

export function FeatureGuard({ feature, children }: FeatureGuardProps) {
  const router = useRouter();
  const enabled = isFeatureEnabled(feature);

  useEffect(() => {
    if (!enabled) {
      router.replace("/dashboard");
    }
  }, [enabled, router]);

  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[30vh] sm:min-h-[40vh] gap-4 text-center px-4">
        <p className="text-text-muted text-sm max-w-md">
          This feature is not enabled. Add <code className="text-brass-700">{feature}</code> to{" "}
          <code className="text-brass-700">enabledFeatures</code> in{" "}
          <code className="text-brass-700">src/config/features.config.ts</code>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
