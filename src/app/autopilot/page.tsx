import { FeatureGuard } from "@/components/layout/FeatureGuard";
import AutopilotPage from "@/features/premium-autopilot/pages/AutopilotPage";

export default function Page() {
  return (
    <FeatureGuard feature="premium-autopilot">
      <AutopilotPage />
    </FeatureGuard>
  );
}
