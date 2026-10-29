import { FeatureGuard } from "@/components/layout/FeatureGuard";
import AnalysisPage from "@/features/core-workflow/pages/AnalysisPage";

export default function Page() {
  return (
    <FeatureGuard feature="core-workflow">
      <AnalysisPage />
    </FeatureGuard>
  );
}
