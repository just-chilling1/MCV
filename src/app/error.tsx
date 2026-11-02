"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-container flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description="This page hit an unexpected error. Try again, or head back to the dashboard."
        action={{ label: "Try again", onClick: reset }}
      />
      <Link href="/dashboard" className="text-sm font-medium text-brass-700 hover:underline">
        Go to dashboard
      </Link>
    </div>
  );
}
