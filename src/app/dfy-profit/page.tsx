import { FeatureGuard } from "@/components/layout/FeatureGuard";
import { loadFeaturePage } from "@/lib/load-feature-page";

const DfyProfitPage = loadFeaturePage(
  () => import("@/features/dfy-profit/pages/DfyProfitPage"),
  "Loading Done-For-You Profit..."
);

export default function Page() {
  return (
    <FeatureGuard feature="premium-dfy-profit">
      <DfyProfitPage />
    </FeatureGuard>
  );
}
