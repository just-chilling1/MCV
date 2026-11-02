"use client";

import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { brand } from "@/config/brand.config";
import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <body
        className="text-text-primary antialiased"
        style={{ backgroundColor: brand.colors.page }}
      >
        <div className="page-container flex min-h-dvh flex-col items-center justify-center gap-4">
          <EmptyState
            icon={AlertTriangle}
            title="Something went wrong"
            description="The app hit an unexpected error. Try again, or head back to the dashboard."
            action={{ label: "Try again", onClick: reset }}
          />
          <a href="/dashboard" className="text-sm font-medium text-brass-700 hover:underline">
            Go to dashboard
          </a>
        </div>
      </body>
    </html>
  );
}
