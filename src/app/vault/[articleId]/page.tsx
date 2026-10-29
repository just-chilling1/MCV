import { FeatureGuard } from "@/components/layout/FeatureGuard";
import ArticleViewPage from "@/features/portfolio/pages/VaultArticlePage";

export default function Page() {
  return (
    <FeatureGuard feature="portfolio">
      <ArticleViewPage />
    </FeatureGuard>
  );
}
