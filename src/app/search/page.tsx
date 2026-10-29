import { FeatureGuard } from "@/components/layout/FeatureGuard";
import SearchPage from "@/features/core-workflow/pages/SearchPage";

export default function Page() {
  return (
    <FeatureGuard feature="core-workflow">
      <SearchPage />
    </FeatureGuard>
  );
}
