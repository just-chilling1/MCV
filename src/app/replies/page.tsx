import { FeatureGuard } from "@/components/layout/FeatureGuard";
import RepliesPage from "@/features/core-workflow/pages/RepliesPage";

export default function Page() {
  return (
    <FeatureGuard feature="core-workflow">
      <RepliesPage />
    </FeatureGuard>
  );
}
