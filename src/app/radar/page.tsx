import { FeatureGuard } from "@/components/layout/FeatureGuard";
import RadarPage from "@/features/core-workflow/pages/RadarPage";

export default function Page() {
  return (
    <FeatureGuard feature="core-workflow">
      <RadarPage />
    </FeatureGuard>
  );
}
