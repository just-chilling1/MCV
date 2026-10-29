import { FeatureGuard } from "@/components/layout/FeatureGuard";
import { loadFeaturePage } from "@/lib/load-feature-page";

const SocialPayoutsPage = loadFeaturePage(
  () => import("@/features/premium-social/pages/SocialPayoutsPage"),
  "Loading Social Payouts..."
);

export default function Page() {
  return (
    <FeatureGuard feature="premium-social">
      <SocialPayoutsPage />
    </FeatureGuard>
  );
}
