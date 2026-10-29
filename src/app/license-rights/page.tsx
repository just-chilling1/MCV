import { FeatureGuard } from "@/components/layout/FeatureGuard";
import { loadFeaturePage } from "@/lib/load-feature-page";

const LicenseRightsPage = loadFeaturePage(
  () => import("@/features/premium-license-rights/pages/LicenseRightsPage"),
  "Loading License Rights..."
);

export default function Page() {
  return (
    <FeatureGuard feature="premium-license-rights">
      <LicenseRightsPage />
    </FeatureGuard>
  );
}
