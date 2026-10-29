import { FeatureGuard } from "@/components/layout/FeatureGuard";
import { loadFeaturePage } from "@/lib/load-feature-page";

const SalesOfferGeneratorPage = loadFeaturePage(
  () => import("@/features/blog-builder/pages/SalesOfferGeneratorPage"),
  "Loading Sales Offer Generator..."
);

export default function Page() {
  return (
    <FeatureGuard feature="blog-builder">
      <SalesOfferGeneratorPage />
    </FeatureGuard>
  );
}
