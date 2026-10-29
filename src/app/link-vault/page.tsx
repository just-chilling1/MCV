import { FeatureGuard } from "@/components/layout/FeatureGuard";
import { loadFeaturePage } from "@/lib/load-feature-page";

const LinkVaultPage = loadFeaturePage(
  () => import("@/features/blog-builder/pages/LinkVaultPage"),
  "Loading Link Vault..."
);

export default function Page() {
  return (
    <FeatureGuard feature="blog-builder">
      <LinkVaultPage />
    </FeatureGuard>
  );
}
