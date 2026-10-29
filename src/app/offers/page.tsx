import { FeatureGuard } from "@/components/layout/FeatureGuard";
import { loadFeaturePage } from "@/lib/load-feature-page";

const OffersLibraryPage = loadFeaturePage(
  () => import("@/features/blog-builder/pages/OffersLibraryPage"),
  "Loading Offer Library..."
);

export default function Page() {
  return (
    <FeatureGuard feature="blog-builder">
      <OffersLibraryPage />
    </FeatureGuard>
  );
}
