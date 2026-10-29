import { FeatureGuard } from "@/components/layout/FeatureGuard";
import { loadFeaturePage } from "@/lib/load-feature-page";
import WealthChecklistPage from "@/features/protector/pages/WealthChecklistPage";

const ProtectorPage = loadFeaturePage(
  () => import("@/features/protector/pages/ProtectorPage"),
  "Loading Vault Protector..."
);

export default function Page() {
  return (
    <FeatureGuard feature="protector">
      <ProtectorPage />
      <WealthChecklistPage />
    </FeatureGuard>
  );
}
