import { FeatureGuard } from "@/components/layout/FeatureGuard";
import { loadFeaturePage } from "@/lib/load-feature-page";

const TrainingFaqPage = loadFeaturePage(
  () => import("@/features/training/pages/TrainingFaqPage"),
  "Loading FAQ..."
);

export default function Page() {
  return (
    <FeatureGuard feature="training">
      <TrainingFaqPage />
    </FeatureGuard>
  );
}
