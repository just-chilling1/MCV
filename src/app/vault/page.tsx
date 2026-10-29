import { FeatureGuard } from "@/components/layout/FeatureGuard";
import VaultPage from "@/features/portfolio/pages/VaultPage";

export default function Page() {
  return (
    <FeatureGuard feature="portfolio">
      <VaultPage />
    </FeatureGuard>
  );
}
