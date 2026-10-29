import { FeatureGuard } from "@/components/layout/FeatureGuard";
import WritePage from "@/features/article-wizard/pages/WritePage";

/** Craft wizard — Link Vault save uses /api/blog/link-vault. */
export default function Page() {
  return (
    <FeatureGuard feature="article-wizard">
      <WritePage />
    </FeatureGuard>
  );
}
