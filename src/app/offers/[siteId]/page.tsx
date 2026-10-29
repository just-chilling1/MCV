import { FeatureGuard } from "@/components/layout/FeatureGuard";
import { loadFeaturePage } from "@/lib/load-feature-page";

const OfferDetailPage = loadFeaturePage<{ siteId: string }>(
  () => import("@/features/blog-builder/pages/OfferDetailPage"),
  "Loading offer..."
);

export default async function Page({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  return (
    <FeatureGuard feature="blog-builder">
      <OfferDetailPage siteId={siteId} />
    </FeatureGuard>
  );
}
