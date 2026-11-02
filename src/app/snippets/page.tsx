import { FeatureGuard } from "@/components/layout/FeatureGuard";
import { loadFeaturePage } from "@/lib/load-feature-page";

const SnippetLibraryPage = loadFeaturePage(
  () => import("@/features/money-links-vault/pages/LinksPage"),
  "Loading Snippet Library..."
);

export default function Page() {
  return (
    <FeatureGuard feature="money-links-vault">
      <SnippetLibraryPage />
    </FeatureGuard>
  );
}
