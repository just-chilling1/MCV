import { FeatureGuard } from "@/components/layout/FeatureGuard";
import { loadFeaturePage } from "@/lib/load-feature-page";

const RecurringStreamPage = loadFeaturePage(
  () => import("@/features/premium-recurring/pages/RecurringStreamPage"),
  "Loading Guaranteed High-Ticket Payouts..."
);

export default function Page() {
  return (
    <FeatureGuard feature="premium-recurring">
      <RecurringStreamPage />
    </FeatureGuard>
  );
}
