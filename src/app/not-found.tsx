import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="page-container flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="This link may be outdated or the page was removed."
        action={{ label: "Go to dashboard", href: "/dashboard" }}
      />
    </div>
  );
}
