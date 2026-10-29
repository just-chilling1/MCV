import { FeatureGuard } from "@/components/layout/FeatureGuard";
import { loadFeaturePage } from "@/lib/load-feature-page";

const TrainingVideosPage = loadFeaturePage(
  () => import("@/features/training/pages/TrainingVideosPage"),
  "Loading Academy..."
);

export default function Page() {
  return (
    <FeatureGuard feature="training">
      <TrainingVideosPage />
    </FeatureGuard>
  );
}
