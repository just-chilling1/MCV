import { FeatureGuard } from "@/components/layout/FeatureGuard";
import InfinitePage from "@/features/premium-infinite/pages/InfinitePage";

export default function Page() {
  return (
    <FeatureGuard feature="premium-infinite">
      <InfinitePage />
    </FeatureGuard>
  );
}
