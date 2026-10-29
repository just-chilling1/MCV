import { FeatureGuard } from "@/components/layout/FeatureGuard";
import ImagesPage from "@/features/article-images/pages/ImagesPage";

export default function Page() {
  return (
    <FeatureGuard feature="article-images">
      <ImagesPage />
    </FeatureGuard>
  );
}
