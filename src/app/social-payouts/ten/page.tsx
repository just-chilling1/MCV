import { FeatureGuard } from "@/components/layout/FeatureGuard";
import TenPostsPage from "@/features/premium-social/pages/TenPostsPage";

export default function Page() {
  return (
    <FeatureGuard feature="premium-social">
      <TenPostsPage />
    </FeatureGuard>
  );
}
