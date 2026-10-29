import { FeatureGuard } from "@/components/layout/FeatureGuard";
import PublishPage from "@/features/article-publish-flow/pages/PublishPage";

export default function Page() {
  return (
    <FeatureGuard feature="article-publish">
      <PublishPage />
    </FeatureGuard>
  );
}
